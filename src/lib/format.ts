import type { BookingStatus, DemoRequestStatus, Language } from "@/lib/types";

export const dayNamesByLanguage: Record<Language, string[]> = {
  he: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const dayNames = dayNamesByLanguage.he;

export const bookingStatusLabelsByLanguage: Record<Language, Record<BookingStatus, string>> = {
  he: {
    pending: "ממתין לאישור",
    confirmed: "אושר",
    cancelled: "בוטל",
    completed: "הושלם",
  },
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
  },
};

export const bookingStatusLabels = bookingStatusLabelsByLanguage.he;

export const demoStatusLabels: Record<DemoRequestStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  closed: "נסגר",
};

export function formatPrice(price: number, language: Language = "he") {
  return new Intl.NumberFormat(language === "he" ? "he-IL" : "en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(minutes: number, language: Language = "he") {
  if (language === "en") {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const hourLabel = hours === 1 ? "hour" : "hours";
    return rest ? `${hours} ${hourLabel} ${rest} min` : `${hours} ${hourLabel}`;
  }

  if (minutes < 60) {
    return `${minutes} דקות`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!rest) {
    return hours === 1 ? "שעה" : `${hours} שעות`;
  }

  return `${hours} שעות ו-${rest} דקות`;
}

export function formatDate(date: string, language: Language = "he") {
  return new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getBusinessToneClasses(tone: "teal" | "rose" | "blue") {
  const tones = {
    teal: "from-[#0d3032] via-[#0d6b62] to-[#9fb6a6]",
    rose: "from-[#321d28] via-[#8f4e66] to-[#d2a37f]",
    blue: "from-[#102f34] via-[#315d70] to-[#9bb8bd]",
  };

  return tones[tone];
}
