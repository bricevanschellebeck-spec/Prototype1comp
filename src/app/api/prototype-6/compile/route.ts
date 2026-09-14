import { NextResponse } from "next/server";
import { z } from "zod";
import { compileExperience } from "@/src/prototype6/compiler";
export const runtime = "nodejs";
const schema = z.object({ blueprint: z.unknown(), designReceipt: z.string().min(1), approvedStageIds: z.array(z.string()).optional() }).strict();
export async function POST(request: Request) {
  try { const body = schema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: "Invalid compilation request." }, { status: 400 }); const result = compileExperience(body.data.blueprint, body.data.designReceipt, body.data.approvedStageIds); return result.experience ? NextResponse.json({ experience: result.experience }) : NextResponse.json({ errors: result.errors }, { status: 422 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Compilation failed." }, { status: 400 }); }
}
