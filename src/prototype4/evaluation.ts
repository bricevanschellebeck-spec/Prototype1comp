import type { ApiComposeRequest, ComposeResponse, LessonId } from "./types";

export type EvaluationScenario = {
  id: string;
  label: string;
  request: ApiComposeRequest;
  requiredBlockIds: string[];
};

const base = (lessonId: LessonId, goal: ApiComposeRequest["goal"], depthMinutes: ApiComposeRequest["depthMinutes"]): ApiComposeRequest => ({ schemaVersion: "p4-api-1", lessonId, goal, depthMinutes, evidenceLog: [] });

export const evaluationScenarios: EvaluationScenario[] = [
  { id: "circuits-understand", label: "Circuits · understand", request: base("circuits-resistance-v1", "understand", 15), requiredBlockIds: ["circuits.predict-resistance-change", "circuits.reach-target-current"] },
  { id: "circuits-revise", label: "Circuits · quick revision", request: base("circuits-resistance-v1", "revise", 5), requiredBlockIds: ["circuits.predict-resistance-change", "circuits.reach-target-current"] },
  { id: "circuits-test", label: "Circuits · test", request: base("circuits-resistance-v1", "test", 15), requiredBlockIds: ["circuits.design-transfer-circuit"] },
  { id: "circuits-correct", label: "Circuits · secure evidence", request: { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] }, requiredBlockIds: ["circuits.generate-current-graph", "circuits.reach-target-current"] },
  { id: "circuits-incorrect", label: "Circuits · misconception", request: { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["more-resistance-means-more-current"] }] }, requiredBlockIds: ["circuits.compare-current-paths", "circuits.guided-resistance-retry"] },
  { id: "circuits-hint", label: "Circuits · supported evidence", request: { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 2, hintUsed: true, misconceptionIds: [] }] }, requiredBlockIds: ["circuits.reach-target-current"] },
  { id: "cells-understand", label: "Cells · understand", request: base("cell-membrane-transport-v1", "understand", 15), requiredBlockIds: ["cells.predict-gradient-direction", "cells.apply-new-cell-scenario"] },
  { id: "cells-revise", label: "Cells · quick revision", request: base("cell-membrane-transport-v1", "revise", 5), requiredBlockIds: ["cells.classify-transport"] },
  { id: "cells-test", label: "Cells · test", request: base("cell-membrane-transport-v1", "test", 15), requiredBlockIds: ["cells.predict-water-balance", "cells.apply-new-cell-scenario"] },
  { id: "cells-correct", label: "Cells · secure evidence", request: { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] }, requiredBlockIds: ["cells.classify-transport"] },
  { id: "cells-incorrect", label: "Cells · misconception", request: { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["particles-move-against-gradient-without-energy"] }] }, requiredBlockIds: ["cells.compare-passive-active", "cells.guided-gradient-retry"] },
  { id: "cells-hint", label: "Cells · supported evidence", request: { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "correct", attempts: 2, hintUsed: true, misconceptionIds: [] }] }, requiredBlockIds: [] },
];

export function pathMatches(response: ComposeResponse, scenario: EvaluationScenario) {
  const selected = new Set(response.blueprint.remainingSteps.map((step) => step.blockId));
  return scenario.requiredBlockIds.every((id) => selected.has(id));
}
