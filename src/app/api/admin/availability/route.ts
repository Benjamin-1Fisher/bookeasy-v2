import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { getAdminSummary, replaceAvailabilityRules } from "@/lib/store";
import { availabilityUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const summary = await getAdminSummary();
    return NextResponse.json({ availabilityRules: summary.availabilityRules });
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    assertAdmin(request);
    const payload = availabilityUpdateSchema.parse(await request.json());
    const availabilityRules = await replaceAvailabilityRules(payload.businessId, payload.rules);

    return NextResponse.json({ availabilityRules });
  } catch (error) {
    return jsonError(error, 400);
  }
}
