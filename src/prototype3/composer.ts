import {
  type WorkspaceBlockId,
  workspaceBlockCatalog,
  workspaceBlockCatalogById,
} from "./catalog";
import {
  type P3ComposeRequest,
  type P3LessonBlueprint,
  p3LessonBlueprintSchema,
} from "./composerContracts";
import { OBJECTIVES } from "./curriculum";
import type { LearnerState } from "./domain";
import { createInitialLearnerState } from "./engine";
import {
  P3_SOURCE_LESSON_ID,
  resistanceSourceLesson,
  textbookBlockIds,
  trustedFactIds,
  type TextbookBlockId,
} from "./sourceLesson";

const IDS = {
  prediction: "predict-resistance-change",
  manipulate: "manipulate-resistance",
  graph: "generate-current-graph",
  compare: "compare-current-paths",
  retry: "guided-resistance-retry",
  formula: "formula-from-measurements",
  target: "reach-target-current",
  transfer: "design-transfer-circuit",
} as const satisfies Record<string, WorkspaceBlockId>;

const supportIds = new Set<WorkspaceBlockId>([IDS.compare, IDS.retry]);
const applicationIds = new Set<WorkspaceBlockId>([IDS.target, IDS.transfer, IDS.formula]);

export function createP3InitialLearnerState(): LearnerState {
  const state = createInitialLearnerState();
  return {
    ...state,
    objectiveStatus: {
      ...state.objectiveStatus,
      [OBJECTIVES.circuit]: "secure",
      [OBJECTIVES.voltage]: "secure",
    },
  };
}

function needsSupport(request: P3ComposeRequest) {
  return Boolean(
    request.lastOutcome &&
      (request.lastOutcome.correct === false ||
        request.lastOutcome.attempts > 1 ||
        request.lastOutcome.hintUsed ||
        request.lastOutcome.misconceptionIds.length > 0),
  );
}

export function getP3CandidateBlockIds(request: P3ComposeRequest): WorkspaceBlockId[] {
  const completed = new Set(request.completedBlockIds);
  const candidates = request.phase === "initial"
    ? workspaceBlockCatalog.map((block) => block.id)
    : needsSupport(request)
      ? [IDS.compare, IDS.retry, IDS.graph, IDS.formula, IDS.target, IDS.transfer]
      : [IDS.graph, IDS.formula, IDS.target, IDS.transfer];
  return candidates.filter((id) => !completed.has(id));
}

function maximumSteps(request: P3ComposeRequest) {
  if (request.phase === "adapt" && needsSupport(request)) return 4;
  return request.depth === 5 ? 3 : 5;
}

function step(
  blockId: WorkspaceBlockId,
  reasonCode: P3LessonBlueprint["remainingSteps"][number]["reasonCode"],
) {
  return { blockId, reasonCode };
}

function sourceVisibility(steps: WorkspaceBlockId[]) {
  const formulaSelected = steps.includes(IDS.formula) || steps.includes(IDS.target);
  return {
    preserveSourceBlockIds: ["concept-voltage"] as TextbookBlockId[],
    delaySourceBlockIds: formulaSelected
      ? (["ohms-law", "worked-example"] as TextbookBlockId[])
      : ([] as TextbookBlockId[]),
  };
}

