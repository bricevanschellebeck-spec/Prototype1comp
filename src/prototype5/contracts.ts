import { z } from "zod";
import type { ApprovedLearningSpec, FactoryConfig, RepresentationPlanDraft, SourceAnalysisDraft, SourceCitation, SourceDocument } from "./types";

const id = z.string().min(1).max(140);
const textCitationSchema = z.object({ kind: z.literal("text"), sectionId: id, quote: z.string().min(1).max(900) }).strict();
const tableCitationSchema = z.object({ kind: z.literal("table"), tableId: id, rowIds: z.array(id).min(1).max(30), columnIds: z.array(id).min(1).max(20) }).strict();
export const citationSchema = z.discriminatedUnion("kind", [textCitationSchema, tableCitationSchema]);

const conceptSchema = z.object({ tempId: id, name: z.string().min(1).max(180), citations: z.array(citationSchema).min(1).max(8) }).strict();
const factSchema = z.object({ tempId: id, statement: z.string().min(1).max(420), citations: z.array(citationSchema).min(1).max(8) }).strict();
const relationshipSchema = z.object({
  tempId: id, fromConceptId: id,
  type: z.enum(["causes", "increases", "decreases", "part-of", "sequence", "compares", "depends-on"]),
  toConceptId: id, supportingFactIds: z.array(id).min(1).max(8), citations: z.array(citationSchema).min(1).max(8),
}).strict();

export const analysisDraftSchema = z.object({
  schemaVersion: z.literal("p5-analysis-1"), sourceDocumentId: id, modelId: id,
  sourceDerived: z.object({
    concepts: z.array(conceptSchema).min(2).max(12),
    facts: z.array(factSchema).min(2).max(12),
    relationships: z.array(relationshipSchema).max(10),
  }).strict(),
  pedagogical: z.object({
    objectives: z.array(z.object({ tempId: id, statement: z.string().min(1).max(320), supportingFactIds: z.array(id).min(1).max(8) }).strict()).min(1).max(8),
    proposedPrerequisites: z.array(z.object({ objectiveId: id, prerequisiteConceptId: id, confidence: z.enum(["low", "medium", "high"]), rationale: z.string().min(1).max(320) }).strict()).max(8),
    suggestedMisconceptions: z.array(z.object({ tempId: id, description: z.string().min(1).max(320), relatedObjectiveIds: z.array(id).min(1).max(6) }).strict()).max(8),
  }).strict(),
}).strict();

const predictionConfig = z.object({ kind: z.literal("prediction"), relationshipId: id }).strict();
const experimentConfig = z.object({ kind: z.literal("parameter-experiment"), tableId: id, inputColumnId: id, outputColumnId: id }).strict();
const plotConfig = z.object({ kind: z.literal("data-plot"), tableId: id, xColumnId: id, yColumnId: id }).strict();
const comparisonConfig = z.object({ kind: z.literal("comparison"), tableId: id, rowIds: z.array(id).min(2).max(6), columnIds: z.array(id).min(1).max(6) }).strict();
const classificationConfig = z.object({ kind: z.literal("classification"), categoryConceptIds: z.array(id).min(2).max(6), itemFactIds: z.array(id).min(2).max(10) }).strict();
const sequenceConfig = z.object({ kind: z.literal("step-sequence"), relationshipIds: z.array(id).min(2).max(8) }).strict();
const revealConfig = z.object({ kind: z.literal("evidence-reveal"), factIds: z.array(id).min(1).max(8) }).strict();
const targetConfig = z.object({ kind: z.literal("target-challenge"), tableId: id, heldOutRowId: id, predictionColumnId: id }).strict();
export const factoryConfigSchema = z.discriminatedUnion("kind", [predictionConfig, experimentConfig, plotConfig, comparisonConfig, classificationConfig, sequenceConfig, revealConfig, targetConfig]);
export const primitiveSchema = z.enum(["prediction", "parameter-experiment", "comparison", "data-plot", "classification", "step-sequence", "evidence-reveal", "target-challenge"]);
export const roleSchema = z.enum(["evidence", "explore", "represent", "support", "apply", "transfer"]);

const proposalSchema = z.object({
  tempId: id, primitiveId: primitiveSchema, role: roleSchema,
  supportingFactIds: z.array(id).min(1).max(10), relationshipIds: z.array(id).max(8), factoryConfig: factoryConfigSchema,
}).strict();
export const representationPlanSchema = z.object({
  schemaVersion: z.literal("p5-representations-1"), sourceDocumentId: id,
  objectivePlans: z.array(z.object({ objectiveId: id, representationGap: z.boolean(), gapReason: z.string().min(1).max(300).optional(), proposals: z.array(proposalSchema).max(8) }).strict()).min(1).max(10),
}).strict();

