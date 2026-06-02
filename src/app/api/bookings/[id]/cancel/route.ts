import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { cancelBooking } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const booking = await cancelBooking(id);

    return NextResponse.json({ booking });
  } catch (error) {
    return jsonError(error, 400);
  }
}
