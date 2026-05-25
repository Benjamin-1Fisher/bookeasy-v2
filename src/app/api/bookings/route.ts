import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { createBooking } from "@/lib/store";
import { jsonError } from "@/lib/responses";

export async function POST(request: Request) {
  try {
    const payload = bookingSchema.parse(await request.json());
    const booking = await createBooking({
      ...payload,
      notes: payload.notes || "",
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
