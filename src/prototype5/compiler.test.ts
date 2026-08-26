import { describe, expect, it } from "vitest";
import { compareAnalysisDrafts } from "./comparison";
import { compileApprovedLesson } from "./compiler";
import { validateAnalysisDraft, validateCitation, validateRepresentationPlan } from "./contracts";
import { p5EvaluationFixtures } from "./evaluationFixtures";
import { deterministicBlueprint } from "./composer";
import { reactionRateSource } from "./sources";
import type { RepresentationPlanDraft, SourceAnalysisDraft } from "./types";

const gold = p5EvaluationFixtures[0].goldSpec;
const approvedPlan: RepresentationPlanDraft = {
  schemaVersion: "p5-representations-1", sourceDocumentId: reactionRateSource.id,
  objectivePlans: [{ objectiveId: "objective-01", representationGap: false, proposals: [
    { tempId: "predict", primitiveId: "prediction", role: "evidence", supportingFactIds: ["fact-01"], relationshipIds: ["relationship-01"], factoryConfig: { kind: "prediction", relationshipId: "relationship-01" } },
    { tempId: "experiment", primitiveId: "parameter-experiment", role: "explore", supportingFactIds: ["fact-02"], relationshipIds: ["relationship-01"], factoryConfig: { kind: "parameter-experiment", tableId: "concentration-time-table", inputColumnId: "concentration", outputColumnId: "time" } },
    { tempId: "plot", primitiveId: "data-plot", role: "represent", supportingFactIds: ["fact-02"], relationshipIds: ["relationship-01"], factoryConfig: { kind: "data-plot", tableId: "concentration-time-table", xColumnId: "concentration", yColumnId: "time" } },
    { tempId: "apply", primitiveId: "target-challenge", role: "apply", supportingFactIds: ["fact-02"], relationshipIds: ["relationship-01"], factoryConfig: { kind: "target-challenge", tableId: "concentration-time-table", heldOutRowId: "result-200", predictionColumnId: "time" } },
  ] }],
};

describe("Prototype 5 trust and compilation boundary", () => {
  it("rejects an inexact quote before review", () => {
    expect(validateCitation(reactionRateSource, { kind: "text", sectionId: "particle-explanation", quote: "Higher concentration always doubles the rate." })).toContain("Quote is not an exact substring of particle-explanation.");
  });

  it("rejects table rows and columns that are not in the trusted source", () => {
    const invalid = structuredClone(approvedPlan); const proposal = invalid.objectivePlans[0].proposals[1];
    if (proposal.factoryConfig.kind === "parameter-experiment") proposal.factoryConfig.outputColumnId = "invented-rate";
    expect(validateRepresentationPlan(reactionRateSource, gold, invalid).errors.join(" ")).toContain("unknown column");
  });

  it("compiles approved proposals into registered blocks and a generic safe route", () => {
    const result = compileApprovedLesson(gold, approvedPlan); expect(result.errors).toEqual([]); expect(result.manifest?.blocks).toHaveLength(4);
    expect(result.manifest?.blocks.every((block) => block.id.startsWith("generated."))).toBe(true);
    expect(result.manifest?.provenanceReceipt.every((receipt) => receipt.citations.length > 0)).toBe(true);
    const route = deterministicBlueprint(result.manifest!, 15, []); expect(route.remainingSteps[0].blockId).toBe("generated.predict"); expect(route.remainingSteps.at(-1)?.blockId).toBe("generated.apply");
  });

  it("makes disagreement visible instead of auto-merging it", () => {
    const base: SourceAnalysisDraft = { schemaVersion: "p5-analysis-1", sourceDocumentId: reactionRateSource.id, modelId: "fast", sourceDerived: { concepts: [{ tempId: "c1", name: "concentration", citations: [{ kind: "text", sectionId: "particle-explanation", quote: "A higher acid concentration contains more acid particles in the same volume." }] }, { tempId: "c2", name: "reaction rate", citations: [{ kind: "text", sectionId: "particle-explanation", quote: "This produces more frequent successful collisions with magnesium, so the reaction is faster." }] }], facts: [{ tempId: "f1", statement: "Higher concentration makes the reaction faster.", citations: [{ kind: "text", sectionId: "particle-explanation", quote: "This produces more frequent successful collisions with magnesium, so the reaction is faster." }] }, { tempId: "f2", statement: "Shorter collection time means faster reaction.", citations: [{ kind: "text", sectionId: "reading-time", quote: "a shorter collection time indicates a faster reaction" }] }], relationships: [] }, pedagogical: { objectives: [{ tempId: "o1", statement: "Predict the change in reaction rate.", supportingFactIds: ["f1"] }], proposedPrerequisites: [], suggestedMisconceptions: [] } };
    const quality = structuredClone(base); quality.modelId = "quality"; quality.sourceDerived.facts[0].statement = "Higher concentration changes collision frequency.";
    const groups = compareAnalysisDrafts(base, quality); expect(groups.some((group) => group.status === "conflict")).toBe(true);
  });

  it("keeps source-derived and pedagogical arrays structurally separate", () => {
    const candidate = { schemaVersion: "p5-analysis-1", sourceDocumentId: reactionRateSource.id, modelId: "test", sourceDerived: { concepts: [], facts: [], relationships: [], objectives: [] }, pedagogical: { objectives: [], proposedPrerequisites: [], suggestedMisconceptions: [] } };
    expect(validateAnalysisDraft(reactionRateSource, candidate).schemaValid).toBe(false);
  });
});
