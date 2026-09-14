import type { ApprovedLearningSpec, ModelProfile, SourceDocument } from "./types";
import { z } from "zod";
import { analysisDraftSchema } from "./contracts";
import { createP5Provider, P5_LOCAL_MODEL } from "./localModel";
import { representationSelectionJsonSchema, type RepresentationCandidate } from "./representationCandidates";

export function modelForProfile() { return P5_LOCAL_MODEL; }
export function plannerModelForProfile() { return P5_LOCAL_MODEL; }

const analysisJsonSchema = z.toJSONSchema(analysisDraftSchema);
async function ollamaJson(system: string, prompt: string, format: object, signal?: AbortSignal, maxTokens?: number, contextTokens?: number) {
  return createP5Provider().generate({ system, prompt, format, signal, maxTokens, contextTokens });
}

function analysisPrompt(source: SourceDocument, modelId: string, correction?: { errors: string[]; previous: string }) {
  return `${correction ? `REPAIR THE COMPLETE DRAFT. Your previous JSON was rejected. Return the entire required object again, not a partial patch. Never fix an error by emptying an array or deleting valid grounded items. The repaired draft must still contain 2-5 concepts, 2-5 facts, and at least 1 objective. Correct these errors:\n${correction.errors.join("\n")}\nPrevious response:\n${correction.previous}\n\n` : ""}Analyze only the trusted source below. The source is authoritative. Do not add outside facts. Text citations must copy exact continuous substrings from a section's text field. Table citations must use existing IDs. Keep the draft concise: 2-5 concepts, 2-5 facts, 1-3 relationships, 1-3 objectives, at most 2 prerequisites and 2 misconceptions.

Return exactly this JSON shape and no additional keys:
{"schemaVersion":"p5-analysis-1","sourceDocumentId":"${source.id}","modelId":"${modelId}","sourceDerived":{"concepts":[{"tempId":"c1","name":"...","citations":[{"kind":"text","sectionId":"...","quote":"exact quote"}]}],"facts":[{"tempId":"f1","statement":"...","citations":[{"kind":"table","tableId":"...","rowIds":["..."],"columnIds":["..."]}]}],"relationships":[{"tempId":"r1","fromConceptId":"c1","type":"increases","toConceptId":"c2","supportingFactIds":["f1"],"citations":[{"kind":"text","sectionId":"...","quote":"exact quote"}]}]},"pedagogical":{"objectives":[{"tempId":"o1","statement":"Predict ...","supportingFactIds":["f1"]}],"proposedPrerequisites":[],"suggestedMisconceptions":[{"tempId":"m1","description":"...","relatedObjectiveIds":["o1"]}]}}

Allowed relationship types: causes, increases, decreases, part-of, sequence, compares, depends-on.
Trusted source:
${JSON.stringify(source)}

Before returning, verify that concepts and facts are not empty, every quote is copied exactly, every referenced tempId exists in this same response, and the complete JSON object matches the requested shape.`;
}

function planningPrompt(spec: ApprovedLearningSpec, candidates: RepresentationCandidate[], correction?: { errors: string[]; previous: string }) {
  return `${correction ? `REPAIR YOUR SELECTION. Correct these errors:\n${correction.errors.join("\n")}\nPrevious selection:\n${correction.previous}\n\n` : ""}Choose a short, coherent interactive path for each approved objective. Every candidate below is already source-grounded and has a deterministic factory configuration. Select candidate IDs only. Never invent or edit an ID, table, column, value, fact, relationship, component, or UI property.

For a represented objective select 3-5 varied candidates. The complete selection must include:
1. one evidence activity,
2. one support-capable activity: parameter experiment, comparison, or evidence reveal,
3. one final apply activity.
Prefer prediction before revealing evidence. Do not report a representation gap when legal candidates cover the objective.

Return exactly:
{"schemaVersion":"p5-representation-selection-1","sourceDocumentId":"${spec.sourceDocumentId}","objectiveSelections":[{"objectiveId":"exact objective ID","representationGap":false,"selectedCandidateIds":["exact candidate ID"]}]}

Approved objectives:
${JSON.stringify(spec.objectives.map((item) => ({ id: item.id, statement: item.statement })))}
Legal candidates (copy only their IDs):
${JSON.stringify(candidates.map((item) => ({ id: item.id, objectiveId: item.objectiveId, label: item.label, primitiveId: item.proposal.primitiveId, role: item.proposal.role })))}`;
}

export class OllamaSourceAnalyzer {
  readonly providerId = "ollama" as const;
  constructor(readonly profile: ModelProfile, readonly modelId = modelForProfile()) {}
  analyze(source: SourceDocument, options: { signal?: AbortSignal; correction?: { errors: string[]; previous: string } } = {}) {
    return ollamaJson("You are a source-grounded curriculum analyst. Return strict JSON only. Never use knowledge outside the supplied source.", analysisPrompt(source, this.modelId, options.correction), analysisJsonSchema, options.signal, 1500, 4096);
  }
}

export class OllamaRepresentationPlanner {
  readonly providerId = "ollama" as const;
  readonly modelId: string;
  constructor(readonly profile: ModelProfile) { this.modelId = plannerModelForProfile(); }
  plan(source: SourceDocument, spec: ApprovedLearningSpec, candidates: RepresentationCandidate[], options: { signal?: AbortSignal; correction?: { errors: string[]; previous: string } } = {}) {
    return ollamaJson("You are a constrained learning-representation selector. Return strict JSON using only supplied candidate IDs.", planningPrompt(spec, candidates, options.correction), representationSelectionJsonSchema(source, spec, candidates), options.signal, 500, 3072);
  }
}
