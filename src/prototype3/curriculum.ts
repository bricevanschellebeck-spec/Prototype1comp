export const P2_TOPIC_ID = "basic-electric-circuits-adaptive";

export const OBJECTIVES = {
  circuit: "complete-a-closed-circuit",
  voltage: "identify-voltage-as-the-source-of-push",
  resistance: "predict-current-when-resistance-changes",
  graph: "interpret-the-current-resistance-pattern",
  target: "choose-resistance-for-a-target-current",
  design: "transfer-the-relationship-to-a-new-circuit",
} as const;

export const OBJECTIVE_ORDER = [
  OBJECTIVES.circuit,
  OBJECTIVES.voltage,
  OBJECTIVES.resistance,
  OBJECTIVES.graph,
  OBJECTIVES.target,
  OBJECTIVES.design,
] as const;

export const OBJECTIVE_LABELS: Record<string, string> = {
  [OBJECTIVES.circuit]: "Complete path",
  [OBJECTIVES.voltage]: "Voltage supplies the push",
  [OBJECTIVES.resistance]: "Resistance changes current",
  [OBJECTIVES.graph]: "Read the relationship",
  [OBJECTIVES.target]: "Apply the relationship",
  [OBJECTIVES.design]: "Transfer to a new circuit",
};

export const MORE_RESISTANCE_MORE_CURRENT =
  "more-resistance-means-more-current";
