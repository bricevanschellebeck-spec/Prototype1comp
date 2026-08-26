import { OBJECTIVES } from "./curriculum";

export const P3_SOURCE_LESSON_ID = "resistance-current-textbook-v1" as const;

export type TextbookBlockId =
  | "circuit-figure"
  | "concept-voltage"
  | "concept-current"
  | "concept-resistance"
  | "relationship-comparison"
  | "ohms-law"
  | "worked-example"
  | "static-graph"
  | "prediction-question";

export type TrustedFact = {
  id: string;
  label: string;
  statement: string;
};

export type TextbookBlock = {
  id: TextbookBlockId;
  page: 1 | 2;
  order: number;
  factIds: string[];
  fixedDisplayValues: Record<string, string | number | number[]>;
};

export const resistanceSourceLesson = {
  id: P3_SOURCE_LESSON_ID,
  title: "How resistance affects current",
  subtitle: "A fixed, trusted textbook explanation",
  objectiveIds: [OBJECTIVES.resistance],
  facts: [
    { id: "fact-closed-path", label: "Complete circuit", statement: "Electric current requires a closed path through the circuit." },
    { id: "fact-voltage-push", label: "Voltage", statement: "Voltage is the electrical push supplied by the battery." },
    { id: "fact-current-flow", label: "Current", statement: "Current measures how much electric charge passes a point each second." },
    { id: "fact-resistance-opposes", label: "Resistance", statement: "Resistance opposes the movement of charge through a component." },
    { id: "fact-fixed-voltage-relationship", label: "Relationship", statement: "When voltage is fixed, increasing resistance decreases current." },
    { id: "fact-ohms-law", label: "Ohm's law", statement: "Current equals voltage divided by resistance: I = V / R." },
    { id: "fact-worked-example", label: "Worked example", statement: "A 9 V battery across a 6 ohm resistor produces 1.5 A of current." },
  ] satisfies TrustedFact[],
  blocks: [
    { id: "circuit-figure", page: 1, order: 1, factIds: ["fact-closed-path"], fixedDisplayValues: { voltage: 9, resistance: 4, lamp: "on" } },
    { id: "concept-voltage", page: 1, order: 2, factIds: ["fact-voltage-push"], fixedDisplayValues: { label: "Push from the battery." } },
    { id: "concept-current", page: 1, order: 3, factIds: ["fact-current-flow"], fixedDisplayValues: { label: "Charge moving each second." } },
    { id: "concept-resistance", page: 1, order: 4, factIds: ["fact-resistance-opposes"], fixedDisplayValues: { label: "Opposition to flow." } },
    { id: "relationship-comparison", page: 1, order: 5, factIds: ["fact-fixed-voltage-relationship"], fixedDisplayValues: { resistances: [4, 8], currents: [2.25, 1.13] } },
    { id: "ohms-law", page: 2, order: 1, factIds: ["fact-ohms-law"], fixedDisplayValues: { formula: "I = V ÷ R" } },
    { id: "static-graph", page: 2, order: 2, factIds: ["fact-fixed-voltage-relationship", "fact-ohms-law"], fixedDisplayValues: { voltage: 9, resistances: [3, 4, 6, 9, 12] } },
    { id: "worked-example", page: 2, order: 3, factIds: ["fact-worked-example"], fixedDisplayValues: { voltage: 9, resistance: 6, current: 1.5 } },
    {
      id: "prediction-question",
      page: 2,
      order: 4,
      factIds: ["fact-fixed-voltage-relationship"],
      fixedDisplayValues: { question: "If resistance doubles while voltage stays fixed, what happens to current?" },
    },
  ] satisfies TextbookBlock[],
} as const;

export const textbookBlockIds = new Set<TextbookBlockId>(
  resistanceSourceLesson.blocks.map((block) => block.id),
);

export const trustedFactIds = new Set(
  resistanceSourceLesson.facts.map((fact) => fact.id),
);

export function validateTextbookSource(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const block of resistanceSourceLesson.blocks) {
    if (ids.has(block.id)) errors.push(`Duplicate textbook block: ${block.id}`);
    ids.add(block.id);
    if (block.factIds.length === 0) errors.push(`Textbook block has no trusted fact: ${block.id}`);
    for (const factId of block.factIds) {
      if (!trustedFactIds.has(factId)) errors.push(`Unknown fact ${factId} on ${block.id}`);
    }
  }
  return errors;
}
