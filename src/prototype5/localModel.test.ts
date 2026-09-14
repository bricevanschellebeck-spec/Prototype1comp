import { afterEach, describe, expect, it, vi } from "vitest";
import { getP5ModelStatus, LocalModelProvider, P5_LOCAL_MODEL } from "./localModel";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("P5 lightweight local provider", () => {
  it("ignores obsolete large-model overrides and limits local compute", async () => {
    vi.stubEnv("P5_PLANNER_MODEL", "qwen3:14b");
    vi.stubEnv("P5_ANALYZER_QUALITY_MODEL", "qwen3:14b");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: "{}" } })));
    vi.stubGlobal("fetch", fetchMock);
    await new LocalModelProvider().generate({ system: "test", prompt: "test", format: {} });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe(P5_LOCAL_MODEL);
    expect(body.options.num_thread).toBe(2);
    expect(body.keep_alive).toBe("1m");
    expect(body.think).toBe(false);
  });

  it("rejects concurrent generations and releases its slot on cancellation", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")), { once: true });
    })));
    const controller = new AbortController(); const provider = new LocalModelProvider();
    const first = provider.generate({ system: "test", prompt: "test", format: {}, signal: controller.signal });
    await expect(provider.generate({ system: "test", prompt: "test", format: {} })).rejects.toThrow("already working");
    controller.abort(); await expect(first).rejects.toThrow("Stopped");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: "{}" } }))));
    await expect(provider.generate({ system: "test", prompt: "test", format: {} })).resolves.toMatchObject({ content: "{}" });
  });

  it("reports whether the configured 4B model is installed and warm", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: P5_LOCAL_MODEL }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ model: P5_LOCAL_MODEL }] })));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getP5ModelStatus()).resolves.toMatchObject({
      connected: true,
      installed: true,
      loaded: true,
      model: P5_LOCAL_MODEL,
    });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://127.0.0.1:11434/api/tags",
      "http://127.0.0.1:11434/api/ps",
    ]);
  });
});
