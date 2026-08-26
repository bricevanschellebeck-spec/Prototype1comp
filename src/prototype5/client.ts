import type { AnalysisResult, ApprovedLearningSpec, BlockOutcome, CompiledLessonManifest, DepthMinutes, LearningGoal, ModelProfile, P5ComposeResponse, PlanningResult, RepresentationPlanDraft } from "./types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as T & { error?: string; details?: string[] };
  if (!response.ok) throw new Error(payload.error || payload.details?.join(" ") || `Request failed with HTTP ${response.status}.`);
  return payload;
}
export function requestAnalysis(sourceDocumentId: string, modelProfile: ModelProfile) { return post<AnalysisResult>("/api/prototype-5/analyze", { sourceDocumentId, modelProfile }); }
export function requestPlan(approvedSpec: ApprovedLearningSpec, modelProfile: ModelProfile) { return post<PlanningResult>("/api/prototype-5/plan", { approvedSpec, modelProfile }); }
export function requestCompile(approvedSpec: ApprovedLearningSpec, approvedRepresentationPlan: RepresentationPlanDraft, approvedProposalIds: string[]) { return post<{ manifest: CompiledLessonManifest }>("/api/prototype-5/compile", { approvedSpec, approvedRepresentationPlan, approvedProposalIds }); }
export function requestP5Composition(compiledManifest: CompiledLessonManifest, goal: LearningGoal, depthMinutes: DepthMinutes, evidenceLog: BlockOutcome[]) { return post<P5ComposeResponse>("/api/prototype-5/compose", { compiledManifest, goal, depthMinutes, evidenceLog }); }