export const analyzeRequestSchema = z.object({ sourceDocumentId: id, modelProfile: z.enum(["fast", "quality"]) }).strict();
export const planRequestSchema = z.object({ approvedSpec: z.unknown(), modelProfile: z.enum(["fast", "quality"]) }).strict();
export const compileRequestSchema = z.object({ approvedSpec: z.unknown(), approvedRepresentationPlan: z.unknown() }).strict();

export function validateCitation(source: SourceDocument, citation: SourceCitation): string[] {
  if (citation.kind === "text") {
    const section = source.sections.find((item) => item.id === citation.sectionId);
    if (!section) return [`Unknown source section ${citation.sectionId}.`];
    if (!section.text.includes(citation.quote)) return [`Quote is not an exact substring of ${citation.sectionId}.`];
    return [];
  }
  const table = source.tables.find((item) => item.id === citation.tableId);
  if (!table) return [`Unknown source table ${citation.tableId}.`];
  const rows = new Set(table.rows.map((row) => row.id));
  const columns = new Set(table.columns.map((column) => column.id));
  return [
    ...citation.rowIds.filter((rowId) => !rows.has(rowId)).map((rowId) => `Unknown row ${rowId} in ${citation.tableId}.`),
    ...citation.columnIds.filter((columnId) => !columns.has(columnId)).map((columnId) => `Unknown column ${columnId} in ${citation.tableId}.`),
  ];
}

function duplicateErrors(items: Array<{ tempId: string }>, kind: string) {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const item of items) {
    if (seen.has(item.tempId)) errors.push(`Duplicate ${kind} ID ${item.tempId}.`);
    seen.add(item.tempId);
  }
  return errors;
}

