import { describe, expect, it } from "vitest";
import { adaptiveBlockCatalog } from "./catalog";
import {
  composeP3Fallback,
  createP3InitialLearnerState,
  getP3CandidateBlockIds,
  normalizeP3Blueprint,
  validateP3Blueprint,
} from "./composer";
import type { P3ComposeRequest } from "./composerContracts";
import { OBJECTIVES } from "./curriculum";
import { trustedFactIds } from "./sourceLesson";

function initialRequest(): P3ComposeRequest {
  return {
    phase: "initial",
    goal: "understand",
    depth: 15,
    learnerState: createP3InitialLearnerState(),
    completedBlockIds: [],
  };
}

function adaptiveRequest(correct: boolean): P3ComposeRequest {
  const lastOutcome = {
    blockId: "resistance-prediction-experiment",
    objectiveIds: [OBJECTIVES.resistance],
    completed: true,
    correct,
    attempts: correct ? 1 : 2,
    hintUsed: false,
    misconceptionIds: correct ? [] : ["resistance-current-direction"],
  };
  const learnerState = createP3InitialLearnerState();
  learnerState.lastOutcome = lastOutcome;
  learnerState.completedBlockIds = [
    "guided-resistance-experiment",
    "resistance-prediction-experiment",
  ];
  return {
    phase: "adapt",
    goal: "understand",
    depth: 15,
    learnerState,
    completedBlockIds: learnerState.completedBlockIds,
    lastOutcome,
  };
}

describe("Prototype 3 constrained composer", () => {
  it("maps every selectable block to trusted human-authored facts", () => {
    expect(adaptiveBlockCatalog.length).toBeGreaterThanOrEqual(8);
    for (const block of adaptiveBlockCatalog) {
      expect(block.sourceFactIds.length).toBeGreaterThan(0);
      for (const factId of block.sourceFactIds) expect(trustedFactIds.has(factId)).toBe(true);
    }
  });

  it("produces a valid initial fallback path", () => {
    const request = initialRequest();
    const result = validateP3Blueprint(composeP3Fallback(request), request);
    expect(result.valid, result.errors.join("\n")).toBe(true);
    expect(result.blueprint?.remainingSteps.some((step) => step.blockId === "resistance-prediction-experiment")).toBe(true);
  });

  it("produces visibly different secure and support paths", () => {
    const secureRequest = adaptiveRequest(true);
    const supportRequest = adaptiveRequest(false);
    const secure = composeP3Fallback(secureRequest).remainingSteps.map((step) => step.blockId);
    const support = composeP3Fallback(supportRequest).remainingSteps.map((step) => step.blockId);

    expect(validateP3Blueprint(composeP3Fallback(secureRequest), secureRequest).valid).toBe(true);
    expect(validateP3Blueprint(composeP3Fallback(supportRequest), supportRequest).valid).toBe(true);
    expect(secure).not.toEqual(support);
    expect(secure[0]).toBe("current-resistance-graph");
    expect(support).toContain("resistance-misconception-visual");
    expect(support).toContain("resistance-equivalent-retry");
  });

  it("rejects invented, completed, and incorrectly ordered blocks", () => {
    const request = initialRequest();
    const invented = composeP3Fallback(request);
    invented.remainingSteps[0] = { blockId: "ai-invented-video", reasonCode: "increase-challenge" };
    expect(validateP3Blueprint(invented, request).valid).toBe(false);

    const supportRequest = adaptiveRequest(false);
    expect(getP3CandidateBlockIds(supportRequest)).not.toContain("guided-resistance-experiment");
    const invalidOrder = composeP3Fallback(supportRequest);
    invalidOrder.remainingSteps = [
      { blockId: "resistance-misconception-visual", reasonCode: "respond-to-misconception" },
      { blockId: "current-resistance-graph", reasonCode: "offer-alternate-representation" },
      { blockId: "resistance-equivalent-retry", reasonCode: "elicit-existing-model" },
      { blockId: "target-current-challenge", reasonCode: "confirm-transfer" },
    ];
    expect(validateP3Blueprint(invalidOrder, supportRequest).valid).toBe(false);
  });

  it("keeps AI-selected order while normalizing the explanatory vocabulary", () => {
    const request = initialRequest();
    const blueprint = composeP3Fallback(request);
    blueprint.remainingSteps[0].reasonCode = "increase-challenge";
    blueprint.compositionSummary = "free model prose";
    const normalized = normalizeP3Blueprint(blueprint, request);
    expect(normalized.remainingSteps.map((step) => step.blockId)).toEqual(
      blueprint.remainingSteps.map((step) => step.blockId),
    );
    expect(normalized.remainingSteps[0].reasonCode).toBe("test-through-manipulation");
    expect(normalized.compositionSummary).toContain("verified interactions");
  });
});
