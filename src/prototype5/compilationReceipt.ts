import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CompiledLessonManifest } from "./types";

// Server-only proof that this exact manifest passed the compilation endpoint.
// A local restart invalidates old receipts; a deployment can configure a stable key.
const runtime = globalThis as typeof globalThis & { p5SigningKey?: string };
function key() {
  return process.env.P5_COMPILATION_SECRET?.trim() || (runtime.p5SigningKey ??= randomBytes(32).toString("hex"));
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => `${JSON.stringify(name)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
function digest(manifest: Record<string, unknown>) {
  const body = { ...manifest }; delete body.compilationReceipt;
  return createHmac("sha256", key()).update(canonical(body)).digest("hex");
}
export function sealCompilation(manifest: CompiledLessonManifest): CompiledLessonManifest {
  return { ...manifest, compilationReceipt: digest(manifest as unknown as Record<string, unknown>) };
}
export function hasValidCompilationReceipt(candidate: unknown): candidate is CompiledLessonManifest {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const value = candidate as Record<string, unknown>;
  if (typeof value.compilationReceipt !== "string" || !/^[a-f0-9]{64}$/.test(value.compilationReceipt)) return false;
  return timingSafeEqual(Buffer.from(value.compilationReceipt, "hex"), Buffer.from(digest(value), "hex"));
}
