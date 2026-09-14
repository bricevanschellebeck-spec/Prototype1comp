import { describe, expect, it } from "vitest";
import { chooseSmallestAdaptation, deriveUnderstanding, learningDesignQualityRules, referenceContributionsForOutcome } from "./evidence";
import { detailParts, informationDensity, objectKnowledgeState, shouldRevealContext } from "./information";
import { activityPath, circuitLesson, goldLessons, historyLesson } from "./lessons";
import { circuitRuntimeIssues, learnerEvidenceVisible, sceneForActivity } from "./runtime";
import { addReferenceKnowledge, emptyLivingReference, referenceAvailable, validateReferenceContribution } from "./reference";
import { activityExperimentRecords } from "./activityExperiments";
import type { SceneState } from "./Scenes";
import type { EvidenceEvent } from "./types";

describe("P6.5 gold-standard learning language", () => {
  it("registers two structurally different persistent environments", () => {
    expect(goldLessons.map((lesson) => lesson.sceneId)).toEqual(["circuit-continuum", "history-continuum"]);
    expect(new Set(circuitLesson.activities.map((activity) => activity.interaction))).not.toEqual(new Set(historyLesson.activities.map((activity) => activity.interaction)));
  });

  it("separates activity family, purpose, and freedom", () => {
    for (const lesson of goldLessons) for (const activity of lesson.activities) {
      expect(activity.family).toBeTruthy();
      expect(["casual", "focus"]).toContain(activity.purpose);
      expect(["guided-learning", "guided-challenge", "playground"]).toContain(activity.freedom);
      expect(activity.representation).toBeTruthy();
      expect(activity.sceneTransition).toBeTruthy();
      expect(activity.adaptationOptions.length).toBeGreaterThan(0);
    }
    expect(circuitLesson.activities.some((activity) => activity.purpose === "focus" && activity.freedom === "guided-challenge")).toBe(true);
    expect(circuitLesson.activities.some((activity) => activity.freedom === "playground")).toBe(true);
  });

  it("makes goal and depth combinations structurally different", () => {
    const signature = (goal: Parameters<typeof activityPath>[1], depth: Parameters<typeof activityPath>[2]) => activityPath(circuitLesson, goal, depth).map((activity) => `${activity.family}:${activity.purpose}:${activity.freedom}`).join("|");
    expect(signature("curious", "quick")).not.toBe(signature("test", "deep"));
    expect(signature("understand", "learn")).not.toBe(signature("revise", "quick"));
  });

  it("builds the reference from completed activities rather than an initial dump", () => {
    expect(circuitLesson.initialReference).toEqual([]);
    expect(circuitLesson.activities.find((activity) => activity.id === "c-lab")?.referenceContributions.map((entry) => entry.kind)).toContain("evidence");
    expect(historyLesson.activities.find((activity) => activity.id === "h-source")?.referenceContributions.map((entry) => entry.kind)).toContain("evidence");
  });

  it("chooses a representation change after misconception evidence", () => {
    const prediction = circuitLesson.activities.find((activity) => activity.id === "c-predict")!;
    const event: EvidenceEvent = { activityId: prediction.id, conceptIds: prediction.conceptIds, channel: "diagnostic", result: "misconception", attempts: 1, guidanceLevel: 1, detail: "Incorrect direction" };
    expect(chooseSmallestAdaptation(prediction, event)).toMatchObject({ scale: "medium", kind: "comparison", insertActivityId: "c-compare" });
  });

  it("tracks concept evidence without a numerical mastery score", () => {
    const evidence: EvidenceEvent[] = [
      { activityId: "c-predict", conceptIds: ["resistance-current"], channel: "diagnostic", result: "misconception", attempts: 1, guidanceLevel: 1, detail: "Prediction reversed" },
      { activityId: "c-lab", conceptIds: ["resistance-current"], channel: "natural", result: "supported", attempts: 1, guidanceLevel: 1, detail: "Recovered through comparison" },
    ];
    const state = deriveUnderstanding(circuitLesson, evidence).find((concept) => concept.conceptId === "resistance-current");
    expect(state?.state).toBe("supported");
    expect(state).not.toHaveProperty("score");
  });

  it("keeps explicit learning-design quality rules", () => {
    expect(learningDesignQualityRules.length).toBeGreaterThanOrEqual(15);
    expect(learningDesignQualityRules.join(" ")).toContain("smallest adaptation");
  });

  it("exposes the vocabulary a future P6 AI designer must target", () => {
    for (const lesson of goldLessons) {
      expect(lesson.sceneObjects.length).toBeGreaterThanOrEqual(5);
      expect(lesson.activities.every((activity) => activity.representation && activity.sceneTransition)).toBe(true);
      expect(lesson.sideBranches.length).toBeGreaterThan(0);
    }
  });

  it("introduces scene objects progressively instead of labelling everything immediately", () => {
    const close = circuitLesson.activities.find((activity) => activity.id === "c-close")!;
    expect(objectKnowledgeState("battery", circuitLesson, close, [])).toBe("known");
    expect(objectKnowledgeState("switch", circuitLesson, close, [])).toBe("active");
    expect(objectKnowledgeState("resistor", circuitLesson, close, [])).toBe("future");
    const predict = circuitLesson.activities.find((activity) => activity.id === "c-predict")!;
    expect(objectKnowledgeState("resistor", circuitLesson, predict, ["c-close"])).toBe("active");
  });

  it("keeps essential context visible by rule while optional detail follows depth", () => {
    const lab = circuitLesson.activities.find((activity) => activity.id === "c-lab")!;
    expect(shouldRevealContext(lab, { goal: "understand", actionObserved: false, guidanceLevel: 0 })).toBe(false);
    expect(shouldRevealContext(lab, { goal: "understand", actionObserved: true, guidanceLevel: 0 })).toBe(true);
    const resistor = circuitLesson.objectDetails.find((detail) => detail.id === "resistor")!;
    expect(detailParts("glance", resistor).map((part) => part.label)).toEqual(["Definition"]);
    expect(detailParts("deep", resistor).map((part) => part.label)).toEqual(["Definition", "Unit", "How it works", "Go deeper"]);
  });

  it("adds connections for Understand without preloading the Curious route", () => {
    const close = circuitLesson.activities.find((activity) => activity.id === "c-close")!;
    const voltage = circuitLesson.activities.find((activity) => activity.id === "c-voltage")!;
    expect(close.goalPrompts?.understand).toContain("why a circuit needs a complete path");
    expect(close.goalPrompts?.curious).toBeUndefined();
    expect(shouldRevealContext(voltage, { goal: "understand", actionObserved: false, guidanceLevel: 0 })).toBe(true);
    expect(shouldRevealContext(voltage, { goal: "curious", actionObserved: false, guidanceLevel: 0 })).toBe(false);
    expect(voltage.purpose).toBe("casual");
  });

  it("changes information density with purpose, depth, and concept-specific support", () => {
    expect(informationDensity("test", "deep", 0)).toBe("glance");
    expect(informationDensity("understand", "learn", 0)).toBe("guided");
    expect(informationDensity("curious", "deep", 0)).toBe("deep");
    expect(informationDensity("revise", "deep", 3)).toBe("deep");
  });

  it("registers three-layer information for every scene object that learners may inspect", () => {
    for (const lesson of goldLessons) {
      expect(new Set(lesson.objectDetails.map((detail) => detail.id))).toEqual(new Set(lesson.sceneObjects.filter((id) => id !== "measurement-graph" || lesson.id === "circuits")));
      for (const activity of lesson.activities) {
        expect(activity.information.activeObjectIds.length).toBeGreaterThan(0);
        expect(activity.information.introducedObjectIds.every((id) => lesson.sceneObjects.includes(id))).toBe(true);
      }
    }
  });

  it("uses purpose for teaching order and depth for reach", () => {
    const ids = (goal: Parameters<typeof activityPath>[1], depth: Parameters<typeof activityPath>[2]) => activityPath(circuitLesson, goal, depth).map((activity) => activity.id);
    expect(ids("curious", "quick")).toEqual(["c-close", "c-lab"]);
    expect(ids("understand", "quick")).toEqual(["c-close", "c-predict", "c-lab"]);
    expect(ids("understand", "learn")).toEqual(["c-close", "c-voltage", "c-predict", "c-lab", "c-target"]);
    expect(ids("revise", "learn")).toEqual(["c-predict", "c-target", "c-repair"]);
    expect(ids("test", "deep")).toEqual(["c-predict", "c-target", "c-repair", "c-transfer"]);
    expect(ids("understand", "deep").length).toBeGreaterThan(ids("understand", "quick").length);
  });

  it("changes the activity mix rather than only changing wording", () => {
    const curious = activityPath(circuitLesson, "curious", "deep");
    const test = activityPath(circuitLesson, "test", "deep");
    expect(curious.some((activity) => activity.freedom === "playground")).toBe(true);
    expect(test.every((activity) => activity.purpose === "focus" || activity.evidenceChannel === "diagnostic")).toBe(true);
    expect(test.some((activity) => activity.stageRole === "transfer")).toBe(true);
  });

  it("keeps curious adaptation light but inserts targeted revision support", () => {
    const prediction = circuitLesson.activities.find((activity) => activity.id === "c-predict")!;
    const miss: EvidenceEvent = { activityId: prediction.id, conceptIds: prediction.conceptIds, channel: "diagnostic", result: "misconception", attempts: 1, guidanceLevel: 1, detail: "Prediction reversed" };
    expect(chooseSmallestAdaptation(prediction, miss, "curious")).toMatchObject({ scale: "micro", kind: "cue" });
    expect(chooseSmallestAdaptation(prediction, miss, "revise")).toMatchObject({ scale: "medium", insertActivityId: "c-compare" });
  });

  it("registers a small, evidence-defined activity experiment set", () => {
    expect(activityExperimentRecords.map((record) => record.pattern)).toEqual(["compare", "evidence-reason", "target-challenge", "repair-debug"]);
    for (const record of activityExperimentRecords) {
      expect(record.learnerAction).toBeTruthy();
      expect(record.evidenceCollected).toBeTruthy();
      expect(record.decision).toBe("evaluate");
    }
    const repair = circuitLesson.activities.find((activity) => activity.id === "c-repair")!;
    expect(repair.evidenceContract.reasonableInference).toContain("complete-path concept");
    expect(repair.evidenceContract.excludedInference).toContain("Does not prove");
  });

  it("keeps comparison targeted and does not overload the default Understand route", () => {
    const understand = activityPath(circuitLesson, "understand", "learn").map((activity) => activity.id);
    expect(understand).not.toContain("c-compare");
    expect(understand).not.toContain("c-repair");
    expect(understand).toHaveLength(5);
  });

  it("grows references according to purpose", () => {
    const lab = circuitLesson.activities.find((activity) => activity.id === "c-lab")!;
    const result: EvidenceEvent = { activityId: lab.id, conceptIds: lab.conceptIds, channel: "natural", result: "strong", attempts: 1, guidanceLevel: 0, detail: "Built pattern" };
    expect(referenceContributionsForOutcome(lab, result, "curious", "quick").map((entry) => entry.id)).toEqual(["ref-resistance"]);
    expect(referenceContributionsForOutcome(lab, result, "understand", "learn")).toHaveLength(3);
    expect(referenceContributionsForOutcome(lab, result, "revise", "learn").map((entry) => entry.kind)).toEqual(["evidence"]);
    expect(referenceContributionsForOutcome(lab, result, "revise", "learn", true)).toHaveLength(3);
  });

  it("organizes the living reference by knowledge rather than discovery order", () => {
    const close = circuitLesson.activities.find((activity) => activity.id === "c-close")!;
    const voltage = circuitLesson.activities.find((activity) => activity.id === "c-voltage")!;
    const closeEvidence: EvidenceEvent = { activityId: close.id, conceptIds: close.conceptIds, channel: "natural", result: "supported", attempts: 1, guidanceLevel: 0, detail: "Closed the switch and observed current." };
    const voltageEvidence: EvidenceEvent = { activityId: voltage.id, conceptIds: voltage.conceptIds, channel: "natural", result: "supported", attempts: 1, guidanceLevel: 0, detail: "Compared two battery voltages." };
    const scene: SceneState = {
      circuits: { closed: true, voltage: 12, resistance: 4, measurements: [], voltageObservations: [9, 12], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 },
      history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 },
    };
    const first = addReferenceKnowledge({ reference: emptyLivingReference(circuitLesson), lesson: circuitLesson, activity: voltage, event: voltageEvidence, goal: "understand", depth: "learn", scene });
    const second = addReferenceKnowledge({ reference: first.reference, lesson: circuitLesson, activity: close, event: closeEvidence, goal: "understand", depth: "learn", scene });
    expect(second.reference.sections.map((section) => section.id)).toEqual(["complete-circuit", "current", "voltage"]);
    expect(second.updatedSectionIds).toEqual(["complete-circuit", "current"]);
    expect(second.reference.sections.find((section) => section.id === "complete-circuit")?.referenceState).toBe("explored");
    expect(second.reference.sections.find((section) => section.id === "voltage")?.learnerEvidence[0].measurements).toEqual([
      { input: "9 V · 4 Ω", output: "2.25 A" },
      { input: "12 V · 4 Ω", output: "3.00 A" },
    ]);
  });

  it("keeps canonical knowledge, learner evidence, and understanding state separate", () => {
    const lab = circuitLesson.activities.find((activity) => activity.id === "c-lab")!;
    const result: EvidenceEvent = { activityId: lab.id, conceptIds: lab.conceptIds, channel: "natural", result: "strong", attempts: 1, guidanceLevel: 0, detail: "Generated four measurements." };
    const scene: SceneState = {
      circuits: { closed: true, voltage: 9, resistance: 12, measurements: [3, 6, 9, 12], voltageObservations: [], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 },
      history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 },
    };
    const update = addReferenceKnowledge({ reference: emptyLivingReference(circuitLesson), lesson: circuitLesson, activity: lab, event: result, goal: "understand", depth: "learn", scene });
    const relationship = update.reference.sections.find((section) => section.id === "relationships")!;
    expect(relationship.canonicalKnowledge.some((item) => item.kind === "relationship")).toBe(true);
    expect(relationship.learnerEvidence[0].measurements).toHaveLength(4);
    expect(relationship.referenceState).toBe("established");
    expect(relationship).not.toHaveProperty("mastery");
  });

  it("keeps Curious reference lighter and locks Test reference until evidence is committed", () => {
    const lab = circuitLesson.activities.find((activity) => activity.id === "c-lab")!;
    const prediction = circuitLesson.activities.find((activity) => activity.id === "c-predict")!;
    const result: EvidenceEvent = { activityId: lab.id, conceptIds: lab.conceptIds, channel: "natural", result: "strong", attempts: 1, guidanceLevel: 0, detail: "Built the relationship." };
    const scene: SceneState = {
      circuits: { closed: true, voltage: 9, resistance: 9, measurements: [3, 9], voltageObservations: [], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 },
      history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 },
    };
    const curious = addReferenceKnowledge({ reference: emptyLivingReference(circuitLesson), lesson: circuitLesson, activity: lab, event: result, goal: "curious", depth: "quick", scene });
    const understand = addReferenceKnowledge({ reference: emptyLivingReference(circuitLesson), lesson: circuitLesson, activity: lab, event: result, goal: "understand", depth: "learn", scene });
    expect(curious.reference.sections.map((section) => section.id)).toEqual(["resistance"]);
    expect(understand.reference.sections.map((section) => section.id)).toEqual(["resistance", "relationships"]);
    expect(referenceAvailable("test", prediction, [])).toBe(false);
    expect(referenceAvailable("test", prediction, [{ ...result, activityId: prediction.id }])).toBe(true);
  });

  it("grounds every canonical reference contribution in registered trusted knowledge", () => {
    for (const lesson of goldLessons) for (const activity of lesson.activities) for (const contribution of activity.referenceContributions) {
      expect(validateReferenceContribution(lesson, contribution)).toEqual([]);
    }
  });

  it("uses one registered runtime state for instruction, rendering, and calculation", () => {
    const voltage = circuitLesson.activities.find((activity) => activity.id === "c-voltage")!;
    const staleScene: SceneState = {
      circuits: { closed: true, voltage: 9, resistance: 9, measurements: [3, 9], voltageObservations: [], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 },
      history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 },
    };
    const resolved = sceneForActivity(staleScene, voltage);
    expect(resolved.circuits.resistance).toBe(4);
    expect(resolved.circuits.voltage / resolved.circuits.resistance).toBe(2.25);
    expect(circuitRuntimeIssues(voltage)).toEqual([]);
  });

  it("withholds answer-like evidence until a prediction is committed", () => {
    const prediction = circuitLesson.activities.find((activity) => activity.id === "c-predict")!;
    expect(learnerEvidenceVisible(prediction, false)).toBe(false);
    expect(learnerEvidenceVisible(prediction, true)).toBe(true);
    expect(circuitRuntimeIssues(prediction)).toEqual([]);
    const beforeCommit: SceneState = {
      circuits: { closed: true, voltage: 12, resistance: 9, measurements: [3, 6, 9], voltageObservations: [9, 12], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 },
      history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 },
    };
    expect(sceneForActivity(beforeCommit, prediction).circuits).toMatchObject({ voltage: 9, resistance: 4 });
    const afterTest = { ...beforeCommit, circuits: { ...beforeCommit.circuits, resistance: 9, assessmentEvidenceRevealed: true } };
    expect(sceneForActivity(afterTest, prediction).circuits).toMatchObject({ voltage: 9, resistance: 9 });
  });
});
