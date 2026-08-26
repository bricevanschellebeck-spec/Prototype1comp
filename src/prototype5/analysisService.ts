import { primitiveFactoryCatalog } from "./catalog";
import { validateAnalysisDraft, validateApprovedSpec, validateRepresentationPlan } from "./contracts";
import { OllamaRepresentationPlanner, OllamaSourceAnalyzer } from "./providers";
import { getSourceDocument } from "./sources";
import type { AnalysisResult, ModelProfile, PlanningResult } from "./types";

function parseJson(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

function timeoutFor(profile: ModelProfile) {
  const raw = profile === "fast" ? process.env.P5_FAST_TIMEOUT_MS ?? "180000" : process.env.P5_QUALITY_TIMEOUT_MS ?? "420000";
  return Math.max(15_000, Math.min(600_000, Number(raw)));
}

export async function analyzeSource(sourceDocumentId: string, profile: ModelProfile): Promise<AnalysisResult> {
  const source = getSourceDocument(sourceDocumentId);
  const analyzer = new OllamaSourceAnalyzer(profile);
  const started = performance.now();
  if (!source) return { status: "failed", profile, providerId: "ollama", modelId: analyzer.modelId, latencyMs: 0, correctionAttempted: false, validationErrors: ["Unknown trusted source."], failureReason: "The requested source is not registered.", rawMetrics: { received: false, parsed: false, schemaValid: false, semanticValid: false } };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutFor(profile));
  let received = false; let parsed = false; let schemaValid = false; let correctionAttempted = false; let lastErrors: string[] = [];
  try {
    let correction: { errors: string[]; previous: string } | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      correctionAttempted = attempt === 1;
      const response = await analyzer.analyze(source, { signal: controller.signal, correction }); received = true;
      let candidate: unknown;
      try { candidate = parseJson(response.content); parsed = true; }
      catch { lastErrors = ["Analyzer returned invalid JSON."]; correction = { errors: lastErrors, previous: response.content }; continue; }
      const validation = validateAnalysisDraft(source, candidate); schemaValid = validation.schemaValid; lastErrors = validation.errors;
      if (validation.valid && validation.draft) return { status: "accepted", profile, providerId: "ollama", modelId: response.model, latencyMs: Math.round(performance.now() - started), correctionAttempted, draft: validation.draft, validationErrors: [], rawMetrics: { received, parsed, schemaValid: true, semanticValid: true } };
      correction = { errors: validation.errors, previous: response.content };
    }
    return { status: "failed", profile, providerId: "ollama", modelId: analyzer.modelId, latencyMs: Math.round(performance.now() - started), correctionAttempted, validationErrors: lastErrors, failureReason: "The analyzer failed validation after one correction attempt.", rawMetrics: { received, parsed, schemaValid, semanticValid: false } };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? `${profile === "quality" ? "14B" : "4B"} analysis timed out.` : error instanceof Error ? error.message : "Analyzer unavailable.";
    return { status: "failed", profile, providerId: "ollama", modelId: analyzer.modelId, latencyMs: Math.round(performance.now() - started), correctionAttempted, validationErrors: lastErrors, failureReason: reason, rawMetrics: { received, parsed, schemaValid, semanticValid: false } };
  } finally { clearTimeout(timeout); }
}

export async function planRepresentations(approvedSpecCandidate: unknown, profile: ModelProfile): Promise<PlanningResult> {
  const sourceId = typeof approvedSpecCandidate === "object" && approvedSpecCandidate ? String((approvedSpecCandidate as { sourceDocumentId?: unknown }).sourceDocumentId ?? "") : "";
  const source = getSourceDocument(sourceId); const planner = new OllamaRepresentationPlanner(profile); const started = performance.now();
  if (!source) return { status: "failed", profile, providerId: "ollama", modelId: planner.modelId, latencyMs: 0, correctionAttempted: false, validationErrors: ["Unknown source."], failureReason: "The approved specification has no registered source." };
  const specValidation = validateApprovedSpec(source, approvedSpecCandidate);
  if (!specValidation.valid || !specValidation.spec) return { status: "failed", profile, providerId: "ollama", modelId: planner.modelId, latencyMs: 0, correctionAttempted: false, validationErrors: specValidation.errors, failureReason: "The server rejected the approved specification." };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutFor(profile)); let correctionAttempted = false; let lastErrors: string[] = [];
  try {
    let correction: { errors: string[]; previous: string } | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      correctionAttempted = attempt === 1;
      const response = await planner.plan(specValidation.spec, primitiveFactoryCatalog, { signal: controller.signal, correction });
      let candidate: unknown;
      try { candidate = parseJson(response.content); } catch { lastErrors = ["Planner returned invalid JSON."]; correction = { errors: lastErrors, previous: response.content }; continue; }
      const validation = validateRepresentationPlan(source, specValidation.spec, candidate); lastErrors = validation.errors;
      if (validation.valid && validation.plan) return { status: "accepted", profile, providerId: "ollama", modelId: response.model, latencyMs: Math.round(performance.now() - started), correctionAttempted, draft: validation.plan, validationErrors: [] };
      correction = { errors: validation.errors, previous: response.content };
    }
    return { status: "failed", profile, providerId: "ollama", modelId: planner.modelId, latencyMs: Math.round(performance.now() - started), correctionAttempted, validationErrors: lastErrors, failureReason: "The planner failed validation after one correction attempt." };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? `${profile === "quality" ? "14B" : "4B"} planner timed out.` : error instanceof Error ? error.message : "Planner unavailable.";
    return { status: "failed", profile, providerId: "ollama", modelId: planner.modelId, latencyMs: Math.round(performance.now() - started), correctionAttempted, validationErrors: lastErrors, failureReason: reason };
  } finally { clearTimeout(timeout); }
}
