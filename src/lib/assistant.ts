import { formatDate, formatDuration, formatPrice } from "@/lib/format";
import type { AssistantSettings, Booking, Business, FaqTemplates, Service, WaitlistEntry } from "@/lib/types";

export const defaultAssistantSettings: AssistantSettings = {
  confirmationEnabled: true,
  remindersEnabled: true,
  reminder24hEnabled: true,
  reminder3hEnabled: false,
  reminderTemplate: "מזכירים לך שהתור שלך מתקרב. אם צריך לשנות, אפשר להשתמש בקישור המצורף.",
  cancellationFollowUpEnabled: true,
  cancellationFollowUpTemplate: "התור שלך בוטל. אפשר לבחור זמן חדש דרך הקישור.",
  noShowFollowUpEnabled: true,
  noShowFollowUpTemplate: "ראינו שלא הצלחת להגיע לתור. אפשר לקבוע תור חדש דרך הקישור.",
  waitlistEnabled: true,
  waitlistMessageTemplate: "התפנה תור ואפשר לבחור זמן חדש דרך הקישור.",
  dailySummaryEnabled: true,
  weeklySummaryEnabled: true,
};

export const defaultFaqTemplates: FaqTemplates = {
  prices: "המחירים מופיעים בדף ההזמנות ליד כל שירות. אפשר לבחור שירות ולראות מחיר לפני קביעת התור.",
  location: "הכתובת מופיעה בדף ההזמנות. אם צריך הכוונה אפשר לשלוח הודעה לעסק.",
  openingHours: "שעות הפעילות משתנות לפי זמינות. בדף ההזמנות מוצגות רק שעות פנויות שאפשר לקבוע.",
  cancellationPolicy: "אפשר לבטל או לשנות תור מראש דרך הקישור שקיבלת בהודעת האישור.",
  reschedule: "כדי לשנות תור נכנסים לקישור ההזמנה ובוחרים זמן חדש.",
};

export function createDefaultAssistantSettings(): AssistantSettings {
  return { ...defaultAssistantSettings };
}

export function createDefaultFaqTemplates(): FaqTemplates {
  return { ...defaultFaqTemplates };
}

export function normalizeAssistantSettings(settings?: Partial<AssistantSettings> | null): AssistantSettings {
  const normalized = { ...defaultAssistantSettings, ...(settings ?? {}) };

  return {
    ...normalized,
    reminderTemplate: readableTemplate(normalized.reminderTemplate, defaultAssistantSettings.reminderTemplate),
    cancellationFollowUpTemplate: readableTemplate(
      normalized.cancellationFollowUpTemplate,
      defaultAssistantSettings.cancellationFollowUpTemplate,
    ),
    noShowFollowUpTemplate: readableTemplate(normalized.noShowFollowUpTemplate, defaultAssistantSettings.noShowFollowUpTemplate),
    waitlistMessageTemplate: readableTemplate(normalized.waitlistMessageTemplate, defaultAssistantSettings.waitlistMessageTemplate),
  };
}

export function normalizeFaqTemplates(templates?: Partial<FaqTemplates> | null): FaqTemplates {
  const normalized = { ...defaultFaqTemplates, ...(templates ?? {}) };

  return {
    prices: readableTemplate(normalized.prices, defaultFaqTemplates.prices),
    location: readableTemplate(normalized.location, defaultFaqTemplates.location),
    openingHours: readableTemplate(normalized.openingHours, defaultFaqTemplates.openingHours),
    cancellationPolicy: readableTemplate(normalized.cancellationPolicy, defaultFaqTemplates.cancellationPolicy),
    reschedule: readableTemplate(normalized.reschedule, defaultFaqTemplates.reschedule),
  };
}

export type AssistantTemplateContext = {
  businessName: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  endTime: string;
  price: string;
  duration: string;
  address: string;
  phone: string;
  bookingLink: string;
  rescheduleLink: string;
  cancelLink: string;
  bookAgainLink: string;
};

export function renderAssistantTemplate(template: string, context: AssistantTemplateContext) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => context[key as keyof AssistantTemplateContext] ?? "");
}

