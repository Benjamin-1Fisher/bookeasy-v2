import type { BookingStatus, DemoRequestStatus } from "@/lib/types";

export const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "ממתין לאישור",
  confirmed: "אושר",
  cancelled: "בוטל",
  completed: "הושלם",
};

export const demoStatusLabels: Record<DemoRequestStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  closed: "נסגר",
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(minutes: number) {
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

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
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
    teal: "from-[#123b3a] via-[#0f766e] to-[#f4b860]",
    rose: "from-[#3a2332] via-[#be5a6a] to-[#f4b860]",
    blue: "from-[#17343a] via-[#466c8b] to-[#82c0cc]",
  };

  return tones[tone];
}
