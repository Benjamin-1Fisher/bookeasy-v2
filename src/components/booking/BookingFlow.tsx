"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, MessageSquareText, UserRound } from "lucide-react";
import {
  buildBookingLinks,
  generateCancellationMessage,
  generateConfirmationMessage,
} from "@/lib/assistant";
import { addDaysToDateKey, dateFromKey, getBookingWindowBounds } from "@/lib/booking-window";
import { formatDate, formatDuration, formatPrice } from "@/lib/format";
import type { Booking, Business, Service, Slot, WaitlistEntry } from "@/lib/types";

type BookingFlowProps = {
  business: Business;
  services: Service[];
};

type BookingForm = {
  customerName: string;
  customerPhone: string;
  notes: string;
};

type SavedCustomerDetails = Pick<BookingForm, "customerName" | "customerPhone">;

const initialForm: BookingForm = {
  customerName: "",
  customerPhone: "",
  notes: "",
};

const customerDetailsStorageKey = "bookeasy:customer-details:v1";
const quickDateCount = 7;
const calendarCells = 42;
const calendarWeekdays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const slotPeriods = [
  { id: "morning", label: "בוקר", start: 0, end: 12 * 60 },
  { id: "afternoon", label: "צהריים", start: 12 * 60, end: 16 * 60 },
  { id: "evening", label: "אחה\"צ וערב", start: 16 * 60, end: 24 * 60 },
];

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatQuickDateLabel(index: number, value: string) {
  if (index === 0) {
    return "היום";
  }

  if (index === 1) {
    return "מחר";
  }

  return new Intl.DateTimeFormat("he-IL", { weekday: "short" }).format(dateFromKey(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric" }).format(dateFromKey(value));
}

function formatSlotCount(count: number) {
  if (count === 1) {
    return "תור פנוי אחד";
  }

  return `${count} תורים פנויים`;
}

function formatGroupSlotCount(count: number) {
  if (count === 1) {
    return "תור אחד";
  }

  return `${count} תורים`;
}

function getMonthStart(value: string) {
  const date = dateFromKey(value);
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function addMonths(value: string, months: number) {
  const date = dateFromKey(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(dateFromKey(value));
}

function getCalendarDays(month: string) {
  const firstDate = dateFromKey(getMonthStart(month));
  const firstDay = firstDate.getDay();
  const daysInMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();

  return Array.from({ length: calendarCells }, (_, index) => {
    const day = index - firstDay + 1;

    if (day < 1 || day > daysInMonth) {
      return null;
    }

    const date = new Date(firstDate);
    date.setDate(day);

    return {
      value: date.toISOString().slice(0, 10),
      day,
    };
  });
}

function readSavedCustomerDetails(): SavedCustomerDetails | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(customerDetailsStorageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedCustomerDetails>;
    const customerName = typeof parsed.customerName === "string" ? parsed.customerName.trim() : "";
    const customerPhone = typeof parsed.customerPhone === "string" ? parsed.customerPhone.trim() : "";

    if (!customerName && !customerPhone) {
      return null;
    }

    return { customerName, customerPhone };
  } catch {
    return null;
  }
}

function saveCustomerDetails(details: SavedCustomerDetails) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      customerDetailsStorageKey,
      JSON.stringify({
        customerName: details.customerName.trim(),
        customerPhone: details.customerPhone.trim(),
      }),
    );
  } catch {
    // Booking should still succeed if the browser blocks local storage.
  }
}

