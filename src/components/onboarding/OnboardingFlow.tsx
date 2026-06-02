"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { launchPlan } from "@/lib/pricing";
import type { Business, BusinessCategory, Service } from "@/lib/types";

type OnboardingForm = {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  category: BusinessCategory;
  phone: string;
  whatsapp: string;
  address: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  paymentConfirmed: boolean;
  acceptTerms: boolean;
};

type OnboardingResult = {
  business: Business;
  service: Service;
  bookingLink: string;
  dashboardLink: string;
  payment: {
    mode: "demo";
    status: "paid";
  };
};

const categoryOptions: Array<{
  value: BusinessCategory;
  label: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
}> = [
  { value: "barber", label: "מספרה / ברבר", serviceName: "תספורת גבר", servicePrice: 90, serviceDurationMinutes: 45 },
  { value: "nails", label: "קוסמטיקה / ציפורניים", serviceName: "לק ג׳ל", servicePrice: 130, serviceDurationMinutes: 75 },
  { value: "clinic", label: "קליניקה", serviceName: "פגישת ייעוץ", servicePrice: 220, serviceDurationMinutes: 60 },
  { value: "fitness", label: "אימון אישי", serviceName: "אימון אישי", servicePrice: 180, serviceDurationMinutes: 60 },
  { value: "other", label: "עסק אחר", serviceName: "שירות ראשון", servicePrice: 120, serviceDurationMinutes: 45 },
];

const initialForm: OnboardingForm = {
  ownerName: "",
  ownerEmail: "",
  businessName: "",
  category: "barber",
  phone: "",
  whatsapp: "",
  address: "",
  serviceName: "תספורת גבר",
  servicePrice: 90,
  serviceDurationMinutes: 45,
  paymentConfirmed: false,
  acceptTerms: false,
};

