import type { ApprovedLearningSpec, ModelProfile, PrimitiveFactoryDescription, SourceDocument } from "./types";
import { z } from "zod";
import { analysisDraftSchema, representationPlanSchema } from "./contracts";

type OllamaEnvelope = { model?: string; message?: { content?: string }; prompt_eval_count?: number; eval_count?: number };

export function modelForProfile(profile: ModelProfile) {
  return profile === "fast"
    ? process.env.P5_ANALYZER_FAST_MODEL?.trim() || "qwen3:4b-instruct"
    : process.env.P5_ANALYZER_QUALITY_MODEL?.trim() || "qwen3:14b";
}

export function plannerModelForProfile(profile: ModelProfile) {
  return profile === "fast"
    ? process.env.P5_ANALYZER_FAST_MODEL?.trim() || "qwen3:4b-instruct"
    : process.env.P5_PLANNER_MODEL?.trim() || "qwen3:14b";
}

function baseUrl() { return (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, ""); }

const analysisJsonSchema = z.toJSONSchema(analysisDraftSchema);
const representationJsonSchema = z.toJSONSchema(representationPlanSchema);

async function ollamaJson(model: string, system: string, prompt: string, format: object, signal?: AbortSignal) {
  const response = await fetch(`${baseUrl()}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal, cache: "no-store",
    body: JSON.stringify({
      model, stream: false, think: false, format, keep_alive: "15m",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      options: { temperature: 0.05, num_ctx: 4096, num_predict: 1450 },
    }),
  });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
  const payload = (await response.json()) as OllamaEnvelope;
  if (!payload.message?.content) throw new Error("Ollama returned no structured content.");
  return { content: payload.message.content, model: payload.model || model };
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

function planningPrompt(spec: ApprovedLearningSpec, catalog: PrimitiveFactoryDescription[], correction?: { errors: string[]; previous: string }) {
  return `${correction ? `Your previous JSON was rejected. Correct only these errors:\n${correction.errors.join("\n")}\nPrevious response:\n${correction.previous}\n\n` : ""}Plan approved interactive representations for this human-approved learning specification. Use only IDs present in the specification and only primitive/config shapes in the catalog. Do not write UI copy, JSX, CSS, coordinates, generated values, or new knowledge. Prefer a small varied set. For table lessons, useful coverage is prediction, discrete parameter experiment, data plot, evidence reveal, and held-out target challenge. If the catalog cannot represent an objective, set representationGap true and explain why.

Return exactly:
{"schemaVersion":"p5-representations-1","sourceDocumentId":"${spec.sourceDocumentId}","objectivePlans":[{"objectiveId":"approved objective ID","representationGap":false,"proposals":[{"tempId":"p1","primitiveId":"prediction","role":"evidence","supportingFactIds":["approved fact ID"],"relationshipIds":["approved relationship ID"],"factoryConfig":{"kind":"prediction","relationshipId":"approved relationship ID"}}]}]}

Primitive and config pairs:
${JSON.stringify(catalog)}
Approved specification:
${JSON.stringify(spec)}`;
}

export class OllamaSourceAnalyzer {
  readonly providerId = "ollama" as const;
  constructor(readonly profile: ModelProfile, readonly modelId = modelForProfile(profile)) {}
  analyze(source: SourceDocument, options: { signal?: AbortSignal; correction?: { errors: string[]; previous: string } } = {}) {
    return ollamaJson(this.modelId, "You are a source-grounded curriculum analyst. Return strict JSON only. Never use knowledge outside the supplied source.", analysisPrompt(source, this.modelId, options.correction), analysisJsonSchema, options.signal);
  }
}

export class OllamaRepresentationPlanner {
  readonly providerId = "ollama" as const;
  readonly modelId: string;
  constructor(readonly profile: ModelProfile) { this.modelId = plannerModelForProfile(profile); }
  plan(spec: ApprovedLearningSpec, catalog: PrimitiveFactoryDescription[], options: { signal?: AbortSignal; correction?: { errors: string[]; previous: string } } = {}) {
    return ollamaJson(this.modelId, "You are a constrained learning-representation planner. Return strict JSON using only supplied IDs and factory shapes.", planningPrompt(spec, catalog, options.correction), representationJsonSchema, options.signal);
  }
}
