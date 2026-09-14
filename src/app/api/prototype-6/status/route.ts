import { NextResponse } from "next/server";
import { getP6ModelStatus } from "@/src/prototype6/provider";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(await getP6ModelStatus()); }