function readableTemplate(value: string | undefined, fallback: string) {
  if (!value || value.includes("{{")) {
    return fallback;
  }

  return value;
}

export function buildBookingLinks(business: Business, booking?: Pick<Booking, "id">, baseUrl = "") {
  const bookingLink = `${baseUrl}/b/${business.slug}`;
  const suffix = booking ? `?booking=${encodeURIComponent(booking.id)}#booking` : "#booking";

  return {
    bookingLink,
    rescheduleLink: `${bookingLink}${suffix}`,
    cancelLink: booking ? `${bookingLink}?cancel=${encodeURIComponent(booking.id)}#booking` : bookingLink,
    bookAgainLink: `${bookingLink}#booking`,
  };
}

export function buildBookingContext(
  business: Business,
  service: Service,
  booking: Booking,
  baseUrl = "",
): AssistantTemplateContext {
  const links = buildBookingLinks(business, booking, baseUrl);

  return {
    businessName: business.name,
    customerName: booking.customerName,
    serviceName: service.name,
    date: formatDate(booking.date),
    time: booking.startTime,
    endTime: booking.endTime,
    price: formatPrice(service.price),
    duration: formatDuration(service.durationMinutes),
    address: business.address || "הכתובת תישלח בהמשך",
    phone: business.phone,
    ...links,
  };
}

export function generateConfirmationMessage(business: Business, service: Service, booking: Booking, baseUrl = "") {
  const context = buildBookingContext(business, service, booking, baseUrl);

  return [
    `היי ${context.customerName}, התור שלך נקבע בהצלחה.`,
    `עסק: ${context.businessName}`,
    `שירות: ${context.serviceName}`,
    `מועד: ${context.date}, שעה ${context.time}`,
    `לשינוי תור: ${context.rescheduleLink}`,
    `לביטול תור: ${context.cancelLink}`,
  ].join("\n");
}

export function generateReminderMessage(business: Business, service: Service, booking: Booking, baseUrl = "") {
  const context = buildBookingContext(business, service, booking, baseUrl);
  const settings = normalizeAssistantSettings(business.assistantSettings);

  return [
    `היי ${context.customerName},`,
    settings.reminderTemplate,
    `עסק: ${context.businessName}`,
    `שירות: ${context.serviceName}`,
    `מועד: ${context.date}, שעה ${context.time}`,
    `לשינוי תור: ${context.rescheduleLink}`,
  ].join("\n");
}

export function generateCancellationMessage(business: Business, service: Service, booking: Booking, baseUrl = "") {
  const context = buildBookingContext(business, service, booking, baseUrl);
  const settings = normalizeAssistantSettings(business.assistantSettings);

  return [`היי ${context.customerName},`, settings.cancellationFollowUpTemplate, `לקביעת תור חדש: ${context.bookAgainLink}`].join("\n");
}

export function generateNoShowMessage(business: Business, service: Service, booking: Booking, baseUrl = "") {
  const context = buildBookingContext(business, service, booking, baseUrl);
  const settings = normalizeAssistantSettings(business.assistantSettings);

  return [`היי ${context.customerName},`, settings.noShowFollowUpTemplate, `לקביעת תור חדש: ${context.bookAgainLink}`].join("\n");
}

export function generateWaitlistMessage(business: Business, entry: WaitlistEntry, service?: Service, baseUrl = "") {
  const links = buildBookingLinks(business, undefined, baseUrl);
  const context: AssistantTemplateContext = {
    businessName: business.name,
    customerName: entry.customerName,
    serviceName: service?.name ?? "השירות שביקשת",
    date: entry.preferredDate ? formatDate(entry.preferredDate) : "הזמן שביקשת",
    time: "",
    endTime: "",
    price: service ? formatPrice(service.price) : "",
    duration: service ? formatDuration(service.durationMinutes) : "",
    address: business.address || "הכתובת תישלח בהמשך",
    phone: business.phone,
    ...links,
  };

  return [`היי ${context.customerName},`, normalizeAssistantSettings(business.assistantSettings).waitlistMessageTemplate, context.bookAgainLink].join("\n");
}
