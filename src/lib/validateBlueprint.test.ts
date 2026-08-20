import { describe, expect, it } from "vitest";
import { blockCatalog } from "../data/blockCatalog";
import {
  CIRCUIT_FOUNDATION_OBJECTIVE_ID,
  OHMS_LAW_TOPIC_ID,
  RESISTANCE_OBJECTIVE_ID,
} from "../data/curriculum";
import { composeLocally } from "./localComposer";
import { validateBlueprint } from "./validateBlueprint";

const request = {
  topicId: OHMS_LAW_TOPIC_ID,
  requiredObjectiveIds: [
    CIRCUIT_FOUNDATION_OBJECTIVE_ID,
    RESISTANCE_OBJECTIVE_ID,
  ],
  learnerSnapshot: {
    priorKnowledge: "beginner" as const,
    knownMisconceptions: [],
    recentlyEffectiveInteractions: [],
  },
  constraints: {
    targetMinutes: 9,
    maximumSteps: 5,
    unavailableBlockIds: [],
    accessibilityNeeds: [],
  },
};

describe("validateBlueprint", () => {
  it("starts with a concrete circuit experience before the resistance relationship", () => {
    const blueprint = composeLocally(request);

    expect(blueprint.steps[0].blockId).toBe("complete-circuit-foundation");
    expect(blueprint.steps[1].blockId).toBe("battery-voltage-discovery");
    expect(blueprint.steps[2].blockId).toBe("resistance-slider-simulation");
    expect(
      blueprint.steps.some(
        (step) => step.blockId === "ohms-law-relationship-diagram",
      ),
    ).toBe(false);
  });

  it("accepts the local fallback composition", () => {
    const blueprint = composeLocally(request);
    const result = validateBlueprint(blueprint, blockCatalog, request.constraints && {
      topicId: request.topicId,
      requiredObjectiveIds: request.requiredObjectiveIds,
      ...request.constraints,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects invented block IDs", () => {
    const blueprint = composeLocally(request);
    blueprint.steps[0].blockId = "ai-invented-block";

    const result = validateBlueprint(blueprint, blockCatalog, {
      topicId: request.topicId,
      requiredObjectiveIds: request.requiredObjectiveIds,
      ...request.constraints,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("Unknown block"))).toBe(
      true,
    );
  });

  it("rejects unavailable blocks", () => {
    const blueprint = composeLocally(request);
    const result = validateBlueprint(blueprint, blockCatalog, {
      topicId: request.topicId,
      requiredObjectiveIds: request.requiredObjectiveIds,
      ...request.constraints,
      unavailableBlockIds: ["resistance-slider-simulation"],
    });

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.includes("Unavailable block")),
    ).toBe(true);
  });
});
