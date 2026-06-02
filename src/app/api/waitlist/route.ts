import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { createWaitlistEntry } from "@/lib/store";
import { waitlistSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = waitlistSchema.parse(await request.json());
    const entry = await createWaitlistEntry({
      ...payload,
      serviceId: payload.serviceId || undefined,
      preferredDate: payload.preferredDate || undefined,
      notes: payload.notes || "",
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
