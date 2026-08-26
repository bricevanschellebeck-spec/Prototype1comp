import { describe, expect, it } from "vitest";
import { buildComposerInput, buildModelPrompt, composeDeterministic, expandModelSelection, parseModelJson, validateBlueprint } from "./composer";
import { cellsManifest, circuitsManifest, lessonRegistry, validateManifest } from "./manifests";
import type { ApiComposeRequest } from "./types";

function request(lessonId: ApiComposeRequest["lessonId"], goal: ApiComposeRequest["goal"] = "understand", depthMinutes: ApiComposeRequest["depthMinutes"] = 15): ApiComposeRequest {
  return { schemaVersion: "p4-api-1", lessonId, goal, depthMinutes, evidenceLog: [] };
}

describe("Prototype 4 generalized composition", () => {
  it("keeps both subject manifests attached to trusted facts and registered primitives", () => {
    expect(lessonRegistry.size).toBe(2);
    expect(validateManifest(circuitsManifest)).toEqual([]);
    expect(validateManifest(cellsManifest)).toEqual([]);
    expect(circuitsManifest.blocks).toHaveLength(8);
    expect(cellsManifest.blocks).toHaveLength(8);
    expect(new Set(circuitsManifest.blocks.map((block) => block.primitiveId))).toContain("data-plot");
    expect(new Set(cellsManifest.blocks.map((block) => block.primitiveId))).toContain("classification");
    expect(new Set(cellsManifest.blocks.map((block) => block.primitiveId))).toContain("step-sequence");
  });

  it("uses the same builder and validator for structurally different initial paths", () => {
    for (const lessonId of ["circuits-resistance-v1", "cell-membrane-transport-v1"] as const) {
      const { input, evidenceErrors } = buildComposerInput(request(lessonId));
      const blueprint = composeDeterministic(input);
      expect(evidenceErrors).toEqual([]);
      expect(validateBlueprint(blueprint, input).valid).toBe(true);
      expect(blueprint.remainingSteps[0].blockId.startsWith(lessonId.startsWith("circuits") ? "circuits." : "cells.")).toBe(true);
    }
  });

  it("creates visibly different correct and misconception recompositions for both lessons", () => {
    const scenarios: ApiComposeRequest[] = [
      { ...request("circuits-resistance-v1"), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] },
      { ...request("circuits-resistance-v1"), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["more-resistance-means-more-current"] }] },
      { ...request("cell-membrane-transport-v1"), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] },
      { ...request("cell-membrane-transport-v1"), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["particles-move-against-gradient-without-energy"] }] },
    ];
    const paths = scenarios.map((scenario) => { const { input } = buildComposerInput(scenario); const blueprint = composeDeterministic(input); expect(validateBlueprint(blueprint, input).valid).toBe(true); return blueprint.remainingSteps.map((step) => step.blockId); });
    expect(paths[0]).not.toEqual(paths[1]);
    expect(paths[2]).not.toEqual(paths[3]);
    expect(paths[1].slice(0, 2)).toEqual(["circuits.compare-current-paths", "circuits.guided-resistance-retry"]);
    expect(paths[3].slice(0, 2)).toEqual(["cells.compare-passive-active", "cells.guided-gradient-retry"]);
  });

  it("rejects cross-subject IDs, arbitrary fields, duplicates, and dependency violations", () => {
    const { input } = buildComposerInput(request("cell-membrane-transport-v1"));
    const crossSubject = composeDeterministic(input);
    crossSubject.remainingSteps[0].blockId = "circuits.predict-resistance-change";
    expect(validateBlueprint(crossSubject, input).valid).toBe(false);

    const arbitrary = { ...composeDeterministic(input), css: "position: fixed" };
    expect(validateBlueprint(arbitrary, input).schemaValid).toBe(false);

    const duplicate = composeDeterministic(input);
    duplicate.remainingSteps[1] = duplicate.remainingSteps[0];
    expect(validateBlueprint(duplicate, input).valid).toBe(false);
  });

  it("extracts a blueprint from fenced and thinking-prefixed model output", () => {
    const { input } = buildComposerInput(request("circuits-resistance-v1"));
    const blueprint = composeDeterministic(input);
    expect(parseModelJson(`\`\`\`json\n${JSON.stringify(blueprint)}\n\`\`\``)).toEqual(blueprint);
    expect(parseModelJson(`<think>hidden</think>\n${JSON.stringify(blueprint)}`)).toEqual(blueprint);
  });

  it("expands a compact provider selection into the strict public blueprint", () => {
    const { input } = buildComposerInput(request("cell-membrane-transport-v1", "revise", 5));
    const compact = {
      steps: ["cells.classify-transport", "cells.predict-water-balance", "cells.apply-new-cell-scenario"],
      delay: ["cells.osmosis-rule"],
    };
    const expanded = expandModelSelection(compact, input);
    expect(validateBlueprint(expanded, input).valid).toBe(true);
  });

  it("safely normalizes a nested count-and-path model response", () => {
    const { input } = buildComposerInput({
      ...request("circuits-resistance-v1"),
      evidenceLog: [{
        blockId: "circuits.predict-resistance-change",
        result: "incorrect",
        attempts: 1,
        hintUsed: false,
        misconceptionIds: ["more-resistance-means-more-current"],
      }],
    });
    const malformedProviderShape = {
      blueprintVersion: "wrong-provider-version",
      lessonId: "wrong-provider-lesson",
      blueprint: {
        count: 4,
        path: [
          "circuits.compare-current-paths",
          { id: "circuits.guided-resistance-retry" },
          { blockId: "circuits.generate-current-graph" },
          "circuits.reach-target-current",
        ],
      },
    };
    const expanded = expandModelSelection(malformedProviderShape, input);
    const validation = validateBlueprint(expanded, input);
    expect(validation.valid).toBe(true);
    expect(validation.blueprint?.remainingSteps).toHaveLength(4);
  });

  it("states the exact step limit and correction errors in the model prompt", () => {
    const { input } = buildComposerInput(request("circuits-resistance-v1", "understand", 5));
    const prompt = JSON.parse(buildModelPrompt(input, {
      validationErrors: ["Blueprint exceeds the step limit."],
      previousContent: '{"steps":["too","many","step","ids"]}',
    }));
    expect(prompt.rules.maximumTotalSteps).toBe(3);
    expect(prompt.rules.neverExceedMaximumTotalSteps).toBe(true);
    expect(prompt.returnOnly.stepCountRange).toBe("1-3");
    expect(prompt.returnOnly.forbiddenKeys).toContain("path");
    expect(prompt.correction.validationErrors).toEqual(["Blueprint exceeds the step limit."]);
  });

  it("never offers strong-remediation blocks unless support need is strong", () => {
    const hintedRequest = {
      ...request("cell-membrane-transport-v1"),
      evidenceLog: [{
        blockId: "cells.predict-gradient-direction",
        result: "correct" as const,
        attempts: 2,
        hintUsed: true,
        misconceptionIds: [],
      }],
    };
    const { input } = buildComposerInput(hintedRequest);
    expect(input.learnerState.supportNeed).toBe("light");
    expect(input.legalCandidates.some((candidate) => candidate.role === "support")).toBe(false);
  });
});
