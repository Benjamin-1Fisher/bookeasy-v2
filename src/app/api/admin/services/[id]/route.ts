import { NextResponse } from "next/server";
import { assertAdmin, jsonError } from "@/lib/responses";
import { deleteService, patchService } from "@/lib/store";
import { servicePatchSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await context.params;
    const payload = servicePatchSchema.parse(await request.json());
    const service = await patchService(id, {
      ...payload,
      description: payload.description || "",
    });

    return NextResponse.json({ service });
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await context.params;
    const result = await deleteService(id);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
