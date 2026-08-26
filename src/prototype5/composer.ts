import { z } from "zod";
import type { BlockOutcome, CompiledBlock, CompiledLessonManifest, DepthMinutes, LearningGoal, P5Blueprint, P5ComposeResponse, ReasonCode } from "./types";

const reasonCodes: ReasonCode[] = ["elicit-existing-model", "test-through-manipulation", "offer-alternate-representation", "respond-to-misconception", "provide-guided-retry", "connect-evidence-to-concept", "increase-challenge", "confirm-transfer"];
const requestSchema = z.object({
  compiledManifest: z.unknown(), goal: z.enum(["explore", "understand", "revise", "test"]), depthMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  evidenceLog: z.array(z.object({ blockId: z.string().min(1), result: z.enum(["correct", "incorrect", "completed"]), attempts: z.number().int().min(1).max(20), hintUsed: z.boolean(), misconceptionIds: z.array(z.string()) }).strict()).max(30),
}).strict();

const blueprintSchema = z.object({ blueprintVersion: z.literal("p5-1"), lessonId: z.string().min(1), remainingSteps: z.array(z.object({ blockId: z.string().min(1), reasonCode: z.enum(reasonCodes) }).strict()).min(1).max(6) }).strict();

export function validateCompiledManifest(candidate: unknown): { manifest?: CompiledLessonManifest; errors: string[] } {
  if (!candidate || typeof candidate !== "object") return { errors: ["Compiled manifest is missing."] };
  const manifest = candidate as CompiledLessonManifest; const errors: string[] = [];
  if (manifest.schemaVersion !== "p5-compiled-lesson-1" || !manifest.id || !manifest.sourceDocumentId) errors.push("Invalid compiled manifest identity.");
  if (!Array.isArray(manifest.blocks) || !manifest.blocks.length) errors.push("Compiled manifest has no blocks.");
  if (!Array.isArray(manifest.fallbackPath) || !manifest.fallbackPath.length) errors.push("Compiled manifest has no fallback path.");
  const ids = new Set<string>();
  for (const block of manifest.blocks ?? []) {
    if (ids.has(block.id)) errors.push(`Duplicate block ${block.id}.`); ids.add(block.id);
    if (!block.id?.startsWith("generated.")) errors.push(`Unregistered generated block ${block.id}.`);
    if (!block.supportingFactIds?.length || !block.sourceCitations?.length) errors.push(`${block.id} has no source provenance.`);
    if (block.primitiveId !== block.render?.kind) errors.push(`${block.id} has mismatched primitive configuration.`);
  }
  for (const blockId of manifest.fallbackPath ?? []) if (!ids.has(blockId)) errors.push(`Fallback references unknown block ${blockId}.`);
  return { manifest, errors };
}

function maxSteps(depth: DepthMinutes) { return depth === 5 ? 3 : depth === 15 ? 5 : 6; }
function defaultReason(block: CompiledBlock, support: boolean): ReasonCode {
  if (support && (block.role === "support" || block.primitiveId === "comparison")) return "respond-to-misconception";
  if (block.role === "evidence") return "elicit-existing-model";
  if (block.primitiveId === "parameter-experiment") return "test-through-manipulation";
  if (block.primitiveId === "evidence-reveal") return "connect-evidence-to-concept";
  if (block.role === "apply" || block.role === "transfer") return "confirm-transfer";
  return "offer-alternate-representation";
}
function legalBlocks(manifest: CompiledLessonManifest, evidence: BlockOutcome[]) {
  const completed = new Set(evidence.map((item) => item.blockId));
  return manifest.blocks.filter((block) => !completed.has(block.id));
}

export function deterministicBlueprint(manifest: CompiledLessonManifest, depth: DepthMinutes, evidence: BlockOutcome[]): P5Blueprint {
  const legal = legalBlocks(manifest, evidence); const byId = new Map(legal.map((block) => [block.id, block])); const support = evidence.at(-1)?.result === "incorrect";
  let ordered = manifest.fallbackPath.map((id) => byId.get(id)).filter(Boolean) as CompiledBlock[];
  if (support) {
    const supportBlocks = legal.filter((block) => block.role === "support" || block.primitiveId === "comparison");
    ordered = [...supportBlocks, ...ordered.filter((block) => !supportBlocks.some((supportBlock) => supportBlock.id === block.id))];
  }
  const limit = maxSteps(depth); const final = [...ordered].reverse().find((block) => block.role === "apply" || block.role === "transfer");
  const selected = ordered.slice(0, limit);
  if (final && !selected.some((block) => block.id === final.id)) selected[Math.max(0, selected.length - 1)] = final;
  return { blueprintVersion: "p5-1", lessonId: manifest.id, remainingSteps: [...new Map(selected.map((block) => [block.id, block])).values()].map((block) => ({ blockId: block.id, reasonCode: defaultReason(block, support) })) };
}

function prompt(manifest: CompiledLessonManifest, goal: LearningGoal, depth: DepthMinutes, evidence: BlockOutcome[], legal: CompiledBlock[], correction?: string[]) {
  return `${correction?.length ? `Correct these validation errors: ${correction.join(" | ")}\n` : ""}Select a constrained learning path. Use only legal block IDs and approved reason codes. Do not repeat completed blocks. Put evidence early. If the last outcome is incorrect, begin with support or comparison. End with apply or transfer. Maximum ${maxSteps(depth)} steps.
Return exactly {"blueprintVersion":"p5-1","lessonId":"${manifest.id}","remainingSteps":[{"blockId":"legal ID","reasonCode":"approved reason"}]}.
Goal: ${goal}. Depth: ${depth}. Evidence: ${JSON.stringify(evidence)}. Legal blocks: ${JSON.stringify(legal.map((block) => ({ id: block.id, primitiveId: block.primitiveId, role: block.role, objectiveIds: block.objectiveIds })))}. Approved reasons: ${reasonCodes.join(", ")}.`;
}

