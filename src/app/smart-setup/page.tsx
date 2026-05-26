"use client";

import Link from "next/link";
import { ChangeEvent, ComponentType, FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  ImageIcon,
  Link2,
  MessageCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  Camera,
} from "lucide-react";
import { BusinessIcon, businessIconOptions } from "@/components/ui/BusinessIcon";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { languageLabels, useI18n } from "@/i18n";
import { formatDuration, formatPrice, getBusinessToneClasses } from "@/lib/format";
import {
  buildInstagramBioText,
  buildWhatsappShareMessage,
  cleanSlug,
  parseSmartSetupText,
  type SmartSetupDraft,
  type SmartSetupServiceDraft,
} from "@/lib/smart-setup";
import type { BusinessCategory, Language } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

type CreatedPage = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  bookingUrl: string;
  dashboardUrl: string;
};

const categoryValues: BusinessCategory[] = ["barber", "nails", "clinic", "fitness", "other"];
const toneValues: Array<SmartSetupDraft["coverTone"]> = ["teal", "rose", "blue"];
const categoryIconDefaults: Record<BusinessCategory, string> = {
  barber: "scissors",
  nails: "sparkles",
  clinic: "heart-pulse",
  fitness: "dumbbell",
  other: "store",
};

type Translation = ReturnType<typeof useI18n>["t"];
type ProfileImageVariant = "clean" | "studio" | "premium" | "generated";

const tonePalettes: Record<SmartSetupDraft["coverTone"], { background: string; middle: string; accent: string; foreground: string }> = {
  teal: { background: "#0d3032", middle: "#0d6b62", accent: "#9fb6a6", foreground: "#f8fffc" },
  rose: { background: "#321d28", middle: "#8f4e66", accent: "#d2a37f", foreground: "#fff8f5" },
  blue: { background: "#102f34", middle: "#315d70", accent: "#9bb8bd", foreground: "#f7fbff" },
};

function iconForCategory(category: BusinessCategory) {
  return categoryIconDefaults[category] ?? "store";
}

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return replacements[character];
  });
}

function hashString(value: string) {
  return Array.from(value).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 9973, 7);
}

function buildProfileImage(draft: SmartSetupDraft, variant: ProfileImageVariant, prompt = "") {
  const palette = tonePalettes[draft.coverTone];
  const seed = hashString(`${draft.businessName}-${draft.category}-${variant}-${prompt}`);
  const initial = escapeSvgText((draft.businessName.trim()[0] || "B").toLocaleUpperCase(draft.defaultLanguage === "he" ? "he-IL" : "en-US"));
  const title = escapeSvgText((prompt || draft.shortDescription || draft.businessName).trim().slice(0, 54));
  const blur = variant === "premium" ? 34 : variant === "studio" ? 22 : 14;
  const opacity = variant === "generated" ? 0.92 : 0.76;
  const shapeOffset = seed % 120;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette.background}" />
          <stop offset="0.55" stop-color="${palette.middle}" />
          <stop offset="1" stop-color="${palette.accent}" />
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="${blur}" /></filter>
      </defs>
      <rect width="720" height="720" rx="68" fill="url(#bg)" />
      <circle cx="${120 + shapeOffset}" cy="148" r="138" fill="${palette.foreground}" opacity="0.12" filter="url(#soft)" />
      <circle cx="${560 - shapeOffset / 2}" cy="570" r="182" fill="${palette.foreground}" opacity="0.16" filter="url(#soft)" />
      <rect x="92" y="92" width="536" height="536" rx="54" fill="${palette.foreground}" opacity="0.10" />
      <text x="360" y="355" text-anchor="middle" dominant-baseline="middle" font-family="Heebo, Arial, sans-serif" font-size="184" font-weight="900" fill="${palette.foreground}" opacity="${opacity}">${initial}</text>
      <text x="360" y="512" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="34" font-weight="800" fill="${palette.foreground}" opacity="0.90">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function resizeProfileImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const maxSize = 720;
      const scale = Math.min(1, maxSize / image.width, maxSize / image.height);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is not available"));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not load"));
    };

    image.src = url;
  });
}

