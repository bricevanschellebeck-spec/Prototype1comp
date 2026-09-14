import { validateApprovedSpec, validateRepresentationPlan } from "./contracts";
import { getSourceDocument } from "./sources";
import type { ApprovedLearningSpec, BlockRole, CompiledBlock, CompiledLessonManifest, FactoryConfig, RepresentationPlanDraft, RepresentationProposal, SourceCitation, SourceDocument } from "./types";

function titleFor(source: SourceDocument, proposal: RepresentationProposal) {
  const config = proposal.factoryConfig;
  const tableId = "tableId" in config ? config.tableId : undefined;
  const table = tableId ? source.tables.find((item) => item.id === tableId) : undefined;
  const inputColumnId = config.kind === "parameter-experiment" ? config.inputColumnId : config.kind === "data-plot" ? config.xColumnId : undefined;
  const inputLabel = table?.columns.find((column) => column.id === inputColumnId)?.label.toLowerCase();
  const labels: Record<string, string> = {
    prediction: "Predict the pattern", "parameter-experiment": `Change ${inputLabel ?? "one source value"}`, comparison: "Compare trusted trials", "data-plot": "Build the evidence graph",
    classification: "Classify the evidence", "step-sequence": "Order the mechanism", "evidence-reveal": "Name the rule", "target-challenge": "Predict the final trial",
  };
  return labels[proposal.primitiveId];
}
function promptFor(proposal: RepresentationProposal) {
  const labels: Record<string, string> = {
    prediction: "Commit to a direction before the source data is revealed.", "parameter-experiment": "Select only recorded experimental conditions and compare the measured output.", comparison: "Hold the measured system constant and inspect the selected trusted rows.", "data-plot": "Reveal each recorded point and build the pattern from evidence.",
    classification: "Sort each approved example using the canonical concepts.", "step-sequence": "Build the approved relationship chain in order.", "evidence-reveal": "Connect what you observed to the approved source fact.", "target-challenge": "Use the pattern to predict a value hidden from the earlier workspace.",
  };
  return labels[proposal.primitiveId];
}
function uniqueCitations(spec: ApprovedLearningSpec, factIds: string[]): SourceCitation[] {
  const keys = new Set<string>(); const citations: SourceCitation[] = [];
  for (const factId of factIds) for (const citation of spec.facts.find((fact) => fact.id === factId)?.citations ?? []) {
    const key = JSON.stringify(citation); if (!keys.has(key)) { keys.add(key); citations.push(citation); }
  }
  return citations;
}
function factoryCitations(source: SourceDocument, config: FactoryConfig): SourceCitation[] {
  if (!("tableId" in config)) return [];
  const table = source.tables.find((item) => item.id === config.tableId); if (!table) return [];
  if (config.kind === "comparison") return [{ kind: "table", tableId: table.id, rowIds: config.rowIds, columnIds: config.columnIds }];
  if (config.kind === "target-challenge") return [{ kind: "table", tableId: table.id, rowIds: [config.heldOutRowId], columnIds: [config.predictionColumnId] }];
  const columnIds = config.kind === "parameter-experiment" ? [config.inputColumnId, config.outputColumnId] : config.kind === "data-plot" ? [config.xColumnId, config.yColumnId] : [];
  return columnIds.length ? [{ kind: "table", tableId: table.id, rowIds: table.rows.map((row) => row.id), columnIds }] : [];
}
function mergeCitations(...groups: SourceCitation[][]) { const map = new Map<string, SourceCitation>(); groups.flat().forEach((citation) => map.set(JSON.stringify(citation), citation)); return [...map.values()]; }
function rankRole(role: BlockRole) { return ({ evidence: 0, explore: 1, represent: 2, support: 3, apply: 4, transfer: 5 })[role]; }

