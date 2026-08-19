import { z } from "zod";

export const blockPurposeSchema = z.enum([
  "introduce",
  "explore",
  "check",
  "remediate",
  "apply",
]);

export const blockTypeSchema = z.enum([
  "diagram",
  "simulation",
  "question",
  "graph",
  "challenge",
]);

export const reasonCodeSchema = z.enum([
  "establish-conceptual-model",
  "test-relationship-through-manipulation",
  "check-concept-before-symbolic-work",
  "connect-observation-to-graph",
  "address-known-misconception",
  "demonstrate-independent-application",
  "fit-short-lesson",
]);

export const learnerSnapshotSchema = z.object({
  priorKnowledge: z.enum(["unknown", "beginner", "developing"]),
  knownMisconceptions: z.array(z.string()),
  recentlyEffectiveInteractions: z.array(z.string()),
});

export const compositionConstraintsSchema = z.object({
  targetMinutes: z.number().int().min(3).max(15),
  maximumSteps: z.number().int().min(2).max(6),
  unavailableBlockIds: z.array(z.string()),
  accessibilityNeeds: z.array(z.string()),
});

export const compositionRequestSchema = z.object({
  topicId: z.string(),
  requiredObjectiveIds: z.array(z.string()).min(1),
  learnerSnapshot: learnerSnapshotSchema,
  constraints: compositionConstraintsSchema,
});

export const blueprintStepSchema = z.object({
  stepId: z.string(),
  blockId: z.string(),
  purpose: blockPurposeSchema,
  reasonCode: reasonCodeSchema,
  expectedEvidence: z.string(),
});

export const lessonBlueprintSchema = z.object({
  blueprintVersion: z.literal("1"),
  topicId: z.string(),
  objectiveIds: z.array(z.string()).min(1),
  steps: z.array(blueprintStepSchema).min(2).max(6),
  completionCheckBlockId: z.string(),
});

export type BlockPurpose = z.infer<typeof blockPurposeSchema>;
export type BlockType = z.infer<typeof blockTypeSchema>;
export type ReasonCode = z.infer<typeof reasonCodeSchema>;
export type LearnerSnapshot = z.infer<typeof learnerSnapshotSchema>;
export type CompositionConstraints = z.infer<
  typeof compositionConstraintsSchema
>;
export type CompositionRequest = z.infer<typeof compositionRequestSchema>;
export type BlueprintStep = z.infer<typeof blueprintStepSchema>;
export type LessonBlueprint = z.infer<typeof lessonBlueprintSchema>;

export type LearningBlock = {
  id: string;
  title: string;
  componentType: BlockType;
  objectiveIds: string[];
  prerequisiteObjectiveIds: string[];
  difficulty: 1 | 2 | 3;
  purpose: BlockPurpose;
  interactionType: string;
  modality: string[];
  estimatedMinutes: number;
  misconceptionsAddressed: string[];
  resourceIds: string[];
  accessibilityFeatures: string[];
  content: BlockContent;
};

export type BlockContent =
  | {
      kind: "diagram";
      heading: string;
      body: string;
    }
  | {
      kind: "simulation";
      heading: string;
      instructions: string;
      fixedVoltage: number;
      resistanceRange: [number, number];
      initialResistance: number;
    }
  | {
      kind: "question";
      heading: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      feedback: string;
    }
  | {
      kind: "graph";
      heading: string;
      body: string;
      fixedVoltage: number;
      resistanceValues: number[];
    }
  | {
      kind: "challenge";
      heading: string;
      prompt: string;
      targetCurrent: number;
      voltage: number;
      resistanceOptions: number[];
    };

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  estimatedMinutes: number;
};

export type ComposeResponse = {
  blueprint: LessonBlueprint;
  validation: ValidationResult;
  source: "ai" | "local-fallback";
  note?: string;
};
