export const OHMS_LAW_TOPIC_ID = "ohms-law-resistance";
export const RESISTANCE_OBJECTIVE_ID = "predict-current-from-resistance";

export const topicSpec = {
  id: OHMS_LAW_TOPIC_ID,
  title: "How resistance changes current",
  essentialQuestion:
    "When voltage stays constant, what happens to current as resistance changes?",
  objectiveIds: [RESISTANCE_OBJECTIVE_ID],
  prerequisites: [
    "Recognize a complete circuit",
    "Understand that current describes the flow of electric charge",
  ],
  masteryEvidence: [
    "Predicts the direction of current change",
    "Connects the prediction to I = V / R",
    "Applies the relationship in a new circuit",
  ],
  commonMisconceptions: [
    {
      id: "more-resistance-means-more-current",
      label: "Increasing resistance increases current",
    },
  ],
} as const;
