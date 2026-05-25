import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { createBusinessPage } from "@/lib/store";
import { businessCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = businessCreateSchema.parse(await request.json());
    const result = await createBusinessPage({
      ownerName: payload.ownerName,
      businessName: payload.businessName,
      category: payload.category,
      phone: payload.phone,
      whatsapp: payload.whatsapp || payload.phone,
      address: payload.address || "",
      slug: payload.slug,
      serviceName: payload.serviceName,
      servicePrice: payload.servicePrice,
      serviceDurationMinutes: payload.serviceDurationMinutes,
    });

    return NextResponse.json(
      {
        business: result.business,
        service: result.service,
        bookingUrl: `/b/${result.business.slug}`,
        dashboardUrl: `/dashboard?businessId=${result.business.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, 400);
  }
}
