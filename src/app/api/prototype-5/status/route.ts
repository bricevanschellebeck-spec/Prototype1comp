import { NextResponse } from "next/server";
import { getP5ModelStatus } from "@/src/prototype5/localModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getP5ModelStatus());
}
