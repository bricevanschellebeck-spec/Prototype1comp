// One small local model for every P5 responsibility. Legacy 14B environment
// variables deliberately have no effect while the project is in 4B-only mode.
export const P5_LOCAL_MODEL = "qwen3:4b-instruct";

export type JsonModelRequest = {
  system: string;
  prompt: string;
  format: object;
  maxTokens?: number;
  contextTokens?: number;
  signal?: AbortSignal;
};

export interface JsonModelProvider {
  readonly providerId: string;
  readonly modelId: string;
  generate(request: JsonModelRequest): Promise<{ content: string; model: string }>;
}

export type P5ModelStatus = {
  connected: boolean;
  installed: boolean;
  loaded: boolean;
  model: typeof P5_LOCAL_MODEL;
  provider: "ollama";
  message: string;
};

export async function getP5ModelStatus(): Promise<P5ModelStatus> {
  const base = (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const [tagsResponse, runningResponse] = await Promise.all([
      fetch(`${base}/api/tags`, { signal: controller.signal, cache: "no-store" }),
      fetch(`${base}/api/ps`, { signal: controller.signal, cache: "no-store" }),
    ]);
    if (!tagsResponse.ok) throw new Error(`Ollama returned HTTP ${tagsResponse.status}.`);
    const tags = await tagsResponse.json() as { models?: Array<{ name?: string; model?: string }> };
    const running = runningResponse.ok
      ? await runningResponse.json() as { models?: Array<{ name?: string; model?: string }> }
      : { models: [] };
    const hasModel = (items: Array<{ name?: string; model?: string }> | undefined) =>
      Boolean(items?.some((item) => item.name === P5_LOCAL_MODEL || item.model === P5_LOCAL_MODEL));
    const installed = hasModel(tags.models);
    const loaded = hasModel(running.models);
    return {
      connected: true,
      installed,
      loaded,
      model: P5_LOCAL_MODEL,
      provider: "ollama",
      message: installed
        ? loaded ? "Local Qwen 4B is connected and warm." : "Local Qwen 4B is connected and ready to load."
        : "Ollama is connected, but Qwen 4B is not installed.",
    };
  } catch (error) {
    return {
      connected: false,
      installed: false,
      loaded: false,
      model: P5_LOCAL_MODEL,
      provider: "ollama",
      message: error instanceof Error && error.name === "AbortError"
        ? "Ollama did not answer the connection check."
        : "Ollama is not reachable from the P5 server.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Shared across requests and development hot reloads. Reject concurrent work
// instead of loading multiple generations into a CPU-only machine.
const runtime = globalThis as typeof globalThis & { p5ModelBusy?: boolean };

export class LocalModelProvider implements JsonModelProvider {
  readonly providerId = "ollama";
  readonly modelId = P5_LOCAL_MODEL;

  async generate(request: JsonModelRequest) {
    if (runtime.p5ModelBusy) throw new Error("The 4B model is already working. Wait for that run to finish, then retry.");
    request.signal?.throwIfAborted();
    runtime.p5ModelBusy = true;
    try {
      const base = (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, "");
      const response = await fetch(`${base}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: request.signal, cache: "no-store",
        body: JSON.stringify({
          model: this.modelId, stream: false, think: false, format: request.format,
          keep_alive: "1m",
          messages: [{ role: "system", content: request.system }, { role: "user", content: request.prompt }],
          options: { temperature: 0.05, num_ctx: request.contextTokens ?? 4096, num_predict: request.maxTokens ?? 1800, num_thread: 2 },
        }),
      });
      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}. Check that the 4B model is installed.`);
      const payload = await response.json() as { model?: string; message?: { content?: string } };
      if (!payload.message?.content) throw new Error("The local model returned no structured content.");
      return { content: payload.message.content, model: payload.model || this.modelId };
    } finally { runtime.p5ModelBusy = false; }
  }
}

// Future API providers can implement this interface at a single entry point.
export function createP5Provider(): JsonModelProvider { return new LocalModelProvider(); }