export function compileApprovedLesson(specCandidate: unknown, planCandidate: unknown, approvedProposalIds?: string[]): { manifest?: CompiledLessonManifest; errors: string[] } {
  const sourceId = typeof specCandidate === "object" && specCandidate ? String((specCandidate as { sourceDocumentId?: unknown }).sourceDocumentId ?? "") : "";
  const source = getSourceDocument(sourceId); if (!source) return { errors: ["Unknown source document."] };
  const specValidation = validateApprovedSpec(source, specCandidate); if (!specValidation.valid || !specValidation.spec) return { errors: specValidation.errors };
  const planValidation = validateRepresentationPlan(source, specValidation.spec, planCandidate); if (!planValidation.valid || !planValidation.plan) return { errors: planValidation.errors };
  const spec = specValidation.spec; const plan = planValidation.plan as RepresentationPlanDraft; const allowed = approvedProposalIds ? new Set(approvedProposalIds) : null;
  const blocks: CompiledBlock[] = [];
  for (const objectivePlan of plan.objectivePlans) for (const proposal of objectivePlan.proposals) {
    if (allowed && !allowed.has(proposal.tempId)) continue;
    blocks.push({
      id: `generated.${proposal.tempId}`, title: titleFor(source, proposal), prompt: promptFor(proposal), primitiveId: proposal.primitiveId, role: proposal.role,
      objectiveIds: [objectivePlan.objectiveId], supportingFactIds: proposal.supportingFactIds, relationshipIds: proposal.relationshipIds,
      sourceCitations: mergeCitations(uniqueCitations(spec, proposal.supportingFactIds), factoryCitations(source, proposal.factoryConfig)), estimatedMinutes: proposal.role === "support" ? 1 : 2,
      possibleMisconceptionIds: spec.misconceptions.filter((item) => item.relatedObjectiveIds.includes(objectivePlan.objectiveId)).map((item) => item.id), render: proposal.factoryConfig,
    });
  }
  if (allowed) {
    const proposalIds = new Set(plan.objectivePlans.flatMap((item) => item.proposals.map((proposal) => proposal.tempId)));
    if ([...allowed].some((id) => !proposalIds.has(id))) return { errors: ["Approval references an unknown proposal."] };
  }
  for (const table of source.tables) {
    const reserved = new Set(blocks.flatMap((block) => block.render.kind === "target-challenge" && block.render.tableId === table.id ? [block.render.heldOutRowId] : []));
    if (reserved.size && table.rows.length - reserved.size < 2) return { errors: ["Keep at least two observed trials besides the reserved challenge trials."] };
  }
  if (!blocks.length) return { errors: ["Approve at least one representation proposal."] };
  if (!blocks.some((block) => ["comparison", "parameter-experiment", "evidence-reveal"].includes(block.primitiveId) || block.role === "support")) return { errors: ["Approve at least one experiment, comparison or explanation so the learner can test a prediction and receive support."] };
  for (const block of blocks) {
    if (block.render.kind === "comparison") {
      const config = block.render;
      const reserved = new Set(blocks.flatMap((item) => item.render.kind === "target-challenge" && item.render.tableId === config.tableId ? [item.render.heldOutRowId] : []));
      if (config.rowIds.filter((id) => !reserved.has(id)).length < 2) return { errors: ["A comparison needs two observed trials besides the reserved challenge trial."] };
    }
  }
  if (!blocks.some((block) => block.role === "evidence")) return { errors: ["The compiled lesson needs an approved evidence block."] };
  if (!blocks.some((block) => block.role === "apply" || block.role === "transfer")) return { errors: ["The compiled lesson needs an approved apply or transfer block."] };
  const sorted = [...blocks].sort((a, b) => rankRole(a.role) - rankRole(b.role));
  const evidence = sorted.find((block) => block.role === "evidence")!;
  const middle = sorted.filter((block) => block.id !== evidence.id && block.role !== "apply" && block.role !== "transfer");
  const final = [...sorted].reverse().find((block) => block.role === "apply" || block.role === "transfer")!;
  const fallbackPath = [...new Set([evidence.id, ...middle.map((block) => block.id), final.id])];
  return { errors: [], manifest: {
    schemaVersion: "p5-compiled-lesson-1", id: `compiled-${source.id}`, sourceDocumentId: source.id, title: source.title, subject: source.subject,
    concepts: spec.concepts, facts: spec.facts, relationships: spec.relationships, objectives: spec.objectives, misconceptions: spec.misconceptions, blocks, fallbackPath,
    provenanceReceipt: blocks.map((block) => ({ blockId: block.id, factIds: block.supportingFactIds, citations: block.sourceCitations })),
  } };
}
