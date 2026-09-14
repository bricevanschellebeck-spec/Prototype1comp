import type { CircuitKnowledgePackage } from "./types";

export const circuitKnowledge: CircuitKnowledgePackage = {
  id: "circuits-resistance-approved-v1",
  source: {
    title: "How resistance changes current",
    subject: "physics",
    sections: [
      { id: "circuit-system", heading: "A complete circuit", text: "A closed circuit provides a complete path for electric charge. The battery supplies voltage, current moves through the path, and the resistor opposes that movement." },
      { id: "fixed-voltage", heading: "Changing resistance", text: "When voltage stays fixed, increasing resistance decreases current. Lower resistance allows more current to flow." },
      { id: "ohms-law", heading: "Ohm's law", text: "Current equals voltage divided by resistance. The relationship is written I = V ÷ R, with current in amperes, voltage in volts, and resistance in ohms." },
    ],
    pages: [
      { id: "source-title", page: 1, kind: "title", title: "How resistance changes current", body: "One circuit. Three quantities. A relationship you can test.", factIds: ["fact-closed-path"] },
      { id: "source-circuit", page: 1, kind: "diagram", title: "A complete circuit", body: "Battery → resistor → lamp → battery", factIds: ["fact-closed-path", "fact-voltage", "fact-current", "fact-resistance"] },
      { id: "source-voltage", page: 1, kind: "definition", title: "Voltage", body: "The electrical push supplied by the battery.", factIds: ["fact-voltage"] },
      { id: "source-current", page: 1, kind: "definition", title: "Current", body: "Charge passing a point each second.", factIds: ["fact-current"] },
      { id: "source-resistance", page: 1, kind: "definition", title: "Resistance", body: "Opposition to the movement of charge.", factIds: ["fact-resistance"] },
      { id: "source-pattern", page: 1, kind: "relationship", title: "The fixed-voltage pattern", body: "More resistance → less current", factIds: ["fact-fixed-voltage"] },
      { id: "source-formula", page: 2, kind: "formula", title: "Ohm's law", body: "I = V ÷ R", factIds: ["fact-ohms-law", "fact-units"] },
      { id: "source-example", page: 2, kind: "example", title: "One example", body: "9 V ÷ 6 Ω = 1.5 A", factIds: ["fact-ohms-law", "fact-units"] },
      { id: "source-question", page: 2, kind: "question", title: "Think", body: "If resistance rises while voltage stays fixed, what happens to current?", factIds: ["fact-fixed-voltage"] },
    ],
  },
  concepts: [
    { id: "concept-closed-path", name: "closed circuit" }, { id: "concept-voltage", name: "voltage" }, { id: "concept-current", name: "current" }, { id: "concept-resistance", name: "resistance" }, { id: "concept-ohms-law", name: "Ohm's law" },
  ],
  facts: [
    { id: "fact-closed-path", statement: "A closed circuit provides a complete path for electric charge.", sectionId: "circuit-system", quote: "A closed circuit provides a complete path for electric charge." },
    { id: "fact-voltage", statement: "The battery supplies voltage.", sectionId: "circuit-system", quote: "The battery supplies voltage" },
    { id: "fact-current", statement: "Current moves through a complete circuit path.", sectionId: "circuit-system", quote: "current moves through the path" },
    { id: "fact-resistance", statement: "A resistor opposes the movement of charge.", sectionId: "circuit-system", quote: "the resistor opposes that movement" },
    { id: "fact-fixed-voltage", statement: "At fixed voltage, increasing resistance decreases current.", sectionId: "fixed-voltage", quote: "When voltage stays fixed, increasing resistance decreases current." },
    { id: "fact-ohms-law", statement: "Current equals voltage divided by resistance.", sectionId: "ohms-law", quote: "Current equals voltage divided by resistance." },
    { id: "fact-units", statement: "Current is measured in amperes, voltage in volts, and resistance in ohms.", sectionId: "ohms-law", quote: "with current in amperes, voltage in volts, and resistance in ohms." },
  ],
  relationships: [
    { id: "relationship-resistance-current", fromConceptId: "concept-resistance", type: "decreases", toConceptId: "concept-current", heldConstantVariableIds: ["voltage"], supportingFactIds: ["fact-fixed-voltage"] },
    { id: "relationship-voltage-current", fromConceptId: "concept-voltage", type: "increases", toConceptId: "concept-current", heldConstantVariableIds: ["resistance"], supportingFactIds: ["fact-ohms-law"] },
    { id: "relationship-ohms-law", fromConceptId: "concept-current", type: "depends-on", toConceptId: "concept-ohms-law", heldConstantVariableIds: [], supportingFactIds: ["fact-ohms-law", "fact-units"] },
    { id: "relationship-path-current", fromConceptId: "concept-current", type: "requires", toConceptId: "concept-closed-path", heldConstantVariableIds: [], supportingFactIds: ["fact-closed-path", "fact-current"] },
  ],
  objectives: [
    { id: "objective-predict", statement: "Predict how current changes when resistance changes at fixed voltage.", supportingFactIds: ["fact-fixed-voltage"] },
    { id: "objective-explain", statement: "Connect circuit observations to Ohm's law.", supportingFactIds: ["fact-fixed-voltage", "fact-ohms-law", "fact-units"] },
    { id: "objective-apply", statement: "Use Ohm's law to choose a resistance or current in a new circuit.", supportingFactIds: ["fact-ohms-law", "fact-units"] },
  ],
  misconceptions: [{ id: "misconception-more-resistance-more-current", description: "More resistance produces more current at fixed voltage.", objectiveIds: ["objective-predict", "objective-explain"] }],
  variables: [
    { id: "voltage", label: "Voltage", symbol: "V", unit: "V" }, { id: "resistance", label: "Resistance", symbol: "R", unit: "Ω" }, { id: "current", label: "Current", symbol: "I", unit: "A" },
  ],
  values: [
    { id: "voltage-9", variableId: "voltage", value: 9 }, { id: "voltage-12", variableId: "voltage", value: 12 },
    { id: "resistance-3", variableId: "resistance", value: 3 }, { id: "resistance-4", variableId: "resistance", value: 4 }, { id: "resistance-6", variableId: "resistance", value: 6 }, { id: "resistance-8", variableId: "resistance", value: 8 }, { id: "resistance-9", variableId: "resistance", value: 9 }, { id: "resistance-12", variableId: "resistance", value: 12 },
    { id: "current-1", variableId: "current", value: 1 }, { id: "current-1-5", variableId: "current", value: 1.5 }, { id: "current-2", variableId: "current", value: 2 }, { id: "current-2-25", variableId: "current", value: 2.25 }, { id: "current-3", variableId: "current", value: 3 },
  ],
  derivations: [
    { id: "ohms-law-current", outputVariableId: "current", inputVariableIds: ["voltage", "resistance"], operator: "divide" },
    { id: "ohms-law-resistance", outputVariableId: "resistance", inputVariableIds: ["voltage", "current"], operator: "divide" },
  ],
  scenes: [{ id: "circuit-loop-v1", supportedConceptIds: ["concept-closed-path", "concept-voltage", "concept-current", "concept-resistance"], supportedVariableIds: ["voltage", "resistance", "current"] }],
};

export function valueById(id: string) { return circuitKnowledge.values.find((item) => item.id === id); }
export function deriveValue(ruleId: string, valueIds: string[]) {
  const rule = circuitKnowledge.derivations.find((item) => item.id === ruleId);
  if (!rule) return undefined;
  const bindings = new Map(valueIds.map((id) => valueById(id)).filter(Boolean).map((item) => [item!.variableId, item!.value]));
  const inputs = rule.inputVariableIds.map((id) => bindings.get(id));
  if (inputs.some((value) => value === undefined)) return undefined;
  return rule.operator === "divide" ? inputs[0]! / inputs[1]! : undefined;
}
