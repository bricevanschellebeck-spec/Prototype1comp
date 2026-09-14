import { circuitKnowledge } from "./knowledge";
import { experienceBlueprintSchema, validateDesignRequest, validateExperienceBlueprint } from "./contracts";
import { createP6Provider } from "./provider";
import { signBlueprint } from "./receipts";
import type { P6DesignResponse } from "./types";
import { z } from "zod";
import { normalizedCapabilities, primitiveCapabilityRegistry } from "./capabilities";

const stringArraySchema = { type: "array", items: { type: "string" } };
const groundedTextSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "supportingFactIds", "supportingRelationshipIds"],
  properties: { text: { type: "string" }, supportingFactIds: stringArraySchema, supportingRelationshipIds: stringArraySchema },
};

function flatGeminiSchema(): Record<string, unknown> {
  const binding = { type: "object", additionalProperties: false, required: ["variableId", "valueId"], properties: { variableId: { type: "string" }, valueId: { type: "string" } } };
  const primitive = {
    type: "object", additionalProperties: false, required: ["kind"], properties: {
      kind: { type: "string", enum: Object.keys(primitiveCapabilityRegistry) }, factIds: stringArraySchema, sceneId: { type: "string" }, highlightConceptIds: stringArraySchema,
      relationshipId: { type: "string" }, scenarioValueIds: stringArraySchema, answerStrategy: { type: "string" }, controlVariableId: { type: "string" }, observedVariableId: { type: "string" },
      fixedBindings: { type: "array", items: binding }, selectableValueIds: stringArraySchema, derivationRuleId: { type: "string" }, minimumComparisons: { type: "integer" },
      caseBindings: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "valueIds"], properties: { label: { type: "string" }, valueIds: stringArraySchema } } },
      observedVariableIds: stringArraySchema, xVariableId: { type: "string" }, yVariableId: { type: "string" }, xValueIds: stringArraySchema, inputValueIds: stringArraySchema,
      requestedPrecision: { type: "integer", enum: [0, 1, 2] }, revealOrder: { type: "string" }, targetVariableId: { type: "string" },
    },
  };
  const stage = {
    type: "object", additionalProperties: false,
    required: ["stageId", "objectiveIds", "role", "availability", "prerequisiteStageIds", "addressesMisconceptionIds", "primitive", "copy", "sourceFactIds", "sourceRelationshipIds", "estimatedMinutes", "representationReason", "transitionReason"],
    properties: {
      stageId: { type: "string" }, objectiveIds: stringArraySchema,
      role: { type: "string", enum: ["orient", "evidence", "explore", "represent", "explain", "support", "apply", "transfer"] },
      availability: { type: "string", enum: ["core", "support-only", "extension"] }, prerequisiteStageIds: stringArraySchema, addressesMisconceptionIds: stringArraySchema,
      primitive,
      copy: { type: "object", additionalProperties: false, required: ["title", "instruction"], properties: { title: groundedTextSchema, instruction: groundedTextSchema, explanation: groundedTextSchema, correctFeedback: groundedTextSchema, incorrectFeedback: groundedTextSchema } },
      sourceFactIds: stringArraySchema, sourceRelationshipIds: stringArraySchema, estimatedMinutes: { type: "integer", enum: [1, 2, 3, 4, 5] },
      representationReason: { type: "string", enum: ["spatial-system-best-seen", "causal-change-best-manipulated", "existing-model-should-be-elicited", "numerical-trend-best-observed", "contrast-reduces-misconception", "formal-language-after-evidence", "application-confirms-understanding", "transfer-tests-generalization"] },
      transitionReason: { type: "string", enum: ["introduce-system", "collect-prior-evidence", "test-prediction", "show-alternate-form", "name-observed-pattern", "respond-to-misconception", "increase-challenge", "confirm-transfer"] },
    },
  };
  return {
    type: "object", additionalProperties: false,
    required: ["schemaVersion", "sourcePackageId", "designProfile", "lessonTitle", "objectiveIds", "assumedPrerequisiteConceptIds", "persistentSceneId", "stages", "initialSequenceStageIds", "finalApplicationStageId", "representationGaps", "designSummary"],
    properties: {
      schemaVersion: { type: "string", enum: ["p6-experience-blueprint-1"] }, sourcePackageId: { type: "string", enum: ["circuits-resistance-approved-v1"] },
      designProfile: { type: "object", additionalProperties: false, required: ["goal", "depthMinutes", "learnerLevel"], properties: { goal: { type: "string", enum: ["explore", "understand", "revise", "test"] }, depthMinutes: { type: "integer", enum: [5, 15, 30] }, learnerLevel: { type: "string", enum: ["intro-secondary"] } } },
      lessonTitle: groundedTextSchema, objectiveIds: stringArraySchema, assumedPrerequisiteConceptIds: stringArraySchema, persistentSceneId: { type: "string", enum: ["circuit-loop-v1"] },
      stages: { type: "array", items: stage }, initialSequenceStageIds: stringArraySchema, finalApplicationStageId: { type: "string" },
      representationGaps: { type: "array", items: { type: "object", additionalProperties: false, required: ["objectiveId", "missingCapability", "reasonCode"], properties: { objectiveId: { type: "string" }, missingCapability: { type: "string", enum: normalizedCapabilities }, reasonCode: { type: "string", enum: ["existing-primitives-cannot-show-mechanism"] } } } },
      designSummary: { type: "object", additionalProperties: false, required: ["delayedFactIds", "omittedFactIds", "reasonCodes"], properties: { delayedFactIds: stringArraySchema, omittedFactIds: stringArraySchema, reasonCodes: stringArraySchema } },
    },
  };
}

