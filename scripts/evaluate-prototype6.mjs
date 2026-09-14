import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const profile = valueAfter("--profile") || "quick";
if (!["quick", "full"].includes(profile)) throw new Error("Use --profile quick or --profile full.");
const requestedRepeats = Number(valueAfter("--repeats") || (profile === "full" ? 3 : 1));
if (!Number.isInteger(requestedRepeats) || requestedRepeats < 1 || requestedRepeats > 5) throw new Error("--repeats must be an integer from 1 to 5.");

const baseUrl = process.env.P6_EVALUATION_URL || "http://localhost:3000";
async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${value.error || "request failed"}`);
  return value;
}
async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${value.error || value.errors?.join(" ")}`);
  return value;
}

const status = await get("/api/prototype-6/status");
if (status.provider !== "gemini" || !status.connected) {
  throw new Error(`Live goal evaluation requires connected Gemini. Current status: ${status.provider}/${status.model} — ${status.message}`);
}
const { profiles } = await get("/api/prototype-6/evaluation-fixtures");

function signatureOf(blueprint) {
  const byId = new Map(blueprint.stages.map((stage) => [stage.stageId, stage]));
  const initialStages = blueprint.initialSequenceStageIds.map((id) => byId.get(id)).filter(Boolean);
  return {
    primitiveOrder: initialStages.map((stage) => stage.primitive.kind),
    stageRoles: initialStages.map((stage) => stage.role),
    supportAlternatives: blueprint.stages.filter((stage) => stage.availability === "support-only").map((stage) => `${stage.role}:${stage.primitive.kind}:${[...stage.objectiveIds].sort().join("+")}`).sort(),
    finalApplicationType: byId.get(blueprint.finalApplicationStageId)?.primitive.kind || blueprint.finalApplicationStageId,
    delayedFacts: [...blueprint.designSummary.delayedFactIds].sort(),
    omittedFacts: [...blueprint.designSummary.omittedFactIds].sort(),
  };
}

function compare(left, right) {
  if (!left || !right) return null;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const dimensions = {
    primitiveOrder: same(left.primitiveOrder, right.primitiveOrder),
    stageRoles: same(left.stageRoles, right.stageRoles),
    supportAlternatives: same(left.supportAlternatives, right.supportAlternatives),
    finalApplicationType: left.finalApplicationType === right.finalApplicationType,
    delayedFacts: same(left.delayedFacts, right.delayedFacts),
    omittedFacts: same(left.omittedFacts, right.omittedFacts),
  };
  return { ...dimensions, differingDimensions: Object.values(dimensions).filter((item) => !item).length, meaningfullyDifferent: Object.values(dimensions).some((item) => !item) };
}

function groupSummary(rows) {
  const accepted = rows.filter((row) => row.accepted && row.signature);
  const counts = new Map();
  for (const row of accepted) {
    const key = JSON.stringify(row.signature);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const modal = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const latencies = rows.map((row) => row.latencyMs).sort((a, b) => a - b);
  return {
    totalRuns: rows.length,
    acceptedRuns: accepted.length,
    invalidOrFallbackRuns: rows.filter((row) => !row.accepted || row.fallbackUsed).length,
    compilationFailures: rows.filter((row) => row.accepted && !row.compiled).length,
    distinctStructures: counts.size,
    modalConsistencyPercent: accepted.length && modal ? Math.round(modal[1] / accepted.length * 100) : 0,
    meanLatencyMs: Math.round(rows.reduce((sum, row) => sum + row.latencyMs, 0) / Math.max(1, rows.length)),
    p95LatencyMs: latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)] || 0,
    representativeSignature: modal ? JSON.parse(modal[0]) : null,
  };
}

const rows = [];
const tasks = profiles.flatMap((designProfile) => Array.from({ length: requestedRepeats }, (_, index) => ({ designProfile, run: index + 1 })));
for (const [index, task] of tasks.entries()) {
  const design = await post("/api/prototype-6/design", task.designProfile);
  let compiled = false;
  let compileErrors = [];
  let signature = null;
  if (design.status === "accepted") {
    signature = signatureOf(design.blueprint);
    try {
      await post("/api/prototype-6/compile", { blueprint: design.blueprint, designReceipt: design.designReceipt });
      compiled = true;
    } catch (error) {
      compileErrors = [error instanceof Error ? error.message : String(error)];
    }
  }
  rows.push({
    goal: task.designProfile.goal,
    depthMinutes: task.designProfile.depthMinutes,
    run: task.run,
    accepted: design.status === "accepted",
    compiled,
    fallbackUsed: false,
    provider: design.provider,
    model: design.model,
    corrected: design.correctionAttempted,
    latencyMs: design.latencyMs,
    validationErrors: design.validationErrors,
    compileErrors,
    failureReason: design.failureReason,
    signature,
  });
  console.log(`${index + 1}/${tasks.length} ${task.designProfile.goal} run ${task.run}: ${design.status}, ${(design.latencyMs / 1000).toFixed(1)}s`);
}

