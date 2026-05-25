"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "העתק לינק" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const fullValue = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    await navigator.clipboard.writeText(fullValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-sm font-bold text-foreground transition hover:border-primary"
    >
      {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
      {copied ? "הלינק הועתק" : label}
    </button>
  );
}
