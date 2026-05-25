import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { addService, getAdminSummary } from "@/lib/store";
import { serviceSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    const summary = await getAdminSummary();
    return NextResponse.json({ services: summary.services });
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    assertAdmin(request);
    const payload = serviceSchema.parse(await request.json());
    const service = await addService({
      businessId: payload.businessId,
      name: payload.name,
      description: payload.description || "",
      price: payload.price,
      durationMinutes: payload.durationMinutes,
      isActive: payload.isActive ?? true,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
