import { z } from "zod";
import { P3_SOURCE_LESSON_ID } from "./sourceLesson";

export const p3GoalSchema = z.enum(["explore", "understand", "revise", "test"]);
export const p3DepthSchema = z.union([z.literal(5), z.literal(15), z.literal(30)]);
export const compositionPhaseSchema = z.enum(["initial", "adapt"]);

export const reasonCodeSchema = z.enum([
  "elicit-existing-model",
  "test-through-manipulation",
  "offer-alternate-representation",
  "respond-to-misconception",
  "increase-challenge",
  "confirm-transfer",
]);

export const blockOutcomeSchema = z.object({
  blockId: z.string().min(1).max(100),
  objectiveIds: z.array(z.string().min(1).max(100)).max(8),
  completed: z.boolean(),
  correct: z.boolean().optional(),
  attempts: z.number().int().min(0).max(20),
  hintUsed: z.boolean(),
  misconceptionIds: z.array(z.string().min(1).max(100)).max(8),
});

export const learnerStateSchema = z.object({
  objectiveStatus: z.record(
    z.string().min(1).max(100),
    z.enum(["unseen", "developing", "secure"]),
  ),
  activeMisconceptionIds: z.array(z.string().min(1).max(100)).max(8),
  completedBlockIds: z.array(z.string().min(1).max(100)).max(20),
  recentInteractionTypes: z.array(z.string().min(1).max(100)).max(6),
  lastOutcome: blockOutcomeSchema.optional(),
});

export const p3ComposeRequestSchema = z.object({
  phase: compositionPhaseSchema,
  goal: p3GoalSchema,
  depth: p3DepthSchema,
  learnerState: learnerStateSchema,
  completedBlockIds: z.array(z.string().min(1).max(100)).max(20),
  lastOutcome: blockOutcomeSchema.optional(),
}).strict();

export const blueprintStepSchema = z.object({
  blockId: z.string().min(1).max(100),
  reasonCode: reasonCodeSchema,
}).strict();

export const p3LessonBlueprintSchema = z.object({
  blueprintVersion: z.literal("p3-1"),
  sourceLessonId: z.literal(P3_SOURCE_LESSON_ID),
  objectiveIds: z.array(z.string().min(1).max(100)).min(1).max(6),
  remainingSteps: z.array(blueprintStepSchema).min(1).max(5),
  compositionSummary: z.string().min(1).max(260),
}).strict();

export type P3Goal = z.infer<typeof p3GoalSchema>;
export type P3Depth = z.infer<typeof p3DepthSchema>;
export type CompositionPhase = z.infer<typeof compositionPhaseSchema>;
export type P3ComposeRequest = z.infer<typeof p3ComposeRequestSchema>;
export type P3LessonBlueprint = z.infer<typeof p3LessonBlueprintSchema>;

export const p3ComposeResponseSchema = z.object({
  blueprint: p3LessonBlueprintSchema,
  source: z.enum(["ollama", "deterministic-fallback"]),
  model: z.string().nullable(),
  candidateBlockIds: z.array(z.string()),
  validationErrors: z.array(z.string()),
  fallbackReason: z.string().optional(),
});

export type P3ComposeResponse = z.infer<typeof p3ComposeResponseSchema>;
