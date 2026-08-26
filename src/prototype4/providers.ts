import { buildModelPrompt, composeDeterministic } from "./composer";
import type { ComposerInput, LearningComposer } from "./types";

export class DeterministicComposer implements LearningComposer {
  readonly providerId = "deterministic";
  async compose(input: ComposerInput) {
    return composeDeterministic(input);
  }
}

type OllamaResponse = { model?: string; message?: { content?: string } };

export class OllamaComposer implements LearningComposer {
  readonly providerId = "ollama";
  readonly model: string;
  readonly baseUrl: string;

  constructor(options?: { model?: string; baseUrl?: string }) {
    this.model = options?.model ?? process.env.OLLAMA_MODEL?.trim() ?? "qwen3:4b-instruct";
    this.baseUrl = (options?.baseUrl ?? process.env.OLLAMA_BASE_URL?.trim() ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  }

  async compose(input: ComposerInput, options?: {
    signal?: AbortSignal;
    temperature?: number;
    correction?: { validationErrors: string[]; previousContent: string };
  }) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: options?.signal,
      cache: "no-store",
      body: JSON.stringify({
        model: this.model,
        stream: false,
        think: false,
        format: "json",
        keep_alive: "10m",
        messages: [
          { role: "system", content: "You are a constrained learning-interface composer. Use only supplied IDs. Return only the requested JSON object." },
          { role: "user", content: buildModelPrompt(input, options?.correction) },
        ],
        options: { temperature: options?.temperature ?? 0.1, num_ctx: 2048, num_predict: 140 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    const payload = (await response.json()) as OllamaResponse;
    if (!payload.message?.content) throw new Error("Ollama returned no blueprint content.");
    return { content: payload.message.content, model: payload.model ?? this.model };
  }
}
