import type { BlockOutcome, CompiledExperience, LearningExperienceBlueprint, P6DesignRequest, P6DesignResponse, P6PathResponse } from "./types";
import type { P6ModelStatus } from "./provider";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init); const body = await response.json();
  if (!response.ok) throw new Error(body.error || body.errors?.join(" ") || `Request failed (${response.status}).`);
  return body as T;
}
export function getP6Status() { return request<P6ModelStatus>("/api/prototype-6/status"); }
export function requestP6Design(body: P6DesignRequest, signal?: AbortSignal) { return request<P6DesignResponse>("/api/prototype-6/design", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal }); }
export function requestP6Compile(blueprint: LearningExperienceBlueprint, designReceipt: string, approvedStageIds?: string[]) { return request<{ experience: CompiledExperience }>("/api/prototype-6/compile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ blueprint, designReceipt, approvedStageIds }) }); }
export function requestP6Composition(compiledExperience: CompiledExperience, evidenceLog: BlockOutcome[], signal?: AbortSignal) { return request<P6PathResponse>("/api/prototype-6/compose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ compiledExperience, evidenceLog }), signal }); }
