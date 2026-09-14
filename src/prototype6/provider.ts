export const P6_LOCAL_MODEL = "qwen3:4b-instruct";
export const P6_GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

export type P6ProviderId = "gemini" | "ollama";
export type JsonGenerationRequest = {
  system: string;
  prompt: string;
  format: Record<string, unknown>;
  signal?: AbortSignal;
  maxTokens?: number;
  contextTokens?: number;
  thinkingBudget?: number;
};
export interface P6ModelProvider {
  readonly providerId: P6ProviderId;
  readonly modelId: string;
  generate(request: JsonGenerationRequest): Promise<{ content: string; model: string }>;
}
export type P6ModelStatus = {
  connected: boolean;
  installed: boolean;
  loaded: boolean;
  model: string;
  provider: P6ProviderId;
  message: string;
};

type P6Environment = Record<string, string | undefined>;

const runtime = globalThis as typeof globalThis & { p6ModelQueue?: Promise<void> };

async function exclusive<T>(task: () => Promise<T>) {
  const previous = runtime.p6ModelQueue ?? Promise.resolve();
  let release = () => {};
  runtime.p6ModelQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous.catch(() => undefined);
  try { return await task(); } finally { release(); }
}

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, "");
}

function geminiModel() {
  return process.env.GEMINI_MODEL?.trim() || P6_GEMINI_DEFAULT_MODEL;
}

export function resolveP6ProviderId(environment: P6Environment = process.env): P6ProviderId {
  const requested = environment.P6_AI_PROVIDER?.trim().toLowerCase();
  if (requested === "gemini" || requested === "ollama") return requested;
  if (requested) throw new Error('P6_AI_PROVIDER must be either "gemini" or "ollama".');
  return environment.GEMINI_API_KEY?.trim() ? "gemini" : "ollama";
}

async function getOllamaStatus(): Promise<P6ModelStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const [tags, active] = await Promise.all([
      fetch(`${ollamaBaseUrl()}/api/tags`, { signal: controller.signal, cache: "no-store" }),
      fetch(`${ollamaBaseUrl()}/api/ps`, { signal: controller.signal, cache: "no-store" }),
    ]);
    if (!tags.ok) throw new Error("Ollama did not answer.");
    const installed = (await tags.json() as { models?: Array<{ name?: string; model?: string }> }).models?.some((item) => [item.name, item.model].includes(P6_LOCAL_MODEL)) ?? false;
    const loaded = active.ok && ((await active.json() as { models?: Array<{ name?: string; model?: string }> }).models?.some((item) => [item.name, item.model].includes(P6_LOCAL_MODEL)) ?? false);
    return { connected: true, installed, loaded, model: P6_LOCAL_MODEL, provider: "ollama", message: installed ? `Qwen 4B is ${loaded ? "warm" : "connected and ready to load"}.` : `Install ${P6_LOCAL_MODEL} in Ollama.` };
  } catch {
    return { connected: false, installed: false, loaded: false, model: P6_LOCAL_MODEL, provider: "ollama", message: "Ollama is not reachable on this computer." };
  } finally {
    clearTimeout(timer);
  }
}

async function getGeminiStatus(): Promise<P6ModelStatus> {
  const model = geminiModel();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { connected: false, installed: false, loaded: false, model, provider: "gemini", message: "Add GEMINI_API_KEY to .env.local, then restart the development server." };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "x-goog-api-key": apiKey },
    });
    if (!response.ok) return { connected: false, installed: true, loaded: false, model, provider: "gemini", message: `Gemini rejected the key or model (HTTP ${response.status}).` };
    return { connected: true, installed: true, loaded: true, model, provider: "gemini", message: `${model} is connected and ready.` };
  } catch {
    return { connected: false, installed: true, loaded: false, model, provider: "gemini", message: "Gemini is configured but could not be reached." };
  } finally {
    clearTimeout(timer);
  }
}

export async function getP6ModelStatus(): Promise<P6ModelStatus> {
  try {
    return resolveP6ProviderId() === "gemini" ? getGeminiStatus() : getOllamaStatus();
  } catch (error) {
    return { connected: false, installed: false, loaded: false, model: "not configured", provider: "gemini", message: error instanceof Error ? error.message : "The P6 AI provider is not configured." };
  }
}

function geminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(geminiSchema);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if (["$schema", "minLength", "maxLength", "pattern", "uniqueItems", "minProperties", "maxProperties"].includes(key)) continue;
    if (key === "const") { result.enum = [child]; continue; }
    result[key] = geminiSchema(child);
  }
  return result;
}

export function buildGeminiRequestBody(request: JsonGenerationRequest, model = geminiModel()) {
  const thinkingBudget = Math.max(0, Math.floor(request.thinkingBudget ?? 0));
  const thinkingConfig = model.startsWith("gemini-2.5")
    ? { thinkingBudget }
    : { thinkingLevel: thinkingBudget > 0 ? "low" : "minimal" };
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [{ role: "user", parts: [{ text: request.prompt }] }],
    generationConfig: {
      temperature: 0.12,
      maxOutputTokens: Math.max(256, (request.maxTokens ?? 4200) + thinkingBudget),
      responseMimeType: "application/json",
      responseJsonSchema: geminiSchema(request.format),
      thinkingConfig,
    },
  };
}

export class GeminiP6Provider implements P6ModelProvider {
  readonly providerId = "gemini" as const;
  readonly modelId = geminiModel();

  async generate(request: JsonGenerationRequest) {
    return exclusive(async () => {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing from .env.local.");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.modelId)}:generateContent`, {
        method: "POST",
        signal: request.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(buildGeminiRequestBody(request, this.modelId)),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string; details?: unknown } } | null;
        const diagnostic = payload?.error?.details ? ` ${JSON.stringify(payload.error.details).slice(0, 1200)}` : "";
        const detail = payload?.error?.message ? ` ${payload.error.message}${diagnostic}` : "";
        throw new Error(`Gemini returned HTTP ${response.status}.${detail}`);
      }
      const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
        promptFeedback?: { blockReason?: string };
      };
      const candidate = payload.candidates?.[0];
      const content = candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || "").join("") || "";
      if (!content) throw new Error(payload.promptFeedback?.blockReason ? `Gemini blocked the request: ${payload.promptFeedback.blockReason}.` : "Gemini returned no design.");
      if (candidate?.finishReason === "MAX_TOKENS") throw new Error("Gemini reached its output limit before completing the JSON design.");
      return { content, model: this.modelId };
    });
  }
}

class OllamaP6Provider implements P6ModelProvider {
  readonly providerId = "ollama" as const;
  readonly modelId = P6_LOCAL_MODEL;

  async generate(request: JsonGenerationRequest) {
    return exclusive(async () => {
      const response = await fetch(`${ollamaBaseUrl()}/api/chat`, {
        method: "POST",
        signal: request.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: this.modelId, stream: true, think: false, format: request.format, keep_alive: "2m", messages: [{ role: "system", content: request.system }, { role: "user", content: request.prompt }], options: { temperature: 0.12, num_ctx: request.contextTokens ?? 8192, num_predict: request.maxTokens ?? 4200, num_thread: 2 } }),
      });
      if (!response.ok) throw new Error(`Ollama returned ${response.status}.`);
      if (!response.body) throw new Error("Ollama returned no response stream.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let model = this.modelId;
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) if (line.trim()) {
          const chunk = JSON.parse(line) as { model?: string; message?: { content?: string }; error?: string };
          if (chunk.error) throw new Error(chunk.error);
          model = chunk.model || model;
          content += chunk.message?.content || "";
        }
        if (done) break;
      }
      if (buffer.trim()) {
        const chunk = JSON.parse(buffer) as { model?: string; message?: { content?: string }; error?: string };
        if (chunk.error) throw new Error(chunk.error);
        model = chunk.model || model;
        content += chunk.message?.content || "";
      }
      if (!content) throw new Error("Ollama returned no design.");
      return { content, model };
    });
  }
}

export function createP6Provider(): P6ModelProvider {
  return resolveP6ProviderId() === "gemini" ? new GeminiP6Provider() : new OllamaP6Provider();
}
