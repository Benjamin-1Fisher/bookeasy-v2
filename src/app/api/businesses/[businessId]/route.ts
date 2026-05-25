import { NextResponse } from "next/server";
import { getBusinessBundle } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await context.params;
  const bundle = await getBusinessBundle(businessId);

  if (!bundle) {
    return NextResponse.json({ error: "העסק לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
