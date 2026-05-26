"use client";

import Link from "next/link";
import { ComponentType, FormEvent, ReactNode, useMemo, useState } from "react";
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
} from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { BusinessIcon, businessIconOptions } from "@/components/ui/BusinessIcon";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { languageLabels, useI18n } from "@/i18n";
import { bookingStatusLabelsByLanguage, dayNamesByLanguage, formatDuration, formatPrice, todayKey } from "@/lib/format";
import { launchPlan } from "@/lib/pricing";
import type { AvailabilityRule, Booking, BookingStatus, Business, Language, Service } from "@/lib/types";

type SummaryCards = {
  totalBookings: number;
  upcomingBookings: number;
  popularService: string;
  totalBusinesses: number;
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

const emptyService = {
  name: "",
  description: "",
  price: 120,
  durationMinutes: 45,
};

export function DashboardShell({ initialData }: DashboardShellProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [business, setBusiness] = useState(initialData.business);
  const [services, setServices] = useState(initialData.services);
  const [bookings, setBookings] = useState(initialData.bookings);
  const [availabilityRules, setAvailabilityRules] = useState(initialData.availabilityRules);
  const [cards, setCards] = useState(initialData.cards);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const bookingLink = `/b/${business.slug}`;
  const today = todayKey();
  const todayBookings = bookings.filter((booking) => booking.date === today && booking.status !== "cancelled");
  const upcomingBookings = bookings.filter((booking) => booking.date >= today && booking.status !== "cancelled");
  const tabs = [
    { id: "overview" as const, label: t.dashboard.tabs.overview, icon: LayoutDashboard },
    { id: "bookings" as const, label: t.dashboard.tabs.bookings, icon: ClipboardList },
    { id: "services" as const, label: t.dashboard.tabs.services, icon: Settings },
    { id: "availability" as const, label: t.dashboard.tabs.availability, icon: CalendarDays },
    { id: "profile" as const, label: t.dashboard.tabs.profile, icon: LinkIcon },
  ];

  async function refreshSummary() {
    const response = await fetch(`/api/admin/summary?businessId=${business.id}`);
    const data = (await response.json()) as DashboardInitialData & { error?: string };

    if (!response.ok) {
      setError(data.error ?? t.dashboard.messages.refreshError);
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
        <div className="container-shell flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="icon-tile size-12">
              <BusinessIcon value={business.businessIcon} className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-primary">{t.dashboard.title}</p>
              <h1 className="text-3xl font-extrabold text-foreground">{business.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <LanguageSelector />
            <select
              value={business.id}
              onChange={(event) => {
                window.location.href = `/dashboard?businessId=${event.target.value}`;
              }}
              className="focus-ring min-h-11 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-bold text-foreground"
              aria-label={t.dashboard.businessSelect}
            >
              {initialData.businesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <CopyButton value={bookingLink} label={t.dashboard.copyBookingLink} />
            <a
              href={`/b/${business.slug}`}
              target="_blank"
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              <Eye size={17} aria-hidden="true" />
              {t.dashboard.preview}
            </a>
          </div>
        </div>
      </header>

      <div className="container-shell grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-[8px] border border-line bg-white p-2 lg:sticky lg:top-4">
          <nav className="grid gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`focus-ring flex min-h-11 items-center gap-3 rounded-[8px] px-3 py-2 text-start font-bold transition ${
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
          {message ? <p className="rounded-[8px] bg-emerald-950/40 px-4 py-3 font-bold text-emerald-100">{message}</p> : null}
          {error ? <p className="rounded-[8px] bg-red-950/50 px-4 py-3 font-bold text-red-100">{error}</p> : null}

          {activeTab === "overview" ? (
            <OverviewTab
              cards={cards}
              todayBookings={todayBookings}
              upcomingBookings={upcomingBookings}
              services={services}
              businesses={initialData.businesses}
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
                  setError(data.error ?? t.dashboard.messages.statusError);
                  return;
                }

                await refreshSummary();
                notify(t.dashboard.messages.statusUpdated);
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
              businessId={business.id}
              rules={availabilityRules}
              setRules={setAvailabilityRules}
              refreshSummary={refreshSummary}
              notify={notify}
              setError={setError}
            />
          ) : null}

          {activeTab === "profile" ? (
            <ProfileTab business={business} setBusiness={setBusiness} bookingLink={bookingLink} notify={notify} setError={setError} />
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
  businesses,
  business,
  bookingLink,
}: {
  cards: SummaryCards;
  todayBookings: Booking[];
  upcomingBookings: Booking[];
  services: Service[];
  businesses: Business[];
  business: Business;
  bookingLink: string;
}) {
  const { t } = useI18n();

  return (
    <>
      <section className="quiet-card rounded-[8px] bg-[#102f34] p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-[8px] bg-white/12 text-[#d7a44a]">
              <BadgeDollarSign size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#d7a44a]">{t.landing.pricingEyebrow}</p>
              <h2 className="mt-1 text-2xl font-extrabold">
                {t.landing.launchPlanName} {launchPlan.priceLabel} {t.landing.periodLabel}
              </h2>
              <p className="mt-1 text-white/75">{t.landing.pricingText}</p>
            </div>
          </div>
          <Link
            href="/smart-setup"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-[8px] bg-white px-4 py-2 text-sm font-bold text-foreground"
          >
            {t.dashboard.addAnotherPage}
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t.dashboard.cards.totalBookings, cards.totalBookings],
          [t.dashboard.cards.upcomingBookings, cards.upcomingBookings],
          [t.dashboard.cards.popularService, cards.popularService || t.dashboard.cards.noData],
          [t.dashboard.cards.activePages, cards.totalBusinesses],
        ].map(([label, value]) => (
          <article key={String(label)} className="soft-card rounded-[8px] p-5">
            <p className="text-sm font-bold text-muted">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel title={t.dashboard.todayBookings} icon={CalendarClock}>
          {todayBookings.length ? (
            <BookingList bookings={todayBookings} services={services} compact />
          ) : (
            <EmptyState title={t.dashboard.empty.todayTitle} text={t.dashboard.empty.todayText} />
          )}
        </Panel>

        <Panel title={t.dashboard.upcomingBookings} icon={ClipboardList}>
          {upcomingBookings.length ? (
            <BookingList bookings={upcomingBookings.slice(0, 5)} services={services} compact />
          ) : (
            <EmptyState title={t.dashboard.empty.upcomingTitle} text={t.dashboard.empty.upcomingText} />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title={t.dashboard.createdPages} icon={ClipboardList}>
          {businesses.length ? (
            <div className="grid gap-3">
              {businesses.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
                  <p className="font-extrabold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    /b/{item.slug} · <span className="ltr inline-block">{item.phone}</span>
                  </p>
                  <Link className="mt-3 inline-flex text-sm font-extrabold text-primary" href={`/dashboard?businessId=${item.id}`}>
                    {t.dashboard.tabs.profile}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t.dashboard.empty.pagesTitle} text={t.dashboard.empty.pagesText} />
          )}
        </Panel>

        <Panel title={t.dashboard.publicPreview} icon={Eye}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{t.dashboard.publicPreviewText}</p>
            <a className="focus-ring inline-flex items-center gap-2 rounded-[8px] font-bold text-primary" href={`/b/${business.slug}`} target="_blank">
              {t.dashboard.openNewWindow}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="h-[460px] overflow-hidden rounded-[8px] border border-line bg-white">
            <iframe title={t.dashboard.publicPreview} src={bookingLink || `/b/${business.slug}`} className="h-full w-full" />
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
  const { language, t } = useI18n();
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const today = todayKey();
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
    <Panel title={t.dashboard.tabs.bookings} icon={ClipboardList}>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["upcoming", t.dashboard.filters.upcoming],
          ["past", t.dashboard.filters.past],
          ["all", t.dashboard.filters.all],
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
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-start">
            <thead>
              <tr className="text-sm text-muted">
                <th className="border-b border-line px-3 py-3">{t.dashboard.table.customer}</th>
                <th className="border-b border-line px-3 py-3">{t.dashboard.table.phone}</th>
                <th className="border-b border-line px-3 py-3">{t.dashboard.table.service}</th>
                <th className="border-b border-line px-3 py-3">{t.dashboard.table.dateTime}</th>
                <th className="border-b border-line px-3 py-3">{t.dashboard.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const service = services.find((item) => item.id === booking.serviceId);
                return (
                  <tr key={booking.id}>
                    <td className="border-b border-line px-3 py-3 font-bold">{booking.customerName}</td>
                    <td className="ltr border-b border-line px-3 py-3 text-start">{booking.customerPhone}</td>
                    <td className="border-b border-line px-3 py-3">{service?.name ?? t.dashboard.table.service}</td>
                    <td className="border-b border-line px-3 py-3">
                      {booking.date} · <span className="ltr inline-block">{booking.startTime}</span>
                    </td>
                    <td className="border-b border-line px-3 py-3">
                      <select
                        value={booking.status}
                        onChange={(event) => onStatusChange(booking.id, event.target.value as BookingStatus)}
                        className="focus-ring rounded-[8px] border border-line bg-white px-3 py-2 font-bold"
                      >
                        {Object.entries(bookingStatusLabelsByLanguage[language]).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
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
        <EmptyState title={t.dashboard.empty.bookingsTitle} text={t.dashboard.empty.bookingsText} />
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
  const { language, t } = useI18n();
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
      setError(data.error ?? t.dashboard.messages.serviceAddError);
      return;
    }

    setNewService(emptyService);
    await refreshSummary();
    notify(t.dashboard.messages.serviceAdded);
  }

  async function save(service: Service) {
    const response = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? t.dashboard.messages.serviceSaveError);
      return;
    }

    await refreshSummary();
    notify(t.dashboard.messages.serviceSaved);
  }

  async function remove(id: string) {
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? t.dashboard.messages.serviceDeleteError);
      return;
    }

    await refreshSummary();
    notify(t.dashboard.messages.serviceDeleted);
  }

  return (
    <div className="grid gap-5">
      <Panel title={t.dashboard.services.addTitle} icon={Plus}>
        <form onSubmit={add} className="grid gap-4 md:grid-cols-[1fr_1fr_120px_150px_auto] md:items-end">
          <Field label={t.dashboard.services.name}>
            <input
              required
              value={newService.name}
              onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
            />
          </Field>
          <Field label={t.dashboard.services.description}>
            <input
              value={newService.description}
              onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
            />
          </Field>
          <Field label={t.dashboard.services.price}>
            <input
              required
              type="number"
              value={newService.price}
              onChange={(event) => setNewService((current) => ({ ...current, price: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
            />
          </Field>
          <Field label={t.dashboard.services.duration}>
            <input
              required
              type="number"
              min={15}
              step={15}
              value={newService.durationMinutes}
              onChange={(event) => setNewService((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
            />
          </Field>
          <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-3 font-extrabold text-white">
            <Plus size={18} aria-hidden="true" />
            {t.dashboard.services.add}
          </button>
        </form>
      </Panel>

      <Panel title={t.dashboard.services.existingTitle} icon={Settings}>
        {services.length ? (
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.id} className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_110px_130px]">
                  <Field label={t.dashboard.services.name}>
                    <input
                      value={service.name}
                      onChange={(event) =>
                        setServices(services.map((item) => (item.id === service.id ? { ...item, name: event.target.value } : item)))
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.dashboard.services.description}>
                    <input
                      value={service.description}
                      onChange={(event) =>
                        setServices(services.map((item) => (item.id === service.id ? { ...item, description: event.target.value } : item)))
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.dashboard.services.price}>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(event) =>
                        setServices(services.map((item) => (item.id === service.id ? { ...item, price: Number(event.target.value) } : item)))
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.dashboard.services.duration}>
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
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-muted">
                    {formatPrice(service.price, language)} · {formatDuration(service.durationMinutes, language)} ·{" "}
                    {service.isActive ? t.common.active : t.common.inactive}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => save(service)}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-primary px-3 py-2 text-sm font-extrabold text-white"
                    >
                      <Save size={16} aria-hidden="true" />
                      {t.common.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => save({ ...service, isActive: !service.isActive })}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold"
                    >
                      <ToggleLeft size={16} aria-hidden="true" />
                      {service.isActive ? t.dashboard.services.deactivate : t.dashboard.services.activate}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(service.id)}
                      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-red-900/50 bg-white px-3 py-2 text-sm font-extrabold text-red-200"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      {t.dashboard.services.remove}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t.dashboard.services.emptyTitle} text={t.dashboard.services.emptyText} />
        )}
      </Panel>
    </div>
  );
}

function AvailabilityTab({
  businessId,
  rules,
  setRules,
  refreshSummary,
  notify,
  setError,
}: {
  businessId: string;
  rules: AvailabilityRule[];
  setRules: (rules: AvailabilityRule[]) => void;
  refreshSummary: () => Promise<void>;
  notify: (text: string) => void;
  setError: (text: string) => void;
}) {
  const { language, t } = useI18n();
  const dayNames = dayNamesByLanguage[language];
  const normalizedRules = useMemo(
    () =>
      dayNames.map((_, dayOfWeek) => {
        const existing = rules.find((rule) => rule.dayOfWeek === dayOfWeek);
        return (
          existing ?? {
            id: `draft_${dayOfWeek}`,
            businessId,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isActive: dayOfWeek > 0 && dayOfWeek < 5,
          }
        );
      }),
    [businessId, dayNames, rules],
  );

  async function save() {
    const response = await fetch("/api/admin/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, rules: normalizedRules }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? t.dashboard.messages.availabilityError);
      return;
    }

    await refreshSummary();
    notify(t.dashboard.messages.availabilitySaved);
  }

  function updateRule(dayOfWeek: number, patch: Partial<AvailabilityRule>) {
    setRules(normalizedRules.map((rule) => (rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule)));
  }

  return (
    <Panel title={t.dashboard.availability.title} icon={CalendarDays}>
      <p className="mb-5 leading-7 text-muted">{t.dashboard.availability.text}</p>
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
              {dayNames[rule.dayOfWeek]}
            </label>
            <Field label={t.dashboard.availability.start}>
              <input
                type="time"
                dir="ltr"
                value={rule.startTime}
                onChange={(event) => updateRule(rule.dayOfWeek, { startTime: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
              />
            </Field>
            <Field label={t.dashboard.availability.end}>
              <input
                type="time"
                dir="ltr"
                value={rule.endTime}
                onChange={(event) => updateRule(rule.dayOfWeek, { endTime: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
              />
            </Field>
          </div>
        ))}
      </div>
      <button onClick={save} className="focus-ring mt-5 inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white">
        <Save size={18} aria-hidden="true" />
        {t.dashboard.availability.save}
      </button>
    </Panel>
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
  const { t } = useI18n();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...business, businessId: business.id }),
    });
    const data = (await response.json()) as { business?: Business; error?: string };

    if (!response.ok || !data.business) {
      setError(data.error ?? t.dashboard.messages.profileError);
      return;
    }

    setBusiness(data.business);
    notify(t.dashboard.messages.profileSaved);
  }

  function toggleSupportedLanguage(nextLanguage: Language) {
    const exists = business.supportedLanguages.includes(nextLanguage);
    const supportedLanguages = exists
      ? business.supportedLanguages.filter((language) => language !== nextLanguage)
      : [...business.supportedLanguages, nextLanguage];
    const normalized = supportedLanguages.length ? supportedLanguages : [nextLanguage];
    setBusiness({
      ...business,
      supportedLanguages: normalized,
      defaultLanguage: normalized.includes(business.defaultLanguage) ? business.defaultLanguage : normalized[0],
    });
  }

  return (
    <div className="grid gap-5">
      <Panel title={t.dashboard.profile.title} icon={Settings}>
        <form onSubmit={save} className="grid gap-4">
          <div className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="icon-tile size-16 bg-white">
                  <BusinessIcon value={business.businessIcon} className="size-8" />
                </span>
                <div>
                  <p className="font-extrabold">{t.dashboard.profile.iconTitle}</p>
                  <p className="text-sm text-muted">{t.dashboard.profile.iconText}</p>
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
                    aria-label={option.value}
                  >
                    <BusinessIcon value={option.value} className="size-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.dashboard.profile.businessName}>
              <input
                value={business.name}
                onChange={(event) => setBusiness({ ...business, name: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
            <Field label={t.dashboard.profile.phone}>
              <input
                dir="ltr"
                value={business.phone}
                onChange={(event) => setBusiness({ ...business, phone: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-start"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.dashboard.profile.bookingSlug}>
              <input
                dir="ltr"
                value={business.slug}
                onChange={(event) => setBusiness({ ...business, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-start"
                placeholder="barber-demo"
              />
            </Field>
            <Field label={t.dashboard.profile.category}>
              <select
                value={business.category}
                onChange={(event) => setBusiness({ ...business, category: event.target.value as Business["category"] })}
                className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
              >
                {Object.entries(t.categories).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.dashboard.profile.whatsapp}>
              <input
                dir="ltr"
                value={business.whatsapp}
                onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })}
                className="focus-ring ltr rounded-[8px] border border-line px-3 py-3 text-start"
              />
            </Field>
            <Field label={t.dashboard.profile.tone}>
              <select
                value={business.coverTone}
                onChange={(event) => setBusiness({ ...business, coverTone: event.target.value as Business["coverTone"] })}
                className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
              >
                {Object.entries(t.tones).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
            <h3 className="font-extrabold">{t.languages.pageSettings}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{t.languages.helper}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label={t.languages.defaultLanguage}>
                <select
                  value={business.defaultLanguage}
                  onChange={(event) => {
                    const nextLanguage = event.target.value as Language;
                    setBusiness({
                      ...business,
                      defaultLanguage: nextLanguage,
                      supportedLanguages: business.supportedLanguages.includes(nextLanguage)
                        ? business.supportedLanguages
                        : [...business.supportedLanguages, nextLanguage],
                    });
                  }}
                  className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                >
                  {(["he", "en"] as Language[]).map((option) => (
                    <option key={option} value={option}>
                      {languageLabels[option]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-2 text-sm font-bold">
                {t.languages.supportedLanguages}
                <div className="flex flex-wrap gap-2">
                  {(["he", "en"] as Language[]).map((option) => (
                    <label key={option} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2">
                      <input
                        type="checkbox"
                        checked={business.supportedLanguages.includes(option)}
                        onChange={() => toggleSupportedLanguage(option)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {languageLabels[option]}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={business.showLanguageSwitcher}
                  onChange={(event) => setBusiness({ ...business, showLanguageSwitcher: event.target.checked })}
                  className="size-5 accent-[var(--primary)]"
                />
                {t.languages.showSwitcher}
              </label>
            </div>
          </div>

          <Field label={t.dashboard.profile.shortDescription}>
            <input
              value={business.shortDescription}
              onChange={(event) => setBusiness({ ...business, shortDescription: event.target.value })}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <Field label={t.dashboard.profile.description}>
            <textarea
              value={business.description}
              onChange={(event) => setBusiness({ ...business, description: event.target.value })}
              className="focus-ring min-h-28 rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.dashboard.profile.coverTitle}>
              <input
                value={business.coverTitle}
                onChange={(event) => setBusiness({ ...business, coverTitle: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
            <Field label={t.dashboard.profile.coverSubtitle}>
              <input
                value={business.coverSubtitle}
                onChange={(event) => setBusiness({ ...business, coverSubtitle: event.target.value })}
                className="focus-ring rounded-[8px] border border-line px-3 py-3"
              />
            </Field>
          </div>
          <Field label={t.dashboard.profile.address}>
            <input
              value={business.address}
              onChange={(event) => setBusiness({ ...business, address: event.target.value })}
              className="focus-ring rounded-[8px] border border-line px-3 py-3"
            />
          </Field>
          <button className="focus-ring inline-flex min-h-12 w-fit items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white">
            <Save size={18} aria-hidden="true" />
            {t.dashboard.profile.save}
          </button>
        </form>
      </Panel>

      <Panel title={t.dashboard.profile.bookingLink} icon={LinkIcon}>
        <div className="flex flex-col gap-3 rounded-[8px] border border-line bg-[#f4f7f5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="ltr break-all text-start font-bold">{bookingLink}</span>
          <CopyButton value={bookingLink} />
        </div>
      </Panel>
    </div>
  );
}

function BookingList({ bookings, services, compact = false }: { bookings: Booking[]; services: Service[]; compact?: boolean }) {
  const { language } = useI18n();

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
                  {service?.name} · <span className="ltr inline-block">{booking.startTime}</span>
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#e8f3ef] px-3 py-1 text-xs font-extrabold text-primary">
                {bookingStatusLabelsByLanguage[language][booking.status]}
              </span>
            </div>
            {!compact && booking.notes ? <p className="mt-3 text-sm leading-6 text-muted">{booking.notes}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

type IconComponent = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

function Panel({ title, icon: Icon, children }: { title: string; icon: IconComponent; children: ReactNode }) {
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

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-foreground ${className}`}>
      {label}
      {children}
    </label>
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
