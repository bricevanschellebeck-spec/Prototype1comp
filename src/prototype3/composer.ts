import { adaptiveBlockCatalog, adaptiveBlockCatalogById } from "./catalog";
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
  trustedFactIds,
} from "./sourceLesson";

const IDS = {
  diagnostic: "resistance-prediction-experiment",
  misconception: "resistance-misconception-visual",
  guided: "guided-resistance-experiment",
  retry: "resistance-equivalent-retry",
  graph: "current-resistance-graph",
  target: "target-current-challenge",
  design: "final-circuit-design-challenge",
} as const;

const supportIds = new Set<string>([IDS.misconception, IDS.guided, IDS.retry]);

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

export function getP3CandidateBlockIds(request: P3ComposeRequest): string[] {
  const completed = new Set(request.completedBlockIds);
  let ids: string[];

  if (request.phase === "initial") {
    ids = [IDS.guided, IDS.diagnostic, IDS.graph, IDS.target, IDS.design];
  } else if (needsSupport(request)) {
    ids = [IDS.misconception, IDS.guided, IDS.retry, IDS.graph, IDS.target, IDS.design];
  } else {
    ids = [IDS.graph, IDS.target, IDS.design];
  }

  return ids.filter((id) => !completed.has(id));
}

function maximumSteps(request: P3ComposeRequest) {
  if (request.phase === "adapt" && needsSupport(request)) return 5;
  if (request.depth === 5) return 3;
  if (request.depth === 15) return 5;
  return 5;
}

function step(blockId: string, reasonCode: P3LessonBlueprint["remainingSteps"][number]["reasonCode"]) {
  return { blockId, reasonCode };
}

