import type { LearningBlock } from "../domain/contracts";
import {
  RESISTANCE_OBJECTIVE_ID,
} from "./curriculum";

export const blockCatalog: LearningBlock[] = [
  {
    id: "ohms-law-relationship-diagram",
    title: "Simpler visual explanation",
    componentType: "diagram",
    objectiveIds: [RESISTANCE_OBJECTIVE_ID],
    prerequisiteObjectiveIds: [],
    difficulty: 1,
    purpose: "introduce",
    interactionType: "inspect",
    modality: ["visual", "text"],
    estimatedMinutes: 1,
    misconceptionsAddressed: [],
    resourceIds: ["teacher-verified-ohms-law-diagram-v1"],
    accessibilityFeatures: ["text-equivalent", "high-contrast"],
    content: {
      kind: "diagram",
      heading: "Voltage pushes. Resistance opposes. Current responds.",
      body:
        "With voltage fixed, increasing resistance reduces current. The relationship is I = V / R.",
    },
  },
  {
    id: "resistance-slider-simulation",
    title: "Run the experiment",
    componentType: "simulation",
    objectiveIds: [RESISTANCE_OBJECTIVE_ID],
    prerequisiteObjectiveIds: [],
    difficulty: 1,
    purpose: "explore",
    interactionType: "slider-experiment",
    modality: ["interactive", "visual", "numerical"],
    estimatedMinutes: 3,
    misconceptionsAddressed: ["more-resistance-means-more-current"],
    resourceIds: ["verified-fixed-voltage-circuit-model-v1"],
    accessibilityFeatures: ["keyboard-slider", "live-value-text"],
    content: {
      kind: "simulation",
      heading: "Try changing resistance",
      instructions:
        "Predict first, then move the resistance slider and watch the current respond.",
      fixedVoltage: 9,
      resistanceRange: [1, 20],
      initialResistance: 4,
    },
  },
  {
    id: "resistance-prediction-question",
    title: "Prediction checkpoint",
    componentType: "question",
    objectiveIds: [RESISTANCE_OBJECTIVE_ID],
    prerequisiteObjectiveIds: [],
    difficulty: 1,
    purpose: "check",
    interactionType: "multiple-choice",
    modality: ["text", "prediction"],
    estimatedMinutes: 1,
    misconceptionsAddressed: ["more-resistance-means-more-current"],
    resourceIds: ["teacher-verified-prediction-question-v1"],
    accessibilityFeatures: ["keyboard-options", "screen-reader-feedback"],
    content: {
      kind: "question",
      heading: "What if resistance doubles?",
      prompt:
        "A circuit stays at 9 V. Its resistance changes from 4 Ω to 8 Ω. What happens to current?",
      options: [
        "Current increases",
        "Current decreases",
        "Current stays the same",
      ],
      correctIndex: 1,
      feedback:
        "At fixed voltage, current and resistance move in opposite directions because I = V / R.",
    },
  },
  {
    id: "current-resistance-graph",
    title: "See it another way",
    componentType: "graph",
    objectiveIds: [RESISTANCE_OBJECTIVE_ID],
    prerequisiteObjectiveIds: [],
    difficulty: 2,
    purpose: "apply",
    interactionType: "graph-inspection",
    modality: ["visual", "numerical"],
    estimatedMinutes: 2,
    misconceptionsAddressed: [],
    resourceIds: ["verified-ohms-law-data-v1"],
    accessibilityFeatures: ["data-table-equivalent", "high-contrast"],
    content: {
      kind: "graph",
      heading: "Current falls along a curve",
      body:
        "The current falls quickly at first, then more gradually as resistance increases.",
      fixedVoltage: 9,
      resistanceValues: [1, 2, 3, 5, 9, 12, 18],
    },
  },
  {
    id: "resistance-final-challenge",
    title: "Design for the target current",
    componentType: "challenge",
    objectiveIds: [RESISTANCE_OBJECTIVE_ID],
    prerequisiteObjectiveIds: [],
    difficulty: 2,
    purpose: "apply",
    interactionType: "single-choice-design",
    modality: ["problem-solving", "numerical"],
    estimatedMinutes: 2,
    misconceptionsAddressed: [],
    resourceIds: ["teacher-verified-design-challenge-v1"],
    accessibilityFeatures: ["keyboard-options", "text-feedback"],
    content: {
      kind: "challenge",
      heading: "Build a 1.5 A circuit",
      prompt:
        "The battery supplies 9 V. Which resistor produces a current of 1.5 A?",
      targetCurrent: 1.5,
      voltage: 9,
      resistanceOptions: [3, 6, 9, 12],
    },
  },
];

export const blockCatalogById = new Map(
  blockCatalog.map((block) => [block.id, block]),
);
