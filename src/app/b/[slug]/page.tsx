import { notFound } from "next/navigation";
import { BusinessBookingPageClient } from "@/components/booking/BusinessBookingPageClient";
import { getBusinessBundle } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BusinessBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBusinessBundle(slug);

  if (!bundle) {
    notFound();
  }

  return <BusinessBookingPageClient business={bundle.business} services={bundle.services} />;
}
