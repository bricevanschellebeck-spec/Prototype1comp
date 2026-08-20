import { blockCatalog } from "../data/blockCatalog";
import {
  OHMS_LAW_TOPIC_ID,
  RESISTANCE_OBJECTIVE_ID,
} from "../data/curriculum";
import type {
  BlueprintStep,
  CompositionRequest,
  LessonBlueprint,
  ReasonCode,
} from "../domain/contracts";

const evidenceByBlockId: Record<string, string> = {
  "complete-circuit-foundation":
    "Learner closes the gap and explains that current needs a complete path.",
  "battery-voltage-discovery":
    "Learner observes that a complete path still needs an electrical source.",
  "ohms-law-relationship-diagram":
    "Learner identifies the inverse resistance-current relationship.",
  "resistance-slider-simulation":
    "Learner observes current decreasing as resistance increases.",
  "resistance-prediction-question":
    "Learner predicts the direction of current change.",
  "current-resistance-graph":
    "Learner connects experimental values to the inverse curve.",
  "resistance-final-challenge":
    "Learner applies I = V / R to a new target-current problem.",
};

function reasonFor(blockId: string, shortLesson: boolean): ReasonCode {
  if (shortLesson && blockId === "ohms-law-relationship-diagram") {
    return "fit-short-lesson";
  }

  const reasons: Record<string, ReasonCode> = {
    "complete-circuit-foundation": "establish-conceptual-model",
    "battery-voltage-discovery": "establish-conceptual-model",
    "ohms-law-relationship-diagram": "establish-conceptual-model",
    "resistance-slider-simulation":
      "test-relationship-through-manipulation",
    "resistance-prediction-question":
      "check-concept-before-symbolic-work",
    "current-resistance-graph": "connect-observation-to-graph",
    "resistance-final-challenge": "demonstrate-independent-application",
  };
  return reasons[blockId];
}

export function composeLocally(request: CompositionRequest): LessonBlueprint {
  const availableIds = new Set(
    blockCatalog
      .filter(
        (block) => !request.constraints.unavailableBlockIds.includes(block.id),
      )
      .map((block) => block.id),
  );

  const shortLesson = request.constraints.targetMinutes <= 8;
  const misconceptionKnown = request.learnerSnapshot.knownMisconceptions.includes(
    "more-resistance-means-more-current",
  );
  let preferredIds: string[];
  preferredIds = [
    "complete-circuit-foundation",
    "battery-voltage-discovery",
    "resistance-slider-simulation",
    "current-resistance-graph",
    "resistance-final-challenge",
  ];

  let selectedIds = preferredIds
    .filter((blockId) => availableIds.has(blockId))
    .slice(0, request.constraints.maximumSteps);

  const completionId = "resistance-final-challenge";
  if (
    availableIds.has(completionId) &&
    !selectedIds.includes(completionId) &&
    request.constraints.maximumSteps > 1
  ) {
    selectedIds = selectedIds.slice(0, request.constraints.maximumSteps - 1);
    selectedIds.push(completionId);
  }

  const hasEntry = selectedIds.some((blockId) =>
    ["complete-circuit-foundation", "ohms-law-relationship-diagram", "resistance-slider-simulation"].includes(
      blockId,
    ),
  );
  if (!hasEntry && availableIds.has("ohms-law-relationship-diagram")) {
    selectedIds.unshift("ohms-law-relationship-diagram");
    selectedIds = selectedIds.slice(0, request.constraints.maximumSteps);
  }

  const steps: BlueprintStep[] = selectedIds.map((blockId, index) => {
    const block = blockCatalog.find((candidate) => candidate.id === blockId);
    if (!block) {
      throw new Error(`Local composer selected an unknown block: ${blockId}`);
    }

    return {
      stepId: `step-${index + 1}`,
      blockId,
      purpose: block.purpose,
      reasonCode:
        misconceptionKnown && blockId === "ohms-law-relationship-diagram"
          ? "address-known-misconception"
          : reasonFor(blockId, shortLesson),
      expectedEvidence: evidenceByBlockId[blockId],
    };
  });

  return {
    blueprintVersion: "1",
    topicId: request.topicId || OHMS_LAW_TOPIC_ID,
    objectiveIds:
      request.requiredObjectiveIds.length > 0
        ? request.requiredObjectiveIds
        : [RESISTANCE_OBJECTIVE_ID],
    steps,
    completionCheckBlockId: completionId,
  };
}
