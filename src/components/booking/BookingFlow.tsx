"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, MessageSquareText, UserRound } from "lucide-react";
import { interpolate, useI18n } from "@/i18n";
import { formatDate, formatDuration, formatPrice } from "@/lib/format";
import type { Booking, Business, Service, Slot } from "@/lib/types";

type BookingFlowProps = {
  business: Business;
  services: Service[];
};

type BookingForm = {
  customerName: string;
  customerPhone: string;
  notes: string;
};

const initialForm: BookingForm = {
  customerName: "",
  customerPhone: "",
  notes: "",
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingFlow({ business, services }: BookingFlowProps) {
  const { language, t } = useI18n();
  const activeServices = useMemo(() => services.filter((service) => service.isActive), [services]);
  const [selectedServiceId, setSelectedServiceId] = useState(activeServices[0]?.id ?? "");
  const [date, setDate] = useState(getToday());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loadingSlots, setLoadingSlots] = useState(Boolean(selectedServiceId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  const selectedService = activeServices.find((service) => service.id === selectedServiceId) ?? activeServices[0];
  const selectedTimeText = selectedSlot ? `${formatDate(selectedSlot.date, language)}, ${selectedSlot.startTime}` : t.booking.noTimeSelected;
  const formReady = Boolean(form.customerName.trim() && form.customerPhone.trim());
  const step = booking ? 4 : selectedSlot ? 3 : selectedServiceId ? 2 : 1;

  useEffect(() => {
    if (!selectedServiceId || !date) {
      return;
    }

    let ignore = false;

    fetch(`/api/businesses/${business.id}/slots?serviceId=${selectedServiceId}&date=${date}`)
      .then((response) => response.json())
      .then((data: { slots?: Slot[]; error?: string }) => {
        if (ignore) {
          return;
        }

        if (data.error) {
          setError(data.error);
          setSlots([]);
          return;
        }

        setError("");
        setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!ignore) {
          setError(t.booking.slotsError);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingSlots(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [business.id, selectedServiceId, date, t.booking.slotsError]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !selectedSlot) {
      setError(t.booking.missingSelection);
      return;
    }

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: selectedService.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes,
      }),
    });

    const data = (await response.json()) as { booking?: Booking; error?: string };
    setSubmitting(false);

    if (!response.ok || !data.booking) {
      setError(data.error ?? t.booking.submitError);
      return;
    }

    setBooking(data.booking);
  }

  if (!selectedService) {
    return (
      <div className="rounded-[8px] border border-line bg-white p-6 text-center">
        <p className="text-lg font-extrabold">{t.booking.noServicesTitle}</p>
        <p className="mt-2 text-muted">{t.booking.noServicesText}</p>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" id="booking">
      <aside className="soft-card h-fit rounded-[8px] p-5">
        <span className="inline-flex rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-extrabold text-primary">
          {t.booking.conciergeBadge}
        </span>
        <p className="mt-4 text-sm font-bold text-primary">{interpolate(t.booking.step, { current: step, total: 4 })}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t.booking.conciergeTitle}</h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f3ef]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="mt-5 grid gap-2">
          {t.booking.progress.map((label, index) => {
            const done = [Boolean(selectedServiceId), Boolean(selectedSlot), formReady, Boolean(booking)][index];
            return (
              <div key={label} className="flex items-center gap-3 rounded-[8px] bg-[#f4f7f5] p-3">
                <span
                  className={`grid size-8 place-items-center rounded-full text-sm font-extrabold ${
                    done ? "bg-primary text-white" : "bg-white text-muted"
                  }`}
                >
                  {done ? <Check size={16} aria-hidden="true" /> : index + 1}
                </span>
                <span className="font-bold">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 rounded-[8px] border border-line bg-white p-4">
          <p className="text-sm font-extrabold text-primary">{t.booking.currentSelection}</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            <p>
              <span className="font-extrabold text-foreground">{t.booking.selectedService}:</span> {selectedService.name}
            </p>
            <p>
              <span className="font-extrabold text-foreground">{t.booking.selectedTime}:</span>{" "}
              <span className="inline-block">{selectedTimeText}</span>
            </p>
          </div>
        </div>
      </aside>

      <div className="grid gap-5">
        {booking ? (
          <Confirmation business={business} service={selectedService} booking={booking} />
        ) : (
          <>
            <section className="soft-card rounded-[8px] p-5">
              <div className="flex items-start gap-2">
                <MessageSquareText size={20} className="mt-1 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold">{t.booking.serviceQuestion}</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(null);
                      setError("");
                      if (selectedServiceId !== service.id) {
                        setLoadingSlots(true);
                        setSlots([]);
                        setSelectedServiceId(service.id);
                      }
                    }}
                    aria-pressed={selectedServiceId === service.id}
                    className={`focus-ring rounded-[8px] border p-4 text-start transition ${
                      selectedServiceId === service.id
                        ? "border-primary bg-[#e8f3ef] shadow-sm"
                        : "border-line bg-white hover:border-primary hover:bg-[#f8fbf9]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-extrabold">{service.name}</p>
                          {selectedServiceId === service.id ? (
                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white">
                              {t.booking.selectedLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 leading-7 text-muted">{service.description}</p>
                      </div>
                      <div className="text-start sm:text-end">
                        <p className="font-extrabold text-primary">{formatPrice(service.price, language)}</p>
                        <p className="mt-1 text-sm font-bold text-muted">{formatDuration(service.durationMinutes, language)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="soft-card rounded-[8px] p-5">
              <div className="flex items-start gap-2">
                <CalendarDays size={20} className="mt-1 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold">{t.booking.dateQuestion}</h2>
                </div>
              </div>
              <label className="mt-4 grid max-w-xs gap-2 text-sm font-bold">
                {t.booking.dateLabel}
                <input
                  type="date"
                  min={getToday()}
                  dir="ltr"
                  value={date}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setSelectedSlot(null);
                    setError("");
                    if (nextDate !== date) {
                      setLoadingSlots(true);
                      setSlots([]);
                      setDate(nextDate);
                    }
                  }}
                  className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-start text-base"
                />
              </label>

              <div className="mt-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
                  <Clock3 size={16} aria-hidden="true" />
                  {interpolate(t.booking.availableTimes, { date: formatDate(date, language) })}
                </p>
                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span key={index} className="h-11 animate-pulse rounded-[8px] bg-[#eef1ee]" />
                    ))}
                  </div>
                ) : slots.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={`${slot.date}-${slot.startTime}`}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`focus-ring ltr min-h-11 rounded-[8px] border px-3 py-2 text-center font-extrabold transition ${
                          selectedSlot?.startTime === slot.startTime
                            ? "border-primary bg-primary text-white"
                            : slot.available
                              ? "border-line bg-white text-foreground hover:border-primary"
                              : "border-line bg-[#f3f1eb] text-muted line-through opacity-60"
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-dashed border-line bg-white p-5 text-center text-muted">
                    {t.booking.noSlots}
                  </div>
                )}
                {selectedSlot ? (
                  <p className="mt-3 rounded-[8px] bg-[#e8f3ef] px-4 py-3 text-sm font-extrabold text-primary">
                    {t.booking.selectedTime}: <span className="ltr inline-block">{selectedSlot.startTime}</span>
                  </p>
                ) : null}
              </div>
            </section>

            <form onSubmit={submitBooking} className="soft-card rounded-[8px] p-5">
              <div className="flex items-start gap-2">
                <UserRound size={20} className="mt-1 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold">{t.booking.customerDetails}</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  {t.booking.nameLabel}
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                    className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
                    placeholder={t.booking.namePlaceholder}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  {t.booking.phoneLabel}
                  <input
                    required
                    dir="ltr"
                    value={form.customerPhone}
                    onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                    className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-start text-base"
                    placeholder={t.booking.phonePlaceholder}
                  />
                </label>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold">
                {t.booking.notesLabel}
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="focus-ring min-h-24 rounded-[8px] border border-line bg-white px-4 py-3 text-base"
                  placeholder={t.booking.notesPlaceholder}
                />
              </label>

              {selectedSlot ? (
                <div className="mt-4 rounded-[8px] bg-[#e8f3ef] p-4 text-sm text-primary">
                  <p className="font-extrabold">{t.booking.bookingSummary}</p>
                  <p className="mt-2 font-bold">
                    {interpolate(t.booking.summaryLine, {
                      service: selectedService.name,
                      date: formatDate(selectedSlot.date, language),
                      time: selectedSlot.startTime,
                    })}
                  </p>
                </div>
              ) : null}

              {error ? <p className="mt-4 rounded-[8px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

              <button
                disabled={!selectedSlot || submitting}
                className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white transition hover:bg-primary-strong disabled:opacity-60 sm:w-auto"
              >
                {!selectedSlot ? t.booking.chooseTimeFirst : submitting ? t.booking.submitting : t.booking.submit}
                <CheckCircle2 size={18} aria-hidden="true" />
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

function Confirmation({ business, service, booking }: { business: Business; service: Service; booking: Booking }) {
  const { language, t } = useI18n();

  return (
    <section className="soft-card rounded-[8px] p-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e8f3ef] text-primary">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-3xl font-extrabold">{t.booking.successTitle}</h2>
      <p className="mx-auto mt-3 max-w-lg leading-8 text-muted">{t.booking.successText}</p>
      <div className="mx-auto mt-6 grid max-w-lg gap-3 rounded-[8px] border border-line bg-white p-5 text-start">
        <p>
          <span className="font-extrabold">{t.booking.business}:</span> {business.name}
        </p>
        <p>
          <span className="font-extrabold">{t.booking.service}:</span> {service.name}
        </p>
        <p>
          <span className="font-extrabold">{t.booking.time}:</span> {formatDate(booking.date, language)},{" "}
          <span className="ltr inline-block">{booking.startTime}</span>
        </p>
        <p>
          <span className="font-extrabold">{t.booking.name}:</span> {booking.customerName}
        </p>
      </div>
    </section>
  );
}
