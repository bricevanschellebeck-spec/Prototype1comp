import { blueprintSchema } from "./contracts";
import { deriveLearnerState, validateEvidenceLog } from "./engine";
import { getLessonManifest } from "./manifests";
import type {
  ApiComposeRequest,
  ComposerInput,
  InteractiveBlock,
  LearningGoal,
  LessonBlueprint,
  LessonManifest,
} from "./types";

export function maximumSteps(depth: ApiComposeRequest["depthMinutes"], supportNeed: ComposerInput["learnerState"]["supportNeed"]) {
  if (supportNeed === "strong") return 4;
  return depth === 5 ? 3 : depth === 15 ? 5 : 6;
}

export function getLegalCandidates(manifest: LessonManifest, learnerState: ComposerInput["learnerState"]): InteractiveBlock[] {
  const completed = new Set(learnerState.completedBlockIds);
  return manifest.blocks.filter((block) => {
    if (completed.has(block.id)) return false;
    if (learnerState.supportNeed !== "strong" && block.role === "support") return false;
    if (learnerState.supportNeed === "strong" && block.role === "explore") return false;
    return block.prerequisiteObjectiveIds.every((id) => learnerState.objectiveStatus[id] === "secure");
  });
}

export function buildComposerInput(request: ApiComposeRequest): { input: ComposerInput; evidenceErrors: string[] } {
  const manifest = getLessonManifest(request.lessonId);
  const evidenceErrors = validateEvidenceLog(manifest, request.evidenceLog);
  const learnerState = deriveLearnerState(manifest, evidenceErrors.length ? [] : request.evidenceLog);
  const legalCandidates = getLegalCandidates(manifest, learnerState);
  return {
    evidenceErrors,
    input: {
      schemaVersion: "p4-composer-input-1",
      phase: request.evidenceLog.length ? "adapt" : "initial",
      goal: request.goal,
      depthMinutes: request.depthMinutes,
      lesson: {
        id: manifest.id,
        subject: manifest.subject,
        objectiveIds: manifest.objectiveIds,
        sourceBlocks: manifest.sourceBlocks.map(({ id, factIds }) => ({ id, factIds })),
      },
      learnerState,
      legalCandidates: legalCandidates.map((block) => ({
        id: block.id,
        primitiveId: block.primitiveId,
        role: block.role,
        objectiveIds: block.objectiveIds,
        sourceBlockIds: block.sourceBlockIds,
        prerequisiteObjectiveIds: block.prerequisiteObjectiveIds,
        dependsOnBlockIds: block.dependsOnBlockIds,
        estimatedMinutes: block.estimatedMinutes,
        difficulty: block.difficulty,
        allowedReasonCodes: block.allowedReasonCodes,
        defaultReasonCode: block.defaultReasonCode,
      })),
      constraints: {
        maximumSteps: maximumSteps(request.depthMinutes, learnerState.supportNeed),
        evidenceWithinFirstSteps: 2,
        doNotRepeatCompletedBlocks: true,
        finishWithRoles: ["apply", "transfer"],
        requiredPreserveSourceBlockIds: manifest.visibility.requiredPreserveSourceBlockIds,
        allowedDelaySourceBlockIds: manifest.visibility.allowedDelaySourceBlockIds,
      },
    },
  };
}

function fallbackPath(manifest: LessonManifest, input: ComposerInput): string[] {
  if (input.phase === "adapt") {
    return input.learnerState.supportNeed === "strong"
      ? manifest.fallbackPaths.supportAdapt
      : manifest.fallbackPaths.secureAdapt;
  }
  return manifest.fallbackPaths[input.goal as LearningGoal];
}

export function composeDeterministic(input: ComposerInput): LessonBlueprint {
  const manifest = getLessonManifest(input.lesson.id);
  const legal = new Set(input.legalCandidates.map((candidate) => candidate.id));
  const path = fallbackPath(manifest, input)
    .filter((id) => legal.has(id))
    .slice(0, input.constraints.maximumSteps);
  const blocks = new Map(manifest.blocks.map((block) => [block.id, block]));
  return {
    blueprintVersion: "p4-1",
    lessonId: manifest.id,
    objectiveIds: [...new Set(path.flatMap((id) => blocks.get(id)?.objectiveIds ?? []))],
    preserveSourceBlockIds: manifest.visibility.requiredPreserveSourceBlockIds,
    delaySourceBlockIds: manifest.visibility.defaultDelaySourceBlockIds,
    remainingSteps: path.map((blockId) => ({
      blockId,
      reasonCode: blocks.get(blockId)?.defaultReasonCode ?? "confirm-transfer",
    })),
  };
}

