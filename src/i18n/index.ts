"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { en } from "@/i18n/en";
import { he } from "@/i18n/he";
import type { Language } from "@/lib/types";

export const LANGUAGE_STORAGE_KEY = "bookeasy.language";

export const translations: Record<Language, TranslationDictionary> = {
  he,
  en,
};

export const languageLabels: Record<Language, string> = {
  he: he.common.hebrew,
  en: he.common.english,
};

export const languageDirections: Record<Language, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly Widen<Item>[]
        : T extends object
          ? { [Key in keyof T]: Widen<T[Key]> }
          : T;

export type TranslationDictionary = Widen<typeof he>;

type LocaleContextValue = {
  language: Language;
  direction: "rtl" | "ltr";
  t: TranslationDictionary;
  setLanguage: (language: Language) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function normalizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "he";
}

export function normalizeSupportedLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) {
    return ["he", "en"];
  }

  const languages = value.map(normalizeLanguage).filter((language, index, list) => list.indexOf(language) === index);
  return languages.length ? languages : ["he", "en"];
}

export function isRtl(language: Language) {
  return languageDirections[language] === "rtl";
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("he");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored) {
        setLanguageState(normalizeLanguage(stored));
      }
    }, 150);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const direction = languageDirections[language];
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language]);

  const value = useMemo<LocaleContextValue>(() => {
    return {
      language,
      direction: languageDirections[language],
      t: translations[language],
      setLanguage(nextLanguage) {
        const normalized = normalizeLanguage(nextLanguage);
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
        setLanguageState(normalized);
      },
    };
  }, [language]);

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used inside LocaleProvider");
  }

  return context;
}
