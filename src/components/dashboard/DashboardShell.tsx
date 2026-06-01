"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardList,
  ExternalLink,
  Eye,
  LayoutDashboard,
  LinkIcon,
  Plus,
  Save,
  Settings,
  ToggleLeft,
  Trash2,
  Upload,
} from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { BusinessIcon, businessIconOptions } from "@/components/ui/BusinessIcon";
import { bookingStatusLabels, dayNames, formatDuration, formatPrice, getBusinessToneClasses } from "@/lib/format";
import { launchPlan } from "@/lib/pricing";
import type { AvailabilityRule, Booking, BookingStatus, Business, Service } from "@/lib/types";

const scheduleStatusOptions: BookingStatus[] = ["confirmed", "completed", "cancelled"];
const maxProfileImageSize = 1_500_000;

type SummaryCards = {
  totalBookings: number;
  upcomingBookings: number;
  popularService: string;
  publicDemoPages: number;
};

type DashboardInitialData = {
  businesses: Business[];
  business: Business;
  services: Service[];
  bookings: Booking[];
  availabilityRules: AvailabilityRule[];
  cards: SummaryCards;
};

type DashboardShellProps = {
  initialData: DashboardInitialData;
};

type Tab = "overview" | "bookings" | "services" | "availability" | "profile";

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "סקירה", icon: LayoutDashboard },
  { id: "bookings", label: "הזמנות", icon: ClipboardList },
  { id: "services", label: "שירותים", icon: Settings },
  { id: "availability", label: "זמינות", icon: CalendarDays },
  { id: "profile", label: "עמוד העסק", icon: LinkIcon },
];

const toneOptions: Array<{ value: Business["coverTone"]; label: string }> = [
  { value: "teal", label: "ירוק מקצועי" },
  { value: "rose", label: "ורוד עדין" },
  { value: "blue", label: "כחול רגוע" },
];

const categoryOptions: Array<{ value: Business["category"]; label: string }> = [
  { value: "barber", label: "מספרה / ברבר" },
  { value: "nails", label: "קוסמטיקה / ציפורניים" },
  { value: "clinic", label: "קליניקה" },
  { value: "fitness", label: "אימון אישי" },
  { value: "other", label: "אחר" },
];

