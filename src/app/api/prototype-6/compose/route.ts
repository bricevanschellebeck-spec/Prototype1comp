import { NextResponse } from "next/server";
import { composeAfterEvidence } from "@/src/prototype6/composer";
export const runtime = "nodejs"; export const maxDuration = 90;
export async function POST(request: Request) {
  try { return NextResponse.json(await composeAfterEvidence(await request.json(), request.signal)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Composition failed." }, { status: 400 }); }
}
