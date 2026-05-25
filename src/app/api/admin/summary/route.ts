import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { getAdminSummary } from "@/lib/store";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const summary = await getAdminSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return jsonError(error, 401);
  }
}
