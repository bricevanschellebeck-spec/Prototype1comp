import type { InteractiveBlock, LessonManifest, ReasonCode } from "./types";

const R = {
  elicit: "elicit-existing-model",
  manipulate: "test-through-manipulation",
  alternate: "offer-alternate-representation",
  misconception: "respond-to-misconception",
  retry: "provide-guided-retry",
  concept: "connect-evidence-to-concept",
  challenge: "increase-challenge",
  transfer: "confirm-transfer",
} as const satisfies Record<string, ReasonCode>;

const circuitObjectives = {
  resistance: "predict-current-when-resistance-changes",
  graph: "interpret-current-resistance-pattern",
  target: "choose-resistance-for-target-current",
  transfer: "transfer-resistance-relationship",
};
const circuitMisconception = "more-resistance-means-more-current";

const circuitBlocks: InteractiveBlock[] = [
  {
    id: "circuits.predict-resistance-change", title: "Predict the change", shortPrompt: "Resistance rises. What will current do?",
    primitiveId: "prediction", role: "evidence", interactionType: "prediction", objectiveIds: [circuitObjectives.resistance],
    sourceBlockIds: ["circuits.relationship", "circuits.question"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [circuitMisconception], possibleMisconceptionIds: [circuitMisconception], allowedReasonCodes: [R.elicit], defaultReasonCode: R.elicit,
    render: { kind: "prediction", prompt: "Increase the resistance while the battery stays at 9 V.", options: [{ id: "increase", label: "Increases", symbol: "↑" }, { id: "decrease", label: "Decreases", symbol: "↓" }, { id: "same", label: "Stays the same", symbol: "=" }], correctOptionId: "decrease", misconceptionByOption: { increase: circuitMisconception, same: circuitMisconception }, hint: "Only the opposition changes. The battery does not push harder." },
  },
  {
    id: "circuits.manipulate-resistance", title: "Change the resistor", shortPrompt: "Move one control. Watch the whole system respond.",
    primitiveId: "parameter-experiment", role: "explore", interactionType: "slider", objectiveIds: [circuitObjectives.resistance], sourceBlockIds: ["circuits.figure", "circuits.resistance", "circuits.relationship"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 1,
    misconceptionsAddressed: [circuitMisconception], possibleMisconceptionIds: [], allowedReasonCodes: [R.manipulate], defaultReasonCode: R.manipulate,
    render: { kind: "parameter-experiment", prompt: "Move the resistor far enough to compare two current values.", controlKey: "resistance", label: "Resistance", unit: "Ω", min: 3, max: 12, step: 1, initial: 4, requiredDelta: 2, observationTemplate: "At {value} Ω, current is {current} A." },
  },
  {
    id: "circuits.generate-current-graph", title: "Build the pattern", shortPrompt: "Your measurements draw the relationship.",
    primitiveId: "data-plot", role: "represent", interactionType: "generated-graph", objectiveIds: [circuitObjectives.graph], sourceBlockIds: ["circuits.relationship", "circuits.graph"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 2,
    misconceptionsAddressed: [circuitMisconception], possibleMisconceptionIds: [], allowedReasonCodes: [R.alternate], defaultReasonCode: R.alternate,
    render: { kind: "data-plot", prompt: "Test all three resistors to make the graph appear.", values: [3, 6, 9], controlKey: "resistance", xLabel: "Resistance", yLabel: "Current", relationId: "current-from-resistance" },
  },
  {
    id: "circuits.compare-current-paths", title: "Compare two paths", shortPrompt: "Same battery. Different opposition.",
    primitiveId: "comparison", role: "support", interactionType: "comparison", objectiveIds: [circuitObjectives.resistance], sourceBlockIds: ["circuits.resistance", "circuits.relationship"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [circuitMisconception], possibleMisconceptionIds: [], allowedReasonCodes: [R.misconception], defaultReasonCode: R.misconception,
    render: { kind: "comparison", prompt: "The voltage is equal. Compare only resistance and current.", left: { title: "3 Ω path", value: "3.00 A", note: "Less opposition · more current" }, right: { title: "9 Ω path", value: "1.00 A", note: "More opposition · less current" } },
  },
  {
    id: "circuits.guided-resistance-retry", title: "Try the idea again", shortPrompt: "Use the comparison, then predict once more.",
    primitiveId: "prediction", role: "support", interactionType: "guided-prediction", objectiveIds: [circuitObjectives.resistance], sourceBlockIds: ["circuits.figure", "circuits.relationship", "circuits.question"], prerequisiteObjectiveIds: [], dependsOnBlockIds: ["circuits.compare-current-paths"], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [circuitMisconception], possibleMisconceptionIds: [circuitMisconception], allowedReasonCodes: [R.retry], defaultReasonCode: R.retry,
    render: { kind: "prediction", prompt: "Which path carries less current at the same 9 V?", options: [{ id: "3", label: "3 Ω path" }, { id: "9", label: "9 Ω path" }], correctOptionId: "9", misconceptionByOption: { "3": circuitMisconception }, hint: "Look for the path with more opposition." },
  },
  {
    id: "circuits.formula-from-measurements", title: "Name the relationship", shortPrompt: "The symbols describe what the circuit already showed.",
    primitiveId: "evidence-reveal", role: "represent", interactionType: "evidence-reveal", objectiveIds: [circuitObjectives.graph], sourceBlockIds: ["circuits.ohms-law", "circuits.example"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 1, difficulty: 2,
    misconceptionsAddressed: [], possibleMisconceptionIds: [], allowedReasonCodes: [R.concept], defaultReasonCode: R.concept,
    render: { kind: "evidence-reveal", prompt: "Reveal the compact rule behind your observations.", title: "Ohm’s law", statement: "I = V ÷ R", example: "1.5 A = 9 V ÷ 6 Ω" },
  },
  {
    id: "circuits.reach-target-current", title: "Reach 1.50 A", shortPrompt: "Choose the resistor that creates the target current.",
    primitiveId: "target-challenge", role: "apply", interactionType: "target", objectiveIds: [circuitObjectives.target], sourceBlockIds: ["circuits.figure", "circuits.ohms-law", "circuits.example"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 2,
    misconceptionsAddressed: [], possibleMisconceptionIds: [], allowedReasonCodes: [R.challenge, R.transfer], defaultReasonCode: R.transfer,
    render: { kind: "target-challenge", prompt: "With a 9 V battery, make the meter read 1.50 A.", options: [3, 6, 9, 12].map((value) => ({ id: String(value), label: `${value} Ω` })), correctOptionId: "6", scenePatchByOption: Object.fromEntries([3, 6, 9, 12].map((value) => [String(value), { resistance: value }])) },
  },
  {
    id: "circuits.design-transfer-circuit", title: "Transfer the idea", shortPrompt: "A new circuit. The same trusted relationship.",
    primitiveId: "target-challenge", role: "transfer", interactionType: "transfer", objectiveIds: [circuitObjectives.transfer], sourceBlockIds: ["circuits.figure", "circuits.ohms-law"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 3,
    misconceptionsAddressed: [], possibleMisconceptionIds: [], allowedReasonCodes: [R.transfer], defaultReasonCode: R.transfer,
    render: { kind: "target-challenge", prompt: "A 12 V circuit needs 2.00 A. Choose its resistor.", options: [2, 4, 6, 12].map((value) => ({ id: String(value), label: `${value} Ω` })), correctOptionId: "6", scenePatchByOption: Object.fromEntries([2, 4, 6, 12].map((value) => [String(value), { resistance: value, voltage: 12 }])) },
  },
];

export const circuitsManifest: LessonManifest = {
  id: "circuits-resistance-v1", subject: "physics", title: "How resistance changes current", subtitle: "A fixed circuit becomes a system you can test.", sceneId: "circuit-loop-v1", initialRuntime: { voltage: 9, resistance: 4 },
  objectiveIds: Object.values(circuitObjectives), initialObjectiveStatus: Object.fromEntries(Object.values(circuitObjectives).map((id) => [id, "unseen"])),
  facts: [
    { id: "fact-voltage-push", label: "Voltage", statement: "Voltage is the electrical push supplied by the battery." },
    { id: "fact-current-flow", label: "Current", statement: "Current measures charge passing a point each second." },
    { id: "fact-resistance-opposes", label: "Resistance", statement: "Resistance opposes the movement of charge." },
    { id: "fact-fixed-voltage", label: "Relationship", statement: "At fixed voltage, increasing resistance decreases current." },
    { id: "fact-ohms-law", label: "Ohm's law", statement: "Current equals voltage divided by resistance." },
  ],
  sourceBlocks: [
    { id: "circuits.figure", page: 1, order: 1, kind: "figure", factIds: ["fact-voltage-push", "fact-current-flow", "fact-resistance-opposes"], title: "One closed path", body: "Battery → resistor → lamp" },
    { id: "circuits.voltage", page: 1, order: 2, kind: "definition", factIds: ["fact-voltage-push"], title: "Voltage", body: "Push from the battery." },
    { id: "circuits.current", page: 1, order: 3, kind: "definition", factIds: ["fact-current-flow"], title: "Current", body: "Charge moving each second." },
    { id: "circuits.resistance", page: 1, order: 4, kind: "definition", factIds: ["fact-resistance-opposes"], title: "Resistance", body: "Opposition to charge flow." },
    { id: "circuits.relationship", page: 1, order: 5, kind: "relationship", factIds: ["fact-fixed-voltage"], title: "Compare", body: "4 Ω → 2.25 A · 8 Ω → 1.13 A" },
    { id: "circuits.ohms-law", page: 2, order: 1, kind: "formula", factIds: ["fact-ohms-law"], title: "Current = voltage ÷ resistance", body: "I = V ÷ R" },
    { id: "circuits.graph", page: 2, order: 2, kind: "figure", factIds: ["fact-fixed-voltage", "fact-ohms-law"], title: "The fixed-voltage pattern", body: "More resistance produces less current." },
    { id: "circuits.example", page: 2, order: 3, kind: "example", factIds: ["fact-ohms-law"], title: "Worked example", body: "9 V ÷ 6 Ω = 1.5 A" },
    { id: "circuits.question", page: 2, order: 4, kind: "question", factIds: ["fact-fixed-voltage"], title: "Predict", body: "If resistance doubles, what happens to current?" },
  ],
  blocks: circuitBlocks, misconceptions: [circuitMisconception],
  visibility: { requiredPreserveSourceBlockIds: ["circuits.voltage"], allowedDelaySourceBlockIds: ["circuits.ohms-law", "circuits.example"], defaultDelaySourceBlockIds: ["circuits.ohms-law", "circuits.example"] },
  fallbackPaths: {
    explore: ["circuits.predict-resistance-change", "circuits.manipulate-resistance", "circuits.generate-current-graph", "circuits.formula-from-measurements", "circuits.reach-target-current"],
    understand: ["circuits.predict-resistance-change", "circuits.manipulate-resistance", "circuits.generate-current-graph", "circuits.formula-from-measurements", "circuits.reach-target-current"],
    revise: ["circuits.predict-resistance-change", "circuits.formula-from-measurements", "circuits.reach-target-current"],
    test: ["circuits.predict-resistance-change", "circuits.reach-target-current", "circuits.design-transfer-circuit"],
    secureAdapt: ["circuits.manipulate-resistance", "circuits.generate-current-graph", "circuits.formula-from-measurements", "circuits.reach-target-current"],
    supportAdapt: ["circuits.compare-current-paths", "circuits.guided-resistance-retry", "circuits.generate-current-graph", "circuits.reach-target-current"],
  },
};

const cellObjectives = {
  gradient: "predict-gradient-movement",
  mechanisms: "distinguish-transport-mechanisms",
  water: "predict-water-balance",
  transfer: "transfer-membrane-transport",
};
const cellMisconceptions = {
  gradient: "particles-move-against-gradient-without-energy",
  water: "water-moves-toward-lower-solute",
  active: "active-transport-is-diffusion",
};

const cellBlocks: InteractiveBlock[] = [
  {
    id: "cells.predict-gradient-direction", title: "Predict the movement", shortPrompt: "Where will the particles spread?", primitiveId: "prediction", role: "evidence", interactionType: "prediction", objectiveIds: [cellObjectives.gradient], sourceBlockIds: ["cells.concentration-gradient", "cells.diffusion-rule", "cells.scenario-question"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [cellMisconceptions.gradient], possibleMisconceptionIds: [cellMisconceptions.gradient], allowedReasonCodes: [R.elicit], defaultReasonCode: R.elicit,
    render: { kind: "prediction", prompt: "There are more particles on the left. Without added energy, which way is the net movement?", options: [{ id: "left", label: "Toward the crowded side", symbol: "←" }, { id: "right", label: "Toward the less crowded side", symbol: "→" }, { id: "none", label: "No net movement", symbol: "=" }], correctOptionId: "right", misconceptionByOption: { left: cellMisconceptions.gradient, none: cellMisconceptions.gradient }, hint: "Particles spread out when they move freely." },
  },
  {
    id: "cells.adjust-concentration", title: "Change the gradient", shortPrompt: "Change one side and watch movement respond.", primitiveId: "parameter-experiment", role: "explore", interactionType: "concentration-control", objectiveIds: [cellObjectives.gradient], sourceBlockIds: ["cells.membrane-figure", "cells.concentration-gradient", "cells.diffusion-rule"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 1,
    misconceptionsAddressed: [cellMisconceptions.gradient], possibleMisconceptionIds: [], allowedReasonCodes: [R.manipulate], defaultReasonCode: R.manipulate,
    render: { kind: "parameter-experiment", prompt: "Increase or reduce the particles on the left side.", controlKey: "leftParticles", label: "Particles on left", unit: "", min: 3, max: 12, step: 1, initial: 9, requiredDelta: 3, observationTemplate: "The larger difference creates a stronger net movement toward the less crowded side." },
  },
  {
    id: "cells.classify-transport", title: "Sort the mechanisms", shortPrompt: "Decide what moves, where, and whether energy is used.", primitiveId: "classification", role: "evidence", interactionType: "classification", objectiveIds: [cellObjectives.mechanisms], sourceBlockIds: ["cells.diffusion-rule", "cells.osmosis-rule", "cells.active-transport-rule", "cells.transport-comparison"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 2,
    misconceptionsAddressed: [cellMisconceptions.active], possibleMisconceptionIds: [cellMisconceptions.active], allowedReasonCodes: [R.elicit, R.alternate], defaultReasonCode: R.alternate,
    render: { kind: "classification", prompt: "Assign each example to its transport mechanism.", buckets: [{ id: "diffusion", label: "Diffusion" }, { id: "osmosis", label: "Osmosis" }, { id: "active", label: "Active transport" }], items: [{ id: "oxygen", label: "Oxygen spreads into a cell", correctBucketId: "diffusion" }, { id: "water", label: "Water crosses the membrane", correctBucketId: "osmosis" }, { id: "mineral", label: "Mineral ions move against the gradient using energy", correctBucketId: "active" }], misconceptionId: cellMisconceptions.active },
  },
  {
    id: "cells.compare-passive-active", title: "Compare two mechanisms", shortPrompt: "Same membrane. Different direction and energy.", primitiveId: "comparison", role: "support", interactionType: "comparison", objectiveIds: [cellObjectives.gradient, cellObjectives.mechanisms], sourceBlockIds: ["cells.diffusion-rule", "cells.active-transport-rule", "cells.transport-comparison"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [cellMisconceptions.gradient, cellMisconceptions.active], possibleMisconceptionIds: [], allowedReasonCodes: [R.misconception], defaultReasonCode: R.misconception,
    render: { kind: "comparison", prompt: "Follow the direction of each arrow.", left: { title: "Diffusion", value: "high → low", note: "No cellular energy required" }, right: { title: "Active transport", value: "low → high", note: "Cellular energy required" } },
  },
  {
    id: "cells.guided-gradient-retry", title: "Try the gradient again", shortPrompt: "Use the comparison, then predict again.", primitiveId: "prediction", role: "support", interactionType: "guided-prediction", objectiveIds: [cellObjectives.gradient], sourceBlockIds: ["cells.membrane-figure", "cells.diffusion-rule", "cells.scenario-question"], prerequisiteObjectiveIds: [], dependsOnBlockIds: ["cells.compare-passive-active"], estimatedMinutes: 1, difficulty: 1,
    misconceptionsAddressed: [cellMisconceptions.gradient], possibleMisconceptionIds: [cellMisconceptions.gradient], allowedReasonCodes: [R.retry], defaultReasonCode: R.retry,
    render: { kind: "prediction", prompt: "Without energy, particles begin crowded on the left. What is their net movement?", options: [{ id: "right", label: "Left → right" }, { id: "left", label: "Right → left" }], correctOptionId: "right", misconceptionByOption: { left: cellMisconceptions.gradient }, hint: "Diffusion moves down the concentration gradient." },
  },
  {
    id: "cells.order-active-transport", title: "Build the active sequence", shortPrompt: "Energy changes what the membrane can do.", primitiveId: "step-sequence", role: "represent", interactionType: "ordering", objectiveIds: [cellObjectives.mechanisms], sourceBlockIds: ["cells.active-transport-rule", "cells.transport-comparison"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 2,
    misconceptionsAddressed: [cellMisconceptions.active], possibleMisconceptionIds: [], allowedReasonCodes: [R.concept, R.alternate], defaultReasonCode: R.concept,
    render: { kind: "step-sequence", prompt: "Select the stages in order.", stages: [{ id: "bind", label: "Particle binds to a membrane protein" }, { id: "energy", label: "The cell supplies energy" }, { id: "move", label: "The protein moves the particle against the gradient" }] },
  },
  {
    id: "cells.predict-water-balance", title: "Predict the cell state", shortPrompt: "Water movement changes the whole cell.", primitiveId: "prediction", role: "apply", interactionType: "cause-effect-prediction", objectiveIds: [cellObjectives.water], sourceBlockIds: ["cells.osmosis-rule", "cells.cell-balance-diagram", "cells.scenario-question"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 2,
    misconceptionsAddressed: [cellMisconceptions.water], possibleMisconceptionIds: [cellMisconceptions.water], allowedReasonCodes: [R.challenge, R.transfer], defaultReasonCode: R.challenge,
    render: { kind: "prediction", prompt: "Outside the cell has more dissolved solute. What happens to water in the cell?", options: [{ id: "leave", label: "Water leaves the cell" }, { id: "enter", label: "Water enters the cell" }, { id: "same", label: "No net movement" }], correctOptionId: "leave", misconceptionByOption: { enter: cellMisconceptions.water, same: cellMisconceptions.water }, hint: "Water moves toward the side with more dissolved solute in this model.", scenePatch: { cellState: "shrinking" } },
  },
  {
    id: "cells.apply-new-cell-scenario", title: "Transfer to a new cell", shortPrompt: "A new environment. The same membrane rules.", primitiveId: "target-challenge", role: "transfer", interactionType: "transfer", objectiveIds: [cellObjectives.transfer], sourceBlockIds: ["cells.membrane-figure", "cells.osmosis-rule", "cells.cell-balance-diagram"], prerequisiteObjectiveIds: [], dependsOnBlockIds: [], estimatedMinutes: 2, difficulty: 3,
    misconceptionsAddressed: [cellMisconceptions.water], possibleMisconceptionIds: [cellMisconceptions.water], allowedReasonCodes: [R.transfer], defaultReasonCode: R.transfer,
    render: { kind: "target-challenge", prompt: "A cell is placed in very dilute water. Choose its likely response.", options: [{ id: "swell", label: "Water enters · cell swells" }, { id: "shrink", label: "Water leaves · cell shrinks" }, { id: "still", label: "Nothing changes" }], correctOptionId: "swell", misconceptionByOption: { shrink: cellMisconceptions.water }, scenePatchByOption: { swell: { cellState: "swelling" }, shrink: { cellState: "shrinking" }, still: { cellState: "balanced" } } },
  },
];

export const cellsManifest: LessonManifest = {
  id: "cell-membrane-transport-v1", subject: "biology", title: "How substances cross a cell membrane", subtitle: "A static membrane diagram becomes a system of movement and choice.", sceneId: "cell-membrane-v1", initialRuntime: { leftParticles: 9, rightParticles: 3, cellState: "balanced" },
  objectiveIds: Object.values(cellObjectives), initialObjectiveStatus: Object.fromEntries(Object.values(cellObjectives).map((id) => [id, "unseen"])),
  facts: [
    { id: "fact-selective-membrane", label: "Membrane", statement: "A cell membrane controls which substances cross." },
    { id: "fact-gradient", label: "Concentration gradient", statement: "Freely moving particles spread from higher to lower concentration." },
    { id: "fact-diffusion", label: "Diffusion", statement: "Diffusion is net particle movement down a concentration gradient." },
    { id: "fact-osmosis", label: "Osmosis", statement: "Osmosis is water movement across a selectively permeable membrane." },
    { id: "fact-active", label: "Active transport", statement: "Active transport uses cellular energy to move against a concentration gradient." },
    { id: "fact-water-balance", label: "Water balance", statement: "Net water movement can make a cell swell or shrink." },
  ],
  sourceBlocks: [
    { id: "cells.membrane-figure", page: 1, order: 1, kind: "figure", factIds: ["fact-selective-membrane"], title: "A selective boundary", body: "Some particles cross. Others are held back." },
    { id: "cells.concentration-gradient", page: 1, order: 2, kind: "definition", factIds: ["fact-gradient"], title: "Concentration", body: "How crowded particles are in a space." },
    { id: "cells.diffusion-rule", page: 1, order: 3, kind: "relationship", factIds: ["fact-diffusion"], title: "Diffusion", body: "Net movement: high concentration → low concentration." },
    { id: "cells.transport-comparison", page: 1, order: 4, kind: "comparison", factIds: ["fact-diffusion", "fact-active"], title: "Two directions", body: "Down the gradient needs no cellular energy. Against it does." },
    { id: "cells.osmosis-rule", page: 2, order: 1, kind: "relationship", factIds: ["fact-osmosis"], title: "Osmosis", body: "Water crosses the membrane toward the side with more dissolved solute in this model." },
    { id: "cells.active-transport-rule", page: 2, order: 2, kind: "relationship", factIds: ["fact-active"], title: "Active transport", body: "A membrane protein uses energy to move particles against the gradient." },
    { id: "cells.cell-balance-diagram", page: 2, order: 3, kind: "figure", factIds: ["fact-water-balance"], title: "Cell water balance", body: "Water entering can swell a cell. Water leaving can shrink it." },
    { id: "cells.scenario-question", page: 2, order: 4, kind: "question", factIds: ["fact-gradient", "fact-water-balance"], title: "Predict", body: "What changes when the concentrations on the two sides are unequal?" },
  ],
  blocks: cellBlocks, misconceptions: Object.values(cellMisconceptions),
  visibility: { requiredPreserveSourceBlockIds: ["cells.membrane-figure"], allowedDelaySourceBlockIds: ["cells.diffusion-rule", "cells.osmosis-rule", "cells.active-transport-rule"], defaultDelaySourceBlockIds: ["cells.diffusion-rule", "cells.osmosis-rule"] },
  fallbackPaths: {
    explore: ["cells.predict-gradient-direction", "cells.adjust-concentration", "cells.classify-transport", "cells.order-active-transport", "cells.apply-new-cell-scenario"],
    understand: ["cells.predict-gradient-direction", "cells.adjust-concentration", "cells.classify-transport", "cells.order-active-transport", "cells.apply-new-cell-scenario"],
    revise: ["cells.classify-transport", "cells.predict-water-balance", "cells.apply-new-cell-scenario"],
    test: ["cells.classify-transport", "cells.predict-water-balance", "cells.apply-new-cell-scenario"],
    secureAdapt: ["cells.adjust-concentration", "cells.classify-transport", "cells.order-active-transport", "cells.apply-new-cell-scenario"],
    supportAdapt: ["cells.compare-passive-active", "cells.guided-gradient-retry", "cells.classify-transport", "cells.apply-new-cell-scenario"],
  },
};

export const lessonRegistry = new Map<LessonManifest["id"], LessonManifest>([
  [circuitsManifest.id, circuitsManifest],
  [cellsManifest.id, cellsManifest],
]);

export function getLessonManifest(id: LessonManifest["id"]) {
  const manifest = lessonRegistry.get(id);
  if (!manifest) throw new Error(`Unknown Prototype 4 lesson: ${id}`);
  return manifest;
}

export function validateManifest(manifest: LessonManifest): string[] {
  const errors: string[] = [];
  const factIds = new Set(manifest.facts.map((fact) => fact.id));
  const sourceIds = new Set(manifest.sourceBlocks.map((block) => block.id));
  const blockIds = new Set(manifest.blocks.map((block) => block.id));
  if (factIds.size !== manifest.facts.length) errors.push("Duplicate trusted fact ID.");
  if (sourceIds.size !== manifest.sourceBlocks.length) errors.push("Duplicate source block ID.");
  if (blockIds.size !== manifest.blocks.length) errors.push("Duplicate interactive block ID.");
  for (const source of manifest.sourceBlocks) for (const factId of source.factIds) if (!factIds.has(factId)) errors.push(`${source.id} references unknown fact ${factId}.`);
  for (const block of manifest.blocks) {
    for (const sourceId of block.sourceBlockIds) if (!sourceIds.has(sourceId)) errors.push(`${block.id} references unknown source ${sourceId}.`);
    for (const misconception of [...block.misconceptionsAddressed, ...block.possibleMisconceptionIds]) if (!manifest.misconceptions.includes(misconception)) errors.push(`${block.id} references unknown misconception ${misconception}.`);
    for (const dependency of block.dependsOnBlockIds) if (!blockIds.has(dependency)) errors.push(`${block.id} depends on unknown block ${dependency}.`);
  }
  for (const path of Object.values(manifest.fallbackPaths)) for (const blockId of path) if (!blockIds.has(blockId)) errors.push(`Fallback references unknown block ${blockId}.`);
  return errors;
}
