import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { updateWaitlistStatus } from "@/lib/store";
import { waitlistStatusSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await context.params;
    const payload = waitlistStatusSchema.parse(await request.json());
    const entry = await updateWaitlistStatus(id, payload.status);

    return NextResponse.json({ entry });
  } catch (error) {
    return jsonError(error, 400);
  }
}
