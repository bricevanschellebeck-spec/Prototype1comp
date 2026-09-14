import { describe, expect, it } from "vitest";
import { compileExperience } from "./compiler";
import { validateEvidence, validatePath } from "./composer";
import { validateExperienceBlueprint, validateKnowledgePackage } from "./contracts";
import { compareStructuralSignatures, evaluationProfiles, structuralSignature, structuralSignatureObject, summarizeWithinGoal } from "./evaluation";
import { fixtureBlueprint } from "./fixtures";
import { circuitKnowledge, deriveValue } from "./knowledge";
import { signBlueprint, verifyExperience } from "./receipts";
import { inspectRepresentationGaps, primitiveCapabilityRegistry } from "./capabilities";
import type { LearningExperienceBlueprint } from "./types";

function blueprintWithValidGap(): LearningExperienceBlueprint {
  const request = evaluationProfiles[1];
  const blueprint = structuredClone(fixtureBlueprint(request));
  blueprint.stages = blueprint.stages.filter((stage) => stage.stageId !== "reveal-pattern");
  blueprint.stages.find((stage) => stage.stageId === "change-resistance")!.objectiveIds = ["objective-predict"];
  const final = blueprint.stages.find((stage) => stage.stageId === "reach-current")!;
  final.objectiveIds = ["objective-apply"];
  final.prerequisiteStageIds = ["change-resistance"];
  blueprint.initialSequenceStageIds = ["predict-change", "change-resistance", "reach-current"];
  blueprint.representationGaps = [{ objectiveId: "objective-explain", missingCapability: "microscopic-charge-motion", reasonCode: "existing-primitives-cannot-show-mechanism" }];
  return blueprint;
}

describe("Prototype 6 trusted knowledge", () => {
  it("has source-valid facts and deterministic circuit maths", () => {
    expect(validateKnowledgePackage()).toEqual([]);
    expect(deriveValue("ohms-law-current", ["voltage-9", "resistance-4"])).toBe(2.25);
    expect(deriveValue("ohms-law-current", ["voltage-12", "resistance-6"])).toBe(2);
    expect(deriveValue("ohms-law-resistance", ["voltage-9", "current-1-5"])).toBe(6);
  });
});

describe("Prototype 6 autonomous design boundary", () => {
  for (const request of evaluationProfiles) it(`accepts a complete ${request.goal} evaluator design`, () => {
    const result = validateExperienceBlueprint(fixtureBlueprint(request), request);
    expect(result.errors).toEqual([]);
  });

  it("rejects unknown IDs, extra fields, ungrounded numbers and cycles", () => {
    const request = evaluationProfiles[1]; const unknownId = structuredClone(fixtureBlueprint(request)); unknownId.stages[0].sourceFactIds = ["invented-fact"];
    expect(validateExperienceBlueprint(unknownId, request).errors.join(" ")).toContain("Unknown stage fact invented-fact");
    const extra = { ...fixtureBlueprint(request), html: "<script>" };
    expect(validateExperienceBlueprint(extra, request).schemaValid).toBe(false);
    const number = structuredClone(fixtureBlueprint(request)); number.stages[0].copy.instruction.text = "Set the battery to 47 V.";
    expect(validateExperienceBlueprint(number, request).errors.join(" ")).toContain("unsupported number 47");
    const cycle = structuredClone(fixtureBlueprint(request)); cycle.stages[0].prerequisiteStageIds = ["change-resistance"];
    expect(validateExperienceBlueprint(cycle, request).errors.join(" ")).toContain("cycle");
  });

  it("produces distinct same-source structural profiles", () => {
    const signatures = evaluationProfiles.map((request) => { const value = fixtureBlueprint(request); return structuralSignature(value.stages, value.initialSequenceStageIds, value.finalApplicationStageId, value.designSummary.delayedFactIds, value.designSummary.omittedFactIds); });
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(3);
    expect(signatures[0]).not.toBe(signatures[3]);
  });

  it("compares goal structures without turning variation into validation", () => {
    const explore = fixtureBlueprint(evaluationProfiles[0]);
    const test = fixtureBlueprint(evaluationProfiles[3]);
    const signatureFor = (blueprint: LearningExperienceBlueprint) => structuralSignatureObject(blueprint.stages, blueprint.initialSequenceStageIds, blueprint.finalApplicationStageId, blueprint.designSummary.delayedFactIds, blueprint.designSummary.omittedFactIds);
    const exploreSignature = signatureFor(explore);
    const comparison = compareStructuralSignatures(exploreSignature, signatureFor(test));
    expect(comparison.meaningfullyDifferent).toBe(true);
    expect(comparison.differingDimensions).toBeGreaterThan(0);
    expect(summarizeWithinGoal([exploreSignature, exploreSignature])).toMatchObject({ distinctStructures: 1, modalConsistencyPercent: 100 });
  });
});

