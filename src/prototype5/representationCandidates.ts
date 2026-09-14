import type { ApprovedLearningSpec, RepresentationPlanDraft, RepresentationProposal, SourceDocument } from "./types";

export type RepresentationCandidate = {
  id: string;
  objectiveId: string;
  label: string;
  proposal: RepresentationProposal;
};

export type RepresentationSelectionDraft = {
  schemaVersion: "p5-representation-selection-1";
  sourceDocumentId: string;
  objectiveSelections: Array<{
    objectiveId: string;
    representationGap: boolean;
    gapReason?: string;
    selectedCandidateIds: string[];
  }>;
};

function proposal(tempId: string, primitiveId: RepresentationProposal["primitiveId"], role: RepresentationProposal["role"], supportingFactIds: string[], relationshipIds: string[], factoryConfig: RepresentationProposal["factoryConfig"]): RepresentationProposal {
  return { tempId, primitiveId, role, supportingFactIds, relationshipIds, factoryConfig };
}

export function buildRepresentationCandidates(source: SourceDocument, spec: ApprovedLearningSpec): RepresentationCandidate[] {
  const candidates: RepresentationCandidate[] = [];
  for (const [objectiveIndex, objective] of spec.objectives.entries()) {
    const prefix = `candidate-${objectiveIndex + 1}`;
    const objectiveFacts = objective.supportingFactIds;
    const directional = spec.relationships.find((relationship) =>
      ["increases", "decreases"].includes(relationship.type)
      && relationship.supportingFactIds.some((factId) => objectiveFacts.includes(factId)),
    ) ?? spec.relationships.find((relationship) => ["increases", "decreases"].includes(relationship.type));
    if (directional) {
      candidates.push({
        id: `${prefix}-prediction`, objectiveId: objective.id, label: "Elicit a prediction before showing the evidence",
        proposal: proposal(`${prefix}-prediction`, "prediction", "evidence", directional.supportingFactIds, [directional.id], { kind: "prediction", relationshipId: directional.id }),
      });
    }

    const table = source.tables.find((item) => item.rows.length >= 3 && item.columns.filter((column) => column.valueType === "number").length >= 2);
    if (table) {
      const [input, output] = table.columns.filter((column) => column.valueType === "number");
      const heldOut = table.rows.at(-1)!;
      const observedRows = table.rows.slice(0, -1);
      const tableFactIds = spec.facts.filter((fact) => fact.citations.some((citation) => citation.kind === "table" && citation.tableId === table.id)).map((fact) => fact.id);
      const factIds = tableFactIds.length ? tableFactIds : objectiveFacts;
      candidates.push(
        {
          id: `${prefix}-experiment`, objectiveId: objective.id, label: `Explore recorded ${input.label.toLowerCase()} and ${output.label.toLowerCase()}`,
          proposal: proposal(`${prefix}-experiment`, "parameter-experiment", "explore", factIds, directional ? [directional.id] : [], { kind: "parameter-experiment", tableId: table.id, inputColumnId: input.id, outputColumnId: output.id }),
        },
        {
          id: `${prefix}-plot`, objectiveId: objective.id, label: "Build a graph from the recorded trials",
          proposal: proposal(`${prefix}-plot`, "data-plot", "represent", factIds, directional ? [directional.id] : [], { kind: "data-plot", tableId: table.id, xColumnId: input.id, yColumnId: output.id }),
        },
        {
          id: `${prefix}-comparison`, objectiveId: objective.id, label: "Compare two observed trials side by side",
          proposal: proposal(`${prefix}-comparison`, "comparison", "support", factIds, directional ? [directional.id] : [], { kind: "comparison", tableId: table.id, rowIds: [observedRows[0].id, observedRows.at(-1)!.id], columnIds: [input.id, output.id] }),
        },
        {
          id: `${prefix}-target`, objectiveId: objective.id, label: "Finish with a held-out recorded trial",
          proposal: proposal(`${prefix}-target`, "target-challenge", "apply", factIds, directional ? [directional.id] : [], { kind: "target-challenge", tableId: table.id, heldOutRowId: heldOut.id, predictionColumnId: output.id }),
        },
      );
    }

    candidates.push({
      id: `${prefix}-reveal`, objectiveId: objective.id, label: "Reveal the approved explanation after observation",
      proposal: proposal(`${prefix}-reveal`, "evidence-reveal", "support", objectiveFacts, spec.relationships.filter((relationship) => relationship.supportingFactIds.some((factId) => objectiveFacts.includes(factId))).map((relationship) => relationship.id), { kind: "evidence-reveal", factIds: objectiveFacts }),
    });
  }
  return candidates;
}

