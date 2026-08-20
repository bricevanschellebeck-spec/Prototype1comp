export const OHMS_LAW_TOPIC_ID = "basic-electric-circuits";
export const CIRCUIT_FOUNDATION_OBJECTIVE_ID = "explain-a-complete-circuit";
export const RESISTANCE_OBJECTIVE_ID = "predict-current-from-resistance";

export const topicSpec = {
  id: OHMS_LAW_TOPIC_ID,
  title: "How an electric circuit works",
  essentialQuestion:
    "What makes current flow, and how does resistance change it?",
  objectiveIds: [CIRCUIT_FOUNDATION_OBJECTIVE_ID, RESISTANCE_OBJECTIVE_ID],
  prerequisites: [],
  masteryEvidence: [
    "Explains why a circuit needs a complete path",
    "Distinguishes voltage, current, and resistance",
    "Predicts the direction of current change",
    "Connects an observed relationship to I = V / R",
    "Applies the relationship in a new circuit",
  ],
  commonMisconceptions: [
    {
      id: "more-resistance-means-more-current",
      label: "Increasing resistance increases current",
    },
  ],
} as const;
