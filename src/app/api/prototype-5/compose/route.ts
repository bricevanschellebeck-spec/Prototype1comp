import { NextResponse } from "next/server";
import { composeP5 } from "@/src/prototype5/composer";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { return NextResponse.json(await composeP5(await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid composition request." }, { status: 400 }); }
}
