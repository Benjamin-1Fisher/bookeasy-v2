import { z } from "zod";

const phoneRegex = /^[0-9+\-\s()]{8,18}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const imageUrlRegex = /^(https?:\/\/\S+|\/\S*|data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+)$/i;
const optionalImageUrl = z
  .string()
  .trim()
  .max(2_000_000, "קובץ התמונה גדול מדי")
  .refine((value) => !value || imageUrlRegex.test(value), "אפשר להשתמש רק בקישור תמונה תקין")
  .optional();

export const bookingSchema = z.object({
  businessId: z.string().min(1, "חסר מזהה עסק"),
  serviceId: z.string().min(1, "צריך לבחור שירות"),
  date: z.string().regex(dateRegex, "צריך לבחור תאריך תקין"),
  startTime: z.string().regex(timeRegex, "צריך לבחור שעה תקינה"),
  customerName: z.string().trim().min(2, "יש להזין שם מלא").max(80, "השם ארוך מדי"),
  customerPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "מספר הטלפון נראה לא תקין. כדאי לבדוק שוב"),
  notes: z.string().trim().max(300, "ההערות ארוכות מדי").optional().or(z.literal("")),
});

export const demoRequestSchema = z.object({
  ownerName: z.string().trim().min(2, "יש להזין שם בעל העסק").max(80, "השם ארוך מדי"),
  businessType: z.string().trim().min(2, "יש להזין סוג עסק").max(80, "סוג העסק ארוך מדי"),
  phone: z.string().trim().regex(phoneRegex, "מספר הטלפון נראה לא תקין. כדאי לבדוק שוב"),
  businessLink: z.string().trim().max(160, "הקישור ארוך מדי").optional().or(z.literal("")),
  message: z.string().trim().max(400, "ההודעה ארוכה מדי").optional().or(z.literal("")),
});

export const onboardingSchema = z.object({
  ownerName: z.string().trim().min(2, "יש להזין שם בעל העסק").max(80, "השם ארוך מדי"),
  ownerEmail: z.string().trim().email("כתובת האימייל לא תקינה").max(120, "האימייל ארוך מדי"),
  businessName: z.string().trim().min(2, "יש להזין שם עסק").max(90, "שם העסק ארוך מדי"),
  category: z.enum(["barber", "nails", "clinic", "fitness", "other"]),
  phone: z.string().trim().regex(phoneRegex, "מספר הטלפון נראה לא תקין"),
  whatsapp: z.string().trim().regex(phoneRegex, "מספר הוואטסאפ נראה לא תקין").optional().or(z.literal("")),
  address: z.string().trim().max(140, "הכתובת ארוכה מדי").optional().or(z.literal("")),
  serviceName: z.string().trim().min(2, "צריך לתת שם לשירות הראשון").max(80, "שם השירות ארוך מדי"),
  servicePrice: z.coerce.number().min(0, "יש להזין מחיר במספרים בלבד").max(10000, "המחיר גבוה מדי"),
  serviceDurationMinutes: z.coerce
    .number()
    .int("משך השירות חייב להיות מספר שלם")
    .min(15, "משך השירות חייב להיות לפחות 15 דקות")
    .max(360, "משך השירות ארוך מדי"),
  paymentConfirmed: z.literal(true, {
    message: "צריך לאשר תשלום כדי ליצור עמוד",
  }),
  acceptTerms: z.literal(true, {
    message: "צריך לאשר את תנאי השימוש",
  }),
});

export const serviceSchema = z.object({
  businessId: z.string().min(1, "חסר מזהה עסק"),
  name: z.string().trim().min(2, "צריך לתת שם לשירות").max(80, "שם השירות ארוך מדי"),
  description: z.string().trim().max(180, "התיאור ארוך מדי").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "יש להזין מחיר במספרים בלבד").max(10000, "המחיר גבוה מדי"),
  durationMinutes: z.coerce
    .number()
    .int("משך השירות חייב להיות מספר שלם")
    .min(15, "משך השירות חייב להיות לפחות 15 דקות")
    .max(360, "משך השירות ארוך מדי"),
  isActive: z.boolean().optional(),
});

export const servicePatchSchema = serviceSchema.partial().extend({
  businessId: z.string().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"], {
    message: "סטטוס ההזמנה לא תקין",
  }),
});

export const waitlistSchema = z.object({
  businessId: z.string().min(1, "חסר מזהה עסק"),
  serviceId: z.string().min(1, "צריך לבחור שירות").optional().or(z.literal("")),
  customerName: z.string().trim().min(2, "יש להזין שם מלא").max(80, "השם ארוך מדי"),
  customerPhone: z.string().trim().regex(phoneRegex, "מספר הטלפון נראה לא תקין. כדאי לבדוק שוב"),
  preferredDate: z.string().regex(dateRegex, "צריך לבחור תאריך תקין").optional().or(z.literal("")),
  notes: z.string().trim().max(300, "ההערות ארוכות מדי").optional().or(z.literal("")),
});

