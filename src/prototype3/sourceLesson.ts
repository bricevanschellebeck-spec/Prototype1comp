import { OBJECTIVES } from "./curriculum";

export const P3_SOURCE_LESSON_ID = "resistance-current-textbook-v1" as const;

export type TrustedFact = {
  id: string;
  label: string;
  statement: string;
};

export const resistanceSourceLesson = {
  id: P3_SOURCE_LESSON_ID,
  title: "How resistance affects current",
  subtitle: "A conventional textbook explanation",
  objectiveIds: [OBJECTIVES.resistance],
  facts: [
    {
      id: "fact-closed-path",
      label: "Complete circuit",
      statement: "Electric current requires a closed path through the circuit.",
    },
    {
      id: "fact-voltage-push",
      label: "Voltage",
      statement: "Voltage is the electrical potential difference supplied by the battery.",
    },
    {
      id: "fact-current-flow",
      label: "Current",
      statement: "Current measures how much electric charge passes a point each second.",
    },
    {
      id: "fact-resistance-opposes",
      label: "Resistance",
      statement: "Resistance opposes the movement of charge through a component.",
    },
    {
      id: "fact-fixed-voltage-relationship",
      label: "Relationship",
      statement: "When voltage is fixed, increasing resistance decreases current.",
    },
    {
      id: "fact-ohms-law",
      label: "Ohm's law",
      statement: "Current equals voltage divided by resistance: I = V / R.",
    },
    {
      id: "fact-worked-example",
      label: "Worked example",
      statement: "A 9 V battery across a 6 ohm resistor produces 1.5 A of current.",
    },
  ] satisfies TrustedFact[],
  questions: [
    "If resistance doubles while voltage stays fixed, what happens to current?",
    "Which resistor produces 1.5 A of current from a 9 V battery?",
  ],
} as const;

export const trustedFactIds = new Set(
  resistanceSourceLesson.facts.map((fact) => fact.id),
);

