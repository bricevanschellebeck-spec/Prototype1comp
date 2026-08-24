import { adaptiveBlockCatalog } from "./catalog";
import { OBJECTIVE_ORDER } from "./curriculum";
import type {
  BlockOutcome,
  CandidateEvaluation,
  LearnerState,
  LearningBlock,
  NextBlockDecision,
} from "./domain";

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

function addUnique(items: string[], additions: string[]) {
  return [...new Set([...items, ...additions])];
}

function removeItems(items: string[], removals: string[]) {
  const removalSet = new Set(removals);
  return items.filter((item) => !removalSet.has(item));
}

export function updateLearnerState(
  previousState: LearnerState,
  outcome: BlockOutcome,
  catalog: LearningBlock[] = adaptiveBlockCatalog,
): LearnerState {
  const block = catalog.find((candidate) => candidate.id === outcome.blockId);
  if (!block) {
    throw new Error(`Cannot update learner state for unknown block: ${outcome.blockId}`);
  }
  if (!outcome.completed) return previousState;

  const objectiveStatus = { ...previousState.objectiveStatus };
  const strongCheck =
    outcome.correct === true && outcome.attempts === 1 && !outcome.hintUsed;
  const successfulRetry =
    block.selectionRole === "retry" && outcome.correct === true;
  const successfulApplication =
    block.purpose === "apply" && outcome.correct === true;

  for (const objectiveId of outcome.objectiveIds) {
    if (strongCheck || successfulRetry || successfulApplication) {
      objectiveStatus[objectiveId] = "secure";
      continue;
    }

    if (outcome.correct !== undefined) {
      objectiveStatus[objectiveId] = "developing";
      continue;
    }

    if (
      block.selectionRole === "remediation" ||
      block.selectionRole === "guided-practice"
    ) {
      objectiveStatus[objectiveId] = "developing";
    } else {
      objectiveStatus[objectiveId] = "secure";
    }
  }

  const needsSupport =
    outcome.correct === false ||
    outcome.attempts > 1 ||
    outcome.hintUsed;
  const activeMisconceptionIds = strongCheck || successfulRetry
    ? removeItems(previousState.activeMisconceptionIds, block.misconceptionsAddressed)
    : needsSupport
      ? addUnique(previousState.activeMisconceptionIds, outcome.misconceptionIds)
      : previousState.activeMisconceptionIds;

  return {
    objectiveStatus,
    activeMisconceptionIds,
    completedBlockIds: addUnique(previousState.completedBlockIds, [block.id]),
    recentInteractionTypes: [
      block.interactionType,
      ...previousState.recentInteractionTypes.filter(
        (interaction) => interaction !== block.interactionType,
      ),
    ].slice(0, 3),
    lastOutcome: outcome,
  };
}

function currentObjective(state: LearnerState): string | null {
  return (
    OBJECTIVE_ORDER.find(
      (objectiveId) => state.objectiveStatus[objectiveId] !== "secure",
    ) ?? null
  );
}

function roleScore(
  block: LearningBlock,
  state: LearnerState,
  catalog: LearningBlock[],
) {
  const hasMisconception = block.misconceptionsAddressed.some((id) =>
    state.activeMisconceptionIds.includes(id),
  );
  if (!hasMisconception) return 0;

  const completedRoles = new Set(
    catalog
      .filter((candidate) => state.completedBlockIds.includes(candidate.id))
      .map((candidate) => candidate.selectionRole),
  );

  if (!completedRoles.has("remediation")) {
    if (block.selectionRole === "remediation") return 120;
    if (block.selectionRole === "guided-practice") return 70;
    if (block.selectionRole === "retry") return 30;
  }

  if (!completedRoles.has("guided-practice")) {
    if (block.selectionRole === "guided-practice") return 120;
    if (block.selectionRole === "retry") return 60;
  }

  if (block.selectionRole === "retry") return 120;
  return 0;
}

export function getCandidateBlocks(
  state: LearnerState,
  catalog: LearningBlock[] = adaptiveBlockCatalog,
): CandidateEvaluation[] {
  const objectiveId = currentObjective(state);
  if (!objectiveId) return [];

  return catalog
    .filter((block) => block.objectiveIds.includes(objectiveId))
    .map((block) => {
      const reasons: string[] = [];
      let eligible = true;

      if (state.completedBlockIds.includes(block.id)) {
        eligible = false;
        reasons.push("already-completed");
      }

      const unmetPrerequisite = block.prerequisiteObjectiveIds.find(
        (prerequisiteId) => state.objectiveStatus[prerequisiteId] !== "secure",
      );
      if (unmetPrerequisite) {
        eligible = false;
        reasons.push("prerequisite-not-secure");
      }

      const matchingMisconception = block.misconceptionsAddressed.some((id) =>
        state.activeMisconceptionIds.includes(id),
      );
      const supportRole = block.selectionRole !== "core";
      if (supportRole && !matchingMisconception) {
        eligible = false;
        reasons.push("support-not-needed");
      }

      let score = block.priority;
      if (matchingMisconception) {
        score += roleScore(block, state, catalog);
        reasons.push("addresses-active-misconception");
      }
      if (state.recentInteractionTypes[0] === block.interactionType) {
        score -= 12;
        reasons.push("repeats-recent-interaction");
      } else {
        score += 8;
        reasons.push("varies-interaction");
      }
      if (block.selectionRole === "core") reasons.push("curriculum-core");

      return {
        blockId: block.id,
        title: block.title,
        eligible,
        score,
        reasonCodes: reasons,
      };
    })
    .sort((a, b) => b.score - a.score || a.blockId.localeCompare(b.blockId));
}

export function selectNextBlock(
  state: LearnerState,
  catalog: LearningBlock[] = adaptiveBlockCatalog,
): NextBlockDecision {
  const targetObjectiveId = currentObjective(state);
  if (!targetObjectiveId) {
    return {
      status: "complete",
      selectedBlockId: null,
      targetObjectiveId: null,
      candidates: [],
      reasonCodes: ["all-required-objectives-secure"],
    };
  }

  const candidates = getCandidateBlocks(state, catalog);
  const selected = candidates.find((candidate) => candidate.eligible);
  if (!selected) {
    return {
      status: "blocked",
      selectedBlockId: null,
      targetObjectiveId,
      candidates,
      reasonCodes: ["no-legal-candidate"],
    };
  }

  return {
    status: "selected",
    selectedBlockId: selected.blockId,
    targetObjectiveId,
    candidates,
    reasonCodes: [
      `target:${targetObjectiveId}`,
      ...selected.reasonCodes,
    ],
  };
}

export function validateAdaptiveCatalog(
  catalog: LearningBlock[] = adaptiveBlockCatalog,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const objectiveIds = new Set<string>(OBJECTIVE_ORDER);

  for (const block of catalog) {
    if (ids.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
    ids.add(block.id);
    if (block.objectiveIds.length === 0) {
      errors.push(`Block has no objective: ${block.id}`);
    }
    for (const objectiveId of [
      ...block.objectiveIds,
      ...block.prerequisiteObjectiveIds,
    ]) {
      if (!objectiveIds.has(objectiveId)) {
        errors.push(`Unknown objective ${objectiveId} on block ${block.id}`);
      }
    }
  }

  for (const objectiveId of OBJECTIVE_ORDER) {
    if (!catalog.some((block) => block.objectiveIds.includes(objectiveId))) {
      errors.push(`No registered block for objective: ${objectiveId}`);
    }
  }
  return errors;
}
