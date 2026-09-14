import type { AnalysisResult, ApprovedLearningSpec, BlockOutcome, CompiledLessonManifest, DepthMinutes, LearningGoal, ModelProfile, P5ComposeResponse, PlanningResult, RepresentationPlanDraft } from "./types";
import type { P5ModelStatus } from "./localModel";

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const payload = await response.json() as T & { error?: string; details?: string[] };
  if (!response.ok) throw new Error([payload.error, ...(payload.details ?? [])].filter(Boolean).join(" ") || `Request failed with HTTP ${response.status}.`);
  return payload;
}
export function requestAnalysis(sourceDocumentId: string, modelProfile: ModelProfile, signal?: AbortSignal) { return post<AnalysisResult>("/api/prototype-5/analyze", { sourceDocumentId, modelProfile }, signal); }
export function requestPlan(approvedSpec: ApprovedLearningSpec, modelProfile: ModelProfile, signal?: AbortSignal) { return post<PlanningResult>("/api/prototype-5/plan", { approvedSpec, modelProfile }, signal); }
export function requestCompile(approvedSpec: ApprovedLearningSpec, approvedRepresentationPlan: RepresentationPlanDraft, approvedProposalIds: string[]) { return post<{ manifest: CompiledLessonManifest }>("/api/prototype-5/compile", { approvedSpec, approvedRepresentationPlan, approvedProposalIds }); }
export function requestP5Composition(compiledManifest: CompiledLessonManifest, goal: LearningGoal, depthMinutes: DepthMinutes, evidenceLog: BlockOutcome[], signal?: AbortSignal) { return post<P5ComposeResponse>("/api/prototype-5/compose", { compiledManifest, goal, depthMinutes, evidenceLog }, signal); }
export async function requestP5ModelStatus(signal?: AbortSignal) {
  const response = await fetch("/api/prototype-5/status", { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`AI connection check failed with HTTP ${response.status}.`);
  return response.json() as Promise<P5ModelStatus>;
}
