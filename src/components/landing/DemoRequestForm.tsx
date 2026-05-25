"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

const initialValues = {
  ownerName: "",
  businessType: "",
  phone: "",
  businessLink: "",
  message: "",
};

export function DemoRequestForm() {
  const [values, setValues] = useState(initialValues);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    const response = await fetch("/api/demo-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "לא הצלחנו לשלוח את הבקשה כרגע. נסה שוב בעוד רגע");
      setState("error");
      return;
    }

    setValues(initialValues);
    setState("success");
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card rounded-[8px] p-5 sm:p-7" id="demo-form">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">בקשת דמו</p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
          רוצה לראות איך BookEasy נראה לעסק שלך?
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          השאירו פרטים ונחזור אליכם עם דמו מותאם, בלי התחייבות ובלי מערכת מסובכת.
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
          סוג העסק
          <input
            required
            value={values.businessType}
            onChange={(event) => setValues((current) => ({ ...current, businessType: event.target.value }))}
            className="focus-ring rounded-[8px] border border-line bg-white px-4 py-3 text-base"
            placeholder="לדוגמה: קוסמטיקה"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          טלפון / וואטסאפ
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
          קישור לאינסטגרם או לעסק
          <input
            dir="ltr"
            value={values.businessLink}
            onChange={(event) => setValues((current) => ({ ...current, businessLink: event.target.value }))}
            className="focus-ring ltr rounded-[8px] border border-line bg-white px-4 py-3 text-right text-base"
            placeholder="instagram.com/your-business"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-foreground">
        הודעה חופשית
        <textarea
          value={values.message}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
          className="focus-ring min-h-28 rounded-[8px] border border-line bg-white px-4 py-3 text-base"
          placeholder="מה חשוב שנדע על העסק?"
        />
      </label>

      {error ? <p className="mt-4 rounded-[8px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {state === "success" ? (
        <p className="mt-4 rounded-[8px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          הבקשה נשלחה. נחזור אליך עם דמו מסודר לעסק.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          disabled={state === "submitting"}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white transition hover:bg-[#0b5f5a] disabled:opacity-60"
        >
          <Send size={18} aria-hidden="true" />
          {state === "submitting" ? "שולח בקשה..." : "קבל דמו לעסק שלי"}
        </button>
        <a
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-5 py-3 font-bold text-foreground transition hover:border-primary"
          href="https://wa.me/972501234567?text=%D7%94%D7%99%D7%99%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%93%D7%9E%D7%95%20%D7%A9%D7%9C%20BookEasy"
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} aria-hidden="true" />
          דברו איתנו בוואטסאפ
        </a>
      </div>
    </form>
  );
}
