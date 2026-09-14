import { NextResponse } from "next/server";
import { designExperience } from "@/src/prototype6/designer";
export const runtime = "nodejs"; export const maxDuration = 420;
export async function POST(request: Request) {
  try { return NextResponse.json(await designExperience(await request.json(), request.signal)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Design request failed." }, { status: 400 }); }
}
