import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { getAdminSummary } from "@/lib/store";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const businessId = new URL(request.url).searchParams.get("businessId") ?? undefined;
    const summary = await getAdminSummary(businessId);
    return NextResponse.json(summary);
  } catch (error) {
    return jsonError(error, 401);
  }
}
