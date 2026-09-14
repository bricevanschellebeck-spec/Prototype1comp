import type { LearningExperienceBlueprint, PrimitiveDesign } from "./types";
import { circuitKnowledge } from "./knowledge";

export const normalizedCapabilities = [
  "concise-explanation",
  "spatial-representation",
  "labelled-structure",
  "hypothesis",
  "directional-reasoning",
  "variable-manipulation",
  "cause-effect-observation",
  "contrast",
  "data-comparison",
  "quantitative-trend",
  "evidence-to-concept",
  "deterministic-calculation",
  "retrieval-check",
  "deterministic-application",
  "transfer-generalization",
  "ordered-process",
  "free-form-circuit-construction",
  "microscopic-charge-motion",
  "continuous-field-visualization",
] as const;

export type NormalizedCapability = (typeof normalizedCapabilities)[number];
export type PrimitiveKind = PrimitiveDesign["kind"];

export type PrimitiveCapabilityDescription = {
  purpose: string;
  capabilities: NormalizedCapability[];
  exactShape: string;
};

export const primitiveCapabilityRegistry: Record<PrimitiveKind, PrimitiveCapabilityDescription> = {
  explanation: {
    purpose: "Show a concise grounded explanation.",
    capabilities: ["concise-explanation"],
    exactShape: '{"kind":"explanation","factIds":[fact-id]}',
  },
  observation: {
    purpose: "Focus attention on registered circuit concepts.",
    capabilities: ["spatial-representation", "labelled-structure"],
    exactShape: '{"kind":"observation","sceneId":"circuit-loop-v1","highlightConceptIds":[concept-id]}',
  },
  prediction: {
    purpose: "Ask for the direction of an approved relationship.",
    capabilities: ["hypothesis", "directional-reasoning"],
    exactShape: '{"kind":"prediction","relationshipId":relationship-id,"scenarioValueIds":[at-least-2-value-ids],"answerStrategy":"derive-relationship-direction"}',
  },
  "parameter-experiment": {
    purpose: "Let the learner change one approved variable and calculate another with an approved derivation.",
    capabilities: ["variable-manipulation", "cause-effect-observation"],
    exactShape: '{"kind":"parameter-experiment","sceneId":"circuit-loop-v1","controlVariableId":variable-id,"observedVariableId":variable-id,"fixedBindings":[{"variableId":variable-id,"valueId":value-id}],"selectableValueIds":[at-least-2-value-ids],"derivationRuleId":derivation-id,"minimumComparisons":2}',
  },
  comparison: {
    purpose: "Compare two or more approved value bindings.",
    capabilities: ["contrast", "data-comparison"],
    exactShape: '{"kind":"comparison","caseBindings":[{"label":"short label","valueIds":[value-id]},{"label":"short label","valueIds":[value-id]}],"observedVariableIds":[variable-id],"derivationRuleId":derivation-id}',
  },
  "data-plot": {
    purpose: "Build a graph from approved x values and a derivation.",
    capabilities: ["quantitative-trend", "data-comparison"],
    exactShape: '{"kind":"data-plot","xVariableId":variable-id,"yVariableId":variable-id,"fixedBindings":[{"variableId":variable-id,"valueId":value-id}],"xValueIds":[at-least-3-value-ids],"derivationRuleId":derivation-id}',
  },
  diagram: {
    purpose: "Highlight concepts on the registered circuit scene.",
    capabilities: ["spatial-representation", "labelled-structure"],
    exactShape: '{"kind":"diagram","sceneId":"circuit-loop-v1","highlightConceptIds":[concept-id]}',
  },
  "evidence-reveal": {
    purpose: "Reveal approved facts after observation.",
    capabilities: ["evidence-to-concept"],
    exactShape: '{"kind":"evidence-reveal","factIds":[fact-id]}',
  },
  "worked-example": {
    purpose: "Reveal a deterministic derivation step by step.",
    capabilities: ["deterministic-calculation"],
    exactShape: '{"kind":"worked-example","derivationRuleId":derivation-id,"inputValueIds":[at-least-2-value-ids],"requestedPrecision":0-or-1-or-2,"revealOrder":"inputs-then-operation-then-result"}',
  },
  "multiple-choice": {
    purpose: "Assess an approved relationship with generated directional choices.",
    capabilities: ["directional-reasoning", "retrieval-check"],
    exactShape: '{"kind":"multiple-choice","relationshipId":relationship-id,"scenarioValueIds":[at-least-2-value-ids],"answerStrategy":"derive-relationship-direction"}',
  },
  "target-challenge": {
    purpose: "Derive a requested target variable from approved inputs.",
    capabilities: ["deterministic-application"],
    exactShape: '{"kind":"target-challenge","derivationRuleId":derivation-id,"inputValueIds":[at-least-2-value-ids],"targetVariableId":variable-id}',
  },
  "transfer-challenge": {
    purpose: "Apply a derivation using a different approved circuit condition.",
    capabilities: ["transfer-generalization"],
    exactShape: '{"kind":"transfer-challenge","derivationRuleId":derivation-id,"inputValueIds":[at-least-2-value-ids],"targetVariableId":variable-id}',
  },
};

export const availablePrimitiveCapabilities = new Set<NormalizedCapability>(
  Object.values(primitiveCapabilityRegistry).flatMap((primitive) => primitive.capabilities),
);

export type RepresentationGapInspection = {
  objectiveId: string;
  objective: string;
  missingCapability: NormalizedCapability;
  reasonCode: "existing-primitives-cannot-show-mechanism";
  capabilityAvailable: boolean;
  validationStatus: "accepted" | "inconsistent";
};

export function inspectRepresentationGaps(blueprint: LearningExperienceBlueprint): RepresentationGapInspection[] {
  return blueprint.representationGaps.map((gap) => ({
    ...gap,
    objective: circuitKnowledge.objectives.find((objective) => objective.id === gap.objectiveId)?.statement ?? "Unknown objective",
    capabilityAvailable: availablePrimitiveCapabilities.has(gap.missingCapability),
    validationStatus: availablePrimitiveCapabilities.has(gap.missingCapability) ? "inconsistent" : "accepted",
  }));
}
