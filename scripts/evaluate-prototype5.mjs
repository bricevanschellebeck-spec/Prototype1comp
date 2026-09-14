const args = process.argv.slice(2);
const profileIndex = args.indexOf("--profile");
const profile = profileIndex >= 0 ? args[profileIndex + 1] : "quick";
if (!["quick", "full"].includes(profile)) throw new Error("Use --profile quick or --profile full.");
const baseUrl = process.env.P5_EVALUATION_URL || "http://localhost:3000";
const sourceIds = profile === "quick" ? ["reaction-rate-concentration-v1", "photosynthesis-light-v1"] : ["reaction-rate-concentration-v1", "photosynthesis-light-v1", "river-erosion-v1", "supply-demand-v1", "perpendicular-bisector-v1"];
const rows = [];
const plannerRows = [];
async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}: ${payload.error || "unknown error"}. Start the app first.`);
  return payload;
}
for (const sourceDocumentId of sourceIds) {
  for (const modelProfile of ["fast"]) {
    const analysis = await post("/api/prototype-5/analyze", { sourceDocumentId, modelProfile });
    rows.push({ sourceDocumentId, modelProfile, status: analysis.status, schemaValid: analysis.rawMetrics.schemaValid, citationValid: analysis.rawMetrics.semanticValid, correction: analysis.correctionAttempted, latencyMs: analysis.latencyMs });
    console.log(`${String(rows.length).padStart(2,"0")}/${sourceIds.length} ${sourceDocumentId} · ${modelProfile}: ${analysis.status}, ${(analysis.latencyMs / 1000).toFixed(1)} s`);
  }
}
if (profile === "full") {
  const fixtureResponse = await fetch(`${baseUrl}/api/prototype-5/evaluation-fixtures`);
  if (!fixtureResponse.ok) throw new Error("Could not load the local P5 evaluation fixtures.");
  const fixtures = await fixtureResponse.json();
  for (const fixture of fixtures) {
    for (const modelProfile of ["fast"]) {
      const result = await post("/api/prototype-5/plan", { approvedSpec: fixture.goldSpec, modelProfile });
      const proposals = result.draft?.objectivePlans.flatMap((objective) => objective.proposals) || [];
      const primitives = new Set(proposals.map((proposal) => proposal.primitiveId));
      const gap = Boolean(result.draft?.objectivePlans.some((objective) => objective.representationGap));
      const suitable = fixture.representationGap ? gap : fixture.expectedPrimitiveIds.some((id) => primitives.has(id));
      plannerRows.push({ sourceDocumentId: fixture.sourceDocumentId, modelProfile, status: result.status, suitable, latencyMs: result.latencyMs });
      console.log(`planner ${fixture.sourceDocumentId} · ${modelProfile}: ${result.status}, ${suitable ? "suitable/gap correct" : "outside expected family"}`);
    }
  }
}
const percent = (predicate) => Math.round(rows.filter(predicate).length / rows.length * 100);
const report = { profile, analyzerRuns: rows.length, plannerRuns: plannerRows.length,  validatedSchemaRate: percent((row) => row.schemaValid), validCitationRate: percent((row) => row.citationValid), correctionOrFailureRate: percent((row) => row.correction || row.status === "failed"), primitiveSuitabilityRate: plannerRows.length ? Math.round(plannerRows.filter((row) => row.suitable).length / plannerRows.length * 100) : "not run", meanLatencyMs: Math.round(rows.reduce((sum, row) => sum + row.latencyMs, 0) / rows.length) };
console.log("\nPrototype 5 source-analysis evaluation");
console.table(report);
console.log(report.validatedSchemaRate >= 90 && report.validCitationRate >= 90 ? "STRUCTURE CHECK PASSED: inspect source meaning and teaching suitability separately." : "REVIEW: source validation stayed safe, but model quality needs prompt/model iteration.");
