import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { createSmartSetupBusinessPage, trackEvent } from "@/lib/store";
import { smartSetupSaveSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = smartSetupSaveSchema.parse(await request.json());
    const result = await createSmartSetupBusinessPage({
      ...payload,
      businessName: payload.businessName,
      businessIcon: payload.businessIcon ?? "",
      profileImage: payload.profileImage ?? "",
      whatsapp: payload.whatsapp ?? payload.phone,
      address: payload.address ?? "",
      services: payload.services.map((service) => ({
        ...service,
        description: service.description ?? "",
        isActive: service.isActive ?? true,
      })),
    });

    await trackEvent({
      name: "setup_saved",
      businessId: result.business.id,
      metadata: {
        services: result.services.length,
        defaultLanguage: result.business.defaultLanguage,
      },
    });

    return NextResponse.json(
      {
        business: result.business,
        services: result.services,
        bookingUrl: `/b/${result.business.slug}`,
        dashboardUrl: `/dashboard?businessId=${result.business.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, 400);
  }
}
