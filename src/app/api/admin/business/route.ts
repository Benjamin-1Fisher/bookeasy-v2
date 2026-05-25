import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { getAdminSummary, patchBusiness } from "@/lib/store";
import { businessPatchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const summary = await getAdminSummary();
    return NextResponse.json({ business: summary.business });
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    assertAdmin(request);
    const summary = await getAdminSummary();
    const payload = businessPatchSchema.parse(await request.json());
    const business = await patchBusiness(summary.business.id, payload);

    return NextResponse.json({ business });
  } catch (error) {
    return jsonError(error, 400);
  }
}