async function track(name: "setup_started" | "setup_preview_generated" | "setup_saved" | "booking_page_shared", metadata = {}) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, metadata }),
    });
  } catch {
    // Analytics should never block setup.
  }
}

export default function SmartSetupPage() {
  const { language, t } = useI18n();
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState<SmartSetupDraft | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [createdPage, setCreatedPage] = useState<CreatedPage | null>(null);
  const [copiedLabel, setCopiedLabel] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  useEffect(() => {
    void track("setup_started", { route: "smart-setup" });
  }, []);

  const bookingUrl = useMemo(() => {
    if (!createdPage) {
      return "";
    }

    return createdPage.bookingUrl.startsWith("http") ? createdPage.bookingUrl : `${window.location.origin}${createdPage.bookingUrl}`;
  }, [createdPage]);

  function generateDraft() {
    const parsed = parseSmartSetupText(sourceText || t.smartSetup.placeholder);
    setDraft(parsed);
    setImagePrompt(parsed.shortDescription);
    setCreatedPage(null);
    setState("idle");
    setError("");
    void track("setup_preview_generated", {
      services: parsed.services.length,
      defaultLanguage: parsed.defaultLanguage,
      category: parsed.category,
    });
  }

  function updateDraft(patch: Partial<SmartSetupDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function updateService(index: number, patch: Partial<SmartSetupServiceDraft>) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        services: current.services.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)),
      };
    });
  }

  function addService() {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        services: [
          ...current.services,
          {
            name: language === "he" ? "שירות נוסף" : "Additional service",
            description: "",
            price: 120,
            durationMinutes: 45,
            isActive: true,
          },
        ],
      };
    });
  }

  function removeService(index: number) {
    setDraft((current) => {
      if (!current || current.services.length <= 1) {
        return current;
      }

      return { ...current, services: current.services.filter((_, serviceIndex) => serviceIndex !== index) };
    });
  }

  function updateRule(dayOfWeek: number, patch: Partial<SmartSetupDraft["availabilityRules"][number]>) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        availabilityRules: current.availabilityRules.map((rule) => (rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule)),
      };
    });
  }

  async function uploadProfileImage(event: ChangeEvent<HTMLInputElement>) {
    if (!draft) {
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t.smartSetup.imageUploadError);
      return;
    }

    try {
      const profileImage = await resizeProfileImage(file);
      if (profileImage.length > 500000) {
        setError(t.smartSetup.imageTooLarge);
        return;
      }

      updateDraft({ profileImage });
      setError("");
    } catch {
      setError(t.smartSetup.imageUploadError);
    }
  }

  function generateProfileImage() {
    if (!draft) {
      return;
    }

    const prompt = imagePrompt.trim() || draft.shortDescription || draft.businessName;
    updateDraft({ profileImage: buildProfileImage(draft, "generated", prompt) });
    setImagePrompt(prompt);
    setError("");
  }

  function toggleSupportedLanguage(nextLanguage: Language) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const exists = current.supportedLanguages.includes(nextLanguage);
      const supportedLanguages = exists
        ? current.supportedLanguages.filter((item) => item !== nextLanguage)
        : [...current.supportedLanguages, nextLanguage];
      const normalized = supportedLanguages.length ? supportedLanguages : [nextLanguage];

      return {
        ...current,
        supportedLanguages: normalized,
        defaultLanguage: normalized.includes(current.defaultLanguage) ? current.defaultLanguage : normalized[0],
      };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) {
      return;
    }

    setState("saving");
    setError("");

    const response = await fetch("/api/smart-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json()) as Partial<CreatedPage> & { error?: string };

    if (!response.ok || data.error || !data.business || !data.bookingUrl || !data.dashboardUrl) {
      setState("error");
      setError(data.error ?? t.smartSetup.saveError);
      return;
    }

    const page = {
      business: data.business,
      bookingUrl: `${window.location.origin}${data.bookingUrl}`,
      dashboardUrl: `${window.location.origin}${data.dashboardUrl}`,
    };
    setCreatedPage(page);
    setState("saved");
  }

  async function copyText(kind: "whatsapp" | "instagram") {
    if (!draft || !createdPage) {
      return;
    }

    const text = kind === "whatsapp" ? buildWhatsappShareMessage(draft, bookingUrl) : buildInstagramBioText(draft, bookingUrl);
    await navigator.clipboard.writeText(text);
    setCopiedLabel(kind === "whatsapp" ? t.smartSetup.copiedWhatsapp : t.smartSetup.copiedInstagram);
    window.setTimeout(() => setCopiedLabel(""), 1800);
    void track("booking_page_shared", { channel: kind, hasBookingUrl: Boolean(bookingUrl) });
  }

  function openPreview() {
    if (!createdPage) {
      return;
    }

    void track("booking_page_shared", { channel: "preview", hasBookingUrl: true });
    window.open(createdPage.bookingUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="border-b border-line bg-white/90">
        <div className="container-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="focus-ring inline-flex w-fit items-center gap-2 rounded-[8px] font-extrabold text-foreground">
            <span className="grid size-10 place-items-center rounded-[8px] bg-primary text-white">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            {t.common.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector />
            <Link href="/dashboard" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-bold">
              {t.dashboard.title}
            </Link>
          </div>
        </div>
      </header>

      <section className="container-shell grid gap-7 py-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="h-fit lg:sticky lg:top-5">
          <div className="gold-chip mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold">
            <WandSparkles size={16} aria-hidden="true" />
            {t.smartSetup.badge}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{t.smartSetup.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted">{t.smartSetup.subtitle}</p>

          <details className="group mt-6 rounded-[8px] border border-line bg-white p-4">
            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-[8px] font-extrabold [&::-webkit-details-marker]:hidden">
              {t.smartSetup.examplesTitle}
              <ChevronDown size={18} className="text-muted transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
              {t.smartSetup.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setSourceText(example)}
                  className="focus-ring rounded-[8px] border border-line bg-[var(--surface-soft)] p-3 text-start transition hover:border-primary"
                >
                  {example}
                </button>
              ))}
            </div>
          </details>
        </div>

        <div className="grid gap-5">
          <section className="soft-card rounded-[8px] p-5">
            <label className="grid gap-3">
              <span className="text-lg font-extrabold">{t.smartSetup.textareaLabel}</span>
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                className="focus-ring min-h-[190px] rounded-[8px] border border-line bg-white px-4 py-3 text-base leading-7"
                placeholder={t.smartSetup.placeholder}
              />
            </label>
            <button
              type="button"
              onClick={generateDraft}
              className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-extrabold text-white sm:w-auto"
            >
              <WandSparkles size={18} aria-hidden="true" />
              {draft ? t.smartSetup.regenerate : t.smartSetup.generate}
            </button>
          </section>

          {draft ? (
            <form onSubmit={save} className="grid gap-5">
              <section className="soft-card rounded-[8px] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-primary">{t.smartSetup.reviewReady}</p>
                    <h2 className="mt-1 text-2xl font-extrabold">{draft.businessName}</h2>
                    <p className="mt-2 leading-7 text-muted">{t.smartSetup.reviewReadyText}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-extrabold text-primary">
                      <Globe2 size={15} aria-hidden="true" />
                      {languageLabels[draft.defaultLanguage]}
                    </span>
                    <button
                      disabled={state === "saving"}
                      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                    >
                      <Save size={16} aria-hidden="true" />
                      {state === "saving" ? t.smartSetup.saving : t.smartSetup.save}
                    </button>
                  </div>
                </div>
              </section>

              <DraftBookingPagePreview draft={draft} language={language} t={t} />

              <BusinessVisualPicker
                draft={draft}
                imagePrompt={imagePrompt}
                onImagePromptChange={setImagePrompt}
                onGenerateImage={generateProfileImage}
                onUploadImage={uploadProfileImage}
                onUpdateDraft={updateDraft}
                t={t}
              />

              <Panel title={t.smartSetup.businessProfile} icon={Link2}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.smartSetup.businessName}>
                    <input
                      value={draft.businessName}
                      onChange={(event) =>
                        updateDraft({ businessName: event.target.value, slug: draft.slug || cleanSlug(event.target.value) })
                      }
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.smartSetup.ownerName}>
                    <input
                      value={draft.ownerName}
                      onChange={(event) => updateDraft({ ownerName: event.target.value })}
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.smartSetup.category}>
                    <select
                      value={draft.category}
                      onChange={(event) => {
                        const nextCategory = event.target.value as BusinessCategory;
                        updateDraft({ category: nextCategory, businessIcon: iconForCategory(nextCategory) });
                      }}
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    >
                      {categoryValues.map((category) => (
                        <option key={category} value={category}>
                          {t.categories[category]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.smartSetup.slug}>
                    <input
                      dir="ltr"
                      value={draft.slug}
                      onChange={(event) => updateDraft({ slug: cleanSlug(event.target.value) })}
                      className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
                    />
                  </Field>
                  <Field label={t.smartSetup.phone}>
                    <input
                      dir="ltr"
                      value={draft.phone}
                      onChange={(event) => updateDraft({ phone: event.target.value })}
                      className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
                    />
                  </Field>
                  <Field label={t.smartSetup.whatsapp}>
                    <input
                      dir="ltr"
                      value={draft.whatsapp}
                      onChange={(event) => updateDraft({ whatsapp: event.target.value })}
                      className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
                    />
                  </Field>
                  <Field label={t.smartSetup.address} className="sm:col-span-2">
                    <input
                      value={draft.address}
                      onChange={(event) => updateDraft({ address: event.target.value })}
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                </div>
              </Panel>

              <DetailsPanel title={t.languages.pageSettings} icon={Globe2}>
                <p className="mb-4 leading-7 text-muted">{t.languages.helper}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={t.languages.defaultLanguage}>
                    <select
                      value={draft.defaultLanguage}
                      onChange={(event) => {
                        const nextLanguage = event.target.value as Language;
                        updateDraft({
                          defaultLanguage: nextLanguage,
                          supportedLanguages: draft.supportedLanguages.includes(nextLanguage)
                            ? draft.supportedLanguages
                            : [...draft.supportedLanguages, nextLanguage],
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
                            checked={draft.supportedLanguages.includes(option)}
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
                      checked={draft.showLanguageSwitcher}
                      onChange={(event) => updateDraft({ showLanguageSwitcher: event.target.checked })}
                      className="size-5 accent-[var(--primary)]"
                    />
                    {t.languages.showSwitcher}
                  </label>
                </div>
              </DetailsPanel>

              <Panel title={t.smartSetup.services} icon={Sparkles}>
                <div className="grid gap-3">
                  {draft.services.map((service, index) => (
                    <div key={index} className="rounded-[8px] border border-line bg-[var(--surface-soft)] p-4">
                      <div className="grid gap-3 sm:grid-cols-[1fr_110px_140px_auto] sm:items-end">
                        <Field label={t.smartSetup.serviceName}>
                          <input
                            value={service.name}
                            onChange={(event) => updateService(index, { name: event.target.value })}
                            className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                          />
                        </Field>
                        <Field label={t.smartSetup.price}>
                          <input
                            type="number"
                            min={0}
                            value={service.price}
                            onChange={(event) => updateService(index, { price: Number(event.target.value) })}
                            className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                          />
                        </Field>
                        <Field label={t.smartSetup.duration}>
                          <input
                            type="number"
                            min={15}
                            step={15}
                            value={service.durationMinutes}
                            onChange={(event) => updateService(index, { durationMinutes: Number(event.target.value) })}
                            className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                          />
                        </Field>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-red-200 bg-white px-3 py-2 text-sm font-extrabold text-red-700"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          {t.smartSetup.removeService}
                        </button>
                      </div>
                      <Field label={t.smartSetup.description} className="mt-3">
                        <input
                          value={service.description}
                          onChange={(event) => updateService(index, { description: event.target.value })}
                          className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold"
                >
                  <Plus size={16} aria-hidden="true" />
                  {t.smartSetup.addService}
                </button>
              </Panel>

              <DetailsPanel title={t.smartSetup.hours} icon={CalendarDays}>
                <div className="grid gap-3">
                  {draft.availabilityRules.map((rule) => (
                    <div key={rule.dayOfWeek} className="grid gap-3 rounded-[8px] border border-line bg-[var(--surface-soft)] p-4 sm:grid-cols-[150px_1fr_1fr] sm:items-center">
                      <label className="flex items-center gap-3 font-extrabold">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(event) => updateRule(rule.dayOfWeek, { isActive: event.target.checked })}
                          className="size-5 accent-[var(--primary)]"
                        />
                        {t.days[rule.dayOfWeek]}
                      </label>
                      <Field label={t.smartSetup.from}>
                        <input
                          type="time"
                          dir="ltr"
                          value={rule.startTime}
                          onChange={(event) => updateRule(rule.dayOfWeek, { startTime: event.target.value })}
                          className="focus-ring ltr rounded-[8px] border border-line bg-white px-3 py-3 text-start"
                        />
                      </Field>
                      <Field label={t.smartSetup.to}>
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
              </DetailsPanel>

              <DetailsPanel title={t.smartSetup.pageCopy} icon={MessageCircle}>
                <div className="grid gap-4">
                  <Field label={t.smartSetup.shortDescription}>
                    <input
                      value={draft.shortDescription}
                      onChange={(event) => updateDraft({ shortDescription: event.target.value })}
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <Field label={t.smartSetup.description}>
                    <textarea
                      value={draft.description}
                      onChange={(event) => updateDraft({ description: event.target.value })}
                      className="focus-ring min-h-24 rounded-[8px] border border-line bg-white px-3 py-3"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t.smartSetup.coverTitle}>
                      <input
                        value={draft.coverTitle}
                        onChange={(event) => updateDraft({ coverTitle: event.target.value })}
                        className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                      />
                    </Field>
                    <Field label={t.smartSetup.coverSubtitle}>
                      <input
                        value={draft.coverSubtitle}
                        onChange={(event) => updateDraft({ coverSubtitle: event.target.value })}
                        className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                      />
                    </Field>
                  </div>
                  <Field label={t.dashboard.profile.tone}>
                    <select
                      value={draft.coverTone}
                      onChange={(event) => updateDraft({ coverTone: event.target.value as SmartSetupDraft["coverTone"] })}
                      className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
                    >
                      {toneValues.map((tone) => (
                        <option key={tone} value={tone}>
                          {t.tones[tone]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </DetailsPanel>

              {error ? <p className="rounded-[8px] bg-red-950/50 px-4 py-3 font-bold text-red-100">{error}</p> : null}
              {copiedLabel ? <p className="rounded-[8px] bg-emerald-950/40 px-4 py-3 font-bold text-emerald-100">{copiedLabel}</p> : null}

              {createdPage ? (
                <section className="rounded-[8px] border border-primary/40 bg-[var(--primary-soft)] p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 place-items-center rounded-[8px] bg-primary text-white">
                      <CheckCircle2 size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold">{t.smartSetup.savedTitle}</h2>
                      <p className="mt-1 text-muted">{t.smartSetup.savedText}</p>
                      <p className="ltr mt-2 break-all text-start text-sm font-bold text-muted">{bookingUrl}</p>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="flex flex-col gap-3 rounded-[8px] border border-line bg-white p-4 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => copyText("whatsapp")}
                  disabled={!createdPage}
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold disabled:opacity-50"
                >
                  <Copy size={16} aria-hidden="true" />
                  {t.smartSetup.copyWhatsapp}
                </button>
                <button
                  type="button"
                  onClick={() => copyText("instagram")}
                  disabled={!createdPage}
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold disabled:opacity-50"
                >
                  <Camera size={16} aria-hidden="true" />
                  {t.smartSetup.copyInstagram}
                </button>
                <button
                  type="button"
                  onClick={openPreview}
                  disabled={!createdPage}
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold disabled:opacity-50"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {t.smartSetup.openBookingPreview}
                </button>
                {createdPage ? (
                  <a
                    href={createdPage.dashboardUrl}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    {t.smartSetup.editInDashboard}
                  </a>
                ) : null}
              </div>

              <button
                disabled={state === "saving"}
                className="focus-ring inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-base font-extrabold text-white disabled:opacity-60 sm:w-auto"
              >
                <Save size={18} aria-hidden="true" />
                {state === "saving" ? t.smartSetup.saving : t.smartSetup.save}
              </button>
            </form>
          ) : (
            <section className="quiet-card rounded-[8px] p-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-[8px] bg-[var(--primary-soft)] text-primary">
                <WandSparkles size={24} aria-hidden="true" />
              </div>
              <p className="mt-3 font-extrabold">{t.smartSetup.noDraft}</p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

type IconComponent = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

function Panel({ title, icon: Icon, children }: { title: string; icon: IconComponent; children: React.ReactNode }) {
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

function DetailsPanel({ title, icon: Icon, children }: { title: string; icon: IconComponent; children: React.ReactNode }) {
  return (
    <details className="soft-card group rounded-[8px] p-5">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-[8px] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Icon size={20} className="text-primary" aria-hidden="true" />
          <span className="text-xl font-extrabold">{title}</span>
        </span>
        <ChevronDown size={20} className="text-muted transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function DraftBookingPagePreview({ draft, language, t }: { draft: SmartSetupDraft; language: Language; t: Translation }) {
  const activeServices = draft.services.filter((service) => service.isActive);
  const firstRule = draft.availabilityRules.find((rule) => rule.isActive);
  const sampleSlots = firstRule ? [firstRule.startTime, "12:00", firstRule.endTime] : ["09:00", "12:00", "16:00"];

  return (
    <section className="soft-card overflow-hidden rounded-[8px] p-0">
      <div className="flex flex-col gap-2 border-b border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">{t.smartSetup.livePreviewTitle}</p>
          <h2 className="mt-1 text-xl font-extrabold">{draft.businessName}</h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--surface-soft)] px-3 py-1 text-sm font-extrabold text-muted">
          <ExternalLink size={15} aria-hidden="true" />
          {t.smartSetup.previewTitle}
        </span>
      </div>

      <div className={`bg-gradient-to-br ${getBusinessToneClasses(draft.coverTone)} p-5 text-white`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <BusinessVisual draft={draft} className="size-16" iconClassName="size-8" />
              <div>
                <p className="text-sm font-bold text-white/75">{t.booking.demoBadge}</p>
                <h3 className="mt-1 text-3xl font-extrabold leading-tight">{draft.businessName}</h3>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">{draft.description}</p>
          </div>
          <div className="rounded-[8px] bg-white/14 px-4 py-3 text-sm font-extrabold text-white">
            {draft.phone || draft.whatsapp}
          </div>
        </div>
      </div>

      <div className="grid gap-4 bg-white p-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-extrabold text-muted">{t.booking.chooseService}</p>
          <div className="mt-3 grid gap-2">
            {(activeServices.length ? activeServices : draft.services).slice(0, 3).map((service, index) => (
              <div key={`${service.name}-${index}`} className="rounded-[8px] border border-line bg-[var(--surface-soft)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold">{service.name}</span>
                  <span className="font-extrabold text-primary">{formatPrice(service.price, language)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{formatDuration(service.durationMinutes, language)}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-extrabold text-muted">{t.booking.selectDateTime}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {sampleSlots.map((slot, index) => (
              <span key={`${slot}-${index}`} className="grid min-h-11 place-items-center rounded-[8px] border border-primary bg-[var(--primary-soft)] text-sm font-extrabold text-primary">
                {slot}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-[8px] bg-primary px-4 py-3 text-center font-extrabold text-white">{t.booking.submit}</div>
        </div>
      </div>
    </section>
  );
}

function BusinessVisualPicker({
  draft,
  imagePrompt,
  onImagePromptChange,
  onGenerateImage,
  onUploadImage,
  onUpdateDraft,
  t,
}: {
  draft: SmartSetupDraft;
  imagePrompt: string;
  onImagePromptChange: (value: string) => void;
  onGenerateImage: () => void;
  onUploadImage: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpdateDraft: (patch: Partial<SmartSetupDraft>) => void;
  t: Translation;
}) {
  const presets = [
    { id: "clean" as const, label: t.smartSetup.visualPresetClean, image: buildProfileImage(draft, "clean") },
    { id: "studio" as const, label: t.smartSetup.visualPresetStudio, image: buildProfileImage(draft, "studio") },
    { id: "premium" as const, label: t.smartSetup.visualPresetPremium, image: buildProfileImage(draft, "premium") },
  ];

  return (
    <Panel title={t.smartSetup.visualTitle} icon={ImageIcon}>
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="grid gap-3">
          <BusinessVisual draft={draft} className="size-36" iconClassName="size-14" />
          <button
            type="button"
            onClick={() => onUpdateDraft({ profileImage: "" })}
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-extrabold"
          >
            <BusinessIcon value={draft.businessIcon} className="size-4" />
            {t.smartSetup.visualIconOnly}
          </button>
        </div>

        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-sm font-extrabold text-muted">{t.smartSetup.defaultIcons}</p>
            <div className="flex flex-wrap gap-2">
              {businessIconOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdateDraft({ businessIcon: option.value })}
                  className={`focus-ring grid size-11 place-items-center rounded-[8px] border ${
                    draft.businessIcon === option.value ? "border-primary bg-[var(--primary-soft)] text-primary" : "border-line bg-white text-muted"
                  }`}
                  aria-label={option.label}
                >
                  <BusinessIcon value={option.value} className="size-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-extrabold text-muted">{t.smartSetup.defaultImages}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onUpdateDraft({ profileImage: preset.image })}
                  className="focus-ring flex min-h-16 items-center gap-3 rounded-[8px] border border-line bg-white p-2 text-start text-sm font-extrabold transition hover:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Generated presets are local data URLs. */}
                  <img src={preset.image} alt="" className="size-12 shrink-0 rounded-[8px] object-cover" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
            <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-extrabold">
              <Upload size={16} aria-hidden="true" />
              {t.smartSetup.uploadImage}
              <input type="file" accept="image/*" onChange={onUploadImage} className="sr-only" />
            </label>
            <Field label={t.smartSetup.imagePrompt}>
              <input
                value={imagePrompt}
                onChange={(event) => onImagePromptChange(event.target.value)}
                placeholder={t.smartSetup.imagePromptPlaceholder}
                className="focus-ring rounded-[8px] border border-line bg-white px-3 py-3"
              />
            </Field>
            <button
              type="button"
              onClick={onGenerateImage}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-extrabold text-white"
            >
              <WandSparkles size={16} aria-hidden="true" />
              {t.smartSetup.generateImage}
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function BusinessVisual({
  draft,
  className,
  iconClassName,
}: {
  draft: Pick<SmartSetupDraft, "businessIcon" | "businessName" | "profileImage">;
  className: string;
  iconClassName: string;
}) {
  if (draft.profileImage) {
    // eslint-disable-next-line @next/next/no-img-element -- Profile images can be user-uploaded data URLs.
    return <img src={draft.profileImage} alt={draft.businessName} className={`${className} shrink-0 rounded-[8px] bg-white object-cover shadow-sm`} />;
  }

  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-[8px] bg-white text-primary shadow-sm`}>
      <BusinessIcon value={draft.businessIcon} className={iconClassName} />
    </span>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-foreground ${className}`}>
      {label}
      {children}
    </label>
  );
}
