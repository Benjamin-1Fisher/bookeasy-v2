"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, MessageSquareText, UserRound } from "lucide-react";
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

        setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!ignore) {
          setError("לא הצלחנו לטעון שעות פנויות כרגע");
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
  }, [business.id, selectedServiceId, date]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !selectedSlot) {
      setError("צריך לבחור שירות ושעה כדי להמשיך");
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
      setError(data.error ?? "לא הצלחנו לשמור את ההזמנה. נסה שוב בעוד רגע");
      return;
    }

    setBooking(data.booking);
  }

  if (!selectedService) {
    return (
      <div className="rounded-[8px] border border-line bg-white p-6 text-center">
        <p className="text-lg font-extrabold">אין שירותים פעילים כרגע</p>
        <p className="mt-2 text-muted">כדאי ליצור קשר עם העסק כדי לבדוק זמינות.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" id="booking">
      <aside className="soft-card h-fit rounded-[8px] p-5">
        <p className="text-sm font-bold text-primary">שלב {step} מתוך 4</p>
        <h2 className="mt-2 text-2xl font-extrabold">בחירת תור</h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f3ef]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="mt-5 grid gap-2">
          {[
            ["1", "בחירת שירות", Boolean(selectedServiceId)],
            ["2", "בחירת תאריך ושעה", Boolean(selectedSlot)],
            ["3", "פרטי לקוח", Boolean(form.customerName && form.customerPhone)],
            ["4", "אישור הזמנה", Boolean(booking)],
          ].map(([number, label, done]) => (
            <div key={String(label)} className="flex items-center gap-3 rounded-[8px] bg-[#f4f7f5] p-3">
              <span
                className={`grid size-8 place-items-center rounded-full text-sm font-extrabold ${
                  done ? "bg-primary text-white" : "bg-white text-muted"
                }`}
              >
                {done ? <Check size={16} aria-hidden="true" /> : number}
              </span>
              <span className="font-bold">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="grid gap-5">
        {booking ? (
          <Confirmation business={business} service={selectedService} booking={booking} />
        ) : (
          <>
            <section className="soft-card rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <MessageSquareText size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-xl font-extrabold">1. בוחרים שירות</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(null);
                      setError("");
                      setLoadingSlots(true);
                      setSelectedServiceId(service.id);
                    }}
                    className={`focus-ring rounded-[8px] border p-4 text-right transition ${
                      selectedServiceId === service.id
                        ? "border-primary bg-[#e8f3ef] shadow-sm"
                        : "border-line bg-white hover:border-primary hover:bg-[#f8fbf9]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-extrabold">{service.name}</p>
                        <p className="mt-1 leading-7 text-muted">{service.description}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-primary">{formatPrice(service.price)}</p>
                        <p className="mt-1 text-sm font-bold text-muted">{formatDuration(service.durationMinutes)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="soft-card rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <CalendarDays size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-xl font-extrabold">2. בוחרים תאריך ושעה</h2>
              </div>
              <label className="mt-4 grid max-w-xs gap-2 text-sm font-bold">
                תאריך
                <input
                  type="date"
                  min={getToday()}
                  dir="ltr"
                  value={date}
                  onChange={(event) => {
                    setSelectedSlot(null);
                    setError("");
                    setLoadingSlots(true);
                    setDate(event.target.value);
                  }}
                  className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base"
                />
              </label>

              <div className="mt-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
                  <Clock3 size={16} aria-hidden="true" />
                  שעות פנויות עבור {formatDate(date)}
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
                    אין שעות פנויות בתאריך הזה. כדאי לבחור תאריך אחר.
                  </div>
                )}
              </div>
            </section>

            <form onSubmit={submitBooking} className="soft-card rounded-[8px] p-5">
              <div className="flex items-center gap-2">
                <UserRound size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-xl font-extrabold">3. משאירים פרטים</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  שם מלא
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                    className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
                    placeholder="איך נקרא לך?"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  מספר טלפון
                  <input
                    required
                    dir="ltr"
                    value={form.customerPhone}
                    onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                    className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base"
                    placeholder="050-0000000"
                  />
                </label>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold">
                הערות אופציונליות
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="focus-ring min-h-24 rounded-[8px] border border-line bg-white px-4 py-3 text-base"
                  placeholder="משהו שחשוב לדעת לפני שמגיעים?"
                />
              </label>

              {selectedSlot ? (
                <div className="mt-4 rounded-[8px] bg-[#e8f3ef] p-4 text-sm font-bold text-primary">
                  סיכום: {selectedService.name}, {formatDate(selectedSlot.date)}, בשעה{" "}
                  <span className="ltr inline-block">{selectedSlot.startTime}</span>
                </div>
              ) : null}

              {error ? <p className="mt-4 rounded-[8px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

              <button
                disabled={!selectedSlot || submitting}
                className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white transition hover:bg-primary-strong disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "שומר הזמנה..." : "אישור הזמנה"}
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
  return (
    <section className="soft-card rounded-[8px] p-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e8f3ef] text-primary">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-3xl font-extrabold">ההזמנה נשלחה</h2>
      <p className="mx-auto mt-3 max-w-lg leading-8 text-muted">
        קיבלנו את הפרטים שלך. העסק יוכל לאשר את ההזמנה מתוך לוח הניהול.
      </p>
      <div className="mx-auto mt-6 grid max-w-lg gap-3 rounded-[8px] border border-line bg-white p-5 text-right">
        <p>
          <span className="font-extrabold">עסק:</span> {business.name}
        </p>
        <p>
          <span className="font-extrabold">שירות:</span> {service.name}
        </p>
        <p>
          <span className="font-extrabold">מועד:</span> {formatDate(booking.date)}, שעה{" "}
          <span className="ltr inline-block">{booking.startTime}</span>
        </p>
        <p>
          <span className="font-extrabold">שם:</span> {booking.customerName}
        </p>
      </div>
    </section>
  );
}
