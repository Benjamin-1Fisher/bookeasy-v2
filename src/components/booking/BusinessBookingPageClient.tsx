"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, MapPin, Phone } from "lucide-react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BusinessIcon } from "@/components/ui/BusinessIcon";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { LANGUAGE_STORAGE_KEY, useI18n } from "@/i18n";
import { formatDuration, formatPrice, getBusinessToneClasses } from "@/lib/format";
import type { Business, Language, Service } from "@/lib/types";

export function BusinessBookingPageClient({ business, services }: { business: Business; services: Service[] }) {
  const { language, setLanguage, t } = useI18n();
  const supportedLanguages: Language[] = business.supportedLanguages?.length ? business.supportedLanguages : ["he", "en"];
  const activeServices = services.filter((service) => service.isActive);

  useEffect(() => {
    if (!window.localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      setLanguage(business.defaultLanguage);
    }
  }, [business.defaultLanguage, setLanguage]);

  return (
    <main className="min-h-screen bg-background pb-24">
      <section className={`bg-gradient-to-br ${getBusinessToneClasses(business.coverTone)} text-white`}>
        <div className="container-shell py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-[8px] text-sm font-bold text-white/85">
              <ArrowRight size={17} aria-hidden="true" />
              {t.common.backToBookEasy}
            </Link>
            {business.showLanguageSwitcher ? (
              <div className="grid gap-1 text-start sm:text-end">
                <LanguageSelector languages={supportedLanguages} className="border-white/20 bg-white text-foreground" />
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 py-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-white/14 px-4 py-2 text-sm font-bold text-white">
                {t.booking.demoBadge}
              </span>
              <div className="mt-5 flex items-center gap-4">
                {business.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Profile images can be user-uploaded data URLs.
                  <img src={business.profileImage} alt="" className="size-16 shrink-0 rounded-[8px] bg-white object-cover shadow-sm" />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-[8px] bg-white text-primary shadow-sm">
                    <BusinessIcon value={business.businessIcon} className="size-8" />
                  </span>
                )}
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{business.name}</h1>
              </div>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/82">{business.description}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white/85">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2">
                  <Phone size={16} aria-hidden="true" />
                  <span className="ltr">{business.phone}</span>
                </span>
                {business.address ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2">
                    <MapPin size={16} aria-hidden="true" />
                    {business.address}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[8px] bg-white/12 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur">
              <p className="text-sm font-bold text-white/75">{t.booking.quickServicesLabel}</p>
              <h2 className="mt-2 text-2xl font-extrabold">{business.coverTitle}</h2>
              <div className="mt-5 grid gap-2">
                {activeServices.length ? (
                  activeServices
                    .slice(0, 3)
                    .map((service) => (
                      <div key={service.id} className="rounded-[8px] bg-white p-3 text-foreground">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={17} className="text-primary" aria-hidden="true" />
                            <span className="font-bold">{service.name}</span>
                          </div>
                          <span className="font-extrabold text-primary">{formatPrice(service.price, language)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{formatDuration(service.durationMinutes, language)}</p>
                      </div>
                    ))
                ) : (
                  <div className="rounded-[8px] bg-white p-3 text-foreground">
                    <p className="font-bold">{t.booking.noServicesTitle}</p>
                    <p className="mt-1 text-sm text-muted">{t.booking.noServicesText}</p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">{t.booking.quickServicesHelper}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-shell -mt-8">
        <BookingFlow business={business} services={services} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/94 p-3 shadow-2xl backdrop-blur md:hidden">
        <a href="#booking" className="focus-ring flex min-h-12 items-center justify-center rounded-[8px] bg-primary font-extrabold text-white">
          {t.booking.stickyCta}
        </a>
      </div>
    </main>
  );
}
