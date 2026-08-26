import { describe, expect, it } from "vitest";
import { buildComposerInput, composeDeterministic, validateBlueprint } from "./composer";
import { evaluationScenarios } from "./evaluation";

describe("Prototype 4 evaluation fixtures", () => {
  it("contains the planned twelve cross-subject scenarios and safe fallbacks", () => {
    expect(evaluationScenarios).toHaveLength(12);
    expect(evaluationScenarios.filter((scenario) => scenario.request.lessonId.startsWith("circuits"))).toHaveLength(6);
    expect(evaluationScenarios.filter((scenario) => scenario.request.lessonId.startsWith("cell"))).toHaveLength(6);
    for (const scenario of evaluationScenarios) {
      const { input, evidenceErrors } = buildComposerInput(scenario.request);
      const fallback = composeDeterministic(input);
      expect(evidenceErrors).toEqual([]);
      expect(validateBlueprint(fallback, input).valid).toBe(true);
    }
  });
});