async function callOllama(manifest: CompiledLessonManifest, goal: LearningGoal, depth: DepthMinutes, evidence: BlockOutcome[], legal: CompiledBlock[], correction?: string[], signal?: AbortSignal) {
  const model = process.env.P5_COMPOSER_MODEL?.trim() || "qwen3:4b-instruct"; const base = (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, "");
  const response = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, signal, cache: "no-store", body: JSON.stringify({ model, stream: false, think: false, format: "json", keep_alive: "15m", messages: [{ role: "system", content: "You are a constrained learning path composer. Return strict JSON only." }, { role: "user", content: prompt(manifest, goal, depth, evidence, legal, correction) }], options: { temperature: 0.08, num_ctx: 2048, num_predict: 240 } }) });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`); const payload = await response.json() as { model?: string; message?: { content?: string } };
  if (!payload.message?.content) throw new Error("Composer returned no content.");
  return { content: payload.message.content, model: payload.model || model };
}

function validateBlueprint(candidate: unknown, manifest: CompiledLessonManifest, depth: DepthMinutes, evidence: BlockOutcome[]) {
  const parsed = blueprintSchema.safeParse(candidate); if (!parsed.success) return { errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  const blueprint = parsed.data as P5Blueprint; const errors: string[] = []; const legal = new Map(legalBlocks(manifest, evidence).map((block) => [block.id, block]));
  if (blueprint.lessonId !== manifest.id) errors.push("Blueprint belongs to another lesson.");
  if (blueprint.remainingSteps.length > maxSteps(depth)) errors.push("Blueprint exceeds the depth limit.");
  const ids = new Set<string>(); for (const step of blueprint.remainingSteps) { if (!legal.has(step.blockId)) errors.push(`Illegal block ${step.blockId}.`); if (ids.has(step.blockId)) errors.push(`Duplicate block ${step.blockId}.`); ids.add(step.blockId); }
  const firstTwo = blueprint.remainingSteps.slice(0, 2).map((step) => legal.get(step.blockId)); if (!evidence.length && !firstTwo.some((block) => block?.role === "evidence")) errors.push("Initial path needs early evidence.");
  const final = legal.get(blueprint.remainingSteps.at(-1)?.blockId ?? ""); if (final && final.role !== "apply" && final.role !== "transfer") errors.push("Path must end with application or transfer.");
  if (evidence.at(-1)?.result === "incorrect") { const first = legal.get(blueprint.remainingSteps[0]?.blockId ?? ""); if (first && first.role !== "support" && first.primitiveId !== "comparison") errors.push("Incorrect evidence requires support or comparison first."); }
  return { blueprint, errors };
}

export async function composeP5(requestCandidate: unknown): Promise<P5ComposeResponse> {
  const started = performance.now(); const parsedRequest = requestSchema.safeParse(requestCandidate);
  if (!parsedRequest.success) throw new Error("Invalid P5 composition request.");
  const { manifest, errors: manifestErrors } = validateCompiledManifest(parsedRequest.data.compiledManifest); if (!manifest || manifestErrors.length) throw new Error(manifestErrors.join(" "));
  const { goal, depthMinutes, evidenceLog } = parsedRequest.data; const blockIds = new Set(manifest.blocks.map((block) => block.id)); const evidenceErrors = evidenceLog.flatMap((outcome) => blockIds.has(outcome.blockId) ? [] : [`Unknown evidence block ${outcome.blockId}.`]);
  const fallback = deterministicBlueprint(manifest, depthMinutes, evidenceLog); const legal = legalBlocks(manifest, evidenceLog); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 45_000); let lastErrors = evidenceErrors;
  if (evidenceErrors.length) return { blueprint: fallback, source: "deterministic-fallback", model: null, latencyMs: Math.round(performance.now() - started), legalCandidateIds: legal.map((block) => block.id), validationErrors: evidenceErrors, fallbackReason: "Invalid learner evidence." };
  try {
    let correction: string[] | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await callOllama(manifest, goal, depthMinutes, evidenceLog, legal, correction, controller.signal); let candidate: unknown;
      try { candidate = JSON.parse(response.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); } catch { lastErrors = ["Composer returned invalid JSON."]; correction = lastErrors; continue; }
      const validation = validateBlueprint(candidate, manifest, depthMinutes, evidenceLog); lastErrors = validation.errors;
      if (!lastErrors.length && validation.blueprint) return { blueprint: validation.blueprint, source: "ollama", model: response.model, latencyMs: Math.round(performance.now() - started), legalCandidateIds: legal.map((block) => block.id), validationErrors: [] };
      correction = lastErrors;
    }
    return { blueprint: fallback, source: "deterministic-fallback", model: process.env.P5_COMPOSER_MODEL?.trim() || "qwen3:4b-instruct", latencyMs: Math.round(performance.now() - started), legalCandidateIds: legal.map((block) => block.id), validationErrors: lastErrors, fallbackReason: "AI path failed validation after one correction." };
  } catch (error) {
    return { blueprint: fallback, source: "deterministic-fallback", model: process.env.P5_COMPOSER_MODEL?.trim() || "qwen3:4b-instruct", latencyMs: Math.round(performance.now() - started), legalCandidateIds: legal.map((block) => block.id), validationErrors: lastErrors, fallbackReason: error instanceof Error && error.name === "AbortError" ? "Local composer timed out." : error instanceof Error ? error.message : "Local composer unavailable." };
  } finally { clearTimeout(timeout); }
}
