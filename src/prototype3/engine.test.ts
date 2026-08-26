import { describe, expect, it } from "vitest";
import { MORE_RESISTANCE_MORE_CURRENT, OBJECTIVES } from "./curriculum";
import { createInitialLearnerState, updateLearnerState } from "./engine";

describe("Prototype 3 learner evidence", () => {
  it("records secure first-attempt evidence without mutating the previous state", () => {
    const before = createInitialLearnerState();
    const after = updateLearnerState(before, {
      blockId: "predict-resistance-change",
      objectiveIds: [OBJECTIVES.resistance],
      completed: true,
      correct: true,
      attempts: 1,
      hintUsed: false,
      misconceptionIds: [],
    });
    expect(before.completedBlockIds).toEqual([]);
    expect(after.completedBlockIds).toEqual(["predict-resistance-change"]);
    expect(after.objectiveStatus[OBJECTIVES.resistance]).toBe("secure");
    expect(after.activeMisconceptionIds).toEqual([]);
  });

  it("records a misconception from an incorrect prediction", () => {
    const after = updateLearnerState(createInitialLearnerState(), {
      blockId: "predict-resistance-change",
      objectiveIds: [OBJECTIVES.resistance],
      completed: true,
      correct: false,
      attempts: 1,
      hintUsed: false,
      misconceptionIds: [MORE_RESISTANCE_MORE_CURRENT],
    });
    expect(after.objectiveStatus[OBJECTIVES.resistance]).toBe("developing");
    expect(after.activeMisconceptionIds).toEqual([MORE_RESISTANCE_MORE_CURRENT]);
    expect(after.lastOutcome?.correct).toBe(false);
  });

  it("clears the addressed misconception after a secure guided retry", () => {
    const state = createInitialLearnerState();
    state.activeMisconceptionIds = [MORE_RESISTANCE_MORE_CURRENT];
    const after = updateLearnerState(state, {
      blockId: "guided-resistance-retry",
      objectiveIds: [OBJECTIVES.resistance],
      completed: true,
      correct: true,
      attempts: 1,
      hintUsed: false,
      misconceptionIds: [],
    });
    expect(after.activeMisconceptionIds).toEqual([]);
  });

  it("rejects outcomes for components outside the registered vocabulary", () => {
    expect(() => updateLearnerState(createInitialLearnerState(), {
      blockId: "freeform-ai-page",
      objectiveIds: [OBJECTIVES.resistance],
      completed: true,
      correct: true,
      attempts: 1,
      hintUsed: false,
      misconceptionIds: [],
    })).toThrow(/unknown workspace block/i);
  });
});