const emptyService = {
  name: "",
  description: "",
  price: 120,
  durationMinutes: 45,
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardShell({ initialData }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [business, setBusiness] = useState(initialData.business);
  const [services, setServices] = useState(initialData.services);
  const [bookings, setBookings] = useState(initialData.bookings);
  const [availabilityRules, setAvailabilityRules] = useState(initialData.availabilityRules);
  const [cards, setCards] = useState(initialData.cards);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const bookingLink = `/b/${business.slug}`;
  const today = getToday();
  const todayBookings = bookings.filter((booking) => booking.date === today && booking.status !== "cancelled");
  const upcomingBookings = bookings.filter((booking) => booking.date >= today && booking.status !== "cancelled");

  async function refreshSummary() {
    const response = await fetch(`/api/admin/summary?businessId=${business.id}`);
    const data = (await response.json()) as DashboardInitialData & { error?: string };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו לרענן את הנתונים");
      return;
    }

    setBusiness(data.business);
    setServices(data.services);
    setBookings(data.bookings);
    setAvailabilityRules(data.availabilityRules);
    setCards(data.cards);
  }

  function notify(text: string) {
    setError("");
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex flex-col gap-4 py-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="icon-tile size-11 shrink-0 sm:size-12">
              <BusinessIcon value={business.businessIcon} className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-primary">לוח ניהול</p>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{business.name}</h1>
            </div>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <select
              value={business.id}
              onChange={(event) => {
                window.location.href = `/dashboard?businessId=${event.target.value}`;
              }}
              className="focus-ring min-h-11 w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-bold text-foreground sm:w-auto"
              aria-label="בחירת עסק לעריכה"
            >
              {initialData.businesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <CopyButton value={bookingLink} label="העתק לינק הזמנות" />
            <a
              href={`/b/${business.slug}`}
              target="_blank"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              <Eye size={17} aria-hidden="true" />
              תצוגה מקדימה
            </a>
          </div>
        </div>
      </header>

      <div className="container-shell grid gap-4 py-4 sm:gap-6 sm:py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit overflow-x-auto rounded-[8px] border border-line bg-white p-2 [scrollbar-width:none] lg:sticky lg:top-4 lg:overflow-visible">
          <nav className="flex min-w-max gap-1 lg:grid lg:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`focus-ring flex min-h-11 shrink-0 items-center gap-2 rounded-[8px] px-3 py-2 text-right text-sm font-bold transition sm:gap-3 sm:text-base ${
                    activeTab === tab.id ? "bg-[#e8f3ef] text-primary" : "text-muted hover:bg-[#f4f7f5] hover:text-foreground"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="grid gap-5">
          {message ? <p className="rounded-[8px] bg-emerald-50 px-4 py-3 font-bold text-emerald-800">{message}</p> : null}
          {error ? <p className="rounded-[8px] bg-red-50 px-4 py-3 font-bold text-red-700">{error}</p> : null}

          {activeTab === "overview" ? (
            <OverviewTab
              cards={cards}
              todayBookings={todayBookings}
              upcomingBookings={upcomingBookings}
              services={services}
              business={business}
              bookingLink={bookingLink}
            />
          ) : null}

          {activeTab === "bookings" ? (
            <BookingsTab
              bookings={bookings}
              services={services}
              onStatusChange={async (id, status) => {
                const response = await fetch(`/api/admin/bookings/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                });
                const data = (await response.json()) as { error?: string };

                if (!response.ok) {
                  setError(data.error ?? "לא הצלחנו לעדכן סטטוס");
                  return;
                }

                await refreshSummary();
                notify("סטטוס ההזמנה עודכן");
              }}
            />
          ) : null}

          {activeTab === "services" ? (
            <ServicesTab
              businessId={business.id}
              services={services}
              setServices={setServices}
              refreshSummary={refreshSummary}
              notify={notify}
              setError={setError}
            />
          ) : null}

          {activeTab === "availability" ? (
            <AvailabilityTab
              business={business}
              setBusiness={setBusiness}
              rules={availabilityRules}
              setRules={setAvailabilityRules}
              refreshSummary={refreshSummary}
              notify={notify}
              setError={setError}
            />
          ) : null}

          {activeTab === "profile" ? (
            <ProfileTab
              business={business}
              setBusiness={setBusiness}
              bookingLink={bookingLink}
              notify={notify}
              setError={setError}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function OverviewTab({
  cards,
  todayBookings,
  upcomingBookings,
  services,
  business,
  bookingLink,
}: {
  cards: SummaryCards;
  todayBookings: Booking[];
  upcomingBookings: Booking[];
  services: Service[];
  business: Business;
  bookingLink: string;
}) {
  return (
    <>
      <LaunchPriceNotice />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["סך כל ההזמנות", cards.totalBookings],
          ["הזמנות קרובות", cards.upcomingBookings],
          ["השירות הכי פופולרי", cards.popularService],
          ["דפי דמו פתוחים", cards.publicDemoPages],
        ].map(([label, value]) => (
          <article key={label} className="soft-card rounded-[8px] p-5">
            <p className="text-sm font-bold text-muted">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="הזמנות להיום" icon={CalendarClock}>
          {todayBookings.length ? (
            <BookingList bookings={todayBookings} services={services} compact />
          ) : (
            <EmptyState title="אין הזמנות להיום" text="כשייכנסו הזמנות להיום הן יופיעו כאן." />
          )}
        </Panel>

        <Panel title="הזמנות קרובות" icon={ClipboardList}>
          {upcomingBookings.length ? (
            <BookingList bookings={upcomingBookings.slice(0, 5)} services={services} compact />
          ) : (
            <EmptyState title="אין הזמנות קרובות" text="זה מקום טוב לראות מה מחכה לך השבוע." />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="גישה עצמאית לדמו" icon={ExternalLink}>
          <div className="grid gap-4">
            <p className="leading-7 text-muted">
              אפשר לפתוח את דף ההזמנות ואת לוח הניהול בלי לשלוח פרטים. זה המקום לבדוק את החוויה כמו בעל עסק וכמו לקוח.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-bold text-white"
                href={`/b/${business.slug}`}
                target="_blank"
              >
                פתח דף הזמנות
                <ExternalLink size={16} aria-hidden="true" />
              </a>
              <Link
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] border border-line bg-white px-4 py-2 font-bold text-foreground"
                href="/#demo-access"
              >
                כל הדמוים
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="תצוגה מקדימה של דף ההזמנות" icon={Eye}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">כך נראה הלינק שהלקוחות יקבלו.</p>
            <a className="focus-ring inline-flex items-center gap-2 rounded-[8px] font-bold text-primary" href={`/b/${business.slug}`} target="_blank">
              פתיחה בחלון חדש
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="h-[460px] overflow-hidden rounded-[8px] border border-line bg-white">
            <iframe title="תצוגה מקדימה של דף ההזמנות" src={bookingLink || `/b/${business.slug}`} className="h-full w-full" />
          </div>
        </Panel>
      </div>
    </>
  );
}

function BookingsTab({
  bookings,
  services,
  onStatusChange,
}: {
  bookings: Booking[];
  services: Service[];
  onStatusChange: (id: string, status: BookingStatus) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const today = getToday();
  const filteredBookings = bookings.filter((booking) => {
    if (filter === "upcoming") {
      return booking.date >= today;
    }
    if (filter === "past") {
      return booking.date < today;
    }
    return true;
  });

  return (
    <Panel title="לוח תורים" icon={ClipboardList}>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["upcoming", "קרובות"],
          ["past", "קודמות"],
          ["all", "הכול"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as "upcoming" | "past" | "all")}
            className={`focus-ring rounded-[8px] px-4 py-2 text-sm font-bold ${
              filter === value ? "bg-primary text-white" : "border border-line bg-white text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredBookings.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-right">
            <thead>
              <tr className="text-sm text-muted">
                <th className="border-b border-line px-3 py-3">לקוח</th>
                <th className="border-b border-line px-3 py-3">טלפון</th>
                <th className="border-b border-line px-3 py-3">שירות</th>
                <th className="border-b border-line px-3 py-3">תאריך ושעה</th>
                <th className="border-b border-line px-3 py-3">מצב</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const service = services.find((item) => item.id === booking.serviceId);
                return (
                  <tr key={booking.id}>
                    <td className="border-b border-line px-3 py-3 font-bold">{booking.customerName}</td>
                    <td className="ltr border-b border-line px-3 py-3 text-right">{booking.customerPhone}</td>
                    <td className="border-b border-line px-3 py-3">{service?.name ?? "שירות לא נמצא"}</td>
                    <td className="border-b border-line px-3 py-3">
                      {booking.date} · <span className="ltr inline-block">{booking.startTime}</span>
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <select
                        value={booking.status === "pending" ? "confirmed" : booking.status}
                        onChange={(event) => onStatusChange(booking.id, event.target.value as BookingStatus)}
                        className="focus-ring rounded-[8px] border border-line bg-white px-3 py-2 font-bold"
                      >
                        {scheduleStatusOptions.map((value) => (
                          <option key={value} value={value}>
                            {bookingStatusLabels[value]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="אין הזמנות להצגה" text="אפשר לשנות סינון או לפתוח את דף ההזמנות וליצור הזמנת דמו." />
      )}
    </Panel>
  );
}

function ServicesTab({
  businessId,
  services,
  setServices,
  refreshSummary,
  notify,
  setError,
}: {
  businessId: string;
  services: Service[];
  setServices: (services: Service[]) => void;
  refreshSummary: () => Promise<void>;
  notify: (text: string) => void;
  setError: (text: string) => void;
}) {
  const [newService, setNewService] = useState(emptyService);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, businessId, isActive: true }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו להוסיף שירות");
      return;
    }

    setNewService(emptyService);
    await refreshSummary();
    notify("השירות נוסף");
  }

  async function save(service: Service) {
    const response = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו לשמור שירות");
      return;
    }

    await refreshSummary();
    notify("השירות נשמר");
  }

  async function remove(serviceId: string) {
    const response = await fetch(`/api/admin/services/${serviceId}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string; deactivated?: boolean };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו למחוק שירות");
      return;
    }

    await refreshSummary();
    notify(data.deactivated ? "יש הזמנות פעילות, לכן השירות כובה במקום להימחק" : "השירות נמחק");
  }

  return (
    <div className="grid gap-5">
      <Panel title="הוספת שירות" icon={Plus}>
        <form onSubmit={add} className="grid gap-4 lg:grid-cols-[1fr_1fr_120px_140px_auto] lg:items-end">
          <Field label="שם שירות">
            <input
              required
              value={newService.name}
              onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
              placeholder="לדוגמה: תספורת גבר"
            />
          </Field>
          <Field label="תיאור">
            <input
              value={newService.description}
              onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
              placeholder="מה כולל השירות?"
            />
          </Field>
          <Field label="מחיר">
            <input
              type="number"
              min="0"
              value={newService.price}
              onChange={(event) => setNewService((current) => ({ ...current, price: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <Field label="משך בדקות">
            <input
              type="number"
              min="15"
              step="5"
              value={newService.durationMinutes}
              onChange={(event) => setNewService((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-3 font-extrabold text-white">
            <Plus size={18} aria-hidden="true" />
            הוסף
          </button>
        </form>
      </Panel>

      <Panel title="ניהול שירותים" icon={Settings}>
        {services.length ? (
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.id} className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_110px_120px_auto] lg:items-end">
                  <Field label="שם שירות">
                    <input
                      value={service.name}
                      onChange={(event) =>
                        setServices(services.map((item) => (item.id === service.id ? { ...item, name: event.target.value } : item)))
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label="תיאור">
                    <input
                      value={service.description}
                      onChange={(event) =>
                        setServices(
                          services.map((item) => (item.id === service.id ? { ...item, description: event.target.value } : item)),
                        )
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label="מחיר">
                    <input
                      type="number"
                      value={service.price}
                      onChange={(event) =>
                        setServices(services.map((item) => (item.id === service.id ? { ...item, price: Number(event.target.value) } : item)))
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label="משך">
                    <input
                      type="number"
                      value={service.durationMinutes}
                      onChange={(event) =>
                        setServices(
                          services.map((item) => (item.id === service.id ? { ...item, durationMinutes: Number(event.target.value) } : item)),
                        )
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => save(service)}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-primary px-3 py-2 text-sm font-extrabold text-white"
                    >
                      <Save size={16} aria-hidden="true" />
                      שמור
                    </button>
                    <button
                      type="button"
                      onClick={() => save({ ...service, isActive: !service.isActive })}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold"
                    >
                      <ToggleLeft size={16} aria-hidden="true" />
                      {service.isActive ? "כבה" : "הפעל"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(service.id)}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-red-100 bg-white px-3 py-2 text-sm font-extrabold text-red-700"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      מחק
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-muted">
                  {formatPrice(service.price)} · {formatDuration(service.durationMinutes)} · {service.isActive ? "פעיל" : "כבוי"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="אין שירותים" text="הוסיפו שירות ראשון כדי שלקוחות יוכלו להזמין." />
        )}
      </Panel>
    </div>
  );
}

function AvailabilityTab({
  business,
  setBusiness,
  rules,
  setRules,
  refreshSummary,
  notify,
  setError,
}: {
  business: Business;
  setBusiness: (business: Business) => void;
  rules: AvailabilityRule[];
  setRules: (rules: AvailabilityRule[]) => void;
  refreshSummary: () => Promise<void>;
  notify: (text: string) => void;
  setError: (text: string) => void;
}) {
  const bookingWindowDays = business.bookingWindowDays ?? 60;
  const normalizedRules = useMemo(
    () =>
      dayNames.map((_, dayOfWeek) => {
        const existing = rules.find((rule) => rule.dayOfWeek === dayOfWeek);
        return (
          existing ?? {
            id: `draft_${dayOfWeek}`,
            businessId: business.id,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isActive: dayOfWeek > 0 && dayOfWeek < 5,
          }
        );
      }),
    [business.id, rules],
  );

  async function save() {
    const response = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: business.id, rules: normalizedRules }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו לשמור זמינות");
      return;
    }

    await refreshSummary();
    notify("הזמינות נשמרה");
  }

  function updateRule(dayOfWeek: number, patch: Partial<AvailabilityRule>) {
    setRules(normalizedRules.map((rule) => (rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule)));
  }

  async function saveBookingWindow() {
    const response = await fetch("/api/admin/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: business.id, bookingWindowDays }),
    });
    const data = (await response.json()) as { business?: Business; error?: string };

    if (!response.ok || !data.business) {
      setError(data.error ?? "לא הצלחנו לשמור את טווח ההזמנות");
      return;
    }

    setBusiness(data.business);
    await refreshSummary();
    notify("טווח ההזמנות נשמר");
  }

  return (
    <div className="grid gap-5">
      <Panel title="טווח הזמנות" icon={CalendarClock}>
        <p className="mb-4 leading-7 text-muted">
          קבעו עד כמה ימים קדימה לקוחות יוכלו לבחור תור בלוח השנה.
        </p>
        <div className="grid gap-4 rounded-[8px] border border-line bg-[#f4f7f5] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Field label="פתיחת תורים קדימה">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={bookingWindowDays}
                onChange={(event) =>
                  setBusiness({ ...business, bookingWindowDays: Math.min(365, Math.max(1, Number(event.target.value) || 1)) })
                }
                className="focus-ring ltr w-28 rounded-[8px] border border-line bg-white px-3 py-3 text-center text-base font-extrabold"
              />
              <span className="font-bold text-muted">ימים קדימה</span>
            </div>
          </Field>
          <div className="flex flex-wrap gap-2">
            {[14, 30, 60, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setBusiness({ ...business, bookingWindowDays: days })}
                className={`focus-ring min-h-10 rounded-[8px] border px-3 py-2 text-sm font-extrabold ${
                  bookingWindowDays === days ? "border-primary bg-primary text-white" : "border-line bg-white text-foreground"
                }`}
              >
                {days === 60 ? "חודשיים" : `${days} ימים`}
              </button>
            ))}
            <button
              type="button"
              onClick={saveBookingWindow}
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-extrabold text-white"
            >
              <Save size={16} aria-hidden="true" />
              שמור טווח
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="ניהול זמינות" icon={CalendarDays}>
        <p className="mb-5 leading-7 text-muted">
          בחרו ימי עבודה ושעות עבודה. המערכת לא תאפשר שתי הזמנות חופפות באותה שעה.
        </p>
        <div className="grid gap-3">
          {normalizedRules.map((rule) => (
            <div key={rule.dayOfWeek} className="grid gap-3 rounded-[8px] border border-line bg-[#f4f7f5] p-4 sm:grid-cols-[130px_1fr_1fr] sm:items-center">
              <label className="flex items-center gap-3 font-extrabold">
                <input
                  type="checkbox"
                  checked={rule.isActive}
                  onChange={(event) => updateRule(rule.dayOfWeek, { isActive: event.target.checked })}
                  className="size-5 accent-[var(--primary)]"
                />
                יום {dayNames[rule.dayOfWeek]}
              </label>
              <Field label="שעת התחלה">
                <input
                  type="time"
                  dir="ltr"
                  value={rule.startTime}
                  onChange={(event) => updateRule(rule.dayOfWeek, { startTime: event.target.value })}
                  className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-right"
                />
              </Field>
              <Field label="שעת סיום">
                <input
                  type="time"
                  dir="ltr"
                  value={rule.endTime}
                  onChange={(event) => updateRule(rule.dayOfWeek, { endTime: event.target.value })}
                  className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-right"
                />
              </Field>
            </div>
          ))}
        </div>
        <button onClick={save} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white">
          <Save size={18} aria-hidden="true" />
          שמור זמינות
        </button>
      </Panel>
    </div>
  );
}

function ProfileTab({
  business,
  setBusiness,
  bookingLink,
  notify,
  setError,
}: {
  business: Business;
  setBusiness: (business: Business) => void;
  bookingLink: string;
  notify: (text: string) => void;
  setError: (text: string) => void;
}) {
  const logoImage = business.logoUrl?.trim();
  const coverImage = business.coverImageUrl?.trim();
  const hasUploadedLogo = logoImage?.startsWith("data:image/");
  const hasUploadedCover = coverImage?.startsWith("data:image/");
  const logoInputValue = hasUploadedLogo ? "" : (business.logoUrl ?? "");
  const coverInputValue = hasUploadedCover ? "" : (business.coverImageUrl ?? "");

  function chooseImage(field: "logoUrl" | "coverImageUrl", file?: File) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("אפשר לבחור רק קובץ תמונה");
      return;
    }

    if (file.size > maxProfileImageSize) {
      setError("קובץ התמונה גדול מדי. כדאי לבחור תמונה עד 1.5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        setError("לא הצלחנו לקרוא את קובץ התמונה");
        return;
      }

      setBusiness({ ...business, [field]: result });
    };
    reader.onerror = () => setError("לא הצלחנו לקרוא את קובץ התמונה");
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...business, businessId: business.id }),
    });
    const data = (await response.json()) as { business?: Business; error?: string };

    if (!response.ok || !data.business) {
      setError(data.error ?? "לא הצלחנו לשמור את פרטי העסק");
      return;
    }

    setBusiness(data.business);
    notify("פרטי העסק נשמרו");
  }

  return (
    <div className="grid gap-5">
      <Panel title="הגדרות פרופיל עסק" icon={Settings}>
        <form onSubmit={save} className="grid gap-4">
          <div className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className={`icon-tile size-16 overflow-hidden bg-white ${logoImage ? "bg-cover bg-center" : ""}`}
                  style={logoImage ? { backgroundImage: `url("${logoImage.replaceAll("\"", "%22")}")` } : undefined}
                >
                  {logoImage ? null : <BusinessIcon value={business.businessIcon} className="size-8" />}
                </span>
                <div>
                  <p className="font-extrabold">לוגו ואייקון העסק</p>
                  <p className="text-sm text-muted">אם אין לוגו, יוצג האייקון שנבחר.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {businessIconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBusiness({ ...business, businessIcon: option.value })}
                    className={`focus-ring grid size-10 place-items-center rounded-[8px] border ${
                      business.businessIcon === option.value ? "border-primary bg-[#e8f3ef] text-primary" : "border-line bg-white text-muted"
                    }`}
                    aria-label={`בחירת אייקון ${option.label}`}
                  >
                    <BusinessIcon value={option.value} className="size-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <MediaField
              id={`logo-upload-${business.id}`}
              label="לוגו העסק"
              value={logoInputValue}
              placeholder={hasUploadedLogo ? "נבחר קובץ תמונה" : "https://example.com/logo.png"}
              uploadLabel="העלאת לוגו"
              removeLabel="הסרת לוגו"
              hasImage={Boolean(logoImage)}
              onUrlChange={(value) => setBusiness({ ...business, logoUrl: value })}
              onFileChange={(file) => chooseImage("logoUrl", file)}
              onRemove={() => setBusiness({ ...business, logoUrl: "" })}
            />
            <MediaField
              id={`cover-upload-${business.id}`}
              label="תמונת רקע לעמוד"
              value={coverInputValue}
              placeholder={hasUploadedCover ? "נבחר קובץ תמונה" : "https://example.com/cover.jpg"}
              uploadLabel="העלאת תמונת רקע"
              removeLabel="הסרת תמונת רקע"
              hasImage={Boolean(coverImage)}
              onUrlChange={(value) => setBusiness({ ...business, coverImageUrl: value })}
              onFileChange={(file) => chooseImage("coverImageUrl", file)}
              onRemove={() => setBusiness({ ...business, coverImageUrl: "" })}
            />
          </div>
          <div
            className={`min-h-40 rounded-[8px] border border-line bg-gradient-to-br ${getBusinessToneClasses(
              business.coverTone,
            )} bg-cover bg-center p-4 text-white`}
            style={coverImage ? { backgroundImage: `linear-gradient(135deg, rgba(13, 48, 50, 0.78), rgba(11, 111, 100, 0.48)), url("${coverImage.replaceAll("\"", "%22")}")` } : undefined}
          >
            <div className="flex h-full min-h-32 items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/75">{business.coverSubtitle}</p>
                <p className="mt-2 text-2xl font-extrabold">{business.name}</p>
              </div>
              <span
                className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-white text-primary shadow-sm ${
                  logoImage ? "bg-cover bg-center" : ""
                }`}
                style={logoImage ? { backgroundImage: `url("${logoImage.replaceAll("\"", "%22")}")` } : undefined}
              >
                {logoImage ? null : <BusinessIcon value={business.businessIcon} className="size-7" />}
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="שם העסק">
              <input
                value={business.name}
                onChange={(event) => setBusiness({ ...business, name: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
            <Field label="טלפון">
              <input
                dir="ltr"
                value={business.phone}
                onChange={(event) => setBusiness({ ...business, phone: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-right"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="לינק עמוד ההזמנות">
              <input
                dir="ltr"
                value={business.slug}
                onChange={(event) => setBusiness({ ...business, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-right"
                placeholder="barber-demo"
              />
            </Field>
            <Field label="סוג העסק">
              <select
                value={business.category}
                onChange={(event) => setBusiness({ ...business, category: event.target.value as Business["category"] })}
                className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="וואטסאפ">
              <input
                dir="ltr"
                value={business.whatsapp}
                onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-right"
              />
            </Field>
            <Field label="צבע עמוד ההזמנות">
              <select
                value={business.coverTone}
                onChange={(event) => setBusiness({ ...business, coverTone: event.target.value as Business["coverTone"] })}
                className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="תיאור קצר">
            <input
              value={business.shortDescription}
              onChange={(event) => setBusiness({ ...business, shortDescription: event.target.value })}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <Field label="תיאור מלא">
            <textarea
              value={business.description}
              onChange={(event) => setBusiness({ ...business, description: event.target.value })}
              className="focus-ring min-h-28 rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="כותרת קאבר">
              <input
                value={business.coverTitle}
                onChange={(event) => setBusiness({ ...business, coverTitle: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
            <Field label="תת כותרת קאבר">
              <input
                value={business.coverSubtitle}
                onChange={(event) => setBusiness({ ...business, coverSubtitle: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
          </div>
          <Field label="כתובת">
            <input
              value={business.address}
              onChange={(event) => setBusiness({ ...business, address: event.target.value })}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <button className="focus-ring inline-flex min-h-12 w-fit items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white">
            <Save size={18} aria-hidden="true" />
            שמור פרופיל
          </button>
        </form>
      </Panel>

      <Panel title="לינק ההזמנות שלך" icon={LinkIcon}>
        <div className="flex flex-col gap-3 rounded-[8px] border border-line bg-[#f4f7f5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="ltr break-all text-right font-bold">{bookingLink}</span>
          <CopyButton value={bookingLink} />
        </div>
      </Panel>
    </div>
  );
}

function BookingList({ bookings, services, compact = false }: { bookings: Booking[]; services: Service[]; compact?: boolean }) {
  return (
    <div className="grid gap-3">
      {bookings.map((booking) => {
        const service = services.find((item) => item.id === booking.serviceId);
        return (
          <div key={booking.id} className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-extrabold">{booking.customerName}</p>
                <p className="mt-1 text-sm text-muted">
                  {service?.name ?? "שירות לא נמצא"} · <span className="ltr inline-block">{booking.startTime}</span>
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#e8f3ef] px-3 py-1 text-xs font-extrabold text-primary">
                {bookingStatusLabels[booking.status]}
              </span>
            </div>
            {!compact && booking.notes ? <p className="mt-3 text-sm leading-6 text-muted">{booking.notes}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function LaunchPriceNotice() {
  return (
    <section className="quiet-card rounded-[8px] bg-[#102f34] p-5 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-[8px] bg-white/12 text-[#d7a44a]">
            <BadgeDollarSign size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#d7a44a]">{launchPlan.badge}</p>
            <h2 className="mt-1 text-2xl font-extrabold">
              {launchPlan.name} ב-{launchPlan.priceLabel} {launchPlan.periodLabel}
            </h2>
            <p className="mt-1 text-white/75">{launchPlan.lockMessage}</p>
          </div>
        </div>
        <Link
          href="/#demo-access"
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] bg-white px-4 py-2 text-sm font-bold text-foreground"
        >
          פתח דמו עצמאי
        </Link>
      </div>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return (
    <section className="soft-card rounded-[8px] p-5">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={20} className="text-primary" aria-hidden="true" />
        <h2 className="text-xl font-extrabold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-foreground">
      {label}
      {children}
    </label>
  );
}

function MediaField({
  id,
  label,
  value,
  placeholder,
  uploadLabel,
  removeLabel,
  hasImage,
  onUrlChange,
  onFileChange,
  onRemove,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  uploadLabel: string;
  removeLabel: string;
  hasImage: boolean;
  onUrlChange: (value: string) => void;
  onFileChange: (file?: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-bold text-foreground">
      <label htmlFor={`${id}-url`}>{label}</label>
      <input
        id={`${id}-url`}
        dir="ltr"
        inputMode="url"
        value={value}
        onChange={(event) => onUrlChange(event.target.value)}
        className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-right"
        placeholder={placeholder}
      />
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => onFileChange(event.target.files?.[0])}
          className="sr-only"
        />
        <label
          htmlFor={id}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          className="focus-ring inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold text-foreground"
        >
          <Upload size={16} aria-hidden="true" />
          {uploadLabel}
        </label>
        {hasImage ? (
          <button
            type="button"
            onClick={onRemove}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold text-muted"
          >
            <Trash2 size={16} aria-hidden="true" />
            {removeLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-line bg-white p-6 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-full bg-[#e8f3ef] text-primary">
        <Check size={20} aria-hidden="true" />
      </div>
      <p className="mt-3 text-lg font-extrabold">{title}</p>
      <p className="mt-1 text-muted">{text}</p>
    </div>
  );
}
