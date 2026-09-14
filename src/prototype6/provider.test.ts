import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { experienceBlueprintSchema } from "./contracts";
import { buildGeminiRequestBody, GeminiP6Provider, resolveP6ProviderId } from "./provider";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
});

describe("Prototype 6 AI providers", () => {
  it("selects Gemini explicitly and otherwise recognizes a configured key", () => {
    expect(resolveP6ProviderId({ P6_AI_PROVIDER: "gemini" })).toBe("gemini");
    expect(resolveP6ProviderId({ P6_AI_PROVIDER: "ollama" })).toBe("ollama");
    expect(resolveP6ProviderId({ GEMINI_API_KEY: "local-secret" })).toBe("gemini");
    expect(() => resolveP6ProviderId({ P6_AI_PROVIDER: "unknown" })).toThrow("gemini");
  });

  it("builds a structured Gemini request without unsupported schema keywords", () => {
    const body = buildGeminiRequestBody({
      system: "Return JSON.",
      prompt: "Design a lesson.",
      maxTokens: 500,
      thinkingBudget: 128,
      format: { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties: { id: { const: "lesson", minLength: 2 } }, required: ["id"] },
    }, "gemini-2.5-flash");
    expect(body.generationConfig.maxOutputTokens).toBe(628);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 128 });
    expect(JSON.stringify(body.generationConfig.responseJsonSchema)).not.toContain("minLength");
    expect(JSON.stringify(body.generationConfig.responseJsonSchema)).toContain('"enum":["lesson"]');
  });

  it("uses Gemini 3 thinking levels instead of the retired 2.5 token setting", () => {
    const body = buildGeminiRequestBody({ system: "System", prompt: "Prompt", format: { type: "object" }, thinkingBudget: 1024 }, "gemini-3.5-flash-lite");
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "low" });
  });

  it("converts the complete P6 blueprint to Gemini's supported JSON Schema subset", () => {
    const body = buildGeminiRequestBody({ system: "System", prompt: "Prompt", format: z.toJSONSchema(experienceBlueprintSchema) as Record<string, unknown> });
    const allowed = new Set(["$id", "$defs", "$ref", "$anchor", "type", "format", "title", "description", "enum", "items", "prefixItems", "minItems", "maxItems", "minimum", "maximum", "anyOf", "oneOf", "properties", "additionalProperties", "required"]);
    const unsupported = new Set<string>();
    const inspect = (value: unknown) => {
      if (Array.isArray(value)) { value.forEach(inspect); return; }
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (!allowed.has(key)) unsupported.add(key);
        if (key === "properties" || key === "$defs") Object.values(child as Record<string, unknown>).forEach(inspect);
        else inspect(child);
      }
    };
    inspect(body.generationConfig.responseJsonSchema);
    expect([...unsupported]).toEqual([]);
  });

  it("sends the key only in the server request header and returns structured text", async () => {
    process.env.GEMINI_API_KEY = "private-test-key";
    process.env.GEMINI_MODEL = "gemini-test";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] }, finishReason: "STOP" }] }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new GeminiP6Provider().generate({ system: "System", prompt: "Prompt", format: { type: "object" }, thinkingBudget: 0 });
    expect(result).toEqual({ content: '{"ok":true}', model: "gemini-test" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("private-test-key");
    expect(init.body).not.toContain("private-test-key");
  });
});
