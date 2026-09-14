import { z } from "zod";
import { hasValidCompilationReceipt } from "./compilationReceipt";
import { createP5Provider } from "./localModel";
import { supportBlock, supportNeeded, validateEvidence } from "./learningRules";
import type { BlockOutcome, CompiledBlock, CompiledLessonManifest, DepthMinutes, P5Blueprint, P5ComposeResponse, ReasonCode } from "./types";

const reasonCodes = ["elicit-existing-model", "test-through-manipulation", "offer-alternate-representation", "respond-to-misconception", "provide-guided-retry", "connect-evidence-to-concept", "increase-challenge", "confirm-transfer"] as const;
const requestSchema = z.object({
  compiledManifest: z.unknown(), goal: z.enum(["explore", "understand", "revise", "test"]), depthMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  evidenceLog: z.array(z.object({ blockId: z.string().min(1), result: z.enum(["correct", "incorrect", "completed"]), attempts: z.number().int().min(1).max(20), hintUsed: z.boolean(), misconceptionIds: z.array(z.string()).max(10) }).strict()).max(30),
}).strict();
const blueprintSchema = z.object({
  blueprintVersion: z.literal("p5-1"), lessonId: z.string().min(1),
  remainingSteps: z.array(z.object({ blockId: z.string().min(1), reasonCode: z.enum(reasonCodes) }).strict()).max(6),
}).strict();
const selectionSchema = z.object({
  lessonId: z.string().min(1),
  blockIds: z.array(z.string().min(1)).min(1).max(6),
}).strict();

export function validateCompiledManifest(candidate: unknown): { manifest?: CompiledLessonManifest; errors: string[] } {
  if (!hasValidCompilationReceipt(candidate)) return { errors: ["This lesson has changed or its compilation receipt expired. Return to the representation review and compile again."] };
  return { manifest: candidate, errors: [] };
}
function maxSteps(depth: DepthMinutes) { return depth === 5 ? 3 : depth === 15 ? 5 : 6; }
function legalBlocks(manifest: CompiledLessonManifest, evidence: BlockOutcome[]) {
  const completed = new Set(evidence.map((item) => item.blockId));
  const incomplete = manifest.blocks.filter((block) => !completed.has(block.id));
  // Support-only pieces are legal only after the learner supplies evidence that
  // calls for them. The model never has to remember this safety rule itself.
  return supportNeeded(evidence) ? incomplete : incomplete.filter((block) => block.role !== "support");
}
function defaultReason(block: CompiledBlock, support: boolean): ReasonCode {
  if (support && supportBlock(block)) return "respond-to-misconception";
  if (block.role === "evidence") return "elicit-existing-model";
  if (block.primitiveId === "parameter-experiment") return "test-through-manipulation";
  if (block.primitiveId === "evidence-reveal") return "connect-evidence-to-concept";
  if (block.role === "apply" || block.role === "transfer") return "confirm-transfer";
  return "offer-alternate-representation";
}
export function deterministicBlueprint(manifest: CompiledLessonManifest, depth: DepthMinutes, evidence: BlockOutcome[]): P5Blueprint {
  const legal = legalBlocks(manifest, evidence);
  const byId = new Map(legal.map((block) => [block.id, block]));
  const support = supportNeeded(evidence);
  let ordered = manifest.fallbackPath.map((id) => byId.get(id)).filter((item): item is CompiledBlock => !!item);
  // Include all legal compiled blocks, including alternative transfer/support blocks.
  ordered.push(...legal.filter((block) => !ordered.some((item) => item.id === block.id)));
  if (support) {
    const first = ordered.find(supportBlock);
    if (first) ordered = [first, ...ordered.filter((block) => block.id !== first.id)];
  } else {
    ordered = ordered.filter((block) => block.role !== "support");
  }
  const final = [...ordered].reverse().find((block) => block.role === "apply" || block.role === "transfer");
  const selected = ordered.filter((block) => block.id !== final?.id).slice(0, maxSteps(depth) - (final ? 1 : 0));
  if (final) selected.push(final);
  return { blueprintVersion: "p5-1", lessonId: manifest.id, remainingSteps: selected.map((block) => ({ blockId: block.id, reasonCode: defaultReason(block, support) })) };
}

