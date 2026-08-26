export type LessonId = "circuits-resistance-v1" | "cell-membrane-transport-v1";
export type LearningGoal = "explore" | "understand" | "revise" | "test";
export type DepthMinutes = 5 | 15 | 30;
export type ObjectiveStatus = "unseen" | "developing" | "secure";
export type SupportNeed = "none" | "light" | "strong";
export type OutcomeResult = "correct" | "incorrect" | "completed";
export type RecentResult = "secure" | "supported" | "incorrect";

export type ReasonCode =
  | "elicit-existing-model"
  | "test-through-manipulation"
  | "offer-alternate-representation"
  | "respond-to-misconception"
  | "provide-guided-retry"
  | "connect-evidence-to-concept"
  | "increase-challenge"
  | "confirm-transfer";

export type PrimitiveId =
  | "prediction"
  | "parameter-experiment"
  | "comparison"
  | "data-plot"
  | "classification"
  | "step-sequence"
  | "evidence-reveal"
  | "target-challenge";

export type BlockRole = "evidence" | "explore" | "represent" | "support" | "apply" | "transfer";

export type BlockOutcome = {
  blockId: string;
  result: OutcomeResult;
  attempts: number;
  hintUsed: boolean;
  misconceptionIds: string[];
};

export type LearnerState = {
  objectiveStatus: Record<string, ObjectiveStatus>;
  activeMisconceptionIds: string[];
  completedBlockIds: string[];
  recentInteractionTypes: string[];
  recentResults: RecentResult[];
  supportNeed: SupportNeed;
  lastOutcome?: BlockOutcome;
};

export type ChoiceOption = { id: string; label: string; symbol?: string };

export type RenderConfig =
  | {
      kind: "prediction";
      prompt: string;
      options: ChoiceOption[];
      correctOptionId: string;
      misconceptionByOption?: Record<string, string>;
      hint: string;
      scenePatch?: Record<string, string | number>;
    }
  | {
      kind: "parameter-experiment";
      prompt: string;
      controlKey: string;
      label: string;
      unit: string;
      min: number;
      max: number;
      step: number;
      initial: number;
      requiredDelta: number;
      observationTemplate: string;
    }
  | {
      kind: "comparison";
      prompt: string;
      left: { title: string; value: string; note: string };
      right: { title: string; value: string; note: string };
    }
  | {
      kind: "data-plot";
      prompt: string;
      values: number[];
      controlKey: string;
      xLabel: string;
      yLabel: string;
      relationId: "current-from-resistance";
    }
  | {
      kind: "classification";
      prompt: string;
      buckets: ChoiceOption[];
      items: Array<{ id: string; label: string; correctBucketId: string }>;
      misconceptionId: string;
    }
  | {
      kind: "step-sequence";
      prompt: string;
      stages: Array<{ id: string; label: string }>;
    }
  | {
      kind: "evidence-reveal";
      prompt: string;
      title: string;
      statement: string;
      example: string;
    }
  | {
      kind: "target-challenge";
      prompt: string;
      options: ChoiceOption[];
      correctOptionId: string;
      misconceptionByOption?: Record<string, string>;
      scenePatchByOption?: Record<string, Record<string, string | number>>;
    };

export type TrustedFact = { id: string; label: string; statement: string };
export type SourceBlock = {
  id: string;
  page: 1 | 2;
  order: number;
  kind: "figure" | "definition" | "relationship" | "formula" | "example" | "question" | "comparison";
  factIds: string[];
  title: string;
  body: string;
};

export type InteractiveBlock = {
  id: string;
  title: string;
  shortPrompt: string;
  primitiveId: PrimitiveId;
  role: BlockRole;
  interactionType: string;
  objectiveIds: string[];
  sourceBlockIds: string[];
  prerequisiteObjectiveIds: string[];
  dependsOnBlockIds: string[];
  estimatedMinutes: number;
  difficulty: 1 | 2 | 3;
  misconceptionsAddressed: string[];
  possibleMisconceptionIds: string[];
  allowedReasonCodes: ReasonCode[];
  defaultReasonCode: ReasonCode;
  render: RenderConfig;
};

export type LessonManifest = {
  id: LessonId;
  subject: "physics" | "biology";
  title: string;
  subtitle: string;
  sceneId: "circuit-loop-v1" | "cell-membrane-v1";
  initialRuntime: Record<string, string | number>;
  objectiveIds: string[];
  initialObjectiveStatus: Record<string, ObjectiveStatus>;
  facts: TrustedFact[];
  sourceBlocks: SourceBlock[];
  blocks: InteractiveBlock[];
  misconceptions: string[];
  visibility: {
    requiredPreserveSourceBlockIds: string[];
    allowedDelaySourceBlockIds: string[];
    defaultDelaySourceBlockIds: string[];
  };
  fallbackPaths: {
    explore: string[];
    understand: string[];
    revise: string[];
    test: string[];
    secureAdapt: string[];
    supportAdapt: string[];
  };
};

export type BlueprintStep = { blockId: string; reasonCode: ReasonCode };
export type LessonBlueprint = {
  blueprintVersion: "p4-1";
  lessonId: LessonId;
  objectiveIds: string[];
  preserveSourceBlockIds: string[];
  delaySourceBlockIds: string[];
  remainingSteps: BlueprintStep[];
};

export type ApiComposeRequest = {
  schemaVersion: "p4-api-1";
  lessonId: LessonId;
  goal: LearningGoal;
  depthMinutes: DepthMinutes;
  evidenceLog: BlockOutcome[];
};

export type ComposerInput = {
  schemaVersion: "p4-composer-input-1";
  phase: "initial" | "adapt";
  goal: LearningGoal;
  depthMinutes: DepthMinutes;
  lesson: {
    id: LessonId;
    subject: LessonManifest["subject"];
    objectiveIds: string[];
    sourceBlocks: Array<{ id: string; factIds: string[] }>;
  };
  learnerState: LearnerState;
  legalCandidates: Array<{
    id: string;
    primitiveId: PrimitiveId;
    role: BlockRole;
    objectiveIds: string[];
    sourceBlockIds: string[];
    prerequisiteObjectiveIds: string[];
    dependsOnBlockIds: string[];
    estimatedMinutes: number;
    difficulty: number;
    allowedReasonCodes: ReasonCode[];
    defaultReasonCode: ReasonCode;
  }>;
  constraints: {
    maximumSteps: number;
    evidenceWithinFirstSteps: 2;
    doNotRepeatCompletedBlocks: true;
    finishWithRoles: Array<"apply" | "transfer">;
    requiredPreserveSourceBlockIds: string[];
    allowedDelaySourceBlockIds: string[];
  };
};

export type ComposeResponse = {
  blueprint: LessonBlueprint;
  source: "ollama" | "deterministic-fallback";
  providerId: "ollama" | "deterministic";
  model: string | null;
  latencyMs: number;
  candidateBlockIds: string[];
  validationErrors: string[];
  fallbackReason?: string;
  rawMetrics: {
    received: boolean;
    parsed: boolean;
    schemaValid: boolean;
    semanticValid: boolean;
  };
};

export interface LearningComposer {
  readonly providerId: string;
  compose(input: ComposerInput, options?: {
    signal?: AbortSignal;
    temperature?: number;
    correction?: {
      validationErrors: string[];
      previousContent: string;
    };
  }): Promise<unknown>;
}
