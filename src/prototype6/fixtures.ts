import type { LearningExperienceBlueprint, P6DesignRequest } from "./types";

const grounded = (text: string, factIds: string[], relationshipIds: string[] = []) => ({ text, supportingFactIds: factIds, supportingRelationshipIds: relationshipIds });

/** Human-authored evaluator fixture. It is never used as a runtime lesson fallback. */
export function fixtureBlueprint(request: P6DesignRequest): LearningExperienceBlueprint {
  const fiveMinute = request.depthMinutes === 5;
  const formalStage = request.goal === "explore" ? "observe-pattern" : request.goal === "revise" ? "worked-recall" : "reveal-pattern";
  const formalPrimitive = request.goal === "revise"
    ? { kind: "worked-example" as const, derivationRuleId: "ohms-law-current", inputValueIds: ["voltage-9", "resistance-6"], requestedPrecision: 1 as const, revealOrder: "inputs-then-operation-then-result" as const }
    : request.goal === "explore"
      ? { kind: "observation" as const, sceneId: "circuit-loop-v1" as const, highlightConceptIds: ["concept-resistance", "concept-current"] }
      : { kind: "evidence-reveal" as const, factIds: ["fact-fixed-voltage", "fact-ohms-law"] };
  const stages: LearningExperienceBlueprint["stages"] = [
    {
      stageId: "predict-change", objectiveIds: ["objective-predict"], role: "evidence", availability: "core", prerequisiteStageIds: [], addressesMisconceptionIds: ["misconception-more-resistance-more-current"],
      primitive: { kind: "prediction", relationshipId: "relationship-resistance-current", scenarioValueIds: ["voltage-9", "resistance-4", "resistance-8"], answerStrategy: "derive-relationship-direction" },
      copy: { title: grounded("Predict the change", ["fact-fixed-voltage"], ["relationship-resistance-current"]), instruction: grounded("The battery stays at 9 V. What happens to current when resistance rises?", ["fact-fixed-voltage"], ["relationship-resistance-current"]), correctFeedback: grounded("Yes. With voltage fixed, more resistance means less current.", ["fact-fixed-voltage"], ["relationship-resistance-current"]), incorrectFeedback: grounded("Keep the battery fixed and compare the current again.", ["fact-fixed-voltage"], ["relationship-resistance-current"]) },
      sourceFactIds: ["fact-fixed-voltage"], sourceRelationshipIds: ["relationship-resistance-current"], estimatedMinutes: 1, representationReason: "existing-model-should-be-elicited", transitionReason: "collect-prior-evidence",
    },
    {
      stageId: "change-resistance", objectiveIds: ["objective-predict", "objective-explain"], role: "explore", availability: "core", prerequisiteStageIds: ["predict-change"], addressesMisconceptionIds: [],
      primitive: { kind: "parameter-experiment", sceneId: "circuit-loop-v1", controlVariableId: "resistance", observedVariableId: "current", fixedBindings: [{ variableId: "voltage", valueId: "voltage-9" }], selectableValueIds: ["resistance-3", "resistance-6", "resistance-9"], derivationRuleId: "ohms-law-current", minimumComparisons: 2 },
      copy: { title: grounded("Change the resistance", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), instruction: grounded("Keep 9 V fixed. Try two resistance values and watch current respond.", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), explanation: grounded("Current falls as resistance rises because current equals voltage divided by resistance.", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]) },
      sourceFactIds: ["fact-fixed-voltage", "fact-ohms-law"], sourceRelationshipIds: ["relationship-resistance-current"], estimatedMinutes: 2, representationReason: "causal-change-best-manipulated", transitionReason: "test-prediction",
    },
    {
      stageId: formalStage, objectiveIds: ["objective-explain"], role: request.goal === "explore" ? "represent" : "explain", availability: fiveMinute ? "extension" : "core", prerequisiteStageIds: ["change-resistance"], addressesMisconceptionIds: [], primitive: formalPrimitive,
      copy: { title: grounded(request.goal === "revise" ? "Rebuild the calculation" : "Name the pattern", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), instruction: grounded(request.goal === "revise" ? "Use the approved circuit values to reveal the calculation." : "Connect what the circuit showed to the relationship.", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), explanation: grounded("Ohm's law names the pattern: current equals voltage divided by resistance.", ["fact-ohms-law"], ["relationship-ohms-law"]) },
      sourceFactIds: ["fact-fixed-voltage", "fact-ohms-law"], sourceRelationshipIds: ["relationship-resistance-current", "relationship-ohms-law"], estimatedMinutes: 2, representationReason: request.goal === "explore" ? "spatial-system-best-seen" : "formal-language-after-evidence", transitionReason: "name-observed-pattern",
    },
    {
      stageId: "compare-support", objectiveIds: ["objective-predict"], role: "support", availability: "support-only", prerequisiteStageIds: ["predict-change"], addressesMisconceptionIds: ["misconception-more-resistance-more-current"],
      primitive: { kind: "comparison", caseBindings: [{ label: "Lower resistance", valueIds: ["voltage-9", "resistance-3"] }, { label: "Higher resistance", valueIds: ["voltage-9", "resistance-9"] }], observedVariableIds: ["current"], derivationRuleId: "ohms-law-current" },
      copy: { title: grounded("Compare two circuits", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), instruction: grounded("Both batteries are 9 V. Compare only resistance and current.", ["fact-fixed-voltage", "fact-ohms-law"], ["relationship-resistance-current"]), explanation: grounded("The circuit with more resistance has less current.", ["fact-fixed-voltage"], ["relationship-resistance-current"]) },
      sourceFactIds: ["fact-fixed-voltage", "fact-ohms-law"], sourceRelationshipIds: ["relationship-resistance-current"], estimatedMinutes: 1, representationReason: "contrast-reduces-misconception", transitionReason: "respond-to-misconception",
    },
    {
      stageId: "reach-current", objectiveIds: ["objective-apply", "objective-explain"], role: request.goal === "test" ? "transfer" : "apply", availability: "core", prerequisiteStageIds: fiveMinute ? ["change-resistance"] : [formalStage], addressesMisconceptionIds: [],
      primitive: request.goal === "test" ? { kind: "transfer-challenge", derivationRuleId: "ohms-law-current", inputValueIds: ["voltage-12", "resistance-6"], targetVariableId: "current" } : { kind: "target-challenge", derivationRuleId: "ohms-law-current", inputValueIds: ["voltage-9", "resistance-6"], targetVariableId: "current" },
      copy: { title: grounded(request.goal === "test" ? "Transfer to a new circuit" : "Reach the target", ["fact-ohms-law", "fact-units"], ["relationship-ohms-law"]), instruction: grounded(request.goal === "test" ? "Use a 12 V battery and 6 Ω resistor. Choose the resulting current." : "Use a 9 V battery and 6 Ω resistor. Choose the resulting current.", ["fact-ohms-law", "fact-units"], ["relationship-ohms-law"]), correctFeedback: grounded("The current follows directly from voltage divided by resistance.", ["fact-ohms-law"], ["relationship-ohms-law"]), incorrectFeedback: grounded("Divide the battery voltage by the resistance, then try again.", ["fact-ohms-law"], ["relationship-ohms-law"]) },
      sourceFactIds: ["fact-ohms-law", "fact-units"], sourceRelationshipIds: ["relationship-ohms-law"], estimatedMinutes: 2, representationReason: request.goal === "test" ? "transfer-tests-generalization" : "application-confirms-understanding", transitionReason: "confirm-transfer",
    },
  ];
  const initialSequenceStageIds = fiveMinute ? ["predict-change", "change-resistance", "reach-current"] : ["predict-change", "change-resistance", formalStage, "reach-current"];
  return {
    schemaVersion: "p6-experience-blueprint-1", sourcePackageId: "circuits-resistance-approved-v1", designProfile: { goal: request.goal, depthMinutes: request.depthMinutes, learnerLevel: request.learnerLevel },
    lessonTitle: grounded("How resistance changes current", ["fact-fixed-voltage"], ["relationship-resistance-current"]), objectiveIds: ["objective-predict", "objective-explain", "objective-apply"], assumedPrerequisiteConceptIds: ["concept-closed-path"], persistentSceneId: "circuit-loop-v1", stages,
    initialSequenceStageIds, finalApplicationStageId: "reach-current", representationGaps: [], designSummary: { delayedFactIds: ["fact-ohms-law"], omittedFactIds: [], reasonCodes: ["interaction-before-formal-language"] },
  };
}