export function composeP3Fallback(request: P3ComposeRequest): P3LessonBlueprint {
  let remainingSteps: P3LessonBlueprint["remainingSteps"];
  let compositionSummary: string;

  if (request.phase === "adapt" && needsSupport(request)) {
    remainingSteps = [
      step(IDS.compare, "respond-to-misconception"),
      step(IDS.retry, "test-through-manipulation"),
      step(IDS.graph, "offer-alternate-representation"),
      step(IDS.target, "confirm-transfer"),
    ];
    compositionSummary = "The prediction revealed a misconception, so the unfinished workspace inserts a visual comparison and guided retry before graphing and application.";
  } else if (request.phase === "adapt") {
    remainingSteps = [
      step(IDS.graph, "offer-alternate-representation"),
      step(IDS.formula, "connect-observation-to-symbols"),
      step(IDS.target, "confirm-transfer"),
    ];
    if (request.depth === 30 || request.goal === "test") {
      remainingSteps = [
        step(IDS.graph, "offer-alternate-representation"),
        step(IDS.formula, "connect-observation-to-symbols"),
        step(IDS.target, "increase-challenge"),
        step(IDS.transfer, "confirm-transfer"),
      ];
    }
    compositionSummary = "Secure first-attempt evidence lets the workspace skip support and move directly from an experimental graph to symbols and application.";
  } else if (request.goal === "revise" && request.depth === 5) {
    remainingSteps = [
      step(IDS.prediction, "elicit-existing-model"),
      step(IDS.target, "increase-challenge"),
      step(IDS.formula, "connect-observation-to-symbols"),
    ];
    compositionSummary = "A short revision path checks the idea, applies it to the target, then connects the learner's result to the formula.";
  } else if (request.goal === "test") {
    remainingSteps = [
      step(IDS.prediction, "elicit-existing-model"),
      step(IDS.target, "increase-challenge"),
      step(IDS.transfer, "confirm-transfer"),
    ];
    compositionSummary = "The test-preparation path begins with evidence and quickly moves into two applications of the trusted relationship.";
  } else {
    remainingSteps = [
      step(IDS.prediction, "elicit-existing-model"),
      step(IDS.manipulate, "test-through-manipulation"),
      step(IDS.graph, "offer-alternate-representation"),
      step(IDS.formula, "connect-observation-to-symbols"),
      step(IDS.target, "confirm-transfer"),
    ].slice(0, maximumSteps(request));
    compositionSummary = "Begin with a prediction, test it on the circuit, build the graph from observations, then introduce the formula before application.";
  }

  remainingSteps = remainingSteps
    .filter((item) => !request.completedBlockIds.includes(item.blockId))
    .slice(0, maximumSteps(request));
  const visibility = sourceVisibility(remainingSteps.map((item) => item.blockId as WorkspaceBlockId));

  return {
    blueprintVersion: "p3-2",
    sourceLessonId: P3_SOURCE_LESSON_ID,
    objectiveIds: [OBJECTIVES.resistance],
    ...visibility,
    remainingSteps,
    compositionSummary,
  };
}

