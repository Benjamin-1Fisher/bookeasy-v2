import { NextResponse } from "next/server";
import { jsonError } from "@/lib/responses";
import { createBusinessFromOnboarding } from "@/lib/store";
import { onboardingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = onboardingSchema.parse(await request.json());
    const { business, service } = await createBusinessFromOnboarding(payload);

    return NextResponse.json(
      {
        business,
        service,
        bookingLink: `/b/${business.slug}`,
        dashboardLink: `/dashboard?businessId=${business.id}`,
        payment: {
          mode: "demo",
          status: "paid",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, 400);
  }
}
