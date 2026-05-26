import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { trackEvent } from "@/lib/store";
import { eventSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = eventSchema.parse(await request.json());
    const event = await trackEvent(payload);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