export function BookingFlow({ business, services }: BookingFlowProps) {
  const bookingWindow = useMemo(() => getBookingWindowBounds(business), [business]);
  const { today, maxDate } = bookingWindow;
  const activeServices = useMemo(() => services.filter((service) => service.isActive), [services]);
  const [selectedServiceId, setSelectedServiceId] = useState(activeServices[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [loadingSlots, setLoadingSlots] = useState(Boolean(selectedServiceId));
  const [submitting, setSubmitting] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);

  const selectedService = activeServices.find((service) => service.id === selectedServiceId) ?? activeServices[0];
  const availableSlots = useMemo(() => slots.filter((slot) => slot.available), [slots]);
  const quickDates = useMemo(
    () =>
      Array.from({ length: Math.min(quickDateCount, bookingWindow.days + 1) }, (_, index) => {
        const value = addDaysToDateKey(today, index);
        return {
          value,
          label: formatQuickDateLabel(index, value),
          shortDate: formatShortDate(value),
        };
      }),
    [bookingWindow.days, today],
  );
  const slotGroups = useMemo(
    () =>
      slotPeriods
        .map((period) => ({
          ...period,
          slots: availableSlots.filter((slot) => {
            const start = minutesFromTime(slot.startTime);
            return start >= period.start && start < period.end;
          }),
        }))
        .filter((group) => group.slots.length > 0),
    [availableSlots],
  );
  const step = booking ? 4 : selectedSlot ? 3 : selectedServiceId ? 2 : 1;
  const bookingSteps = [
    ["1", "בחירת שירות", Boolean(selectedServiceId)] as const,
    ["2", "תאריך ושעה", Boolean(selectedSlot)] as const,
    ["3", "פרטי לקוח", Boolean(form.customerName && form.customerPhone)] as const,
    ["4", "התור נקבע", Boolean(booking)] as const,
  ];
  const currentStepLabel = bookingSteps[Math.min(step - 1, bookingSteps.length - 1)]?.[1] ?? "בחירת תור";

  function changeDate(nextDate: string) {
    if (!nextDate || nextDate === date) {
      return;
    }

    if (nextDate < today || nextDate > maxDate) {
      setError(`אפשר לבחור תאריך עד ${formatDate(maxDate)}`);
      return;
    }

    setSelectedSlot(null);
    setError("");
    setLoadingSlots(true);
    setDate(nextDate);
  }

  useEffect(() => {
    const savedDetails = readSavedCustomerDetails();

    if (!savedDetails) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        customerName: current.customerName || savedDetails.customerName,
        customerPhone: current.customerPhone || savedDetails.customerPhone,
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

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

    saveCustomerDetails({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
    });
    setBooking(data.booking);
  }

  async function joinWaitlist() {
    if (!selectedService) {
      setError("צריך לבחור שירות כדי להצטרף לרשימת המתנה");
      return;
    }

    if (!form.customerName || !form.customerPhone) {
      setError("כדי להצטרף לרשימת המתנה צריך להשאיר שם וטלפון");
      return;
    }

    setJoiningWaitlist(true);
    setError("");

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: selectedService.id,
        preferredDate: date,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes,
      }),
    });
    const data = (await response.json()) as { entry?: WaitlistEntry; error?: string };
    setJoiningWaitlist(false);

    if (!response.ok || !data.entry) {
      setError(data.error ?? "לא הצלחנו לצרף אותך לרשימת ההמתנה");
      return;
    }

    saveCustomerDetails({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
    });
    setWaitlistEntry(data.entry);
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
    <section className="grid gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]" id="booking">
      <div className="soft-card rounded-[8px] p-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-primary">שלב {step} מתוך 4</p>
            <h2 className="mt-1 text-xl font-extrabold">{currentStepLabel}</h2>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f3ef] text-sm font-extrabold text-primary">
            {step}/4
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8f3ef]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <aside className="soft-card hidden h-fit rounded-[8px] p-5 lg:sticky lg:top-5 lg:block">
        <p className="text-sm font-bold text-primary">שלב {step} מתוך 4</p>
        <h2 className="mt-2 text-2xl font-extrabold">בחירת תור</h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f3ef]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="mt-5 grid gap-2">
          {bookingSteps.map(([number, label, done]) => (
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
            <section className="soft-card rounded-[8px] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <MessageSquareText size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-lg font-extrabold sm:text-xl">1. בוחרים שירות</h2>
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
                    className={`focus-ring rounded-[8px] border p-3 text-right transition sm:p-4 ${
                      selectedServiceId === service.id
                        ? "border-primary bg-[#e8f3ef] shadow-sm"
                        : "border-line bg-white hover:border-primary hover:bg-[#f8fbf9]"
                    }`}
                  >
                    <div className="grid gap-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold">{service.name}</p>
                        <p className="mt-1 text-sm leading-6 text-muted sm:text-base sm:leading-7">{service.description}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-[8px] bg-white/65 px-3 py-2 text-right sm:block sm:bg-transparent sm:p-0 sm:text-left">
                        <p className="font-extrabold text-primary">{formatPrice(service.price)}</p>
                        <p className="mt-1 text-sm font-bold text-muted">{formatDuration(service.durationMinutes)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="soft-card rounded-[8px] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CalendarDays size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-lg font-extrabold sm:text-xl">2. בוחרים תאריך ושעה</h2>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                  <div className="flex min-w-max gap-2">
                    {quickDates.map((quickDate) => {
                      const selected = quickDate.value === date;

                      return (
                        <button
                          key={quickDate.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => changeDate(quickDate.value)}
                          className={`focus-ring grid min-h-14 w-20 place-items-center rounded-[8px] border px-3 py-2 text-center transition sm:min-h-16 sm:w-24 ${
                            selected
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-line bg-white text-foreground hover:border-primary hover:bg-[#f8fbf9]"
                          }`}
                        >
                          <span className="text-sm font-extrabold">{quickDate.label}</span>
                          <span className={`ltr text-sm font-bold ${selected ? "text-white/82" : "text-muted"}`}>
                            {quickDate.shortDate}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <BookingCalendar
                  selectedDate={date}
                  minDate={today}
                  maxDate={maxDate}
                  onChange={changeDate}
                />
                <p className="text-sm font-bold text-muted">
                  אפשר לקבוע תור עד {bookingWindow.days} ימים קדימה, עד {formatDate(maxDate)}.
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-muted">
                    <Clock3 size={16} aria-hidden="true" />
                    שעות פנויות עבור {formatDate(date)}
                  </p>
                  {!loadingSlots ? (
                    <span className="rounded-full bg-[#e8f3ef] px-3 py-1 text-sm font-extrabold text-primary">
                      {formatSlotCount(availableSlots.length)}
                    </span>
                  ) : null}
                </div>
                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span key={index} className="h-14 animate-pulse rounded-[8px] bg-[#eef1ee] sm:h-16" />
                    ))}
                  </div>
                ) : availableSlots.length ? (
                  <div className="grid gap-4">
                    {slotGroups.map((group) => (
                      <div key={group.id}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-extrabold text-foreground">{group.label}</h3>
                          <span className="text-xs font-bold text-muted">{formatGroupSlotCount(group.slots.length)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {group.slots.map((slot) => {
                            const selected = selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime;

                            return (
                              <button
                                key={`${slot.date}-${slot.startTime}`}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setSelectedSlot(slot)}
                                className={`focus-ring min-h-14 rounded-[8px] border px-3 py-2 text-center transition sm:min-h-16 ${
                                  selected
                                    ? "border-primary bg-primary text-white shadow-sm"
                                    : "border-line bg-white text-foreground hover:border-primary hover:bg-[#f8fbf9]"
                                }`}
                              >
                                <span className="ltr block text-xl font-extrabold leading-none">{slot.startTime}</span>
                                <span className={`mt-1 block text-xs font-bold ${selected ? "text-white/82" : "text-muted"}`}>
                                  עד <span className="ltr inline-block">{slot.endTime}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-dashed border-line bg-white p-5 text-center text-muted">
                    <p className="font-bold">אין שעות פנויות בתאריך הזה</p>
                    <button
                      type="button"
                      onClick={() => changeDate(addDaysToDateKey(date, 1))}
                      disabled={date >= maxDate}
                      className="focus-ring mt-3 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-primary px-4 py-2 font-extrabold text-white transition hover:bg-primary-strong"
                    >
                      {date >= maxDate ? "אין תאריכים נוספים בטווח" : "בדיקת היום הבא"}
                    </button>
                    {business.assistantSettings?.waitlistEnabled ? (
                      <WaitlistPanel
                        joined={Boolean(waitlistEntry)}
                        service={selectedService}
                        selectedDate={date}
                        form={form}
                        setForm={setForm}
                        joining={joiningWaitlist}
                        onJoin={joinWaitlist}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <form onSubmit={submitBooking} className="soft-card rounded-[8px] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <UserRound size={20} className="text-primary" aria-hidden="true" />
                <h2 className="text-lg font-extrabold sm:text-xl">3. משאירים פרטים</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  שם מלא
                  <input
                    required
                    autoComplete="name"
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
                    autoComplete="tel"
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
                {submitting ? "שומר תור..." : "קביעת תור"}
                <CheckCircle2 size={18} aria-hidden="true" />
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

function BookingCalendar({
  selectedDate,
  minDate,
  maxDate,
  onChange,
}: {
  selectedDate: string;
  minDate: string;
  maxDate: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(getMonthStart(selectedDate));
  const minMonth = getMonthStart(minDate);
  const maxMonth = getMonthStart(maxDate);
  const monthDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const previousDisabled = visibleMonth <= minMonth;
  const nextDisabled = visibleMonth >= maxMonth;

  function chooseDate(value: string) {
    onChange(value);
    setVisibleMonth(getMonthStart(value));
    setOpen(false);
  }

  return (
    <div className="relative max-w-xl">
      <span className="mb-2 block text-sm font-bold">תאריך אחר</span>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setVisibleMonth(getMonthStart(selectedDate));
          setOpen((current) => !current);
        }}
        className="focus-ring flex min-h-14 w-full items-center justify-between gap-3 rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base font-extrabold text-foreground"
      >
        <span>{formatDate(selectedDate)}</span>
        <CalendarDays size={20} className="text-primary" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-20 z-30 max-h-[calc(100vh-7rem)] overflow-auto rounded-[8px] border border-line bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-full sm:max-w-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-foreground">{formatMonth(visibleMonth)}</p>
              <p className="mt-1 text-xs font-bold text-muted">
                עד {formatDate(maxDate)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={previousDisabled}
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                className="focus-ring grid size-10 place-items-center rounded-[8px] border border-line bg-white text-foreground disabled:opacity-35"
                aria-label="חודש קודם"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                className="focus-ring grid size-10 place-items-center rounded-[8px] border border-line bg-white text-foreground disabled:opacity-35"
                aria-label="חודש הבא"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarWeekdays.map((day) => (
              <span key={day} className="py-2 text-xs font-extrabold text-muted">
                {day}
              </span>
            ))}
            {monthDays.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="h-11" />;
              }

              const selected = day.value === selectedDate;
              const disabled = day.value < minDate || day.value > maxDate;

              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => chooseDate(day.value)}
                  className={`focus-ring h-11 rounded-[8px] text-sm font-extrabold transition ${
                    selected
                      ? "bg-primary text-white shadow-sm"
                      : disabled
                        ? "cursor-not-allowed bg-[#f4f7f5] text-muted/45"
                        : "bg-white text-foreground hover:bg-[#e8f3ef] hover:text-primary"
                  }`}
                >
                  {day.day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => chooseDate(minDate)}
              className="focus-ring min-h-10 rounded-[8px] px-3 py-2 text-sm font-extrabold text-primary"
            >
              היום
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring min-h-10 rounded-[8px] px-3 py-2 text-sm font-extrabold text-muted"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WaitlistPanel({
  joined,
  service,
  selectedDate,
  form,
  setForm,
  joining,
  onJoin,
}: {
  joined: boolean;
  service: Service;
  selectedDate: string;
  form: BookingForm;
  setForm: Dispatch<SetStateAction<BookingForm>>;
  joining: boolean;
  onJoin: () => Promise<void>;
}) {
  if (joined) {
    return (
      <div className="mt-4 rounded-[8px] bg-[#e8f3ef] p-4 text-right text-primary">
        <p className="font-extrabold">נכנסת לרשימת המתנה</p>
        <p className="mt-1 text-sm font-bold">אם יתפנה זמן מתאים, העסק יוכל לשלוח לך הודעה לקביעת תור חדש.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[8px] border border-line bg-[#f4f7f5] p-4 text-right">
      <p className="text-base font-extrabold text-foreground">רשימת המתנה</p>
      <p className="mt-1 text-sm font-bold text-muted">
        אפשר להשאיר פרטים עבור {service.name} ב-{formatDate(selectedDate)}, ואם יתפנה מקום העסק יוכל לשלוח הודעה.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-foreground">
          שם מלא
          <input
            value={form.customerName}
            onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
            placeholder="איך נקרא לך?"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-foreground">
          טלפון
          <input
            dir="ltr"
            value={form.customerPhone}
            onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-right"
            placeholder="050-0000000"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onJoin}
        disabled={joining}
        className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-primary px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60 sm:w-auto"
      >
        {joining ? "מצרף לרשימה..." : "הצטרפות לרשימת המתנה"}
      </button>
    </div>
  );
}

function Confirmation({ business, service, booking }: { business: Business; service: Service; booking: Booking }) {
  const [cancelled, setCancelled] = useState(booking.status === "cancelled");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const links = buildBookingLinks(business, booking);
  const confirmationEnabled = business.assistantSettings?.confirmationEnabled !== false;
  const confirmationMessage = confirmationEnabled ? generateConfirmationMessage(business, service, booking) : "";
  const cancellationMessage = generateCancellationMessage(business, service, { ...booking, status: "cancelled" });

  async function cancelAppointment() {
    setCancelling(true);
    setCancelError("");

    const response = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
    const data = (await response.json()) as { error?: string };
    setCancelling(false);

    if (!response.ok) {
      setCancelError(data.error ?? "לא הצלחנו לבטל את התור");
      return;
    }

    setCancelled(true);
  }

  return (
    <section className="soft-card rounded-[8px] p-4 text-center sm:p-6">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e8f3ef] text-primary">
        <CheckCircle2 size={28} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">התור נקבע</h2>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-muted sm:leading-8">
        קיבלנו את הפרטים שלך והתור נכנס ללוח של העסק.
      </p>
      <div className="mx-auto mt-5 grid max-w-lg gap-3 rounded-[8px] border border-line bg-white p-4 text-right sm:mt-6 sm:p-5">
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
      <div className="mx-auto mt-4 grid max-w-lg gap-3 rounded-[8px] border border-line bg-[#f4f7f5] p-4 text-right">
        {confirmationEnabled ? (
          <>
            <p className="font-extrabold">הודעת אישור מוכנה לשליחה</p>
            <pre className="whitespace-pre-wrap rounded-[8px] bg-white p-3 text-right text-sm leading-6 text-foreground">{confirmationMessage}</pre>
          </>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <a
            href={links.rescheduleLink}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold text-foreground"
          >
            שינוי תור
          </a>
          <button
            type="button"
            onClick={cancelAppointment}
            disabled={cancelled || cancelling}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] border border-red-100 bg-white px-3 py-2 text-sm font-extrabold text-red-700 disabled:opacity-60"
          >
            {cancelled ? "התור בוטל" : cancelling ? "מבטל..." : "ביטול תור"}
          </button>
          <a
            href={links.bookAgainLink}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] bg-primary px-3 py-2 text-sm font-extrabold text-white"
          >
            קביעת תור נוסף
          </a>
        </div>
        {cancelled ? (
          <div className="rounded-[8px] bg-white p-3">
            <p className="mb-2 text-sm font-extrabold text-primary">הודעה אחרי ביטול</p>
            <p className="text-sm leading-6 text-foreground">{cancellationMessage}</p>
          </div>
        ) : null}
        {cancelError ? <p className="text-sm font-bold text-red-700">{cancelError}</p> : null}
      </div>
    </section>
  );
}
