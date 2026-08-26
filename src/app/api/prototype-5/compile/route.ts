import { NextResponse } from "next/server";
import { compileApprovedLesson } from "@/src/prototype5/compiler";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const body = await request.json() as { approvedSpec?: unknown; approvedRepresentationPlan?: unknown; approvedProposalIds?: string[] }; const result = compileApprovedLesson(body.approvedSpec, body.approvedRepresentationPlan, body.approvedProposalIds); if (!result.manifest) return NextResponse.json({ error: "Compilation rejected.", details: result.errors }, { status: 400 }); return NextResponse.json({ manifest: result.manifest }); }
  catch { return NextResponse.json({ error: "The compilation request was not valid JSON." }, { status: 400 }); }
}