const byGoal = Object.fromEntries(profiles.map(({ goal }) => [goal, groupSummary(rows.filter((row) => row.goal === goal))]));
const pairs = [
  ["explore", "understand"], ["explore", "revise"], ["explore", "test"],
  ["understand", "revise"], ["understand", "test"], ["revise", "test"],
];
const betweenGoals = pairs.map(([left, right]) => ({ left, right, ...compare(byGoal[left].representativeSignature, byGoal[right].representativeSignature) }));
const acceptedRows = rows.filter((row) => row.accepted);
const report = {
  reportVersion: "p6-live-goal-evaluation-1",
  generatedAt: new Date().toISOString(),
  provider: status.provider,
  model: status.model,
  sourcePackageId: "circuits-resistance-approved-v1",
  profile,
  repeatsPerGoal: requestedRepeats,
  totalRuns: rows.length,
  acceptedRuns: acceptedRows.length,
  invalidOrFallbackRuns: rows.filter((row) => !row.accepted || row.fallbackUsed).length,
  compilationFailures: rows.filter((row) => row.accepted && !row.compiled).length,
  correctionRuns: rows.filter((row) => row.corrected).length,
  meanLatencyMs: Math.round(rows.reduce((sum, row) => sum + row.latencyMs, 0) / Math.max(1, rows.length)),
  withinGoal: byGoal,
  betweenGoals,
  requiredContrasts: {
    exploreVsTest: betweenGoals.find((pair) => pair.left === "explore" && pair.right === "test"),
    understandVsRevise: betweenGoals.find((pair) => pair.left === "understand" && pair.right === "revise"),
  },
  runs: rows,
};

const bool = (value) => value ? "different" : "same";
const markdown = [
  "# Prototype 6 — Live Gemini Goal-Mode Evaluation",
  "",
  `Generated: ${report.generatedAt}`,
  `Provider: ${report.provider} · ${report.model}`,
  `Trusted source: ${report.sourcePackageId}`,
  `Runs: ${report.totalRuns} (${requestedRepeats} per goal)`,
  "",
  "## Outcome",
  "",
  `- Accepted blueprints: ${report.acceptedRuns}/${report.totalRuns}`,
  `- Invalid or fallback generations: ${report.invalidOrFallbackRuns}`,
  `- Compilation failures: ${report.compilationFailures}`,
  `- Correction attempts used: ${report.correctionRuns}`,
  `- Mean latency: ${(report.meanLatencyMs / 1000).toFixed(1)} s`,
  "",
  "## Within-goal consistency",
  "",
  "| Goal | Accepted | Distinct structures | Modal consistency | Mean latency | p95 latency |",
  "|---|---:|---:|---:|---:|---:|",
  ...Object.entries(byGoal).map(([goal, value]) => `| ${goal} | ${value.acceptedRuns}/${value.totalRuns} | ${value.distinctStructures} | ${value.modalConsistencyPercent}% | ${(value.meanLatencyMs / 1000).toFixed(1)} s | ${(value.p95LatencyMs / 1000).toFixed(1)} s |`),
  "",
  "## Between-goal structural comparison",
  "",
  "| Comparison | Primitive order | Stage roles | Support alternatives | Final application | Delayed facts | Omitted facts | Meaningfully different |",
  "|---|---|---|---|---|---|---|---|",
  ...betweenGoals.map((pair) => `| ${pair.left} vs ${pair.right} | ${bool(!pair.primitiveOrder)} | ${bool(!pair.stageRoles)} | ${bool(!pair.supportAlternatives)} | ${bool(!pair.finalApplicationType)} | ${bool(!pair.delayedFacts)} | ${bool(!pair.omittedFacts)} | ${pair.meaningfullyDifferent ? "yes" : "no"} |`),
  "",
  "## Structural signatures",
  "",
  ...Object.entries(byGoal).flatMap(([goal, value]) => [
    `### ${goal}`,
    "",
    value.representativeSignature ? `- Primitive order: ${value.representativeSignature.primitiveOrder.join(" → ")}` : "- No accepted design.",
    value.representativeSignature ? `- Stage roles: ${value.representativeSignature.stageRoles.join(" → ")}` : "",
    value.representativeSignature ? `- Support alternatives: ${value.representativeSignature.supportAlternatives.join(", ") || "none"}` : "",
    value.representativeSignature ? `- Final application: ${value.representativeSignature.finalApplicationType}` : "",
    value.representativeSignature ? `- Delayed facts: ${value.representativeSignature.delayedFacts.join(", ") || "none"}` : "",
    value.representativeSignature ? `- Omitted facts: ${value.representativeSignature.omittedFacts.join(", ") || "none"}` : "",
    "",
  ]),
  "## Interpretation boundary",
  "",
  "Structural difference is an evaluation signal, not a runtime validity rule. P6 does not force artificial variation between goals.",
  "",
].join("\n");

const reportDirectory = resolve("reports");
await mkdir(reportDirectory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const jsonPath = resolve(reportDirectory, `prototype6-live-goal-evaluation-${stamp}.json`);
const markdownPath = resolve(reportDirectory, `prototype6-live-goal-evaluation-${stamp}.md`);
await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
await writeFile(markdownPath, markdown, "utf8");

console.table(Object.entries(byGoal).map(([goal, value]) => ({ goal, accepted: `${value.acceptedRuns}/${value.totalRuns}`, distinct: value.distinctStructures, consistency: `${value.modalConsistencyPercent}%`, meanSeconds: (value.meanLatencyMs / 1000).toFixed(1) })));
console.table(betweenGoals.map((pair) => ({ comparison: `${pair.left} vs ${pair.right}`, differingDimensions: pair.differingDimensions, meaningfullyDifferent: pair.meaningfullyDifferent })));
console.log(`JSON report: ${jsonPath}`);
console.log(`Markdown report: ${markdownPath}`);
console.log(report.invalidOrFallbackRuns === 0 && report.compilationFailures === 0 && report.requiredContrasts.exploreVsTest?.meaningfullyDifferent && report.requiredContrasts.understandVsRevise?.meaningfullyDifferent ? "P6 GOAL EVALUATION: target contrasts observed." : "P6 GOAL EVALUATION: inspect the report; one or more target contrasts or safe outcomes need review.");
