import type { ApiComposeRequest, ComposeResponse } from "./types";

export async function requestComposition(request: ApiComposeRequest, evaluation = false): Promise<ComposeResponse> {
  const response = await fetch(`/api/prototype-4/compose${evaluation ? "?evaluation=1" : ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`Composition request failed with HTTP ${response.status}.`);
  return response.json() as Promise<ComposeResponse>;
}
