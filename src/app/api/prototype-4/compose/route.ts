import { NextResponse } from "next/server";
import { apiComposeRequestSchema } from "@/src/prototype4/contracts";
import { composeSafely } from "@/src/prototype4/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 32_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const parsed = apiComposeRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Prototype 4 composition request.", details: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 });
    }
    const evaluation = new URL(request.url).searchParams.get("evaluation") === "1";
    return NextResponse.json(await composeSafely(parsed.data, { temperature: evaluation ? 0.2 : 0.1 }));
  } catch {
    return NextResponse.json({ error: "The request body was not valid JSON." }, { status: 400 });
  }
}