export function p6GenerationSchema(providerId: "gemini" | "ollama") {
  return providerId === "gemini" ? flatGeminiSchema() : z.toJSONSchema(experienceBlueprintSchema, { unrepresentable: "any" }) as Record<string, unknown>;
}

function compactKnowledge() {
  return {
    facts: circuitKnowledge.facts.map(({ id, statement }) => ({ id, statement })), relationships: circuitKnowledge.relationships, objectives: circuitKnowledge.objectives,
    misconceptions: circuitKnowledge.misconceptions, concepts: circuitKnowledge.concepts, variables: circuitKnowledge.variables, values: circuitKnowledge.values,
    derivations: circuitKnowledge.derivations, scenes: circuitKnowledge.scenes,
  };
}

function parse(content: string) { return JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }

export async function designExperience(candidate: unknown, signal?: AbortSignal): Promise<P6DesignResponse> {
  const started = performance.now(); const requestValidation = validateDesignRequest(candidate); const provider = createP6Provider();
  if (!requestValidation.request) return { status: "failed", model: provider.modelId, provider: provider.providerId, latencyMs: 0, correctionAttempted: false, validationErrors: requestValidation.errors, failureReason: "Invalid design request." };
  const request = requestValidation.request; const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), Number(process.env.P6_DESIGN_TIMEOUT_MS || 480000)); const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  let errors: string[] = [];
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const profileRule = request.goal === "explore" ? "Start with an object or prediction; keep formal text minimal." : request.goal === "revise" ? "Begin with retrieval or evidence; avoid introductory exposition." : request.goal === "test" ? "Use at least two scored checks and finish with transfer." : "Move from interaction or prediction to explanation and application.";
      const stageCount = request.depthMinutes === 5 ? 4 : request.depthMinutes === 15 ? 5 : 7;
      const tokenBudget = request.depthMinutes === 5 ? 1900 : request.depthMinutes === 15 ? 2400 : 3200;
      const result = await provider.generate({ signal: combined, format: p6GenerationSchema(provider.providerId), maxTokens: tokenBudget, contextTokens: 6144, thinkingBudget: 1024,
        system: "You are a constrained learning-experience designer. Return one strict JSON blueprint. Design the pedagogy, wording, configurations, alternatives, and order. Use only supplied IDs and registered primitives. Never output code or calculated answers.",
        prompt: `Design a complete circuit learning environment for this exact request: ${JSON.stringify(request)}. ${profileRule}\nApproved knowledge: ${JSON.stringify(compactKnowledge())}\nPrimitive vocabulary and supplied capabilities: ${JSON.stringify(primitiveCapabilityRegistry)}. For every primitive, use exactly and only the keys in its exactShape. Never mix keys from different primitive kinds. Literal strings in exactShape must be copied exactly; placeholders must be replaced only with approved IDs.\nRepresentation gaps: an objective may be accounted for by initial stages OR by one representationGaps item, never both. Declare a gap only when the objective needs one of these normalized capabilities and no registered primitive supplies it: ${normalizedCapabilities.join(", ")}. A gap identifies a limitation; it does not create a stage.\nRole rules: evidence, apply, and transfer stages must use prediction, multiple-choice, target-challenge, or transfer-challenge. A support stage must have role support, availability support-only, and address misconception-more-resistance-more-current. Never give an unscored experiment, diagram, explanation, plot, comparison, observation, reveal, or worked example an evidence/apply/transfer role.\nOutput exactly ${stageCount} stages: exactly one support-only stage for misconception-more-resistance-more-current, and ${stageCount - 1} core stages. Put every core stage in initialSequenceStageIds and no support stage there. Keep arrays minimal. Copy requires title and instruction only; add explanation or feedback only when essential. Every selected objective must be covered by the initial sequence or a valid non-duplicate gap; initial time must fit the budget; include early evidence, a non-text representation, and finish with apply/transfer. Every copy object cites only its stage facts/relationships. Use only approved value IDs. Correct results are computed by code. Stage IDs use lowercase hyphenated form. Do not force a fixed textbook sequence. ${attempt ? `Your previous full response was invalid. Return a complete corrected blueprint. Errors: ${errors.slice(0, 14).join(" | ")}.` : ""}`,
      });
      let parsed: unknown;
      try { parsed = parse(result.content); } catch { errors = ["Designer returned invalid JSON."]; continue; }
      const validation = validateExperienceBlueprint(parsed, request);
      errors = validation.errors;
      if (validation.blueprint && !errors.length) return { status: "accepted", blueprint: validation.blueprint, designReceipt: signBlueprint(validation.blueprint), model: result.model, provider: provider.providerId, latencyMs: Math.round(performance.now() - started), correctionAttempted: attempt === 1, validationErrors: [] };
    }
    return { status: "failed", model: provider.modelId, provider: provider.providerId, latencyMs: Math.round(performance.now() - started), correctionAttempted: true, validationErrors: errors, failureReason: "The lesson designer failed strict validation after one correction attempt." };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: "failed", model: provider.modelId, provider: provider.providerId, latencyMs: Math.round(performance.now() - started), correctionAttempted: false, validationErrors: errors, failureReason: controller.signal.aborted ? `${provider.modelId} exceeded the P6 design timeout.` : error instanceof Error ? error.message : "Designer unavailable." };
  } finally { clearTimeout(timer); }
}
