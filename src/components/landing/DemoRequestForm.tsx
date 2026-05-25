"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Link2, Save } from "lucide-react";

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

const categoryOptions = [
  { value: "barber", label: "מספרה / ברבר" },
  { value: "nails", label: "קוסמטיקה / ציפורניים" },
  { value: "clinic", label: "קליניקה" },
  { value: "fitness", label: "אימון אישי" },
  { value: "other", label: "עסק אחר" },
];

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function DemoRequestForm() {
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
      body: JSON.stringify(values),
    });

    const data = (await response.json()) as Partial<CreatedPage> & { error?: string };

    if (!response.ok || data.error || !data.business || !data.bookingUrl || !data.dashboardUrl) {
      setError(data.error ?? "לא הצלחנו ליצור את עמוד העסק כרגע. כדאי לנסות שוב בעוד רגע");
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
      setError("לא הצלחנו להעתיק אוטומטית. אפשר לסמן את הלינק ולהעתיק ידנית.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card rounded-[8px] p-5 sm:p-7" id="create-page">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">פתיחת עמוד אחרי רכישה</p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
          יוצרים עמוד הזמנות ומקבלים לינק לפרסום
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          אחרי רכישת השירות בעל העסק ממלא פרטים בסיסיים, מקבל עמוד פעיל מיד, וממשיך לערוך שירותים וזמינות בלוח הניהול.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          שם בעל העסק
          <input
            required
            value={values.ownerName}
            onChange={(event) => setValues((current) => ({ ...current, ownerName: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder="לדוגמה: מאיה כהן"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          שם העסק
          <input
            required
            value={values.businessName}
            onChange={(event) => setValues((current) => ({ ...current, businessName: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder="לדוגמה: Maya Nails"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          סוג העסק
          <select
            value={values.category}
            onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          לינק לעמוד העסק
          <div className="flex overflow-hidden rounded-[8px] border border-line bg-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
            <span className="ltr grid place-items-center border-l border-line px-3 text-sm font-bold text-muted">/b/</span>
            <input
              required
              dir="ltr"
              value={values.slug}
              onChange={(event) => setValues((current) => ({ ...current, slug: cleanSlug(event.target.value) }))}
              className="ltr min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-right text-base outline-none"
              placeholder="maya-nails"
            />
          </div>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          טלפון
          <input
            required
            dir="ltr"
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base"
            placeholder="050-0000000"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          וואטסאפ
          <input
            dir="ltr"
            value={values.whatsapp}
            onChange={(event) => setValues((current) => ({ ...current, whatsapp: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base"
            placeholder="אם שונה מהטלפון"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground sm:col-span-2">
          כתובת
          <input
            value={values.address}
            onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder="לדוגמה: רחוב הרצל 10, תל אביב"
          />
        </label>
      </div>

      <div className="mt-5 rounded-[8px] border border-line bg-white/70 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Link2 size={18} className="text-primary" aria-hidden="true" />
          <h3 className="font-extrabold">שירות ראשון לעמוד</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            שם השירות
            <input
              required
              value={values.serviceName}
              onChange={(event) => setValues((current) => ({ ...current, serviceName: event.target.value }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
              placeholder="לדוגמה: לק ג׳ל"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            מחיר
            <input
              required
              type="number"
              min={0}
              value={values.servicePrice}
              onChange={(event) => setValues((current) => ({ ...current, servicePrice: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            משך בדקות
            <input
              required
              type="number"
              min={15}
              step={15}
              value={values.serviceDurationMinutes}
              onChange={(event) => setValues((current) => ({ ...current, serviceDurationMinutes: Number(event.target.value) }))}
              className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            />
          </label>
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
        <span>השירות נרכש, ואפשר לפתוח עמוד הזמנות פעיל עבור העסק.</span>
      </label>

      {error ? <p className="mt-4 rounded-[8px] bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-100">{error}</p> : null}

      {createdPage ? (
        <div className="mt-5 rounded-[8px] border border-primary/40 bg-[var(--primary-soft)] p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-primary text-white">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold text-foreground">העמוד של {createdPage.business.name} מוכן לפרסום</p>
              <p className="ltr mt-2 break-all text-right text-sm font-bold text-muted">{createdPage.bookingUrl}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyLink}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              <Copy size={17} aria-hidden="true" />
              {copied ? "הלינק הועתק" : "העתק לינק לפרסום"}
            </button>
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-bold text-foreground"
              href={createdPage.bookingUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} aria-hidden="true" />
              פתח עמוד הזמנות
            </a>
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-bold text-foreground"
              href={createdPage.dashboardUrl}
            >
              <Save size={17} aria-hidden="true" />
              המשך לעריכה בדשבורד
            </a>
          </div>
        </div>
      ) : null}

      <button
        disabled={state === "submitting"}
        className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white transition disabled:opacity-60 sm:w-auto"
      >
        <Save size={18} aria-hidden="true" />
        {state === "submitting" ? "יוצר עמוד..." : "צור עמוד וקבל לינק"}
      </button>
    </form>
  );
}
