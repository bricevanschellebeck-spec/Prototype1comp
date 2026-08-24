import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildOllamaPrompt,
  composeP3Fallback,
  getP3CandidateBlockIds,
  normalizeP3Blueprint,
  validateP3Blueprint,
} from "@/src/prototype3/composer";
import {
  p3ComposeRequestSchema,
  p3LessonBlueprintSchema,
  type P3ComposeResponse,
} from "@/src/prototype3/composerContracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OllamaChatResponse = {
  model?: string;
  message?: { content?: string };
};

function fallbackResponse(
  request: z.infer<typeof p3ComposeRequestSchema>,
  reason: string,
  validationErrors: string[] = [],
) {
  const response: P3ComposeResponse = {
    blueprint: composeP3Fallback(request),
    source: "deterministic-fallback",
    model: null,
    candidateBlockIds: getP3CandidateBlockIds(request),
    validationErrors,
    fallbackReason: reason,
  };
  return NextResponse.json(response);
}

export async function POST(httpRequest: Request) {
  try {
    const contentLength = Number(httpRequest.headers.get("content-length") ?? "0");
    if (contentLength > 24_000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const parsedRequest = p3ComposeRequestSchema.safeParse(await httpRequest.json());
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid composition request.",
          details: parsedRequest.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        },
        { status: 400 },
      );
    }

    const request = parsedRequest.data;
    const model = process.env.OLLAMA_MODEL?.trim() || "qwen3:4b-instruct";
    const baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, "");
    const controller = new AbortController();
    // A small local model can need extra time for its first cold load. Later
    // requests are normally faster because Ollama keeps the model resident.
    const timeoutId = setTimeout(() => controller.abort(), 75_000);

    try {
      const ollamaResponse = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({
          model,
          stream: false,
          format: z.toJSONSchema(p3LessonBlueprintSchema),
          messages: [
            {
              role: "system",
              content: "You are a constrained learning-interface composer. Select only supplied block IDs. Never invent curriculum, explanations, resources, or UI code. Return only the requested JSON object.",
            },
            { role: "user", content: buildOllamaPrompt(request) },
          ],
          keep_alive: "10m",
          options: { temperature: 0.1, num_predict: 260 },
        }),
      });

      if (!ollamaResponse.ok) {
        return fallbackResponse(request, `Ollama returned HTTP ${ollamaResponse.status}.`);
      }

      const ollama = (await ollamaResponse.json()) as OllamaChatResponse;
      const content = ollama.message?.content;
      if (!content) return fallbackResponse(request, "Ollama returned no structured blueprint.");

      let candidate: unknown;
      try {
        candidate = JSON.parse(content);
      } catch {
        return fallbackResponse(request, "Ollama returned invalid JSON.");
      }

      const validation = validateP3Blueprint(candidate, request);
      if (!validation.valid || !validation.blueprint) {
        return fallbackResponse(request, "The AI blueprint failed deterministic validation.", validation.errors);
      }

      const response: P3ComposeResponse = {
        blueprint: normalizeP3Blueprint(validation.blueprint, request),
        source: "ollama",
        model: ollama.model ?? model,
        candidateBlockIds: getP3CandidateBlockIds(request),
        validationErrors: [],
      };
      return NextResponse.json(response);
    } catch (error) {
      const reason = error instanceof Error && error.name === "AbortError"
        ? "Ollama composition timed out."
        : "The local Ollama service was unavailable.";
      return fallbackResponse(request, reason);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return NextResponse.json({ error: "The request body was not valid JSON." }, { status: 400 });
  }
}
