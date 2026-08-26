const args = process.argv.slice(2);
const repeatIndex = args.indexOf("--repeats");
const repeats = repeatIndex >= 0 ? Math.max(1, Math.min(5, Number(args[repeatIndex + 1]) || 2)) : 2;
const baseUrl = process.env.P4_EVALUATION_URL || "http://localhost:3000";
const base = (lessonId, goal, depthMinutes) => ({ schemaVersion: "p4-api-1", lessonId, goal, depthMinutes, evidenceLog: [] });
const scenarios = [
  ["circuits-understand", base("circuits-resistance-v1", "understand", 15), ["circuits.predict-resistance-change", "circuits.reach-target-current"]],
  ["circuits-revise", base("circuits-resistance-v1", "revise", 5), ["circuits.predict-resistance-change", "circuits.reach-target-current"]],
  ["circuits-test", base("circuits-resistance-v1", "test", 15), ["circuits.design-transfer-circuit"]],
  ["circuits-correct", { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] }, ["circuits.generate-current-graph", "circuits.reach-target-current"]],
  ["circuits-incorrect", { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["more-resistance-means-more-current"] }] }, ["circuits.compare-current-paths", "circuits.guided-resistance-retry"]],
  ["circuits-hint", { ...base("circuits-resistance-v1", "understand", 15), evidenceLog: [{ blockId: "circuits.predict-resistance-change", result: "correct", attempts: 2, hintUsed: true, misconceptionIds: [] }] }, ["circuits.reach-target-current"]],
  ["cells-understand", base("cell-membrane-transport-v1", "understand", 15), ["cells.predict-gradient-direction", "cells.apply-new-cell-scenario"]],
  ["cells-revise", base("cell-membrane-transport-v1", "revise", 5), ["cells.classify-transport"]],
  ["cells-test", base("cell-membrane-transport-v1", "test", 15), ["cells.predict-water-balance", "cells.apply-new-cell-scenario"]],
  ["cells-correct", { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "correct", attempts: 1, hintUsed: false, misconceptionIds: [] }] }, ["cells.classify-transport"]],
  ["cells-incorrect", { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "incorrect", attempts: 1, hintUsed: false, misconceptionIds: ["particles-move-against-gradient-without-energy"] }] }, ["cells.compare-passive-active", "cells.guided-gradient-retry"]],
  ["cells-hint", { ...base("cell-membrane-transport-v1", "understand", 15), evidenceLog: [{ blockId: "cells.predict-gradient-direction", result: "correct", attempts: 2, hintUsed: true, misconceptionIds: [] }] }, []],
];

const results = [];
for (let run = 1; run <= repeats; run += 1) {
  for (const [id, request, required] of scenarios) {
    const response = await fetch(`${baseUrl}/api/prototype-4/compose?evaluation=1`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
    if (!response.ok) throw new Error(`${id} returned HTTP ${response.status}. Start the app with npm run dev first.`);
    const payload = await response.json();
    const selected = new Set(payload.blueprint.remainingSteps.map((step) => step.blockId));
    const pathMatch = required.every((blockId) => selected.has(blockId));
    results.push({ id, run, source: payload.source, latencyMs: payload.latencyMs, ...payload.rawMetrics, pathMatch });
    console.log(`${String(results.length).padStart(2, "0")}/${scenarios.length * repeats} ${id}: ${payload.source}, ${payload.latencyMs} ms, ${pathMatch ? "path ok" : "path outside family"}`);
  }
}
const percent = (key) => Math.round(results.filter((result) => result[key]).length / results.length * 100);
const latency = results.map((result) => result.latencyMs).sort((a, b) => a - b);
const report = { runs: results.length, safeReturnRate: 100, rawParseRate: percent("parsed"), rawSemanticValidRate: percent("semanticValid"), acceptablePathRate: percent("pathMatch"), fallbackRate: Math.round(results.filter((result) => result.source !== "ollama").length / results.length * 100), p95LatencyMs: latency[Math.min(latency.length - 1, Math.ceil(latency.length * .95) - 1)] };
console.log("\nPrototype 4 evaluation summary");
console.table(report);
console.log(report.rawParseRate >= 90 && report.rawSemanticValidRate >= 80 && report.acceptablePathRate >= 80 && report.p95LatencyMs <= 15000 ? "READY: model meets the planned live-demo thresholds." : "REVIEW: one or more model-readiness thresholds were not met; the validated fallback remains safe.");
