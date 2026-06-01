import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MapPin, Phone } from "lucide-react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BusinessIcon } from "@/components/ui/BusinessIcon";
import { formatDuration, formatPrice, getBusinessToneClasses } from "@/lib/format";
import { getBusinessBundle } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BusinessBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await getBusinessBundle(slug);

  if (!bundle) {
    notFound();
  }

  const { business, services } = bundle;
  const coverImage = business.coverImageUrl?.trim();
  const logoImage = business.logoUrl?.trim();
  const coverStyle = coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(13, 48, 50, 0.82), rgba(11, 111, 100, 0.5)), url("${coverImage.replaceAll("\"", "%22")}")`,
      }
    : undefined;

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-24">
      <section
        className={`bg-gradient-to-br ${getBusinessToneClasses(business.coverTone)} bg-cover bg-center text-white`}
        style={coverStyle}
      >
        <div className="container-shell py-4 sm:py-5">
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-[8px] text-sm font-bold text-white/85">
            <ArrowRight size={17} aria-hidden="true" />
            חזרה ל-BookEasy
          </Link>
          <div className="grid gap-4 py-5 sm:gap-6 sm:py-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-white/14 px-3 py-2 text-xs font-bold text-white sm:px-4 sm:text-sm">
                דף הזמנות לדוגמה
              </span>
              <div className="mt-4 flex items-center gap-3 sm:mt-5 sm:gap-4">
                <span
                  className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-white text-primary shadow-sm sm:size-16 ${
                    logoImage ? "bg-cover bg-center" : ""
                  }`}
                  style={logoImage ? { backgroundImage: `url("${logoImage.replaceAll("\"", "%22")}")` } : undefined}
                  aria-hidden="true"
                >
                  {logoImage ? null : <BusinessIcon value={business.businessIcon} className="size-7 sm:size-8" />}
                </span>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{business.name}</h1>
              </div>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/82 sm:mt-4 sm:text-lg sm:leading-8">{business.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-white/85 sm:mt-6 sm:gap-3">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-2 sm:w-auto sm:justify-start">
                  <Phone size={16} aria-hidden="true" />
                  <span className="ltr">{business.phone}</span>
                </span>
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-4 py-2 sm:w-auto sm:justify-start">
                  <MapPin size={16} aria-hidden="true" />
                  {business.address}
                </span>
              </div>
            </div>

            <div className="hidden rounded-[8px] bg-white/12 p-4 backdrop-blur md:block">
              <p className="text-sm font-bold text-white/75">{business.coverSubtitle}</p>
              <h2 className="mt-2 text-2xl font-extrabold">{business.coverTitle}</h2>
              <div className="mt-5 grid gap-2">
                {services
                  .filter((service) => service.isActive)
                  .slice(0, 3)
                  .map((service) => (
                    <div key={service.id} className="rounded-[8px] bg-white p-3 text-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={17} className="text-primary" aria-hidden="true" />
                          <span className="font-bold">{service.name}</span>
                        </div>
                        <span className="font-extrabold text-primary">{formatPrice(service.price)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{formatDuration(service.durationMinutes)}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-shell -mt-4 sm:-mt-8">
        <BookingFlow business={business} services={services} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/94 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur md:hidden">
        <a href="#booking" className="focus-ring flex min-h-12 items-center justify-center rounded-[8px] bg-primary font-extrabold text-white">
          קביעת תור
        </a>
      </div>
    </main>
  );
}
