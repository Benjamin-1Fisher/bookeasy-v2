import type { Business } from "@/lib/types";

export const defaultBookingWindowDays = 60;
export const minBookingWindowDays = 1;
export const maxBookingWindowDays = 365;

type BookingWindowBusiness = Pick<Business, "bookingWindowDays" | "timezone">;

export function getBookingWindowDays(business: Pick<Business, "bookingWindowDays">) {
  const value = business.bookingWindowDays;

  if (!Number.isFinite(value)) {
    return defaultBookingWindowDays;
  }

  return Math.min(maxBookingWindowDays, Math.max(minBookingWindowDays, Math.round(value)));
}

export function dateKeyFromDate(date: Date, timeZone = "Asia/Jerusalem") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function addDaysToDateKey(value: string, days: number) {
  const date = dateFromKey(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getBookingWindowBounds(business: BookingWindowBusiness, now = new Date()) {
  const today = dateKeyFromDate(now, business.timezone || "Asia/Jerusalem");
  const days = getBookingWindowDays(business);

  return {
    today,
    maxDate: addDaysToDateKey(today, days),
    days,
  };
}

export function isDateInBookingWindow(date: string, business: BookingWindowBusiness, now = new Date()) {
  const { today, maxDate } = getBookingWindowBounds(business, now);
  return date >= today && date <= maxDate;
}