export function expandRepresentationSelection(source: SourceDocument, spec: ApprovedLearningSpec, candidate: unknown, available: RepresentationCandidate[]): { plan?: RepresentationPlanDraft; errors: string[] } {
  if (!candidate || typeof candidate !== "object") return { errors: ["Planner selection must be an object."] };
  const draft = candidate as Partial<RepresentationSelectionDraft>;
  const errors: string[] = [];
  if (draft.schemaVersion !== "p5-representation-selection-1") errors.push("Planner selection has the wrong schema version.");
  if (draft.sourceDocumentId !== source.id) errors.push("Planner selection belongs to another source.");
  if (!Array.isArray(draft.objectiveSelections)) return { errors: [...errors, "Planner selection needs objectiveSelections."] };
  const candidateMap = new Map(available.map((item) => [item.id, item]));
  const objectiveIds = new Set(spec.objectives.map((item) => item.id));
  const seenObjectives = new Set<string>();
  const seenCandidates = new Set<string>();
  const objectivePlans: RepresentationPlanDraft["objectivePlans"] = [];
  for (const selection of draft.objectiveSelections) {
    if (!selection || typeof selection !== "object") { errors.push("Invalid objective selection."); continue; }
    const item = selection as RepresentationSelectionDraft["objectiveSelections"][number];
    if (!objectiveIds.has(item.objectiveId)) errors.push(`Unknown objective ${item.objectiveId}.`);
    if (seenObjectives.has(item.objectiveId)) errors.push(`Duplicate objective selection ${item.objectiveId}.`);
    seenObjectives.add(item.objectiveId);
    if (typeof item.representationGap !== "boolean") errors.push(`${item.objectiveId} needs a representationGap boolean.`);
    if (!Array.isArray(item.selectedCandidateIds)) { errors.push(`${item.objectiveId} needs selectedCandidateIds.`); continue; }
    if (item.selectedCandidateIds.length > 5) errors.push(`${item.objectiveId} selects more than five candidates.`);
    if (item.representationGap && item.selectedCandidateIds.length) errors.push(`${item.objectiveId} cannot select candidates and report a gap.`);
    if (item.representationGap && !item.gapReason?.trim()) errors.push(`${item.objectiveId} needs a gap reason.`);
    if (!item.representationGap && !item.selectedCandidateIds.length) errors.push(`${item.objectiveId} must select candidates or report a gap.`);
    const proposals: RepresentationProposal[] = [];
    for (const id of item.selectedCandidateIds) {
      const legal = candidateMap.get(id);
      if (!legal) { errors.push(`Unknown representation candidate ${id}.`); continue; }
      if (legal.objectiveId !== item.objectiveId) { errors.push(`${id} belongs to another objective.`); continue; }
      if (seenCandidates.has(id)) { errors.push(`Duplicate representation candidate ${id}.`); continue; }
      seenCandidates.add(id); proposals.push(structuredClone(legal.proposal));
    }
    objectivePlans.push({ objectiveId: item.objectiveId, representationGap: item.representationGap, gapReason: item.gapReason, proposals });
  }
  for (const objectiveId of objectiveIds) if (!seenObjectives.has(objectiveId)) errors.push(`Missing objective selection ${objectiveId}.`);
  const proposals = objectivePlans.flatMap((item) => item.proposals);
  if (proposals.length && !proposals.some((item) => item.role === "evidence")) errors.push("Select an evidence representation.");
  if (proposals.length && !proposals.some((item) => item.role === "support" || ["parameter-experiment", "comparison", "evidence-reveal"].includes(item.primitiveId))) errors.push("Select an experiment, comparison, or explanation that can support an incorrect learner.");
  if (proposals.length && !proposals.some((item) => ["apply", "transfer"].includes(item.role))) errors.push("Select a final application representation.");
  if (errors.length) return { errors };
  return { plan: { schemaVersion: "p5-representations-1", sourceDocumentId: source.id, objectivePlans }, errors: [] };
}

export function representationSelectionJsonSchema(source: SourceDocument, spec: ApprovedLearningSpec, candidates: RepresentationCandidate[]) {
  return {
    type: "object", additionalProperties: false,
    required: ["schemaVersion", "sourceDocumentId", "objectiveSelections"],
    properties: {
      schemaVersion: { type: "string", const: "p5-representation-selection-1" },
      sourceDocumentId: { type: "string", const: source.id },
      objectiveSelections: {
        type: "array", minItems: spec.objectives.length, maxItems: spec.objectives.length,
        items: {
          type: "object", additionalProperties: false,
          required: ["objectiveId", "representationGap", "selectedCandidateIds"],
          properties: {
            objectiveId: { type: "string", enum: spec.objectives.map((item) => item.id) },
            representationGap: { type: "boolean" },
            gapReason: { type: "string", maxLength: 180 },
            selectedCandidateIds: { type: "array", minItems: 0, maxItems: 5, uniqueItems: true, items: { type: "string", enum: candidates.map((item) => item.id) } },
          },
        },
      },
    },
  };
}
