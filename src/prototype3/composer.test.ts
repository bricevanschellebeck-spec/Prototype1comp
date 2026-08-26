import { describe, expect, it } from "vitest";
import { workspaceBlockCatalog } from "./catalog";
import {
  composeP3Fallback,
  createP3InitialLearnerState,
  getP3CandidateBlockIds,
  normalizeP3Blueprint,
  parseOllamaBlueprintContent,
  validateP3Blueprint,
} from "./composer";
import type { P3ComposeRequest } from "./composerContracts";
import { MORE_RESISTANCE_MORE_CURRENT, OBJECTIVES } from "./curriculum";
import { textbookBlockIds, trustedFactIds, validateTextbookSource } from "./sourceLesson";

function initialRequest(goal: P3ComposeRequest["goal"] = "understand", depth: P3ComposeRequest["depth"] = 15): P3ComposeRequest {
  return {
    phase: "initial",
    goal,
    depth,
    learnerState: createP3InitialLearnerState(),
    completedBlockIds: [],
  };
}

function adaptiveRequest(correct: boolean): P3ComposeRequest {
  const lastOutcome = {
    blockId: "predict-resistance-change",
    objectiveIds: [OBJECTIVES.resistance],
    completed: true,
    correct,
    attempts: 1,
    hintUsed: false,
    misconceptionIds: correct ? [] : [MORE_RESISTANCE_MORE_CURRENT],
  };
  const learnerState = createP3InitialLearnerState();
  learnerState.lastOutcome = lastOutcome;
  learnerState.completedBlockIds = ["predict-resistance-change"];
  return {
    phase: "adapt",
    goal: "understand",
    depth: 15,
    learnerState,
    completedBlockIds: learnerState.completedBlockIds,
    lastOutcome,
  };
}

describe("Prototype 3 textbook recomposition contract", () => {
  it("keeps every textbook block and interactive representation attached to trusted knowledge", () => {
    expect(validateTextbookSource()).toEqual([]);
    expect(workspaceBlockCatalog).toHaveLength(8);
    for (const block of workspaceBlockCatalog) {
      expect(block.sourceBlockIds.length).toBeGreaterThan(0);
      for (const sourceId of block.sourceBlockIds) {
        expect(textbookBlockIds.has(sourceId)).toBe(true);
      }
    }
    expect(trustedFactIds.size).toBe(7);
  });

  it("creates the planned understand path and delays symbolic blocks", () => {
    const request = initialRequest();
    const blueprint = composeP3Fallback(request);
    expect(validateP3Blueprint(blueprint, request).valid).toBe(true);
    expect(blueprint.blueprintVersion).toBe("p3-2");
    expect(blueprint.preserveSourceBlockIds).toContain("concept-voltage");
    expect(blueprint.delaySourceBlockIds).toEqual(["ohms-law", "worked-example"]);
    expect(blueprint.remainingSteps.map((step) => step.blockId)).toEqual([
      "predict-resistance-change",
      "manipulate-resistance",
      "generate-current-graph",
      "formula-from-measurements",
      "reach-target-current",
    ]);
  });

  it("creates a shorter revision composition", () => {
    const request = initialRequest("revise", 5);
    const blueprint = composeP3Fallback(request);
    expect(validateP3Blueprint(blueprint, request).valid).toBe(true);
    expect(blueprint.remainingSteps.map((step) => step.blockId)).toEqual([
      "predict-resistance-change",
      "reach-target-current",
      "formula-from-measurements",
    ]);
  });

  it("visibly recomposes the unfinished path after correct and incorrect evidence", () => {
    const secureRequest = adaptiveRequest(true);
    const supportRequest = adaptiveRequest(false);
    const secure = composeP3Fallback(secureRequest);
    const support = composeP3Fallback(supportRequest);
    expect(validateP3Blueprint(secure, secureRequest).valid).toBe(true);
    expect(validateP3Blueprint(support, supportRequest).valid).toBe(true);
    expect(secure.remainingSteps.map((step) => step.blockId)).toEqual([
      "generate-current-graph",
      "formula-from-measurements",
      "reach-target-current",
    ]);
    expect(support.remainingSteps.map((step) => step.blockId)).toEqual([
      "compare-current-paths",
      "guided-resistance-retry",
      "generate-current-graph",
      "reach-target-current",
    ]);
  });

  it("rejects invented IDs, completed blocks, arbitrary fields, and invalid source visibility", () => {
    const request = initialRequest();
    const invented = composeP3Fallback(request) as unknown as Record<string, unknown>;
    invented.arbitraryCss = "position: fixed";
    expect(validateP3Blueprint(invented, request).valid).toBe(false);

    const unknown = composeP3Fallback(request);
    unknown.remainingSteps[1].blockId = "ai-generated-dashboard";
    expect(validateP3Blueprint(unknown, request).valid).toBe(false);

    const missingPreserved = composeP3Fallback(request);
    missingPreserved.preserveSourceBlockIds = [];
    expect(validateP3Blueprint(missingPreserved, request).valid).toBe(false);

    const supportRequest = adaptiveRequest(false);
    expect(getP3CandidateBlockIds(supportRequest)).not.toContain("predict-resistance-change");
  });

  it("keeps AI-selected order while normalizing the reason vocabulary", () => {
    const request = initialRequest();
    const blueprint = composeP3Fallback(request);
    blueprint.remainingSteps[0].reasonCode = "increase-challenge";
    blueprint.compositionSummary = "free model prose";
    const normalized = normalizeP3Blueprint(blueprint, request);
    expect(normalized.remainingSteps.map((step) => step.blockId)).toEqual(
      blueprint.remainingSteps.map((step) => step.blockId),
    );
    expect(normalized.remainingSteps[0].reasonCode).toBe("elicit-existing-model");
    expect(normalized.compositionSummary).not.toBe("free model prose");
  });

  it("extracts a constrained blueprint from fenced or thinking-prefixed local-model output", () => {
    const blueprint = composeP3Fallback(initialRequest());
    expect(parseOllamaBlueprintContent(`\`\`\`json\n${JSON.stringify(blueprint)}\n\`\`\``)).toEqual(blueprint);
    expect(parseOllamaBlueprintContent(`<think>private reasoning</think>\n${JSON.stringify(blueprint)}`)).toEqual(blueprint);
  });
});
