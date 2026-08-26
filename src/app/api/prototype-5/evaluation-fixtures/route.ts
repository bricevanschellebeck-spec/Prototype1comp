import { NextResponse } from "next/server";
import { p5EvaluationFixtures } from "@/src/prototype5/evaluationFixtures";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(p5EvaluationFixtures.map((fixture) => ({ sourceDocumentId: fixture.source.id, goldSpec: fixture.goldSpec, expectedPrimitiveIds: fixture.expectedPrimitiveIds, representationGap: fixture.representationGap })));
}
