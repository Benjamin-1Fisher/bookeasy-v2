import { NextResponse } from "next/server";
import { createDemoRequest } from "@/lib/store";
import { jsonError } from "@/lib/responses";
import { demoRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = demoRequestSchema.parse(await request.json());
    const demoRequest = await createDemoRequest({
      ownerName: payload.ownerName,
      businessType: payload.businessType,
      phone: payload.phone,
      businessLink: payload.businessLink || "",
      message: payload.message || "",
    });

    return NextResponse.json({ demoRequest }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
