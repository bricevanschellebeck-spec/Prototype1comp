import {
  lessonBlueprintSchema,
  type LessonBlueprint,
  type LearningBlock,
  type ValidationResult,
} from "../domain/contracts";

export function validateBlueprint(
  candidate: unknown,
  catalog: LearningBlock[],
  options: {
    topicId: string;
    requiredObjectiveIds: string[];
    targetMinutes: number;
    maximumSteps: number;
    unavailableBlockIds: string[];
  },
): ValidationResult & { blueprint?: LessonBlueprint } {
  const parsed = lessonBlueprintSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "blueprint"}: ${issue.message}`,
      ),
      estimatedMinutes: 0,
    };
  }

  const blueprint = parsed.data;
  const catalogById = new Map(catalog.map((block) => [block.id, block]));
  const errors: string[] = [];

  if (blueprint.topicId !== options.topicId) {
    errors.push(`Blueprint topic must be ${options.topicId}.`);
  }

  if (blueprint.steps.length > options.maximumSteps) {
    errors.push(`Blueprint exceeds the ${options.maximumSteps}-step limit.`);
  }

  const selectedBlocks = blueprint.steps
    .map((step) => {
      const block = catalogById.get(step.blockId);
      if (!block) {
        errors.push(`Unknown block: ${step.blockId}.`);
        return undefined;
      }

      if (options.unavailableBlockIds.includes(step.blockId)) {
        errors.push(`Unavailable block selected: ${step.blockId}.`);
      }

      if (step.purpose !== block.purpose) {
        errors.push(
          `${step.blockId} has purpose ${block.purpose}, not ${step.purpose}.`,
        );
      }

      const supportsRequiredObjective = block.objectiveIds.some((objectiveId) =>
        options.requiredObjectiveIds.includes(objectiveId),
      );
      if (!supportsRequiredObjective) {
        errors.push(`${step.blockId} does not support a required objective.`);
      }

      return block;
    })
    .filter((block): block is LearningBlock => Boolean(block));

  const uniqueBlockIds = new Set(blueprint.steps.map((step) => step.blockId));
  if (uniqueBlockIds.size !== blueprint.steps.length) {
    errors.push("A block may not appear more than once in Prototype 1.");
  }

  for (const objectiveId of options.requiredObjectiveIds) {
    if (!blueprint.objectiveIds.includes(objectiveId)) {
      errors.push(`Required objective missing from blueprint: ${objectiveId}.`);
    }
  }

  const hasEntryExperience = selectedBlocks.some((block) =>
    ["introduce", "explore"].includes(block.purpose),
  );
  if (!hasEntryExperience) {
    errors.push("Lesson requires an introduction or exploration block.");
  }

  if (!uniqueBlockIds.has(blueprint.completionCheckBlockId)) {
    errors.push("Completion check must appear in the lesson sequence.");
  } else {
    const completionBlock = catalogById.get(blueprint.completionCheckBlockId);
    if (completionBlock?.componentType !== "challenge") {
      errors.push("Completion check must be a registered challenge block.");
    }
  }

  const estimatedMinutes = selectedBlocks.reduce(
    (total, block) => total + block.estimatedMinutes,
    0,
  );
  if (estimatedMinutes > options.targetMinutes + 1) {
    errors.push(
      `Lesson takes about ${estimatedMinutes} minutes, exceeding the target tolerance.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    estimatedMinutes,
    blueprint,
  };
}
