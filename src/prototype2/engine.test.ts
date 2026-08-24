import { describe, expect, it } from "vitest";
import { adaptiveBlockCatalog, adaptiveBlockCatalogById } from "./catalog";
import { MORE_RESISTANCE_MORE_CURRENT, OBJECTIVES } from "./curriculum";
import type { BlockOutcome, LearnerState } from "./domain";
import {
  createInitialLearnerState,
  selectNextBlock,
  updateLearnerState,
  validateAdaptiveCatalog,
} from "./engine";

function outcome(
  blockId: string,
  evidence: Partial<BlockOutcome> = {},
): BlockOutcome {
  const block = adaptiveBlockCatalogById.get(blockId);
  if (!block) throw new Error(`Unknown test block: ${blockId}`);
  return {
    blockId,
    objectiveIds: block.objectiveIds,
    completed: true,
    attempts: 1,
    hintUsed: false,
    misconceptionIds: [],
    ...evidence,
  };
}

function completeCurrent(
  state: LearnerState,
  evidence: Partial<BlockOutcome> = {},
) {
  const decision = selectNextBlock(state);
  if (!decision.selectedBlockId) throw new Error("Expected a selected block");
  return updateLearnerState(
    state,
    outcome(decision.selectedBlockId, evidence),
  );
}

function reachResistanceCheckpoint() {
  let state = createInitialLearnerState();
  expect(selectNextBlock(state).selectedBlockId).toBe("complete-circuit-foundation");
  state = completeCurrent(state);
  expect(selectNextBlock(state).selectedBlockId).toBe("battery-voltage-discovery");
  state = completeCurrent(state);
  expect(selectNextBlock(state).selectedBlockId).toBe("resistance-prediction-experiment");
  return state;
}

describe("Prototype 2 adaptive engine", () => {
  it("has a valid nine-block trusted catalog", () => {
    expect(adaptiveBlockCatalog).toHaveLength(9);
    expect(validateAdaptiveCatalog()).toEqual([]);
  });

  it("selects the secure path after first-attempt success", () => {
    let state = reachResistanceCheckpoint();
    state = completeCurrent(state, { correct: true });

    expect(state.objectiveStatus[OBJECTIVES.resistance]).toBe("secure");
    expect(state.activeMisconceptionIds).toEqual([]);
    expect(selectNextBlock(state).selectedBlockId).toBe("current-resistance-graph");

    state = completeCurrent(state);
    expect(selectNextBlock(state).selectedBlockId).toBe("target-current-challenge");
    state = completeCurrent(state, { correct: true, attempts: 2, hintUsed: true });
    expect(selectNextBlock(state).selectedBlockId).toBe("final-circuit-design-challenge");
    state = completeCurrent(state, { correct: true });
    expect(selectNextBlock(state).status).toBe("complete");
  });

  it("inserts visual support, guided practice, and a retry after difficulty", () => {
    let state = reachResistanceCheckpoint();
    state = completeCurrent(state, {
      correct: true,
      attempts: 2,
      misconceptionIds: [MORE_RESISTANCE_MORE_CURRENT],
    });

    expect(state.objectiveStatus[OBJECTIVES.resistance]).toBe("developing");
    expect(state.activeMisconceptionIds).toContain(MORE_RESISTANCE_MORE_CURRENT);
    expect(selectNextBlock(state).selectedBlockId).toBe("resistance-misconception-visual");

    state = completeCurrent(state);
    expect(selectNextBlock(state).selectedBlockId).toBe("guided-resistance-experiment");
    state = completeCurrent(state);
    expect(selectNextBlock(state).selectedBlockId).toBe("resistance-equivalent-retry");
    state = completeCurrent(state, { correct: true, attempts: 2, hintUsed: true });

    expect(state.objectiveStatus[OBJECTIVES.resistance]).toBe("secure");
    expect(state.activeMisconceptionIds).toEqual([]);
    expect(selectNextBlock(state).selectedBlockId).toBe("current-resistance-graph");
  });

  it("treats hint usage as support evidence even when the answer is correct", () => {
    let state = reachResistanceCheckpoint();
    state = completeCurrent(state, {
      correct: true,
      hintUsed: true,
      misconceptionIds: [MORE_RESISTANCE_MORE_CURRENT],
    });

    expect(selectNextBlock(state).selectedBlockId).toBe("resistance-misconception-visual");
  });

  it("does not mutate completed history while updating learner state", () => {
    const before = createInitialLearnerState();
    const after = completeCurrent(before);

    expect(before.completedBlockIds).toEqual([]);
    expect(after.completedBlockIds).toEqual(["complete-circuit-foundation"]);
    expect(before.objectiveStatus[OBJECTIVES.circuit]).toBe("unseen");
    expect(after.objectiveStatus[OBJECTIVES.circuit]).toBe("secure");
  });

  it("is deterministic for the same learner state", () => {
    const state = reachResistanceCheckpoint();
    expect(selectNextBlock(state)).toEqual(selectNextBlock(state));
  });

  it("blocks rather than bypassing a missing required objective", () => {
    const withoutFoundation = adaptiveBlockCatalog.filter(
      (block) => block.id !== "complete-circuit-foundation",
    );
    const decision = selectNextBlock(createInitialLearnerState(), withoutFoundation);

    expect(decision.status).toBe("blocked");
    expect(decision.selectedBlockId).toBeNull();
  });
});
