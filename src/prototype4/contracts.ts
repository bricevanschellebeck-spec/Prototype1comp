import { z } from "zod";

export const lessonIdSchema = z.enum(["circuits-resistance-v1", "cell-membrane-transport-v1"]);
export const goalSchema = z.enum(["explore", "understand", "revise", "test"]);
export const depthSchema = z.union([z.literal(5), z.literal(15), z.literal(30)]);
export const reasonCodeSchema = z.enum([
  "elicit-existing-model",
  "test-through-manipulation",
  "offer-alternate-representation",
  "respond-to-misconception",
  "provide-guided-retry",
  "connect-evidence-to-concept",
  "increase-challenge",
  "confirm-transfer",
]);

export const outcomeSchema = z.object({
  blockId: z.string().min(1).max(120),
  result: z.enum(["correct", "incorrect", "completed"]),
  attempts: z.number().int().min(1).max(20),
  hintUsed: z.boolean(),
  misconceptionIds: z.array(z.string().min(1).max(120)).max(6),
}).strict();

export const apiComposeRequestSchema = z.object({
  schemaVersion: z.literal("p4-api-1"),
  lessonId: lessonIdSchema,
  goal: goalSchema,
  depthMinutes: depthSchema,
  evidenceLog: z.array(outcomeSchema).max(20),
}).strict();

export const blueprintSchema = z.object({
  blueprintVersion: z.literal("p4-1"),
  lessonId: lessonIdSchema,
  objectiveIds: z.array(z.string().min(1).max(120)).min(1).max(8),
  preserveSourceBlockIds: z.array(z.string().min(1).max(120)).max(12),
  delaySourceBlockIds: z.array(z.string().min(1).max(120)).max(12),
  remainingSteps: z.array(z.object({
    blockId: z.string().min(1).max(120),
    reasonCode: reasonCodeSchema,
  }).strict()).min(1).max(6),
}).strict();

export type ParsedApiComposeRequest = z.infer<typeof apiComposeRequestSchema>;
