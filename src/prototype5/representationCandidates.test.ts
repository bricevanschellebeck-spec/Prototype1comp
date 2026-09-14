import { describe, expect, it } from "vitest";
import { p5EvaluationFixtures } from "./evaluationFixtures";
import { buildRepresentationCandidates, expandRepresentationSelection } from "./representationCandidates";

const { source, goldSpec } = p5EvaluationFixtures[0];

describe("P5 constrained representation selection", () => {
  it("derives source-bound candidates without asking AI for factory IDs", () => {
    const candidates = buildRepresentationCandidates(source, goldSpec);
    expect(candidates.map((item) => item.proposal.primitiveId)).toEqual(expect.arrayContaining(["prediction", "parameter-experiment", "data-plot", "target-challenge"]));
    const tableConfigs = candidates.map((item) => item.proposal.factoryConfig).filter((config) => "tableId" in config);
    expect(tableConfigs.every((config) => "tableId" in config && config.tableId === "concentration-time-table")).toBe(true);
  });

  it("expands legal AI choices into exact deterministic factory configurations", () => {
    const candidates = buildRepresentationCandidates(source, goldSpec);
    const selected = candidates.filter((item) => ["prediction", "parameter-experiment", "data-plot", "target-challenge"].includes(item.proposal.primitiveId));
    const result = expandRepresentationSelection(source, goldSpec, {
      schemaVersion: "p5-representation-selection-1",
      sourceDocumentId: source.id,
      objectiveSelections: [{ objectiveId: "objective-01", representationGap: false, selectedCandidateIds: selected.map((item) => item.id) }],
    }, candidates);
    expect(result.errors).toEqual([]);
    expect(result.plan?.objectivePlans[0].proposals).toHaveLength(4);
    expect(result.plan?.objectivePlans[0].proposals.at(-1)?.factoryConfig).toMatchObject({ tableId: "concentration-time-table", heldOutRowId: "result-200" });
  });

  it("rejects invented candidate IDs before compilation", () => {
    const candidates = buildRepresentationCandidates(source, goldSpec);
    const result = expandRepresentationSelection(source, goldSpec, {
      schemaVersion: "p5-representation-selection-1",
      sourceDocumentId: source.id,
      objectiveSelections: [{ objectiveId: "objective-01", representationGap: false, selectedCandidateIds: ["invented-table-widget"] }],
    }, candidates);
    expect(result.plan).toBeUndefined();
    expect(result.errors.join(" ")).toContain("Unknown representation candidate");
  });

  it("rejects a path that cannot support an incorrect learner", () => {
    const candidates = buildRepresentationCandidates(source, goldSpec);
    const selected = candidates.filter((item) => ["prediction", "data-plot", "target-challenge"].includes(item.proposal.primitiveId));
    const result = expandRepresentationSelection(source, goldSpec, {
      schemaVersion: "p5-representation-selection-1",
      sourceDocumentId: source.id,
      objectiveSelections: [{ objectiveId: "objective-01", representationGap: false, selectedCandidateIds: selected.map((item) => item.id) }],
    }, candidates);
    expect(result.plan).toBeUndefined();
    expect(result.errors.join(" ")).toContain("support an incorrect learner");
  });
});