export function composeP3Fallback(request: P3ComposeRequest): P3LessonBlueprint {
  let remainingSteps: P3LessonBlueprint["remainingSteps"];
  let compositionSummary: string;
  const completed = new Set(request.completedBlockIds);

  if (request.phase === "adapt" && needsSupport(request)) {
    remainingSteps = [
      step(IDS.misconception, "respond-to-misconception"),
      step(IDS.guided, "test-through-manipulation"),
      step(IDS.retry, "elicit-existing-model"),
      step(IDS.graph, "offer-alternate-representation"),
      step(IDS.target, "confirm-transfer"),
    ].filter((item) => !completed.has(item.blockId));
    compositionSummary = "The evidence showed that support is needed, so the path changes representation before asking the learner to apply the idea again.";
  } else if (request.phase === "adapt") {
    remainingSteps = [
      step(IDS.graph, "offer-alternate-representation"),
      step(IDS.target, "increase-challenge"),
    ];
    if (request.depth === 30 || request.goal === "test") {
      remainingSteps.push(step(IDS.design, "confirm-transfer"));
    }
    compositionSummary = "The first interaction produced secure evidence, so the path moves directly to another representation and an application challenge.";
  } else {
    const exploratory = request.goal === "explore" || request.goal === "understand";
    remainingSteps = exploratory && request.depth !== 5
      ? [
          step(IDS.guided, "test-through-manipulation"),
          step(IDS.diagnostic, "elicit-existing-model"),
          step(IDS.graph, "offer-alternate-representation"),
          step(IDS.target, "confirm-transfer"),
        ]
      : [
          step(IDS.diagnostic, "elicit-existing-model"),
          step(IDS.graph, "offer-alternate-representation"),
          step(IDS.target, "confirm-transfer"),
        ];
    if (request.depth === 30 && remainingSteps.length < 5) {
      remainingSteps.push(step(IDS.design, "increase-challenge"));
    }
    compositionSummary = "The lesson begins with direct evidence, then changes representation and finishes with an application of the trusted relationship.";
  }

  return {
    blueprintVersion: "p3-1",
    sourceLessonId: P3_SOURCE_LESSON_ID,
    objectiveIds: [OBJECTIVES.resistance],
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
  const candidateIds = new Set(getP3CandidateBlockIds(request));
  const completed = new Set(request.completedBlockIds);
  const selected = blueprint.remainingSteps.map((item) => item.blockId);

  if (!blueprint.objectiveIds.includes(OBJECTIVES.resistance)) {
    errors.push("The trusted resistance objective is missing.");
  }
  if (selected.length > maximumSteps(request)) {
    errors.push(`The plan exceeds the ${maximumSteps(request)}-step limit.`);
  }
  if (new Set(selected).size !== selected.length) {
    errors.push("A block may not appear more than once.");
  }

  for (const blockId of selected) {
    const block = adaptiveBlockCatalogById.get(blockId);
    if (!block) {
      errors.push(`Unknown block: ${blockId}.`);
      continue;
    }
    if (!candidateIds.has(blockId)) errors.push(`Block is not a legal candidate: ${blockId}.`);
    if (completed.has(blockId)) errors.push(`Completed block was selected again: ${blockId}.`);
    for (const factId of block.sourceFactIds) {
      if (!trustedFactIds.has(factId)) errors.push(`Block ${blockId} references an untrusted fact: ${factId}.`);
    }
  }

  const diagnosticIndex = selected.indexOf(IDS.diagnostic);
  const graphIndex = selected.indexOf(IDS.graph);
  const targetIndex = selected.indexOf(IDS.target);
  const designIndex = selected.indexOf(IDS.design);

  if (request.phase === "initial") {
    if (diagnosticIndex < 0) errors.push("The initial composition requires the resistance evidence checkpoint.");
    if (graphIndex >= 0 && diagnosticIndex > graphIndex) errors.push("The graph cannot appear before the resistance checkpoint.");
  }

  if (request.phase === "adapt" && needsSupport(request)) {
    if (!selected.some((id) => id === IDS.misconception || id === IDS.guided)) {
      errors.push("Support evidence requires a remediation or guided block.");
    }
    const retryIndex = selected.indexOf(IDS.retry);
    if (retryIndex < 0) errors.push("The support path requires an equivalent retry.");
    if (graphIndex >= 0 && retryIndex > graphIndex) errors.push("The learner must retry before the graph appears.");
  }

  if (request.phase === "adapt" && !needsSupport(request)) {
    if (selected.some((id) => supportIds.has(id))) errors.push("Support blocks cannot be inserted after secure evidence.");
    if (selected[0] !== IDS.graph) errors.push("Secure evidence should move first to the graph representation.");
  }

  if (targetIndex >= 0 && graphIndex < 0 && !completed.has(IDS.graph)) {
    errors.push("The target challenge requires the graph first.");
  }
  if (designIndex >= 0 && targetIndex < 0 && !completed.has(IDS.target)) {
    errors.push("The final design challenge requires the target challenge first.");
  }
  const finalId = selected.at(-1);
  if (finalId !== IDS.target && finalId !== IDS.design) {
    errors.push("The composition must finish with a registered application challenge.");
  }

  return { valid: errors.length === 0, errors, blueprint };
}

const normalizedReasonByBlockId: Record<
  string,
  P3LessonBlueprint["remainingSteps"][number]["reasonCode"]
> = {
  [IDS.diagnostic]: "elicit-existing-model",
  [IDS.misconception]: "respond-to-misconception",
  [IDS.guided]: "test-through-manipulation",
  [IDS.retry]: "elicit-existing-model",
  [IDS.graph]: "offer-alternate-representation",
  [IDS.target]: "confirm-transfer",
  [IDS.design]: "increase-challenge",
};

/**
 * Ollama owns the interesting choice of blocks and their order. The application
 * owns the controlled vocabulary used to explain those choices, keeping the
 * teacher-facing trace short, consistent, and free of invented lesson copy.
 */
export function normalizeP3Blueprint(
  blueprint: P3LessonBlueprint,
  request: P3ComposeRequest,
): P3LessonBlueprint {
  const remainingSteps = blueprint.remainingSteps.map((item) => ({
    blockId: item.blockId,
    reasonCode: normalizedReasonByBlockId[item.blockId] ?? item.reasonCode,
  }));

  let compositionSummary: string;
  if (request.phase === "adapt" && needsSupport(request)) {
    compositionSummary = "The learner evidence called for support, so Ollama inserted visual clarification, guided manipulation, and a retry before application.";
  } else if (request.phase === "adapt") {
    compositionSummary = "Secure evidence let Ollama move directly to a graph representation and an application challenge.";
  } else {
    compositionSummary = `Ollama selected and ordered ${remainingSteps.length} verified interactions to turn the trusted source lesson into an object-led path.`;
  }

  return { ...blueprint, remainingSteps, compositionSummary };
}

export function buildOllamaPrompt(request: P3ComposeRequest) {
  const candidateIds = getP3CandidateBlockIds(request);
  const catalog = adaptiveBlockCatalog
    .filter((block) => candidateIds.includes(block.id))
    .map((block) => ({
      id: block.id,
      title: block.title,
      purpose: block.purpose,
      role: block.selectionRole,
      interactionType: block.interactionType,
      modality: block.modality,
      estimatedMinutes: block.estimatedMinutes,
      sourceFactIds: block.sourceFactIds,
    }));

  return JSON.stringify({
    task: "Compose the unfinished portion of an interactive lesson using only the supplied trusted block IDs. Return JSON only. Do not write educational content or frontend code.",
    phase: request.phase,
    goal: request.goal,
    depthMinutes: request.depth,
    trustedLesson: {
      id: resistanceSourceLesson.id,
      objectiveIds: resistanceSourceLesson.objectiveIds,
      facts: resistanceSourceLesson.facts,
    },
    learnerEvidence: request.lastOutcome ?? null,
    completedBlockIds: request.completedBlockIds,
    legalCandidates: catalog,
    constraints: {
      maximumSteps: maximumSteps(request),
      initialMustInclude: request.phase === "initial" ? IDS.diagnostic : null,
      supportRequired: request.phase === "adapt" ? needsSupport(request) : false,
      finishWith: [IDS.target, IDS.design],
      useOnlyLegalCandidateIds: true,
      keepCompositionSummaryUnderCharacters: 260,
    },
  });
}
