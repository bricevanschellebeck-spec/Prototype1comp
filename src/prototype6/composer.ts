import { z } from "zod";
import { createP6Provider } from "./provider";
import { verifyExperience } from "./receipts";
import type { BlockOutcome, CompiledExperience, CompiledStage, P6PathResponse } from "./types";

const outcomeSchema = z.object({ stageId: z.string().min(1), result: z.enum(["correct", "incorrect", "completed"]), attempts: z.number().int().min(1).max(20), hintUsed: z.boolean(), misconceptionIds: z.array(z.string()).max(8) }).strict();
const requestSchema = z.object({ compiledExperience: z.unknown(), evidenceLog: z.array(outcomeSchema).max(30) }).strict();
const selectionSchema = z.object({ experienceId: z.string(), stageIds: z.array(z.string()).min(1).max(8) }).strict();

function needsSupport(evidence: BlockOutcome[]) { const latest = evidence.at(-1); return !!latest && (latest.result === "incorrect" || latest.hintUsed || latest.attempts > 1); }
function scored(stage: CompiledStage) { return ["prediction", "multiple-choice", "target-challenge", "transfer-challenge"].includes(stage.primitive.kind); }

export function validateEvidence(experience: CompiledExperience, evidence: BlockOutcome[]) {
  const errors: string[] = []; const seen = new Set<string>();
  for (const item of evidence) {
    const stage = experience.stages.find((candidate) => candidate.stageId === item.stageId);
    if (!stage) { errors.push(`Unknown evidence stage ${item.stageId}.`); continue; }
    if (seen.has(item.stageId)) errors.push(`Duplicate outcome for ${item.stageId}.`); seen.add(item.stageId);
    if (scored(stage) === (item.result === "completed")) errors.push(`${stage.stageId} has an incompatible result type.`);
    if (item.misconceptionIds.some((id) => !stage.addressesMisconceptionIds.includes(id))) errors.push(`${stage.stageId} reported an unregistered misconception.`);
    if (item.result !== "incorrect" && item.misconceptionIds.length) errors.push("Only incorrect evidence can activate a misconception.");
  }
  return errors;
}

function legalStages(experience: CompiledExperience, evidence: BlockOutcome[]) {
  const completed = new Set(evidence.map((item) => item.stageId)); const support = needsSupport(evidence);
  const initialOrder = new Map(experience.initialSequenceStageIds.map((id, index) => [id, index]));
  return experience.stages.filter((stage) => !completed.has(stage.stageId) && (support || stage.availability !== "support-only"))
    .sort((a, b) => support && a.availability === "support-only" !== (b.availability === "support-only") ? (a.availability === "support-only" ? -1 : 1) : (initialOrder.get(a.stageId) ?? 99) - (initialOrder.get(b.stageId) ?? 99));
}

function fallbackPath(experience: CompiledExperience, evidence: BlockOutcome[]) {
  const legal = legalStages(experience, evidence); const support = needsSupport(evidence); let ordered = [...legal];
  if (!support) ordered = ordered.filter((stage) => stage.availability !== "support-only");
  const final = ordered.find((stage) => stage.stageId === experience.finalApplicationStageId);
  const middle = ordered.filter((stage) => stage.stageId !== final?.stageId && stage.availability !== "extension");
  return [...middle.slice(0, final ? 7 : 8), ...(final ? [final] : [])].map((stage) => stage.stageId);
}

export function validatePath(stageIds: string[], experience: CompiledExperience, evidence: BlockOutcome[]) {
  const errors: string[] = []; const legal = new Map(legalStages(experience, evidence).map((stage) => [stage.stageId, stage]));
  if (new Set(stageIds).size !== stageIds.length) errors.push("Path repeats a stage.");
  stageIds.forEach((id) => { if (!legal.has(id)) errors.push(`Illegal stage ${id}.`); });
  if (needsSupport(evidence) && [...legal.values()].some((stage) => stage.availability === "support-only") && legal.get(stageIds[0])?.availability !== "support-only") errors.push("Supported evidence requires a support stage first.");
  if (!needsSupport(evidence) && stageIds.some((id) => legal.get(id)?.availability === "support-only")) errors.push("Support-only stages require learner evidence.");
  if (legal.has(experience.finalApplicationStageId) && stageIds.at(-1) !== experience.finalApplicationStageId) errors.push("The unfinished path must end with its application.");
  return errors;
}

export async function composeAfterEvidence(candidate: unknown, signal?: AbortSignal): Promise<P6PathResponse> {
  const started = performance.now(); const parsed = requestSchema.safeParse(candidate); const provider = createP6Provider();
  if (!parsed.success) throw new Error("Invalid P6 composition request.");
  if (!verifyExperience(parsed.data.compiledExperience)) throw new Error("Compiled P6 experience is unsigned or changed.");
  const experience = parsed.data.compiledExperience; const evidence = parsed.data.evidenceLog as BlockOutcome[]; const evidenceErrors = validateEvidence(experience, evidence); if (evidenceErrors.length) throw new Error(evidenceErrors.join(" "));
  const legal = legalStages(experience, evidence); const fallback = fallbackPath(experience, evidence); const fallbackErrors = validatePath(fallback, experience, evidence); if (fallbackErrors.length) throw new Error(fallbackErrors.join(" "));
  const make = (stageIds: string[], source: P6PathResponse["source"], validationErrors: string[] = [], fallbackReason?: string): P6PathResponse => ({ stageIds, source, model: provider.modelId, latencyMs: Math.round(performance.now() - started), legalStageIds: legal.map((stage) => stage.stageId), validationErrors, fallbackReason });
  if (legal.length <= 1) return make(fallback, "deterministic-fallback", [], "There was no meaningful path choice left for AI.");
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 60000); const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal; let errors: string[] = [];
  try {
    const format = { type: "object", additionalProperties: false, required: ["experienceId", "stageIds"], properties: { experienceId: { const: experience.id }, stageIds: { type: "array", minItems: 1, maxItems: 8, uniqueItems: true, items: { type: "string", enum: legal.map((stage) => stage.stageId) } } } };
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await provider.generate({ signal: combined, format, maxTokens: 160, contextTokens: 1536, thinkingBudget: 0, system: "Select the unfinished P6 learning stages. Return strict JSON and exact legal IDs only.", prompt: `Experience ${experience.id}. Learner profile ${JSON.stringify(experience.designProfile)}. Evidence ${JSON.stringify(evidence)}. Candidates ${JSON.stringify(legal.map(({ stageId, role, availability, primitive, objectiveIds }) => ({ stageId, role, availability, primitive: primitive.kind, objectiveIds })))}. Preserve a coherent order and finish with ${experience.finalApplicationStageId}. If support is needed, start with support-only. ${attempt ? `Correct these errors: ${errors.join(" | ")}` : ""}` });
      let value: unknown; try { value = JSON.parse(result.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); } catch { errors = ["Composer returned invalid JSON."]; continue; }
      const selected = selectionSchema.safeParse(value); if (!selected.success || selected.data.experienceId !== experience.id) { errors = ["Composer returned the wrong experience or schema."]; continue; }
      errors = validatePath(selected.data.stageIds, experience, evidence); if (!errors.length) return make(selected.data.stageIds, provider.providerId);
    }
    return make(fallback, "deterministic-fallback", errors, "AI recomposition failed validation after one correction.");
  } catch (error) {
    if (signal?.aborted) throw error;
    return make(fallback, "deterministic-fallback", errors, controller.signal.aborted ? `${provider.modelId} exceeded 60 seconds.` : error instanceof Error ? error.message : "Composer unavailable.");
  } finally { clearTimeout(timer); }
}