export function validateBlueprint(candidate: unknown, manifest: CompiledLessonManifest, depth: DepthMinutes, evidence: BlockOutcome[]) {
  const parsed = blueprintSchema.safeParse(candidate);
  if (!parsed.success) return { errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const blueprint = parsed.data; const errors: string[] = [];
  const legal = new Map(legalBlocks(manifest, evidence).map((block) => [block.id, block]));
  if (blueprint.lessonId !== manifest.id) errors.push("Blueprint belongs to another lesson.");
  if (blueprint.remainingSteps.length > maxSteps(depth)) errors.push("Blueprint exceeds the depth limit.");
  if (!blueprint.remainingSteps.length && legal.size) errors.push("The remaining path is empty.");
  const ids = new Set<string>();
  for (const step of blueprint.remainingSteps) {
    if (!legal.has(step.blockId)) errors.push(`Illegal block ${step.blockId}.`);
    if (ids.has(step.blockId)) errors.push(`Duplicate block ${step.blockId}.`);
    ids.add(step.blockId);
  }
  const selected = blueprint.remainingSteps.map((step) => legal.get(step.blockId));
  if (!evidence.length && !selected.slice(0, 2).some((block) => block?.role === "evidence")) errors.push("Initial path needs early evidence.");
  const final = selected.at(-1);
  if ([...legal.values()].some((block) => block.role === "apply" || block.role === "transfer") && final?.role !== "apply" && final?.role !== "transfer") errors.push("Path must end with application or transfer.");
  if (supportNeeded(evidence) && [...legal.values()].some(supportBlock) && (!selected[0] || !supportBlock(selected[0]))) errors.push("Supported or incorrect evidence requires an observation/support block first.");
  if (!supportNeeded(evidence) && selected.some((block) => block?.role === "support")) errors.push("Support-only blocks are reserved for learners who need them.");
  return { blueprint, errors };
}

export async function composeP5(requestCandidate: unknown, signal?: AbortSignal): Promise<P5ComposeResponse> {
  const started = performance.now();
  const request = requestSchema.safeParse(requestCandidate);
  if (!request.success) throw new Error("Invalid P5 composition request.");
  const { manifest, errors } = validateCompiledManifest(request.data.compiledManifest);
  if (!manifest || errors.length) throw new Error(errors.join(" "));
  const { goal, depthMinutes, evidenceLog } = request.data;
  const evidenceErrors = validateEvidence(manifest, evidenceLog);
  if (evidenceErrors.length) throw new Error(evidenceErrors.join(" "));
  const legal = legalBlocks(manifest, evidenceLog);
  const fallback = deterministicBlueprint(manifest, depthMinutes, evidenceLog);
  const fallbackErrors = validateBlueprint(fallback, manifest, depthMinutes, evidenceLog).errors;
  if (fallbackErrors.length) throw new Error("The approved blocks cannot form a valid path: " + fallbackErrors.join(" "));
  const provider = createP5Provider();
  const response = (blueprint: P5Blueprint, source: P5ComposeResponse["source"], validationErrors: string[] = [], fallbackReason?: string): P5ComposeResponse => ({
    blueprint, source, model: provider.modelId, latencyMs: Math.round(performance.now() - started),
    legalCandidateIds: legal.map((block) => block.id), validationErrors, fallbackReason,
  });
  if (!legal.length) return response(fallback, "deterministic-fallback", [], "All approved activities are complete.");
  if (legal.length === 1) return response(fallback, "deterministic-fallback", [], "Only one legal activity remained, so no AI choice was necessary.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  let lastErrors: string[] = [];
  try {
    const format = {
      type: "object", additionalProperties: false,
      required: ["lessonId", "blockIds"],
      properties: {
        lessonId: { type: "string", const: manifest.id },
        blockIds: {
          type: "array", minItems: 1, maxItems: maxSteps(depthMinutes), uniqueItems: true,
          items: { type: "string", enum: legal.map((block) => block.id) },
        },
      },
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await provider.generate({
        signal: combined, format, maxTokens: 100, contextTokens: 1024,
        system: "Select and order legal learning-block IDs. Return strict JSON only.",
        prompt: `Select at most ${maxSteps(depthMinutes)} block IDs in learning order. Keep evidence within the first two initial steps. End with apply/transfer when available. After incorrect, hinted or repeated-attempt evidence, start with a support-capable block.
Schema: {"lessonId":"${manifest.id}","blockIds":["exact legal ID"]}.
Goal: ${goal}. Depth: ${depthMinutes}. Evidence: ${JSON.stringify(evidenceLog)}.
Candidates: ${JSON.stringify(legal.map(({ id, primitiveId, role, objectiveIds }) => ({ id, primitiveId, role, objectiveIds })))}.
${lastErrors.length ? "Correct: " + lastErrors.join(" | ") : ""}`,
      });
      let candidate: unknown;
      try { candidate = JSON.parse(result.content.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "")); }
      catch { lastErrors = ["Composer returned invalid JSON."]; continue; }
      const selected = selectionSchema.safeParse(candidate);
      if (!selected.success) { lastErrors = selected.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`); continue; }
      const selectedBlocks = selected.data.blockIds.map((blockId) => legal.find((block) => block.id === blockId));
      if (selectedBlocks.some((block) => !block)) { lastErrors = ["Composer selected a block outside the legal candidate set."]; continue; }
      const blueprint: P5Blueprint = {
        blueprintVersion: "p5-1",
        lessonId: selected.data.lessonId,
        remainingSteps: selectedBlocks.map((block) => ({ blockId: block!.id, reasonCode: defaultReason(block!, supportNeeded(evidenceLog)) })),
      };
      const validation = validateBlueprint(blueprint, manifest, depthMinutes, evidenceLog);
      lastErrors = validation.errors;
      if (!lastErrors.length && validation.blueprint) return response(validation.blueprint, "ollama");
    }
    return response(fallback, "deterministic-fallback", lastErrors, "AI path failed validation after one correction.");
  } catch (error) {
    if (signal?.aborted) throw error;
    return response(fallback, "deterministic-fallback", lastErrors, controller.signal.aborted ? "The 4B composer exceeded 60 seconds." : error instanceof Error ? error.message : "Local composer unavailable.");
  } finally { clearTimeout(timeout); }
}