export function validateBlueprint(candidate: unknown, input: ComposerInput): { valid: boolean; errors: string[]; blueprint?: LessonBlueprint; schemaValid: boolean } {
  const parsed = blueprintSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      valid: false,
      schemaValid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "blueprint"}: ${issue.message}`),
    };
  }
  const blueprint = parsed.data as LessonBlueprint;
  const manifest = getLessonManifest(input.lesson.id);
  const sourceIds = new Set(manifest.sourceBlocks.map((block) => block.id));
  const legal = new Map(input.legalCandidates.map((block) => [block.id, block]));
  const completed = new Set(input.learnerState.completedBlockIds);
  const selected = blueprint.remainingSteps.map((step) => step.blockId);
  const errors: string[] = [];

  if (blueprint.lessonId !== manifest.id) errors.push("Blueprint lesson does not match the requested lesson.");
  if (selected.length > input.constraints.maximumSteps) errors.push("Blueprint exceeds the step limit.");
  if (new Set(selected).size !== selected.length) errors.push("Interactive blocks may not repeat.");
  if (new Set(blueprint.objectiveIds).size !== blueprint.objectiveIds.length) errors.push("Objectives may not repeat.");
  for (const objectiveId of blueprint.objectiveIds) if (!manifest.objectiveIds.includes(objectiveId)) errors.push(`Unknown lesson objective ${objectiveId}.`);

  for (const sourceId of [...blueprint.preserveSourceBlockIds, ...blueprint.delaySourceBlockIds]) if (!sourceIds.has(sourceId)) errors.push(`Unknown trusted source block ${sourceId}.`);
  for (const required of input.constraints.requiredPreserveSourceBlockIds) if (!blueprint.preserveSourceBlockIds.includes(required)) errors.push(`Required source block ${required} was not preserved.`);
  for (const delayed of blueprint.delaySourceBlockIds) if (!input.constraints.allowedDelaySourceBlockIds.includes(delayed)) errors.push(`Source block ${delayed} may not be delayed.`);
  if (blueprint.preserveSourceBlockIds.some((id) => blueprint.delaySourceBlockIds.includes(id))) errors.push("A source block cannot be preserved and delayed simultaneously.");

  for (let index = 0; index < blueprint.remainingSteps.length; index += 1) {
    const step = blueprint.remainingSteps[index];
    const block = legal.get(step.blockId);
    if (!block) {
      errors.push(`Block is not a legal candidate: ${step.blockId}.`);
      continue;
    }
    if (completed.has(step.blockId)) errors.push(`Completed block was selected again: ${step.blockId}.`);
    if (!block.allowedReasonCodes.includes(step.reasonCode)) errors.push(`${step.reasonCode} is not allowed for ${step.blockId}.`);
    for (const dependency of block.dependsOnBlockIds) {
      if (!completed.has(dependency) && selected.indexOf(dependency) >= index) errors.push(`${step.blockId} appears before dependency ${dependency}.`);
      if (!completed.has(dependency) && !selected.includes(dependency)) errors.push(`${step.blockId} is missing dependency ${dependency}.`);
    }
  }

  const selectedBlocks = selected.map((id) => legal.get(id)).filter(Boolean) as ComposerInput["legalCandidates"];
  const last = selectedBlocks.at(-1);
  if (!last || !input.constraints.finishWithRoles.includes(last.role as "apply" | "transfer")) errors.push("The path must finish with application or transfer.");
  if (input.phase === "initial" && !selectedBlocks.slice(0, input.constraints.evidenceWithinFirstSteps).some((block) => block.role === "evidence")) errors.push("Initial composition must collect evidence within its first two steps.");
  if (input.learnerState.supportNeed === "strong") {
    if (selectedBlocks[0]?.role !== "support" || !selectedBlocks.slice(0, 2).every((block) => block.role === "support")) errors.push("Strong support must begin with comparison and guided retry.");
  } else if (selectedBlocks.some((block) => block.role === "support")) {
    errors.push("Support-only blocks cannot follow secure evidence.");
  }

  return { valid: errors.length === 0, schemaValid: true, errors, blueprint };
}

export function parseModelJson(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Composer returned no JSON object.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

export function expandModelSelection(candidate: unknown, input: ComposerInput): unknown {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;
  const root = candidate as Record<string, unknown>;
  const nested = root.blueprint && typeof root.blueprint === "object" && !Array.isArray(root.blueprint)
    ? root.blueprint as Record<string, unknown>
    : undefined;
  const selection = [
    root.steps,
    root.path,
    nested?.steps,
    nested?.path,
    root.remainingSteps,
    nested?.remainingSteps,
  ].find(Array.isArray);
  if (!selection) return candidate;
  const selectedIds = selection.map((step) => {
    if (typeof step === "string") return step;
    if (!step || typeof step !== "object" || Array.isArray(step)) return undefined;
    const item = step as Record<string, unknown>;
    return typeof item.id === "string" ? item.id : typeof item.blockId === "string" ? item.blockId : undefined;
  }).filter((id): id is string => typeof id === "string");
  if (!selectedIds.length) return candidate;
  const delayValue = root.delay ?? root.delaySourceBlockIds ?? nested?.delay ?? nested?.delaySourceBlockIds;
  const candidates = new Map(input.legalCandidates.map((block) => [block.id, block]));
  return {
    blueprintVersion: "p4-1",
    lessonId: input.lesson.id,
    objectiveIds: [...new Set(selectedIds.flatMap((id) => candidates.get(id)?.objectiveIds ?? []))],
    preserveSourceBlockIds: input.constraints.requiredPreserveSourceBlockIds,
    delaySourceBlockIds: Array.isArray(delayValue) ? delayValue.filter((id): id is string => typeof id === "string") : [],
    remainingSteps: selectedIds.map((blockId) => ({ blockId, reasonCode: candidates.get(blockId)?.defaultReasonCode })),
  };
}

export function buildModelPrompt(
  input: ComposerInput,
  correction?: { validationErrors: string[]; previousContent: string },
) {
  const finishingCandidateIds = input.legalCandidates
    .filter((candidate) => input.constraints.finishWithRoles.includes(candidate.role as "apply" | "transfer"))
    .map((candidate) => candidate.id);
  return JSON.stringify({
    contract: "p4-1",
    task: `Choose a coherent path containing no more than ${input.constraints.maximumSteps} total step IDs. Count the IDs before responding.`,
    lesson: input.lesson.id,
    phase: input.phase,
    goal: input.goal,
    minutes: input.depthMinutes,
    objectives: input.lesson.objectiveIds,
    learner: {
      status: input.learnerState.objectiveStatus,
      misconceptions: input.learnerState.activeMisconceptionIds,
      completed: input.learnerState.completedBlockIds,
      recent: input.learnerState.recentResults,
      support: input.learnerState.supportNeed,
    },
    candidates: input.legalCandidates.map((candidate) => ({
      id: candidate.id,
      primitive: candidate.primitiveId,
      role: candidate.role,
      objectives: candidate.objectiveIds,
      depends: candidate.dependsOnBlockIds,
    })),
    rules: {
      maximumTotalSteps: input.constraints.maximumSteps,
      neverExceedMaximumTotalSteps: true,
      evidenceByStep: input.constraints.evidenceWithinFirstSteps,
      finish: input.constraints.finishWithRoles,
      finalStepMustBeOneOf: finishingCandidateIds,
      supportFirst: input.learnerState.supportNeed === "strong"
        ? input.legalCandidates.filter((candidate) => candidate.role === "support").map((candidate) => candidate.id)
        : [],
      preserve: input.constraints.requiredPreserveSourceBlockIds,
      mayDelay: input.constraints.allowedDelaySourceBlockIds,
      noCompletedOrDuplicates: true,
    },
    correction: correction ? {
      instruction: `The previous answer was rejected. Return a corrected answer with at most ${input.constraints.maximumSteps} total steps.`,
      validationErrors: correction.validationErrors,
      previousRejectedAnswer: correction.previousContent.slice(0, 2_000),
    } : undefined,
    returnOnly: {
      exactShape: { steps: ["candidate ID in chosen order"], delay: ["allowed source ID"] },
      stepCountRange: `1-${input.constraints.maximumSteps}`,
      noExplanation: true,
      forbiddenKeys: ["blueprint", "path", "count", "remainingSteps"],
    },
  });
}