export function OnboardingFlow() {
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardingResult | null>(null);

  function updateBusinessName(value: string) {
    setForm((current) => ({
      ...current,
      businessName: value,
    }));
  }

  function updateCategory(category: BusinessCategory) {
    const option = categoryOptions.find((item) => item.value === category) ?? categoryOptions[0];
    setForm((current) => ({
      ...current,
      category,
      serviceName: option.serviceName,
      servicePrice: option.servicePrice,
      serviceDurationMinutes: option.serviceDurationMinutes,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as Partial<OnboardingResult> & { error?: string };
    setSubmitting(false);

    if (!response.ok || !data.business || !data.service || !data.bookingLink || !data.dashboardLink || !data.payment) {
      setError(data.error ?? "לא הצלחנו ליצור את עמוד העסק");
      return;
    }

    setResult(data as OnboardingResult);
  }

  if (result) {
    return (
      <section className="container-shell py-6 sm:py-10">
        <div className="mx-auto max-w-4xl rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="grid place-items-center rounded-[8px] bg-[#e8f3ef] p-6 text-primary sm:p-8">
              <CheckCircle2 size={60} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-primary">התשלום אושר</p>
              <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-4xl">עמוד העסק נוצר</h1>
              <p className="mt-3 leading-7 text-muted sm:leading-8">
                {result.business.name} מוכן לקבל הזמנות, כולל מזכירה אוטומטית לאישורים, תזכורות וביטולים. אפשר לפתוח את עמוד הלקוח או להיכנס ללוח הניהול ולהמשיך לערוך.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={result.bookingLink}
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white"
                >
                  פתח עמוד הזמנות
                  <ExternalLink size={18} aria-hidden="true" />
                </Link>
                <Link
                  href={result.dashboardLink}
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-5 py-3 font-extrabold text-foreground"
                >
                  פתח לוח ניהול
                  <LayoutDashboard size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-5 rounded-[8px] bg-[#f4f7f5] p-4 text-sm font-bold text-muted">
                הלינק שלך: <span className="ltr inline-block text-foreground">{result.bookingLink}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="container-shell grid gap-5 py-5 sm:gap-6 sm:py-10 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="h-fit rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-5">
        <p className="text-sm font-extrabold text-primary">הצטרפות</p>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">יוצרים עמוד עסק</h1>
        <p className="mt-3 leading-7 text-muted sm:leading-8">
          ממלאים פרטים, מאשרים תשלום, ומקבלים לינק הזמנות עם מזכירה אוטומטית שמטפלת בהודעות החוזרות.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:grid-cols-1">
          {[
            ["1", "פרטי העסק", Boolean(form.businessName && form.phone)],
            ["2", "שירות ראשון", Boolean(form.serviceName && form.servicePrice >= 0)],
            ["3", "תשלום ויצירה", form.paymentConfirmed && form.acceptTerms],
          ].map(([number, label, done]) => (
            <div key={String(label)} className="flex flex-col items-center gap-2 rounded-[8px] bg-[#f4f7f5] p-2 text-center sm:flex-row sm:p-3 sm:text-right">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold sm:size-8 sm:text-sm ${done ? "bg-primary text-white" : "bg-white text-muted"}`}>
                {done ? <CheckCircle2 size={16} aria-hidden="true" /> : number}
              </span>
              <span className="text-xs font-bold leading-5 sm:text-base">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-[8px] border border-line bg-[#f4f7f5] p-3">
          <div className="flex items-start gap-2">
            <Bell size={18} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm font-bold leading-6 text-muted">
              המזכירה האוטומטית מופעלת כברירת מחדל: אישור תור, תזכורות, ביטולים ורשימת המתנה.
            </p>
          </div>
        </div>
      </aside>

      <div className="grid gap-5">
        <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <UserRound size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-extrabold sm:text-xl">1. פרטי בעל העסק</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="שם מלא">
              <input
                required
                autoComplete="name"
                value={form.ownerName}
                onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3"
                placeholder="שם בעל העסק"
              />
            </Field>
            <Field label="אימייל">
              <input
                required
                type="email"
                dir="ltr"
                autoComplete="email"
                value={form.ownerEmail}
                onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right"
                placeholder="you@example.com"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-extrabold sm:text-xl">2. פרטי העסק</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="שם העסק">
              <input
                required
                value={form.businessName}
                onChange={(event) => updateBusinessName(event.target.value)}
                className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3"
                placeholder="לדוגמה: נייל סטודיו"
              />
            </Field>
            <Field label="טלפון">
              <input
                required
                dir="ltr"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right"
                placeholder="050-0000000"
              />
            </Field>
            <Field label="וואטסאפ">
              <input
                dir="ltr"
                value={form.whatsapp}
                onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right"
                placeholder="אם שונה מהטלפון"
              />
            </Field>
            <Field label="כתובת">
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3"
                placeholder="רחוב, עיר"
              />
            </Field>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-bold">סוג העסק</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={form.category === option.value}
                  onClick={() => updateCategory(option.value)}
                  className={`focus-ring rounded-[8px] border px-4 py-3 text-right font-extrabold transition ${
                    form.category === option.value ? "border-primary bg-[#e8f3ef] text-primary" : "border-line bg-white text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[8px] border border-line bg-[#f4f7f5] p-4 text-sm font-bold leading-6 text-muted">
            אחרי יצירת העמוד נקצה לעסק לינק הזמנות אוטומטי ונציג אותו במסך הסיום.
          </div>
        </section>

        <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-extrabold sm:text-xl">3. שירות ראשון</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_180px]">
            <Field label="שם השירות">
              <input
                required
                value={form.serviceName}
                onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))}
                className="focus-ring h-14 w-full min-w-0 rounded-[8px] border border-line bg-white px-4 py-3 text-base font-extrabold"
              />
            </Field>
            <Field label="מחיר בש״ח">
              <input
                required
                type="number"
                min={0}
                value={form.servicePrice}
                onChange={(event) => setForm((current) => ({ ...current, servicePrice: Number(event.target.value) }))}
                className="focus-ring h-14 w-full min-w-0 rounded-[8px] border border-line bg-white px-4 py-3 text-center text-lg font-extrabold tabular-nums"
              />
            </Field>
            <Field label="משך בדקות">
              <input
                required
                type="number"
                min={15}
                step={5}
                value={form.serviceDurationMinutes}
                onChange={(event) => setForm((current) => ({ ...current, serviceDurationMinutes: Number(event.target.value) }))}
                className="focus-ring h-14 w-full min-w-0 rounded-[8px] border border-line bg-white px-4 py-3 text-center text-lg font-extrabold tabular-nums"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-extrabold sm:text-xl">4. תשלום</h2>
          </div>
          <div className="mt-4 grid gap-4 rounded-[8px] border border-line bg-[#f4f7f5] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-extrabold text-foreground">{launchPlan.name}</p>
              <p className="mt-1 text-2xl font-extrabold text-primary sm:text-3xl">
                {launchPlan.priceLabel} <span className="text-sm text-muted">{launchPlan.periodLabel}</span>
              </p>
              <p className="mt-2 text-sm font-bold text-muted">בדמו לא נגבה כסף ולא מזינים כרטיס אשראי.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, paymentConfirmed: true }))}
              className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] px-5 py-3 font-extrabold ${
                form.paymentConfirmed ? "bg-primary text-white" : "bg-white text-foreground border border-line"
              }`}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              {form.paymentConfirmed ? "תשלום אושר" : "אישור תשלום דמו"}
            </button>
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm font-bold text-foreground">
            <input
              required
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(event) => setForm((current) => ({ ...current, acceptTerms: event.target.checked }))}
              className="mt-1 size-5 accent-[var(--primary)]"
            />
            <span>
              אני מאשר/ת את <Link href="/terms" className="text-primary underline">תנאי השימוש</Link> ואת יצירת עמוד העסק.
            </span>
          </label>
        </section>

        {error ? <p className="rounded-[8px] bg-red-50 px-4 py-3 font-bold text-red-700">{error}</p> : null}

        <button
          disabled={submitting}
          className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-primary-strong disabled:opacity-60 sm:shadow-none"
        >
          {submitting ? (
            <>
              יוצר עמוד...
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            </>
          ) : (
            <>
              צור עמוד
              <ArrowLeft size={20} aria-hidden="true" />
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-muted">
          <Link href="/#demo-access" className="focus-ring inline-flex items-center gap-2 rounded-[8px] text-primary">
            רוצה לראות דמו קודם?
            <Link2 size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-foreground">
      {label}
      {children}
    </label>
  );
}
