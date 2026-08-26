import { describe, expect, it } from "vitest";
import { deriveLearnerState, validateEvidenceLog } from "./engine";
import { cellsManifest, circuitsManifest } from "./manifests";

describe("Prototype 4 generic learner evidence", () => {
  it("derives secure circuit evidence without accepting mastery from the browser", () => {
    const state = deriveLearnerState(circuitsManifest, [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }]);
    expect(state.objectiveStatus["predict-current-when-resistance-changes"]).toBe("secure");
    expect(state.supportNeed).toBe("none");
    expect(state.completedBlockIds).toEqual(["circuits.predict-resistance-change"]);
  });

  it("derives strong support and a registered biology misconception", () => {
    const outcome = { blockId: "cells.predict-gradient-direction", result: "incorrect" as const, attempts: 1, hintUsed: false, misconceptionIds: ["particles-move-against-gradient-without-energy"] };
    expect(validateEvidenceLog(cellsManifest, [outcome])).toEqual([]);
    const state = deriveLearnerState(cellsManifest, [outcome]);
    expect(state.supportNeed).toBe("strong");
    expect(state.activeMisconceptionIds).toEqual(["particles-move-against-gradient-without-energy"]);
    expect(state.objectiveStatus["predict-gradient-movement"]).toBe("developing");
  });

  it("rejects forged blocks, duplicate evidence, and unsupported misconception IDs", () => {
    const errors = validateEvidenceLog(cellsManifest, [
      { blockId: "circuits.predict-resistance-change", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: [] },
      { blockId: "cells.predict-gradient-direction", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["invented-personality-label"] },
      { blockId: "cells.predict-gradient-direction", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] },
    ]);
    expect(errors.join(" ")).toMatch(/unknown evidence block/i);
    expect(errors.join(" ")).toMatch(/cannot produce misconception/i);
    expect(errors.join(" ")).toMatch(/more than once/i);
  });
});
