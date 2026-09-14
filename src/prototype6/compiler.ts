import { validateExperienceBlueprint } from "./contracts";
import { circuitKnowledge } from "./knowledge";
import { sealExperience, verifyBlueprint } from "./receipts";
import type { CompiledExperience, LearningExperienceBlueprint, P6DesignRequest } from "./types";

export function compileExperience(blueprintCandidate: unknown, designReceipt: string, approvedStageIds?: string[]): { experience?: CompiledExperience; errors: string[] } {
  if (!blueprintCandidate || typeof blueprintCandidate !== "object") return { errors: ["Missing lesson blueprint."] };
  const blueprint = blueprintCandidate as LearningExperienceBlueprint;
  if (!verifyBlueprint(blueprint, designReceipt)) return { errors: ["The lesson blueprint changed or its design receipt expired."] };
  const selected = approvedStageIds ? new Set(approvedStageIds) : null;
  if (selected) {
    const known = new Set(blueprint.stages.map((stage) => stage.stageId));
    if ([...selected].some((id) => !known.has(id))) return { errors: ["Review approval references an unknown stage."] };
  }
  const filtered: LearningExperienceBlueprint = selected ? {
    ...blueprint,
    stages: blueprint.stages.filter((stage) => selected.has(stage.stageId)),
    initialSequenceStageIds: blueprint.initialSequenceStageIds.filter((id) => selected.has(id)),
  } : blueprint;
  const request: P6DesignRequest = { schemaVersion: "p6-design-request-1", sourcePackageId: filtered.sourcePackageId, ...filtered.designProfile };
  const validation = validateExperienceBlueprint(filtered, request, circuitKnowledge);
  if (!validation.blueprint || validation.errors.length) return { errors: validation.errors };
  const checked = validation.blueprint;
  const experience: CompiledExperience = {
    schemaVersion: "p6-compiled-experience-1", id: `experience-${checked.sourcePackageId}-${checked.designProfile.goal}-${checked.designProfile.depthMinutes}`,
    sourcePackageId: checked.sourcePackageId, designProfile: checked.designProfile, lessonTitle: checked.lessonTitle.text, persistentSceneId: checked.persistentSceneId,
    stages: checked.stages.map((stage) => ({ ...stage, title: stage.copy.title.text, instruction: stage.copy.instruction.text, explanation: stage.copy.explanation?.text, correctFeedback: stage.copy.correctFeedback?.text, incorrectFeedback: stage.copy.incorrectFeedback?.text })),
    initialSequenceStageIds: checked.initialSequenceStageIds, finalApplicationStageId: checked.finalApplicationStageId, representationGaps: checked.representationGaps, designSummary: checked.designSummary,
    provenanceReceipt: checked.stages.map((stage) => ({ stageId: stage.stageId, factIds: stage.sourceFactIds, relationshipIds: stage.sourceRelationshipIds })),
  };
  return { experience: sealExperience(experience), errors: [] };
}
