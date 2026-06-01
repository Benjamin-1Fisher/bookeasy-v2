import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { getSlotsForService } from "@/lib/store";

export async function GET(request: Request, context: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await context.params;
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!serviceId || !date) {
    return NextResponse.json({ error: "צריך לבחור שירות ותאריך" }, { status: 400 });
  }

  try {
    const slots = await getSlotsForService(businessId, serviceId, date);
    return NextResponse.json({ slots });
  } catch (error) {
    return jsonError(error, 400);
  }
}
