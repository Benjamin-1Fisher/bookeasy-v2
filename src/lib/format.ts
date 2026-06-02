import type { BookingStatus, DemoRequestStatus } from "@/lib/types";

export const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "נקבע",
  confirmed: "נקבע",
  cancelled: "בוטל",
  completed: "הושלם",
  no_show: "הלקוח לא הגיע",
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
    teal: "from-[#030711] via-[#0b1f44] to-[#2563eb]",
    rose: "from-[#030711] via-[#171338] to-[#3b82f6]",
    blue: "from-[#030711] via-[#071a35] to-[#1d4ed8]",
  };

  return tones[tone];
}
