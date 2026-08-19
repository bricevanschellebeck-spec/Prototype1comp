import { NextResponse } from "next/server";
import { blockCatalog } from "@/src/data/blockCatalog";
import { compositionRequestSchema } from "@/src/domain/contracts";
import { composeLocally } from "@/src/lib/localComposer";
import { composeWithAI } from "@/src/lib/aiComposer";
import { validateBlueprint } from "@/src/lib/validateBlueprint";

export async function POST(request: Request) {
  const input = compositionRequestSchema.safeParse(await request.json());
  if (!input.success) {
    return NextResponse.json(
      { error: "The composition request was invalid." },
      { status: 400 },
    );
  }

  const validationOptions = {
    topicId: input.data.topicId,
    requiredObjectiveIds: input.data.requiredObjectiveIds,
    targetMinutes: input.data.constraints.targetMinutes,
    maximumSteps: input.data.constraints.maximumSteps,
    unavailableBlockIds: input.data.constraints.unavailableBlockIds,
  };

  if (process.env.OPENAI_API_KEY) {
    try {
      const firstCandidate = await composeWithAI(input.data);
      let validation = validateBlueprint(
        firstCandidate,
        blockCatalog,
        validationOptions,
      );

      if (!validation.valid) {
        const repairedCandidate = await composeWithAI(input.data, {
          previousBlueprint: firstCandidate,
          validationErrors: validation.errors,
        });
        validation = validateBlueprint(
          repairedCandidate,
          blockCatalog,
          validationOptions,
        );
      }

      if (validation.valid && validation.blueprint) {
        return NextResponse.json({
          blueprint: validation.blueprint,
          validation: {
            valid: true,
            errors: [],
            estimatedMinutes: validation.estimatedMinutes,
          },
          source: "ai",
          note: "The AI selected the lesson structure from the registered catalog; deterministic validation approved every step.",
        });
      }
    } catch (error) {
      console.warn(
        "AI composition failed; using the verified local fallback.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const blueprint = composeLocally(input.data);
  const validation = validateBlueprint(
    blueprint,
    blockCatalog,
    validationOptions,
  );

  if (!validation.valid || !validation.blueprint) {
    return NextResponse.json(
      { error: validation.errors.join(" ") },
      { status: 500 },
    );
  }

  return NextResponse.json({
    blueprint: validation.blueprint,
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      estimatedMinutes: validation.estimatedMinutes,
    },
    source: "local-fallback",
    note: process.env.OPENAI_API_KEY
      ? "AI composition was unavailable or invalid, so the deterministic fallback assembled a safe lesson."
      : "No API key is configured, so the deterministic fallback is demonstrating the catalog → blueprint → renderer loop.",
  });
}
