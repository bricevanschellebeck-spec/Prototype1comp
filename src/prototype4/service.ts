import { buildComposerInput, composeDeterministic, expandModelSelection, parseModelJson, validateBlueprint } from "./composer";
import type { ApiComposeRequest, ComposeResponse } from "./types";
import { OllamaComposer } from "./providers";

export async function composeSafely(request: ApiComposeRequest, options?: { temperature?: number }): Promise<ComposeResponse> {
  const started = performance.now();
  const { input, evidenceErrors } = buildComposerInput(request);
  const fallback = composeDeterministic(input);
  const base = {
    candidateBlockIds: input.legalCandidates.map((candidate) => candidate.id),
    latencyMs: 0,
  };

  if (evidenceErrors.length) {
    return {
      blueprint: fallback, source: "deterministic-fallback", providerId: "deterministic", model: null,
      ...base, latencyMs: Math.round(performance.now() - started), validationErrors: evidenceErrors,
      fallbackReason: "The submitted evidence was not valid for this trusted lesson.",
      rawMetrics: { received: false, parsed: false, schemaValid: false, semanticValid: false },
    };
  }

  if ((process.env.P4_COMPOSER_PROVIDER ?? "ollama") === "deterministic") {
    return {
      blueprint: fallback, source: "deterministic-fallback", providerId: "deterministic", model: null,
      ...base, latencyMs: Math.round(performance.now() - started), validationErrors: [],
      fallbackReason: "Prototype 4 is configured for deterministic composition.",
      rawMetrics: { received: false, parsed: false, schemaValid: false, semanticValid: false },
    };
  }

  const timeoutMs = Math.max(2_000, Math.min(90_000, Number(process.env.P4_COMPOSER_TIMEOUT_MS ?? 45_000)));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let received = false;
  let parsed = false;
  try {
    const provider = new OllamaComposer();
    let correction: { validationErrors: string[]; previousContent: string } | undefined;
    let lastErrors: string[] = [];
    let lastSchemaValid = false;
    let model = provider.model;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await provider.compose(input, {
        signal: controller.signal,
        temperature: options?.temperature,
        correction,
      });
      received = true;
      const envelope = raw as { content?: string; model?: string };
      const content = envelope.content ?? "";
      model = envelope.model ?? provider.model;
      let candidate: unknown;
      try {
        candidate = expandModelSelection(parseModelJson(content), input);
        parsed = true;
      } catch {
        lastErrors = ["Composer returned invalid JSON."];
        lastSchemaValid = false;
        correction = { validationErrors: lastErrors, previousContent: content };
        continue;
      }

      const validation = validateBlueprint(candidate, input);
      lastErrors = validation.errors;
      lastSchemaValid = validation.schemaValid;
      if (validation.valid && validation.blueprint) {
        return {
          blueprint: validation.blueprint, source: "ollama", providerId: "ollama", model,
          ...base, latencyMs: Math.round(performance.now() - started), validationErrors: [],
          rawMetrics: { received, parsed, schemaValid: true, semanticValid: true },
        };
      }
      correction = { validationErrors: validation.errors, previousContent: content };
    }

    return {
      blueprint: fallback, source: "deterministic-fallback", providerId: "ollama", model,
      ...base, latencyMs: Math.round(performance.now() - started), validationErrors: lastErrors,
      fallbackReason: parsed ? "The AI blueprint failed deterministic validation after one correction attempt." : "The AI response could not be parsed after one correction attempt.",
      rawMetrics: { received, parsed, schemaValid: lastSchemaValid, semanticValid: false },
    };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "The local composer timed out." : error instanceof Error ? error.message : "The local composer was unavailable.";
    return {
      blueprint: fallback, source: "deterministic-fallback", providerId: "ollama", model: process.env.OLLAMA_MODEL?.trim() ?? "qwen3:4b-instruct",
      ...base, latencyMs: Math.round(performance.now() - started), validationErrors: [], fallbackReason: reason,
      rawMetrics: { received, parsed, schemaValid: false, semanticValid: false },
    };
  } finally {
    clearTimeout(timeout);
  }
}
