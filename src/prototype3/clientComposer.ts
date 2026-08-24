import {
  type P3ComposeRequest,
  type P3ComposeResponse,
  p3ComposeResponseSchema,
} from "./composerContracts";
import { composeP3Fallback, getP3CandidateBlockIds } from "./composer";

export async function requestP3Composition(
  request: P3ComposeRequest,
): Promise<P3ComposeResponse> {
  try {
    const response = await fetch("/api/prototype-3/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Composer returned ${response.status}.`);
    const parsed = p3ComposeResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Composer response did not match the application contract.");
    return parsed.data;
  } catch (error) {
    return {
      blueprint: composeP3Fallback(request),
      source: "deterministic-fallback",
      model: null,
      candidateBlockIds: getP3CandidateBlockIds(request),
      validationErrors: [],
      fallbackReason: error instanceof Error ? error.message : "The composer could not be reached.",
    };
  }
}