export const waitlistStatusSchema = z.object({
  status: z.enum(["waiting", "contacted", "closed"], {
    message: "סטטוס רשימת ההמתנה לא תקין",
  }),
});

export const availabilityRuleSchema = z.object({
  id: z.string().optional(),
  businessId: z.string().min(1, "חסר מזהה עסק"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "שעת התחלה לא תקינה"),
  endTime: z.string().regex(timeRegex, "שעת סיום לא תקינה"),
  isActive: z.boolean(),
});

export const availabilityUpdateSchema = z.object({
  businessId: z.string().min(1, "חסר מזהה עסק"),
  rules: z.array(availabilityRuleSchema).min(1, "צריך להגדיר לפחות יום עבודה אחד"),
});

export const businessPatchSchema = z.object({
  businessId: z.string().min(1, "חסר מזהה עסק").optional(),
  slug: z
    .string()
    .trim()
    .min(3, "הלינק קצר מדי")
    .max(60, "הלינק ארוך מדי")
    .regex(/^[a-z0-9-]+$/, "אפשר להשתמש רק באותיות באנגלית, מספרים ומקפים")
    .optional(),
  businessIcon: z
    .string()
    .trim()
    .min(1, "צריך לבחור אייקון לעסק")
    .max(40, "האייקון לא תקין")
    .regex(/^[a-z-]+$/, "האייקון לא תקין")
    .optional(),
  logoUrl: optionalImageUrl,
  category: z.enum(["barber", "nails", "clinic", "fitness", "other"]).optional(),
  coverTitle: z.string().trim().min(4, "כותרת הקאבר קצרה מדי").max(120, "כותרת הקאבר ארוכה מדי").optional(),
  coverSubtitle: z.string().trim().min(4, "תת הכותרת קצרה מדי").max(160, "תת הכותרת ארוכה מדי").optional(),
  coverImageUrl: optionalImageUrl,
  coverTone: z.enum(["teal", "rose", "blue"]).optional(),
  bookingWindowDays: z.coerce
    .number()
    .int("טווח ההזמנות חייב להיות מספר שלם")
    .min(1, "אפשר לפתוח הזמנות לפחות ליום אחד קדימה")
    .max(365, "אפשר לפתוח הזמנות עד שנה קדימה")
    .optional(),
  assistantSettings: z
    .object({
      confirmationEnabled: z.boolean().optional(),
      remindersEnabled: z.boolean().optional(),
      reminder24hEnabled: z.boolean().optional(),
      reminder3hEnabled: z.boolean().optional(),
      reminderTemplate: z.string().trim().min(4, "תבנית התזכורת קצרה מדי").max(700, "תבנית התזכורת ארוכה מדי").optional(),
      cancellationFollowUpEnabled: z.boolean().optional(),
      cancellationFollowUpTemplate: z.string().trim().min(4, "תבנית הביטול קצרה מדי").max(700, "תבנית הביטול ארוכה מדי").optional(),
      noShowFollowUpEnabled: z.boolean().optional(),
      noShowFollowUpTemplate: z.string().trim().min(4, "תבנית אי-הגעה קצרה מדי").max(700, "תבנית אי-הגעה ארוכה מדי").optional(),
      waitlistEnabled: z.boolean().optional(),
      waitlistMessageTemplate: z.string().trim().min(4, "תבנית רשימת ההמתנה קצרה מדי").max(700, "תבנית רשימת ההמתנה ארוכה מדי").optional(),
      dailySummaryEnabled: z.boolean().optional(),
      weeklySummaryEnabled: z.boolean().optional(),
    })
    .optional(),
  faqTemplates: z
    .object({
      prices: z.string().trim().min(2, "התשובה קצרה מדי").max(700, "התשובה ארוכה מדי").optional(),
      location: z.string().trim().min(2, "התשובה קצרה מדי").max(700, "התשובה ארוכה מדי").optional(),
      openingHours: z.string().trim().min(2, "התשובה קצרה מדי").max(700, "התשובה ארוכה מדי").optional(),
      cancellationPolicy: z.string().trim().min(2, "התשובה קצרה מדי").max(700, "התשובה ארוכה מדי").optional(),
      reschedule: z.string().trim().min(2, "התשובה קצרה מדי").max(700, "התשובה ארוכה מדי").optional(),
    })
    .optional(),
  name: z.string().trim().min(2, "יש להזין שם עסק").max(90, "שם העסק ארוך מדי").optional(),
  description: z.string().trim().min(8, "התיאור קצר מדי").max(400, "התיאור ארוך מדי").optional(),
  shortDescription: z.string().trim().min(4, "התיאור הקצר קצר מדי").max(140, "התיאור הקצר ארוך מדי").optional(),
  phone: z.string().trim().regex(phoneRegex, "מספר הטלפון נראה לא תקין").optional(),
  whatsapp: z.string().trim().regex(phoneRegex, "מספר הוואטסאפ נראה לא תקין").optional(),
  address: z.string().trim().max(140, "הכתובת ארוכה מדי").optional(),
});
