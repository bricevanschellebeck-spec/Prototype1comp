import type { ApprovedLearningSpec, SourceCitation, SourceDocument } from "./types";
import { evaluationSources } from "./sources";

export type P5EvaluationFixture = {
  source: SourceDocument;
  expectedConceptTerms: string[];
  expectedFactTerms: string[];
  expectedRelationshipTypes: string[];
  expectedPrimitiveIds: string[];
  representationGap: boolean;
  unsupportedClaims: string[];
  goldSpec: ApprovedLearningSpec;
};

const text = (sectionId: string, quote: string): SourceCitation => ({ kind: "text", sectionId, quote });
const table = (tableId: string, rowIds: string[], columnIds: string[]): SourceCitation => ({ kind: "table", tableId, rowIds, columnIds });
function spec(source: SourceDocument, options: { concepts: Array<[string, string, SourceCitation]>; facts: Array<[string, string, SourceCitation]>; relation?: [string, "causes" | "increases" | "decreases" | "sequence" | "depends-on", string, string, SourceCitation]; objective: string }): ApprovedLearningSpec {
  const concepts = options.concepts.map(([id, name, citation]) => ({ id, name, citations: [citation] })); const facts = options.facts.map(([id, statement, citation]) => ({ id, statement, citations: [citation] }));
  const relationships = options.relation ? [{ id: "relationship-01", fromConceptId: options.relation[0], type: options.relation[1], toConceptId: options.relation[2], supportingFactIds: [options.relation[3]], citations: [options.relation[4]] }] : [];
  return { schemaVersion: "p5-approved-spec-1", sourceDocumentId: source.id, concepts, facts, relationships, objectives: [{ id: "objective-01", statement: options.objective, supportingFactIds: facts.map((fact) => fact.id) }], prerequisites: [], misconceptions: [], approvalReceipt: [{ comparisonGroupId: "gold-fixture", candidateId: "human-authored" }] };
}