export function validateP3Blueprint(
  candidate: unknown,
  request: P3ComposeRequest,
): { valid: boolean; errors: string[]; blueprint?: P3LessonBlueprint } {
  const parsed = p3LessonBlueprintSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "blueprint"}: ${issue.message}`),
    };
  }

  const blueprint = parsed.data;
  const errors: string[] = [];
  const legal = new Set(getP3CandidateBlockIds(request));
  const completed = new Set(request.completedBlockIds);
  const selected = blueprint.remainingSteps.map((item) => item.blockId as WorkspaceBlockId);

  if (!blueprint.objectiveIds.includes(OBJECTIVES.resistance)) {
    errors.push("The trusted resistance objective is missing.");
  }
  if (selected.length > maximumSteps(request)) errors.push("The plan exceeds the step limit.");
  if (new Set(selected).size !== selected.length) errors.push("A block may not appear more than once.");

  for (const sourceId of [...blueprint.preserveSourceBlockIds, ...blueprint.delaySourceBlockIds]) {
    if (!textbookBlockIds.has(sourceId as TextbookBlockId)) errors.push(`Unknown textbook source block: ${sourceId}.`);
  }
  if (new Set(blueprint.preserveSourceBlockIds).size !== blueprint.preserveSourceBlockIds.length) {
    errors.push("Preserved source blocks may not be duplicated.");
  }
  if (new Set(blueprint.delaySourceBlockIds).size !== blueprint.delaySourceBlockIds.length) {
    errors.push("Delayed source blocks may not be duplicated.");
  }

  for (const blockId of selected) {
    const block = workspaceBlockCatalogById.get(blockId);
    if (!block) {
      errors.push(`Unknown interactive block: ${blockId}.`);
      continue;
    }
    if (!legal.has(blockId)) errors.push(`Block is not a legal candidate: ${blockId}.`);
    if (completed.has(blockId)) errors.push(`Completed block was selected again: ${blockId}.`);
    for (const sourceBlockId of block.sourceBlockIds) {
      if (!textbookBlockIds.has(sourceBlockId)) errors.push(`Block ${blockId} references unknown source block ${sourceBlockId}.`);
      const sourceBlock = resistanceSourceLesson.blocks.find((item) => item.id === sourceBlockId);
      for (const factId of sourceBlock?.factIds ?? []) {
        if (!trustedFactIds.has(factId)) errors.push(`Block ${blockId} references untrusted fact ${factId}.`);
      }
    }
  }

  if (request.phase === "initial") {
    const predictionIndex = selected.indexOf(IDS.prediction);
    if (predictionIndex < 0 || predictionIndex > 1) errors.push("Initial composition must gather evidence within its first two steps.");
  }
  if (request.phase === "adapt" && needsSupport(request)) {
    if (selected[0] !== IDS.compare || selected[1] !== IDS.retry) {
      errors.push("Support recomposition must begin with comparison and guided retry.");
    }
  }
  if (request.phase === "adapt" && !needsSupport(request) && selected.some((id) => supportIds.has(id))) {
    errors.push("Support blocks cannot follow secure evidence.");
  }
  if (!applicationIds.has(selected.at(-1) as WorkspaceBlockId)) {
    errors.push("The composition must finish with application or transfer.");
  }
  if (selected.includes(IDS.formula) && !blueprint.delaySourceBlockIds.includes("ohms-law")) {
    errors.push("Ohm's law must stay delayed until the formula representation activates.");
  }
  if (!blueprint.preserveSourceBlockIds.includes("concept-voltage")) {
    errors.push("The fixed voltage source must remain visible in the workspace.");
  }

  return { valid: errors.length === 0, errors, blueprint };
}

const normalizedReasonByBlockId: Record<WorkspaceBlockId, P3LessonBlueprint["remainingSteps"][number]["reasonCode"]> = {
  [IDS.prediction]: "elicit-existing-model",
  [IDS.manipulate]: "test-through-manipulation",
  [IDS.graph]: "offer-alternate-representation",
  [IDS.compare]: "respond-to-misconception",
  [IDS.retry]: "test-through-manipulation",
  [IDS.formula]: "connect-observation-to-symbols",
  [IDS.target]: "confirm-transfer",
  [IDS.transfer]: "confirm-transfer",
};

export function normalizeP3Blueprint(
  blueprint: P3LessonBlueprint,
  request: P3ComposeRequest,
): P3LessonBlueprint {
  const remainingSteps = blueprint.remainingSteps.map((item) => ({
    blockId: item.blockId,
    reasonCode: normalizedReasonByBlockId[item.blockId as WorkspaceBlockId] ?? item.reasonCode,
  }));
  const compositionSummary = request.phase === "adapt" && needsSupport(request)
    ? "The learner evidence called for support, so the composer inserted a comparison and guided retry before application."
    : request.phase === "adapt"
      ? "Secure evidence let the composer skip support and move directly to a generated graph, symbols, and application."
      : `The composer selected ${remainingSteps.length} approved representations and preserved the voltage reference while delaying symbolic explanation.`;
  return { ...blueprint, remainingSteps, compositionSummary };
}

export function buildOllamaPrompt(request: P3ComposeRequest) {
  const candidateIds = getP3CandidateBlockIds(request);
  const legalCandidates = workspaceBlockCatalog
    .filter((block) => candidateIds.includes(block.id))
    .map((block) => ({
      id: block.id,
      sourceBlockIds: block.sourceBlockIds,
      interactionType: block.interactionType,
      estimatedMinutes: block.estimatedMinutes,
      role: block.role,
    }));

  return JSON.stringify({
    phase: request.phase,
    goal: request.goal,
    depthMinutes: request.depth,
    sourceLesson: {
      id: resistanceSourceLesson.id,
      objectiveIds: resistanceSourceLesson.objectiveIds,
      blocks: resistanceSourceLesson.blocks.map(({ id, page, factIds }) => ({ id, page, factIds })),
    },
    learnerState: request.learnerState,
    completedBlockIds: request.completedBlockIds,
    legalCandidates,
    constraints: {
      maximumSteps: maximumSteps(request),
      useOnlyLegalCandidateIds: true,
      requireEvidenceWithinFirstTwoSteps: request.phase === "initial",
      doNotRepeatCompletedBlocks: true,
      finishWithApplicationOrTransfer: true,
      preserveSourceBlockIdsMustInclude: ["concept-voltage"],
      delaySymbolicSourceUntilEvidence: ["ohms-law", "worked-example"],
      outputOnlyTheP3_2Blueprint: true,
      mayNotSpecify: ["CSS", "coordinates", "component names", "educational copy", "arbitrary properties"],
    },
    requiredOutputShape: {
      blueprintVersion: "p3-2",
      sourceLessonId: P3_SOURCE_LESSON_ID,
      objectiveIds: [OBJECTIVES.resistance],
      preserveSourceBlockIds: ["textbook block IDs"],
      delaySourceBlockIds: ["textbook block IDs"],
      remainingSteps: [{ blockId: "legal candidate ID", reasonCode: "approved reason code" }],
      approvedReasonCodes: [
        "elicit-existing-model",
        "test-through-manipulation",
        "offer-alternate-representation",
        "respond-to-misconception",
        "connect-observation-to-symbols",
        "increase-challenge",
        "confirm-transfer",
      ],
      compositionSummary: "under 300 characters",
    },
  });
}

export function parseOllamaBlueprintContent(content: string): unknown {
  const trimmed = content
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Ollama returned no JSON object.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