export function validateAnalysisDraft(source: SourceDocument, candidate: unknown): { valid: boolean; draft?: SourceAnalysisDraft; errors: string[]; schemaValid: boolean } {
  const parsed = analysisDraftSchema.safeParse(candidate);
  if (!parsed.success) return { valid: false, schemaValid: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const draft = parsed.data as SourceAnalysisDraft;
  const errors: string[] = [];
  if (draft.sourceDocumentId !== source.id) errors.push(`Expected sourceDocumentId ${source.id}.`);
  errors.push(...duplicateErrors(draft.sourceDerived.concepts, "concept"), ...duplicateErrors(draft.sourceDerived.facts, "fact"), ...duplicateErrors(draft.sourceDerived.relationships, "relationship"), ...duplicateErrors(draft.pedagogical.objectives, "objective"), ...duplicateErrors(draft.pedagogical.suggestedMisconceptions, "misconception"));
  const conceptIds = new Set(draft.sourceDerived.concepts.map((item) => item.tempId));
  const factIds = new Set(draft.sourceDerived.facts.map((item) => item.tempId));
  const objectiveIds = new Set(draft.pedagogical.objectives.map((item) => item.tempId));
  for (const item of [...draft.sourceDerived.concepts, ...draft.sourceDerived.facts, ...draft.sourceDerived.relationships]) {
    for (const citation of item.citations) errors.push(...validateCitation(source, citation));
  }
  for (const relation of draft.sourceDerived.relationships) {
    if (!conceptIds.has(relation.fromConceptId)) errors.push(`${relation.tempId} has unknown fromConceptId.`);
    if (!conceptIds.has(relation.toConceptId)) errors.push(`${relation.tempId} has unknown toConceptId.`);
    relation.supportingFactIds.forEach((factId) => { if (!factIds.has(factId)) errors.push(`${relation.tempId} references unknown fact ${factId}.`); });
  }
  for (const objective of draft.pedagogical.objectives) objective.supportingFactIds.forEach((factId) => { if (!factIds.has(factId)) errors.push(`${objective.tempId} references unknown fact ${factId}.`); });
  for (const prerequisite of draft.pedagogical.proposedPrerequisites) {
    if (!objectiveIds.has(prerequisite.objectiveId)) errors.push(`Prerequisite references unknown objective ${prerequisite.objectiveId}.`);
    if (!conceptIds.has(prerequisite.prerequisiteConceptId)) errors.push(`Prerequisite references unknown concept ${prerequisite.prerequisiteConceptId}.`);
  }
  for (const misconception of draft.pedagogical.suggestedMisconceptions) misconception.relatedObjectiveIds.forEach((objectiveId) => { if (!objectiveIds.has(objectiveId)) errors.push(`${misconception.tempId} references unknown objective ${objectiveId}.`); });
  return { valid: errors.length === 0, schemaValid: true, draft, errors };
}

export function validateApprovedSpec(source: SourceDocument, candidate: unknown): { valid: boolean; spec?: ApprovedLearningSpec; errors: string[] } {
  const schema = z.object({
    schemaVersion: z.literal("p5-approved-spec-1"), sourceDocumentId: id,
    concepts: z.array(z.object({ id, name: z.string().min(1), citations: z.array(citationSchema).min(1) }).strict()).min(1),
    facts: z.array(z.object({ id, statement: z.string().min(1), citations: z.array(citationSchema).min(1) }).strict()).min(1),
    relationships: z.array(z.object({ id, fromConceptId: id, type: relationshipSchema.shape.type, toConceptId: id, supportingFactIds: z.array(id).min(1), citations: z.array(citationSchema).min(1) }).strict()),
    objectives: z.array(z.object({ id, statement: z.string().min(1), supportingFactIds: z.array(id).min(1) }).strict()).min(1),
    prerequisites: z.array(z.object({ objectiveId: id, prerequisiteConceptId: id, confidence: z.enum(["low", "medium", "high"]), rationale: z.string().min(1) }).strict()),
    misconceptions: z.array(z.object({ id, description: z.string().min(1), relatedObjectiveIds: z.array(id).min(1) }).strict()),
    approvalReceipt: z.array(z.object({ comparisonGroupId: id, candidateId: id }).strict()).min(1),
  }).strict().safeParse(candidate);
  if (!schema.success) return { valid: false, errors: schema.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const spec = schema.data as ApprovedLearningSpec;
  const errors: string[] = [];
  if (spec.sourceDocumentId !== source.id) errors.push("Approved spec belongs to another source.");
  for (const [label, items] of Object.entries({ concepts: spec.concepts, facts: spec.facts, relationships: spec.relationships, objectives: spec.objectives, misconceptions: spec.misconceptions })) {
    if (new Set(items.map((item) => item.id)).size !== items.length) errors.push(`Duplicate approved ${label} ID.`);
  }
  const conceptIds = new Set(spec.concepts.map((item) => item.id)); const factIds = new Set(spec.facts.map((item) => item.id)); const objectiveIds = new Set(spec.objectives.map((item) => item.id));
  for (const item of [...spec.concepts, ...spec.facts, ...spec.relationships]) item.citations.forEach((citation) => errors.push(...validateCitation(source, citation)));
  for (const relation of spec.relationships) {
    if (!conceptIds.has(relation.fromConceptId) || !conceptIds.has(relation.toConceptId)) errors.push(`${relation.id} has an unapproved concept endpoint.`);
    relation.supportingFactIds.forEach((factId) => { if (!factIds.has(factId)) errors.push(`${relation.id} has unapproved fact ${factId}.`); });
  }
  for (const objective of spec.objectives) objective.supportingFactIds.forEach((factId) => { if (!factIds.has(factId)) errors.push(`${objective.id} has unapproved fact ${factId}.`); });
  for (const prerequisite of spec.prerequisites) if (!objectiveIds.has(prerequisite.objectiveId) || !conceptIds.has(prerequisite.prerequisiteConceptId)) errors.push("Prerequisite points outside approved material.");
  for (const misconception of spec.misconceptions) misconception.relatedObjectiveIds.forEach((objectiveId) => { if (!objectiveIds.has(objectiveId)) errors.push(`${misconception.id} has unknown objective.`); });
  return { valid: errors.length === 0, spec, errors };
}

function validateTableConfig(source: SourceDocument, config: FactoryConfig): string[] {
  if (!("tableId" in config)) return [];
  const table = source.tables.find((item) => item.id === config.tableId);
  if (!table) return [`Unknown factory table ${config.tableId}.`];
  const rows = new Set(table.rows.map((row) => row.id)); const columns = new Set(table.columns.map((column) => column.id));
  if (config.kind === "parameter-experiment" && (!columns.has(config.inputColumnId) || !columns.has(config.outputColumnId))) return ["Parameter experiment references an unknown column."];
  if (config.kind === "data-plot" && (!columns.has(config.xColumnId) || !columns.has(config.yColumnId))) return ["Data plot references an unknown column."];
  if (config.kind === "comparison") return [...config.rowIds.filter((row) => !rows.has(row)).map((row) => `Unknown comparison row ${row}.`), ...config.columnIds.filter((column) => !columns.has(column)).map((column) => `Unknown comparison column ${column}.`)];
  if (config.kind === "target-challenge" && (!rows.has(config.heldOutRowId) || !columns.has(config.predictionColumnId))) return ["Target challenge references unknown trusted data."];
  return [];
}

export function validateRepresentationPlan(source: SourceDocument, spec: ApprovedLearningSpec, candidate: unknown): { valid: boolean; plan?: RepresentationPlanDraft; errors: string[]; schemaValid: boolean } {
  const parsed = representationPlanSchema.safeParse(candidate);
  if (!parsed.success) return { valid: false, schemaValid: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const plan = parsed.data as RepresentationPlanDraft; const errors: string[] = [];
  if (plan.sourceDocumentId !== source.id) errors.push("Representation plan belongs to another source.");
  const objectives = new Set(spec.objectives.map((item) => item.id)); const facts = new Set(spec.facts.map((item) => item.id)); const relationships = new Set(spec.relationships.map((item) => item.id)); const concepts = new Set(spec.concepts.map((item) => item.id));
  const seen = new Set<string>();
  for (const objectivePlan of plan.objectivePlans) {
    if (!objectivePlan.representationGap && !objectivePlan.proposals.length) errors.push("Each objective needs a proposal or an explicit representation gap.");
    if (!objectives.has(objectivePlan.objectiveId)) errors.push(`Unknown objective ${objectivePlan.objectiveId}.`);
    if (objectivePlan.representationGap && objectivePlan.proposals.length) errors.push(`${objectivePlan.objectiveId} cannot have a gap and proposals.`);
    if (objectivePlan.representationGap && !objectivePlan.gapReason) errors.push(`${objectivePlan.objectiveId} needs a gap reason.`);
    for (const proposal of objectivePlan.proposals) {
      if (seen.has(proposal.tempId)) errors.push(`Duplicate proposal ${proposal.tempId}.`); seen.add(proposal.tempId);
      if (proposal.primitiveId !== proposal.factoryConfig.kind) errors.push(`${proposal.tempId} primitive and factory kind differ.`);
      if (["evidence", "apply", "transfer"].includes(proposal.role) && !["prediction", "target-challenge", "step-sequence"].includes(proposal.primitiveId)) errors.push("An evidence/application role needs a scored interaction, not a completion button.");
      proposal.supportingFactIds.forEach((factId) => { if (!facts.has(factId)) errors.push(`${proposal.tempId} uses unapproved fact ${factId}.`); });
      proposal.relationshipIds.forEach((relationshipId) => { if (!relationships.has(relationshipId)) errors.push(`${proposal.tempId} uses unapproved relationship ${relationshipId}.`); });
      if (proposal.factoryConfig.kind === "prediction" && !relationships.has(proposal.factoryConfig.relationshipId)) errors.push(`${proposal.tempId} predicts an unknown relationship.`);
      if (proposal.factoryConfig.kind === "classification") {
        errors.push("Classification is unavailable until approved category-answer mappings are supported. Choose another representation or report a gap.");
        proposal.factoryConfig.categoryConceptIds.forEach((conceptId) => { if (!concepts.has(conceptId)) errors.push(`${proposal.tempId} uses unknown concept ${conceptId}.`); });
        proposal.factoryConfig.itemFactIds.forEach((factId) => { if (!facts.has(factId)) errors.push(`${proposal.tempId} uses unknown fact ${factId}.`); });
      }
      if (proposal.factoryConfig.kind === "step-sequence") proposal.factoryConfig.relationshipIds.forEach((relationshipId) => { if (!relationships.has(relationshipId)) errors.push(`${proposal.tempId} sequences unknown relationship ${relationshipId}.`); });
      if (proposal.factoryConfig.kind === "evidence-reveal") proposal.factoryConfig.factIds.forEach((factId) => { if (!facts.has(factId)) errors.push(`${proposal.tempId} reveals unknown fact ${factId}.`); });
      const config = proposal.factoryConfig;
      if (config.kind === "prediction") {
        const relation = spec.relationships.find((item) => item.id === config.relationshipId);
        if (relation && !["increases", "decreases"].includes(relation.type)) errors.push("Directional predictions require an increases/decreases relationship.");
      }
      if (config.kind === "step-sequence") {
        const chain = config.relationshipIds.map((id) => spec.relationships.find((item) => item.id === id));
        if (new Set(config.relationshipIds).size !== chain.length || chain.some((item, index) => !item || item.type !== "sequence" || (index > 0 && chain[index - 1]?.toConceptId !== item.fromConceptId))) errors.push("Sequencing requires an approved connected sequence chain in order.");
      }
      if (config.kind === "parameter-experiment" || config.kind === "data-plot" || config.kind === "target-challenge") {
        const table = source.tables.find((item) => item.id === config.tableId);
        const ids = config.kind === "parameter-experiment" ? [config.inputColumnId, config.outputColumnId] : config.kind === "data-plot" ? [config.xColumnId, config.yColumnId] : [config.predictionColumnId];
        if (new Set(ids).size !== ids.length) errors.push("Input and output columns must differ.");
        if (table && ids.some((id) => table.columns.find((column) => column.id === id)?.valueType !== "number" || table.rows.some((row) => typeof row.values[id] !== "number" || !Number.isFinite(row.values[id])))) errors.push("This factory requires finite numeric source columns.");
      }
      errors.push(...validateTableConfig(source, proposal.factoryConfig));
    }
  }
  return { valid: errors.length === 0, schemaValid: true, plan, errors };
}
