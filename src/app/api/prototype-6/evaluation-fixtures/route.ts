import { NextResponse } from "next/server";
import { evaluationProfiles } from "@/src/prototype6/evaluation";
export function GET() { return NextResponse.json({ profiles: evaluationProfiles }); }
