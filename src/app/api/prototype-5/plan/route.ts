import { NextResponse } from "next/server";
import { planRepresentations } from "@/src/prototype5/analysisService";
import { planRequestSchema } from "@/src/prototype5/contracts";
export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 600;
export async function POST(request: Request) {
  try { const parsed = planRequestSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid planner request." }, { status: 400 }); return NextResponse.json(await planRepresentations(parsed.data.approvedSpec, parsed.data.modelProfile, request.signal)); }
  catch { return NextResponse.json({ error: "The planner request was not valid JSON." }, { status: 400 }); }
}
