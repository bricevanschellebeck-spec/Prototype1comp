import { NextResponse } from "next/server";
import { analyzeSource } from "@/src/prototype5/analysisService";
import { analyzeRequestSchema } from "@/src/prototype5/contracts";
export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 600;
export async function POST(request: Request) {
  try { const parsed = analyzeRequestSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid analyzer request.", details: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 }); return NextResponse.json(await analyzeSource(parsed.data.sourceDocumentId, parsed.data.modelProfile)); }
  catch { return NextResponse.json({ error: "The analyzer request was not valid JSON." }, { status: 400 }); }
}
