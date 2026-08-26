import { MORE_RESISTANCE_MORE_CURRENT, OBJECTIVES } from "./curriculum";
import type { TextbookBlockId } from "./sourceLesson";

export type WorkspaceBlockId =
  | "predict-resistance-change"
  | "manipulate-resistance"
  | "generate-current-graph"
  | "compare-current-paths"
  | "guided-resistance-retry"
  | "formula-from-measurements"
  | "reach-target-current"
  | "design-transfer-circuit";

export type WorkspaceBlock = {
  id: WorkspaceBlockId;
  title: string;
  shortPrompt: string;
  objectiveIds: string[];
  sourceBlockIds: TextbookBlockId[];
  interactionType: string;
  estimatedMinutes: number;
  misconceptionsAddressed: string[];
  role: "evidence" | "explore" | "represent" | "support" | "apply" | "transfer";
};

export const workspaceBlockCatalog: WorkspaceBlock[] = [
  {
    id: "predict-resistance-change",
    title: "Predict the change",
    shortPrompt: "Increase resistance. What will current do?",
    objectiveIds: [OBJECTIVES.resistance],
    sourceBlockIds: ["relationship-comparison", "prediction-question"],
    interactionType: "prediction-overlay",
    estimatedMinutes: 1,
    misconceptionsAddressed: [MORE_RESISTANCE_MORE_CURRENT],
    role: "evidence",
  },
  {
    id: "manipulate-resistance",
    title: "Change the resistor",
    shortPrompt: "Move the control and watch the circuit respond.",
    objectiveIds: [OBJECTIVES.resistance],
    sourceBlockIds: ["circuit-figure", "concept-current", "concept-resistance", "relationship-comparison"],
    interactionType: "attached-resistance-control",
    estimatedMinutes: 2,
    misconceptionsAddressed: [MORE_RESISTANCE_MORE_CURRENT],
    role: "explore",
  },
  {
    id: "generate-current-graph",
    title: "Build the pattern",
    shortPrompt: "Test three resistors to create the graph.",
    objectiveIds: [OBJECTIVES.graph],
    sourceBlockIds: ["relationship-comparison", "static-graph"],
    interactionType: "experiment-generated-graph",
    estimatedMinutes: 2,
    misconceptionsAddressed: [MORE_RESISTANCE_MORE_CURRENT],
    role: "represent",
  },
  {
    id: "compare-current-paths",
    title: "Compare two paths",
    shortPrompt: "Same battery. Different resistance.",
    objectiveIds: [OBJECTIVES.resistance],
    sourceBlockIds: ["concept-resistance", "relationship-comparison"],
    interactionType: "parallel-circuit-comparison",
    estimatedMinutes: 1,
    misconceptionsAddressed: [MORE_RESISTANCE_MORE_CURRENT],
    role: "support",
  },
  {
    id: "guided-resistance-retry",
    title: "Try the idea again",
    shortPrompt: "Use the circuit, then make the prediction again.",
    objectiveIds: [OBJECTIVES.resistance],
    sourceBlockIds: ["circuit-figure", "relationship-comparison", "prediction-question"],
    interactionType: "guided-predict-and-test",
    estimatedMinutes: 2,
    misconceptionsAddressed: [MORE_RESISTANCE_MORE_CURRENT],
    role: "support",
  },
  {
    id: "formula-from-measurements",
    title: "Name what you observed",
    shortPrompt: "Connect your measurements to Ohm's law.",
    objectiveIds: [OBJECTIVES.graph],
    sourceBlockIds: ["ohms-law", "worked-example"],
    interactionType: "symbolic-reveal-from-results",
    estimatedMinutes: 1,
    misconceptionsAddressed: [],
    role: "represent",
  },
  {
    id: "reach-target-current",
    title: "Reach 1.5 A",
    shortPrompt: "Choose the resistor that produces the target current.",
    objectiveIds: [OBJECTIVES.target],
    sourceBlockIds: ["circuit-figure", "ohms-law", "worked-example"],
    interactionType: "target-current-manipulation",
    estimatedMinutes: 2,
    misconceptionsAddressed: [],
    role: "apply",
  },
  {
    id: "design-transfer-circuit",
    title: "Design a new circuit",
    shortPrompt: "Transfer the relationship to a 12 V circuit.",
    objectiveIds: [OBJECTIVES.design],
    sourceBlockIds: ["circuit-figure", "ohms-law"],
    interactionType: "new-circuit-design",
    estimatedMinutes: 2,
    misconceptionsAddressed: [],
    role: "transfer",
  },
];

export const workspaceBlockCatalogById = new Map(
  workspaceBlockCatalog.map((block) => [block.id, block]),
);