describe("Prototype 6 operational representation gaps", () => {
  const request = evaluationProfiles[1];

  it("accepts an objective covered normally", () => {
    expect(validateExperienceBlueprint(fixtureBlueprint(request), request).errors).toEqual([]);
  });

  it("accepts an objective covered through a genuinely unavailable capability", () => {
    expect(validateExperienceBlueprint(blueprintWithValidGap(), request).errors).toEqual([]);
  });

  it("rejects an objective with neither a stage nor a gap", () => {
    const blueprint = blueprintWithValidGap();
    blueprint.representationGaps = [];
    expect(validateExperienceBlueprint(blueprint, request).errors.join(" ")).toContain("stage or representation gap");
  });

  it("rejects a gap that references an unknown objective", () => {
    const blueprint = blueprintWithValidGap();
    blueprint.representationGaps[0].objectiveId = "objective-invented";
    expect(validateExperienceBlueprint(blueprint, request).errors.join(" ")).toContain("Unknown representation-gap objective objective-invented");
  });

  it("rejects a gap for a capability already supplied by the registry", () => {
    const blueprint = blueprintWithValidGap();
    blueprint.representationGaps[0].missingCapability = "spatial-representation";
    expect(validateExperienceBlueprint(blueprint, request).errors.join(" ")).toContain("claims available capability spatial-representation");
  });

  it("rejects duplicate stage and gap coverage", () => {
    const blueprint = fixtureBlueprint(request);
    blueprint.representationGaps = [{ objectiveId: "objective-explain", missingCapability: "microscopic-charge-motion", reasonCode: "existing-primitives-cannot-show-mechanism" }];
    expect(validateExperienceBlueprint(blueprint, request).errors.join(" ")).toContain("duplicates stage coverage");
  });

  it("preserves accepted gaps through compilation and signing", () => {
    const blueprint = blueprintWithValidGap();
    const compiled = compileExperience(blueprint, signBlueprint(blueprint));
    expect(compiled.errors).toEqual([]);
    expect(compiled.experience?.representationGaps).toEqual(blueprint.representationGaps);
    expect(verifyExperience(compiled.experience)).toBe(true);
  });

  it("builds the inspector row for an accepted gap", () => {
    const [row] = inspectRepresentationGaps(blueprintWithValidGap());
    expect(row).toMatchObject({
      objectiveId: "objective-explain",
      missingCapability: "microscopic-charge-motion",
      capabilityAvailable: false,
      validationStatus: "accepted",
    });
    expect(row.objective).toContain("Ohm's law");
  });

  it("registers generic capability metadata for every primitive", () => {
    expect(Object.keys(primitiveCapabilityRegistry)).toHaveLength(12);
    expect(Object.values(primitiveCapabilityRegistry).every((primitive) => primitive.capabilities.length > 0)).toBe(true);
  });
});

describe("Prototype 6 signed compilation and adaptation", () => {
  const request = evaluationProfiles[1]; const blueprint = fixtureBlueprint(request); const receipt = signBlueprint(blueprint);
  it("compiles an intact AI design and preserves provenance", () => {
    const result = compileExperience(blueprint, receipt);
    expect(result.errors).toEqual([]); expect(result.experience).toBeDefined(); expect(verifyExperience(result.experience)).toBe(true);
    expect(result.experience?.provenanceReceipt).toHaveLength(blueprint.stages.length);
  });
  it("rejects changed signed designs and unsafe review removal", () => {
    const changed = structuredClone(blueprint); changed.lessonTitle.text = "Changed";
    expect(compileExperience(changed, receipt).errors[0]).toContain("changed");
    const withoutSupport = blueprint.stages.filter((stage) => stage.availability !== "support-only").map((stage) => stage.stageId);
    expect(compileExperience(blueprint, receipt, withoutSupport).errors.join(" ")).toContain("support alternative");
  });
  it("validates learner evidence and requires support after an error", () => {
    const experience = compileExperience(blueprint, receipt).experience!;
    const bad = [{ stageId: "predict-change", result: "incorrect" as const, attempts: 1, hintUsed: false, misconceptionIds: ["misconception-more-resistance-more-current"] }];
    expect(validateEvidence(experience, bad)).toEqual([]);
    expect(validatePath(["compare-support", "change-resistance", "reveal-pattern", "reach-current"], experience, bad)).toEqual([]);
    expect(validatePath(["change-resistance", "reveal-pattern", "reach-current"], experience, bad).join(" ")).toContain("support stage first");
  });
  it("detects a changed executable manifest", () => {
    const experience = compileExperience(blueprint, receipt).experience!; experience.lessonTitle = "Tampered";
    expect(verifyExperience(experience)).toBe(false);
  });
  it("keeps the executable signature valid across an HTTP JSON round trip", () => {
    const experience = compileExperience(blueprint, receipt).experience!;
    const transported = JSON.parse(JSON.stringify(experience));
    expect(verifyExperience(transported)).toBe(true);
  });
});

describe("Prototype 6 isolation", () => {
  it("does not embed a fixed path in the trusted knowledge package", () => {
    expect(JSON.stringify(circuitKnowledge)).not.toContain("initialSequenceStageIds");
    expect(JSON.stringify(circuitKnowledge)).not.toContain("support-only");
  });
});
