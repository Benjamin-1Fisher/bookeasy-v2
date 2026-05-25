import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { updateBookingStatus } from "@/lib/store";
import { bookingStatusSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await context.params;
    const payload = bookingStatusSchema.parse(await request.json());
    const booking = await updateBookingStatus(id, payload.status);

    return NextResponse.json({ booking });
  } catch (error) {
    return jsonError(error, 400);
  }
}
