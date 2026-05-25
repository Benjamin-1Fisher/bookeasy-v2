import { z } from "zod";

const phoneRegex = /^[0-9+\-\s()]{8,18}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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
  status: z.enum(["pending", "confirmed", "cancelled", "completed"], {
    message: "סטטוס ההזמנה לא תקין",
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
  name: z.string().trim().min(2, "יש להזין שם עסק").max(90, "שם העסק ארוך מדי").optional(),
  description: z.string().trim().min(8, "התיאור קצר מדי").max(400, "התיאור ארוך מדי").optional(),
  shortDescription: z.string().trim().min(4, "התיאור הקצר קצר מדי").max(140, "התיאור הקצר ארוך מדי").optional(),
  phone: z.string().trim().regex(phoneRegex, "מספר הטלפון נראה לא תקין").optional(),
  whatsapp: z.string().trim().regex(phoneRegex, "מספר הוואטסאפ נראה לא תקין").optional(),
  address: z.string().trim().max(140, "הכתובת ארוכה מדי").optional(),
});
