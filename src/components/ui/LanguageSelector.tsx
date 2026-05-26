"use client";

import { Globe2 } from "lucide-react";
import { languageLabels, useI18n } from "@/i18n";
import type { Language } from "@/lib/types";

type LanguageSelectorProps = {
  languages?: Language[];
  compact?: boolean;
  className?: string;
};

export function LanguageSelector({ languages, compact = false, className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useI18n();
  const options: Language[] = languages?.length ? languages : ["he", "en"];

  return (
    <label
      className={`focus-within:outline-accent inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-line bg-white/80 px-3 py-2 text-sm font-bold text-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${className}`}
    >
      <Globe2 size={16} aria-hidden="true" />
      <span className={compact ? "sr-only" : ""}>{t.languages.label}</span>
      <select
        value={options.includes(language) ? language : options[0]}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="min-h-0 rounded-none border-0 bg-transparent p-0 text-sm font-bold shadow-none outline-none"
        aria-label={t.languages.label}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {languageLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
