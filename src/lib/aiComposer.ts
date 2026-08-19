import { blockCatalog } from "../data/blockCatalog";
import { topicSpec } from "../data/curriculum";
import type {
  CompositionRequest,
  LessonBlueprint,
} from "../domain/contracts";

const lessonBlueprintJsonSchema = {
  type: "object",
  properties: {
    blueprintVersion: { type: "string", enum: ["1"] },
    topicId: { type: "string" },
    objectiveIds: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    steps: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          stepId: { type: "string" },
          blockId: { type: "string" },
          purpose: {
            type: "string",
            enum: ["introduce", "explore", "check", "remediate", "apply"],
          },
          reasonCode: {
            type: "string",
            enum: [
              "establish-conceptual-model",
              "test-relationship-through-manipulation",
              "check-concept-before-symbolic-work",
              "connect-observation-to-graph",
              "address-known-misconception",
              "demonstrate-independent-application",
              "fit-short-lesson",
            ],
          },
          expectedEvidence: { type: "string" },
        },
        required: [
          "stepId",
          "blockId",
          "purpose",
          "reasonCode",
          "expectedEvidence",
        ],
        additionalProperties: false,
      },
    },
    completionCheckBlockId: { type: "string" },
  },
  required: [
    "blueprintVersion",
    "topicId",
    "objectiveIds",
    "steps",
    "completionCheckBlockId",
  ],
  additionalProperties: false,
} as const;

type ResponsePayload = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: { message?: string };
};

function extractOutputText(payload: ResponsePayload): string {
  const content = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text" && item.text);

  if (content?.text) return content.text;

  const refusal = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.refusal)?.refusal;
  if (refusal) throw new Error(`Composer refused the request: ${refusal}`);

  throw new Error("Composer returned no structured lesson blueprint.");
}

function compactCatalog() {
  return blockCatalog.map((block) => ({
    id: block.id,
    componentType: block.componentType,
    objectiveIds: block.objectiveIds,
    prerequisiteObjectiveIds: block.prerequisiteObjectiveIds,
    difficulty: block.difficulty,
    purpose: block.purpose,
    interactionType: block.interactionType,
    modality: block.modality,
    estimatedMinutes: block.estimatedMinutes,
    misconceptionsAddressed: block.misconceptionsAddressed,
    accessibilityFeatures: block.accessibilityFeatures,
  }));
}

export async function composeWithAI(
  request: CompositionRequest,
  correction?: {
    previousBlueprint: unknown;
    validationErrors: string[];
  },
): Promise<LessonBlueprint> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const model = process.env.OPENAI_MODEL || "gpt-5.4-nano";
  const systemInstructions = [
    "You are a constrained learning-interface composer.",
    "Build a coherent mini-lesson using only the supplied registered block IDs.",
    "You select and sequence blocks; you do not generate UI code or educational content.",
    "Respect the learner snapshot, target duration, maximum steps, unavailable blocks, objectives, and metadata.",
    "Use each block at most once.",
    "Include at least one introduce or explore block.",
    "When resistance-slider-simulation is available, place it first so the learner manipulates the concept immediately.",
    "Do not select ohms-law-relationship-diagram for the default path when the simulation is available; the application reserves that diagram for misconception remediation.",
    "Include resistance-final-challenge in steps and set it as completionCheckBlockId.",
    "The purpose for every step must exactly equal that block's registered purpose.",
    "Assign sequential step IDs beginning with step-1.",
    "Return only the structured blueprint required by the response schema.",
  ].join(" ");

  const composerContext = {
    curriculum: topicSpec,
    compositionRequest: request,
    approvedBlockCatalog: compactCatalog(),
    correction: correction ?? null,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: systemInstructions },
        {
          role: "user",
          content: JSON.stringify(composerContext),
        },
      ],
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "lesson_blueprint",
          strict: true,
          schema: lessonBlueprintJsonSchema,
        },
      },
      max_output_tokens: 1800,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const payload = (await response.json()) as ResponsePayload;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Composer API failed (${response.status}).`);
  }

  return JSON.parse(extractOutputText(payload)) as LessonBlueprint;
}
