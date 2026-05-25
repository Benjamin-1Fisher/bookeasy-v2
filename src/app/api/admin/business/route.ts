import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { getAdminSummary, patchBusiness } from "@/lib/store";
import { businessPatchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const businessId = new URL(request.url).searchParams.get("businessId") ?? undefined;
    const summary = await getAdminSummary(businessId);
    return NextResponse.json({ business: summary.business });
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    assertAdmin(request);
    const { businessId, ...payload } = businessPatchSchema.parse(await request.json());
    const summary = await getAdminSummary(businessId);
    const business = await patchBusiness(summary.business.id, payload);

    return NextResponse.json({ business });
  } catch (error) {
    return jsonError(error, 400);
  }
}
