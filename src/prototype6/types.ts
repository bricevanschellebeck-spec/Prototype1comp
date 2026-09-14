export type LearningGoal = "explore" | "understand" | "revise" | "test";
export type DepthMinutes = 5 | 15 | 30;
import type { NormalizedCapability } from "./capabilities";

export type GroundedText = {
  text: string;
  supportingFactIds: string[];
  supportingRelationshipIds: string[];
};

export type ValueBinding = { variableId: string; valueId: string };

export type PrimitiveDesign =
  | { kind: "explanation"; factIds: string[] }
  | { kind: "observation"; sceneId: "circuit-loop-v1"; highlightConceptIds: string[] }
  | { kind: "prediction"; relationshipId: string; scenarioValueIds: string[]; answerStrategy: "derive-relationship-direction" }
  | { kind: "parameter-experiment"; sceneId: "circuit-loop-v1"; controlVariableId: string; observedVariableId: string; fixedBindings: ValueBinding[]; selectableValueIds: string[]; derivationRuleId: string; minimumComparisons: number }
  | { kind: "comparison"; caseBindings: Array<{ label: string; valueIds: string[] }>; observedVariableIds: string[]; derivationRuleId?: string }
  | { kind: "data-plot"; xVariableId: string; yVariableId: string; fixedBindings: ValueBinding[]; xValueIds: string[]; derivationRuleId: string }
  | { kind: "diagram"; sceneId: "circuit-loop-v1"; highlightConceptIds: string[] }
  | { kind: "evidence-reveal"; factIds: string[] }
  | { kind: "worked-example"; derivationRuleId: string; inputValueIds: string[]; requestedPrecision: 0 | 1 | 2; revealOrder: "inputs-then-operation-then-result" }
  | { kind: "multiple-choice"; relationshipId: string; scenarioValueIds: string[]; answerStrategy: "derive-relationship-direction" }
  | { kind: "target-challenge"; derivationRuleId: string; inputValueIds: string[]; targetVariableId: string }
  | { kind: "transfer-challenge"; derivationRuleId: string; inputValueIds: string[]; targetVariableId: string };

export type StageRole = "orient" | "evidence" | "explore" | "represent" | "explain" | "support" | "apply" | "transfer";
export type StageAvailability = "core" | "support-only" | "extension";
export type RepresentationReason = "spatial-system-best-seen" | "causal-change-best-manipulated" | "existing-model-should-be-elicited" | "numerical-trend-best-observed" | "contrast-reduces-misconception" | "formal-language-after-evidence" | "application-confirms-understanding" | "transfer-tests-generalization";
export type TransitionReason = "introduce-system" | "collect-prior-evidence" | "test-prediction" | "show-alternate-form" | "name-observed-pattern" | "respond-to-misconception" | "increase-challenge" | "confirm-transfer";

export type ExperienceStage = {
  stageId: string;
  objectiveIds: string[];
  role: StageRole;
  availability: StageAvailability;
  prerequisiteStageIds: string[];
  addressesMisconceptionIds: string[];
  primitive: PrimitiveDesign;
  copy: { title: GroundedText; instruction: GroundedText; explanation?: GroundedText; correctFeedback?: GroundedText; incorrectFeedback?: GroundedText };
  sourceFactIds: string[];
  sourceRelationshipIds: string[];
  estimatedMinutes: 1 | 2 | 3 | 4 | 5;
  representationReason: RepresentationReason;
  transitionReason: TransitionReason;
};

export type LearningExperienceBlueprint = {
  schemaVersion: "p6-experience-blueprint-1";
  sourcePackageId: "circuits-resistance-approved-v1";
  designProfile: { goal: LearningGoal; depthMinutes: DepthMinutes; learnerLevel: "intro-secondary" };
  lessonTitle: GroundedText;
  objectiveIds: string[];
  assumedPrerequisiteConceptIds: string[];
  persistentSceneId: "circuit-loop-v1";
  stages: ExperienceStage[];
  initialSequenceStageIds: string[];
  finalApplicationStageId: string;
  representationGaps: Array<{ objectiveId: string; missingCapability: NormalizedCapability; reasonCode: "existing-primitives-cannot-show-mechanism" }>;
  designSummary: { delayedFactIds: string[]; omittedFactIds: string[]; reasonCodes: string[] };
};

export type P6DesignRequest = { schemaVersion: "p6-design-request-1"; sourcePackageId: "circuits-resistance-approved-v1"; goal: LearningGoal; depthMinutes: DepthMinutes; learnerLevel: "intro-secondary" };

export type SourcePageBlock = { id: string; page: 1 | 2; kind: "title" | "diagram" | "definition" | "relationship" | "formula" | "example" | "question"; title: string; body: string; factIds: string[] };
export type CircuitKnowledgePackage = {
  id: "circuits-resistance-approved-v1";
  source: { title: string; subject: "physics"; sections: Array<{ id: string; heading: string; text: string }>; pages: SourcePageBlock[] };
  concepts: Array<{ id: string; name: string }>;
  facts: Array<{ id: string; statement: string; sectionId: string; quote: string }>;
  relationships: Array<{ id: string; fromConceptId: string; type: "increases" | "decreases" | "depends-on" | "requires"; toConceptId: string; heldConstantVariableIds: string[]; supportingFactIds: string[] }>;
  objectives: Array<{ id: string; statement: string; supportingFactIds: string[] }>;
  misconceptions: Array<{ id: string; description: string; objectiveIds: string[] }>;
  variables: Array<{ id: string; label: string; symbol: string; unit: string }>;
  values: Array<{ id: string; variableId: string; value: number }>;
  derivations: Array<{ id: string; outputVariableId: string; inputVariableIds: string[]; operator: "divide" }>;
  scenes: Array<{ id: "circuit-loop-v1"; supportedConceptIds: string[]; supportedVariableIds: string[] }>;
};

export type P6ProviderId = "gemini" | "ollama";
export type P6DesignResponse = { status: "accepted" | "failed"; blueprint?: LearningExperienceBlueprint; designReceipt?: string; model: string; provider: P6ProviderId; latencyMs: number; correctionAttempted: boolean; validationErrors: string[]; failureReason?: string };

export type CompiledStage = ExperienceStage & { title: string; instruction: string; explanation?: string; correctFeedback?: string; incorrectFeedback?: string };
export type CompiledExperience = {
  schemaVersion: "p6-compiled-experience-1";
  id: string;
  sourcePackageId: CircuitKnowledgePackage["id"];
  designProfile: LearningExperienceBlueprint["designProfile"];
  lessonTitle: string;
  persistentSceneId: "circuit-loop-v1";
  stages: CompiledStage[];
  initialSequenceStageIds: string[];
  finalApplicationStageId: string;
  representationGaps: LearningExperienceBlueprint["representationGaps"];
  designSummary: LearningExperienceBlueprint["designSummary"];
  provenanceReceipt: Array<{ stageId: string; factIds: string[]; relationshipIds: string[] }>;
  compilationReceipt?: string;
};

export type BlockOutcome = { stageId: string; result: "correct" | "incorrect" | "completed"; attempts: number; hintUsed: boolean; misconceptionIds: string[] };
export type P6PathResponse = { stageIds: string[]; source: P6ProviderId | "deterministic-fallback"; model: string; latencyMs: number; legalStageIds: string[]; validationErrors: string[]; fallbackReason?: string };
