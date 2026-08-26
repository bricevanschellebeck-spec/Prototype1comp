import { workspaceBlockCatalogById } from "./catalog";
import { OBJECTIVE_ORDER } from "./curriculum";
import type { BlockOutcome, LearnerState } from "./domain";

export function createInitialLearnerState(): LearnerState {
  return {
    objectiveStatus: Object.fromEntries(
      OBJECTIVE_ORDER.map((objectiveId) => [objectiveId, "unseen"]),
    ),
    activeMisconceptionIds: [],
    completedBlockIds: [],
    recentInteractionTypes: [],
  };
}

export function updateLearnerState(
  previousState: LearnerState,
  outcome: BlockOutcome,
): LearnerState {
  const block = workspaceBlockCatalogById.get(outcome.blockId as never);
  if (!block) throw new Error(`Cannot record unknown workspace block: ${outcome.blockId}`);
  if (!outcome.completed) return previousState;

  const objectiveStatus = { ...previousState.objectiveStatus };
  const secure = outcome.correct !== false && outcome.attempts <= 1 && !outcome.hintUsed;
  for (const objectiveId of outcome.objectiveIds) {
    objectiveStatus[objectiveId] = secure ? "secure" : "developing";
  }

  const activeMisconceptions = new Set(previousState.activeMisconceptionIds);
  if (outcome.correct === false || outcome.hintUsed || outcome.attempts > 1) {
    outcome.misconceptionIds.forEach((id) => activeMisconceptions.add(id));
  } else {
    block.misconceptionsAddressed.forEach((id) => activeMisconceptions.delete(id));
  }

  return {
    objectiveStatus,
    activeMisconceptionIds: [...activeMisconceptions],
    completedBlockIds: [...new Set([...previousState.completedBlockIds, outcome.blockId])],
    recentInteractionTypes: [
      block.interactionType,
      ...previousState.recentInteractionTypes.filter((type) => type !== block.interactionType),
    ].slice(0, 3),
    lastOutcome: outcome,
  };
}
