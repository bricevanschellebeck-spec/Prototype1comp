import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { CompiledExperience, LearningExperienceBlueprint } from "./types";

function key() {
  const configured = process.env.P6_COMPILATION_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("P6_COMPILATION_SECRET is required in production.");
  return createHash("sha256").update("p6-local-development-only").update(process.cwd()).digest("hex");
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => `${JSON.stringify(name)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
function sign(kind: string, value: unknown) { return createHmac("sha256", key()).update(kind).update(canonical(value)).digest("hex"); }
function equal(a: string, b: string) { return /^[a-f0-9]{64}$/.test(a) && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex")); }
export function signBlueprint(blueprint: LearningExperienceBlueprint) { return sign("p6-blueprint", blueprint); }
export function verifyBlueprint(blueprint: LearningExperienceBlueprint, receipt: string) { return equal(receipt, signBlueprint(blueprint)); }
export function sealExperience(experience: CompiledExperience): CompiledExperience {
  const unsigned = { ...experience };
  delete unsigned.compilationReceipt;
  const body = JSON.parse(JSON.stringify(unsigned)) as CompiledExperience;
  return { ...body, compilationReceipt: sign("p6-experience", body) };
}
export function verifyExperience(candidate: unknown): candidate is CompiledExperience {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const value = candidate as CompiledExperience; if (!value.compilationReceipt) return false; const body = { ...value }; delete body.compilationReceipt;
  return equal(value.compilationReceipt, sign("p6-experience", body));
}