const [chemistry, biology, geography, economics, geometry] = evaluationSources;
export const p5EvaluationFixtures: P5EvaluationFixture[] = [
  {
    source: chemistry, expectedConceptTerms: ["concentration", "reaction rate", "collision"], expectedFactTerms: ["30 ml", "shorter", "faster"], expectedRelationshipTypes: ["increases", "decreases"], expectedPrimitiveIds: ["prediction", "parameter-experiment", "data-plot", "target-challenge"], representationGap: false, unsupportedClaims: ["temperature", "catalyst", "linear"],
    goldSpec: spec(chemistry, { concepts: [["concept-01", "acid concentration", text("particle-explanation", "A higher acid concentration contains more acid particles in the same volume.")], ["concept-02", "reaction rate", text("particle-explanation", "This produces more frequent successful collisions with magnesium, so the reaction is faster.")]], facts: [["fact-01", "Higher concentration gives a faster reaction through more frequent successful collisions.", text("particle-explanation", "This produces more frequent successful collisions with magnesium, so the reaction is faster.")], ["fact-02", "The four recorded concentration and time values are trusted evidence.", table("concentration-time-table", ["result-050","result-100","result-150","result-200"], ["concentration","time"])]], relation: ["concept-01", "increases", "concept-02", "fact-01", text("particle-explanation", "This produces more frequent successful collisions with magnesium, so the reaction is faster.")], objective: "Predict how increasing acid concentration changes reaction rate and support the prediction with recorded data." }),
  },
  {
    source: biology, expectedConceptTerms: ["light", "photosynthesis", "limiting"], expectedFactTerms: ["increase", "rate", "factor"], expectedRelationshipTypes: ["increases"], expectedPrimitiveIds: ["comparison", "data-plot", "evidence-reveal"], representationGap: false, unsupportedClaims: ["carbon dioxide concentration", "temperature is 25"],
    goldSpec: spec(biology, { concepts: [["concept-01", "light intensity", text("light-rate", "At low light intensity, increasing light can increase the rate of photosynthesis.")], ["concept-02", "photosynthesis rate", text("light-rate", "At low light intensity, increasing light can increase the rate of photosynthesis.")]], facts: [["fact-01", "At low light intensity, more light can increase photosynthesis rate.", text("light-rate", "At low light intensity, increasing light can increase the rate of photosynthesis.")], ["fact-02", "The recorded lamp distances and bubble counts are trusted evidence.", table("light-bubbles", ["p1","p2","p3"], ["distance","bubbles"])]], relation: ["concept-01", "increases", "concept-02", "fact-01", text("light-rate", "At low light intensity, increasing light can increase the rate of photosynthesis.")], objective: "Use the source and data to explain how light can limit photosynthesis." }),
  },
  {
    source: geography, expectedConceptTerms: ["velocity", "discharge", "gradient", "erosion"], expectedFactTerms: ["increase", "slowly"], expectedRelationshipTypes: ["causes", "increases", "decreases"], expectedPrimitiveIds: ["classification", "step-sequence", "evidence-reveal"], representationGap: false, unsupportedClaims: ["hydraulic action is always dominant"],
    goldSpec: spec(geography, { concepts: [["concept-01", "river velocity", text("erosion", "Faster water can carry more energy.")], ["concept-02", "river erosion", text("erosion", "Greater discharge and a steeper gradient can increase river velocity and erosion, while resistant rock erodes more slowly.")]], facts: [["fact-01", "Greater discharge and steeper gradient can increase velocity and erosion.", text("erosion", "Greater discharge and a steeper gradient can increase river velocity and erosion, while resistant rock erodes more slowly.")]], relation: ["concept-01", "increases", "concept-02", "fact-01", text("erosion", "Greater discharge and a steeper gradient can increase river velocity and erosion, while resistant rock erodes more slowly.")], objective: "Explain how source-listed factors can change river erosion." }),
  },
  {
    source: economics, expectedConceptTerms: ["supply", "demand", "price"], expectedFactTerms: ["rise", "fall", "unchanged"], expectedRelationshipTypes: ["increases", "decreases", "depends-on"], expectedPrimitiveIds: ["prediction", "classification", "comparison"], representationGap: false, unsupportedClaims: ["inflation", "government intervention"],
    goldSpec: spec(economics, { concepts: [["concept-01", "demand", text("market", "When demand increases while supply is unchanged, price tends to rise.")], ["concept-02", "price", text("market", "When demand increases while supply is unchanged, price tends to rise.")]], facts: [["fact-01", "With supply unchanged, increased demand tends to raise price.", text("market", "When demand increases while supply is unchanged, price tends to rise.")]], relation: ["concept-01", "increases", "concept-02", "fact-01", text("market", "When demand increases while supply is unchanged, price tends to rise.")], objective: "Predict a price direction when either supply or demand changes and the other is held constant." }),
  },
  {
    source: geometry, expectedConceptTerms: ["arc", "endpoint", "perpendicular", "midpoint"], expectedFactTerms: ["equal-radius", "intersections"], expectedRelationshipTypes: ["sequence"], expectedPrimitiveIds: [], representationGap: true, unsupportedClaims: ["protractor", "90 degree measurement"],
    goldSpec: spec(geometry, { concepts: [["concept-01", "equal-radius arcs", text("construction", "Draw equal-radius arcs from both endpoints of a line segment.")], ["concept-02", "perpendicular bisector", text("construction", "The new line is perpendicular to the segment and passes through its midpoint.")]], facts: [["fact-01", "Equal-radius arcs from both endpoints create two intersections used to construct the bisector.", text("construction", "Draw equal-radius arcs from both endpoints of a line segment. Join the two arc intersections.")]], relation: ["concept-01", "sequence", "concept-02", "fact-01", text("construction", "Draw equal-radius arcs from both endpoints of a line segment. Join the two arc intersections.")], objective: "Construct a perpendicular bisector with equal-radius compass arcs." }),
  },
];
