"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Link2, Save, WandSparkles } from "lucide-react";
import { useI18n, interpolate } from "@/i18n";
import { cleanSlug } from "@/lib/smart-setup";

type FormState = "idle" | "submitting" | "success" | "error";

type CreatedPage = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  bookingUrl: string;
  dashboardUrl: string;
};

const initialValues = {
  ownerName: "",
  businessName: "",
  category: "other",
  phone: "",
  whatsapp: "",
  address: "",
  slug: "",
  serviceName: "",
  servicePrice: 120,
  serviceDurationMinutes: 45,
  paymentConfirmed: false,
};

export function DemoRequestForm() {
  const { language, t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [createdPage, setCreatedPage] = useState<CreatedPage | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");
    setCreatedPage(null);

    const response = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        defaultLanguage: language,
        supportedLanguages: language === "he" ? ["he", "en"] : ["en", "he"],
        showLanguageSwitcher: true,
      }),
    });

    const data = (await response.json()) as Partial<CreatedPage> & { error?: string };

    if (!response.ok || data.error || !data.business || !data.bookingUrl || !data.dashboardUrl) {
      setError(data.error ?? t.demoForm.error);
      setState("error");
      return;
    }

    setCreatedPage({
      business: data.business,
      bookingUrl: `${window.location.origin}${data.bookingUrl}`,
      dashboardUrl: `${window.location.origin}${data.dashboardUrl}`,
    });
    setState("success");
  }

  async function copyLink() {
    if (!createdPage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdPage.bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t.demoForm.copyError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card rounded-[8px] p-5 sm:p-7" id="create-page">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">{t.demoForm.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">{t.demoForm.title}</h2>
        <p className="mt-3 text-base leading-7 text-muted">{t.demoForm.text}</p>
        <Link
          href="/smart-setup"
          className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-primary/40 bg-[var(--primary-soft)] px-4 py-2 text-sm font-extrabold text-primary"
        >
          <WandSparkles size={17} aria-hidden="true" />
          {t.demoForm.smartCta}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.demoForm.ownerName}>
          <input
            required
            value={values.ownerName}
            onChange={(event) => setValues((current) => ({ ...current, ownerName: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder={t.demoForm.placeholders.ownerName}
          />
        </Field>

        <Field label={t.demoForm.businessName}>
          <input
            required
            value={values.businessName}
            onChange={(event) => {
              const businessName = event.target.value;
              setValues((current) => ({
                ...current,
                businessName,
                slug: current.slug || cleanSlug(businessName),
              }));
            }}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder={t.demoForm.placeholders.businessName}
          />
        </Field>

        <Field label={t.demoForm.category}>
          <select
            value={values.category}
            onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
          >
            {Object.entries(t.categories).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.demoForm.slug}>
          <div className="flex overflow-hidden rounded-[8px] border border-line bg-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
            <span className="ltr grid place-items-center border-e border-line px-3 text-sm font-bold text-muted">/b/</span>
            <input
              required
              dir="ltr"
              value={values.slug}
              onChange={(event) => setValues((current) => ({ ...current, slug: cleanSlug(event.target.value) }))}
              className="ltr min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-start text-base outline-none"
              placeholder={t.demoForm.placeholders.slug}
            />
          </div>
        </Field>

        <Field label={t.demoForm.phone}>
          <input
            required
            dir="ltr"
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-start text-base"
            placeholder={t.demoForm.placeholders.phone}
          />
        </Field>

        <Field label={t.demoForm.whatsapp}>
          <input
            dir="ltr"
            value={values.whatsapp}
            onChange={(event) => setValues((current) => ({ ...current, whatsapp: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-start text-base"
            placeholder={t.demoForm.placeholders.whatsapp}
          />
        </Field>

        <Field label={t.demoForm.address} className="sm:col-span-2">
          <input
            value={values.address}
            onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder={t.demoForm.placeholders.address}
          />
        </Field>
      </div>

      <div className="mt-5 rounded-[8px] border border-line bg-white/70 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Link2 size={18} className="text-primary" aria-hidden="true" />
          <h3 className="font-extrabold">{t.demoForm.firstService}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
          <Field label={t.demoForm.serviceName}>
            <input
              required
              value={values.serviceName}
              onChange={(event) => setValues((current) => ({ ...current, serviceName: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
              placeholder={t.demoForm.placeholders.serviceName}
            />
          </Field>
          <Field label={t.demoForm.price}>
            <input
              required
              type="number"
              min={0}
              value={values.servicePrice}
              onChange={(event) => setValues((current) => ({ ...current, servicePrice: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            />
          </Field>
          <Field label={t.demoForm.duration}>
            <input
              required
              type="number"
              min={15}
              step={15}
              value={values.serviceDurationMinutes}
              onChange={(event) => setValues((current) => ({ ...current, serviceDurationMinutes: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            />
          </Field>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-[8px] border border-line bg-white/70 p-4 text-sm font-semibold text-foreground">
        <input
          required
          type="checkbox"
          checked={values.paymentConfirmed}
          onChange={(event) => setValues((current) => ({ ...current, paymentConfirmed: event.target.checked }))}
          className="mt-1 size-5 accent-[var(--primary)]"
        />
        <span>{t.demoForm.paymentConfirmed}</span>
      </label>

      {error ? <p className="mt-4 rounded-[8px] bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-100">{error}</p> : null}

      {createdPage ? (
        <div className="mt-5 rounded-[8px] border border-primary/40 bg-[var(--primary-soft)] p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-primary text-white">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold text-foreground">
                {interpolate(t.demoForm.successTitle, { business: createdPage.business.name })}
              </p>
              <p className="ltr mt-2 break-all text-start text-sm font-bold text-muted">{createdPage.bookingUrl}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyLink}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              <Copy size={17} aria-hidden="true" />
              {copied ? t.common.copied : t.demoForm.copyPublish}
            </button>
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-bold text-foreground"
              href={createdPage.bookingUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} aria-hidden="true" />
              {t.demoForm.openBooking}
            </a>
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-bold text-foreground"
              href={createdPage.dashboardUrl}
            >
              <Save size={17} aria-hidden="true" />
              {t.demoForm.continueDashboard}
            </a>
          </div>
        </div>
      ) : null}

      <button
        disabled={state === "submitting"}
        className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white transition disabled:opacity-60 sm:w-auto"
      >
        <Save size={18} aria-hidden="true" />
        {state === "submitting" ? t.demoForm.submitting : t.demoForm.submit}
      </button>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-foreground ${className}`}>
      {label}
      {children}
    </label>
  );
}
