import type { BlockOutcome, LearnerState, LessonManifest, RecentResult } from "./types";

export function validateEvidenceLog(manifest: LessonManifest, evidenceLog: BlockOutcome[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const blocks = new Map(manifest.blocks.map((block) => [block.id, block]));
  for (const outcome of evidenceLog) {
    const block = blocks.get(outcome.blockId);
    if (!block) {
      errors.push(`Unknown evidence block ${outcome.blockId}.`);
      continue;
    }
    if (seen.has(outcome.blockId)) errors.push(`Evidence block ${outcome.blockId} appears more than once.`);
    seen.add(outcome.blockId);
    if (outcome.result !== "incorrect" && outcome.misconceptionIds.length > 0) {
      errors.push(`Non-incorrect outcome ${outcome.blockId} cannot add a misconception.`);
    }
    for (const misconceptionId of outcome.misconceptionIds) {
      if (!block.possibleMisconceptionIds.includes(misconceptionId)) {
        errors.push(`${outcome.blockId} cannot produce misconception ${misconceptionId}.`);
      }
    }
  }
  return errors;
}

export function deriveLearnerState(manifest: LessonManifest, evidenceLog: BlockOutcome[]): LearnerState {
  const state: LearnerState = {
    objectiveStatus: { ...manifest.initialObjectiveStatus },
    activeMisconceptionIds: [],
    completedBlockIds: [],
    recentInteractionTypes: [],
    recentResults: [],
    supportNeed: "none",
  };
  const blocks = new Map(manifest.blocks.map((block) => [block.id, block]));

  for (const outcome of evidenceLog) {
    const block = blocks.get(outcome.blockId);
    if (!block) continue;
    const secure = outcome.result === "correct" && outcome.attempts === 1 && !outcome.hintUsed;
    const recent: RecentResult = outcome.result === "incorrect" ? "incorrect" : secure ? "secure" : "supported";
    for (const objectiveId of block.objectiveIds) {
      state.objectiveStatus[objectiveId] = secure ? "secure" : "developing";
    }
    const misconceptions = new Set(state.activeMisconceptionIds);
    if (outcome.result === "incorrect") outcome.misconceptionIds.forEach((id) => misconceptions.add(id));
    if (secure) block.misconceptionsAddressed.forEach((id) => misconceptions.delete(id));
    state.activeMisconceptionIds = [...misconceptions];
    state.completedBlockIds = [...new Set([...state.completedBlockIds, outcome.blockId])];
    state.recentInteractionTypes = [block.interactionType, ...state.recentInteractionTypes.filter((type) => type !== block.interactionType)].slice(0, 4);
    state.recentResults = [recent, ...state.recentResults].slice(0, 4);
    state.lastOutcome = outcome;
  }

  const last = state.lastOutcome;
  state.supportNeed = !last
    ? "none"
    : last.result === "incorrect"
      ? "strong"
      : last.hintUsed || last.attempts > 1
        ? "light"
        : "none";
  return state;
}
