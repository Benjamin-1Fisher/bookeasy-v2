import { z } from "zod";

const phoneRegex = /^[0-9+\-\s()]{8,18}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const slugRegex = /^[a-z0-9-]+$/;

export const languageSchema = z.enum(["he", "en"]);
export const categorySchema = z.enum(["barber", "nails", "clinic", "fitness", "other"]);
export const toneSchema = z.enum(["teal", "rose", "blue"]);

export const bookingSchema = z.object({
  businessId: z.string().min(1, "Missing business id"),
  serviceId: z.string().min(1, "Choose a service"),
  date: z.string().regex(dateRegex, "Choose a valid date"),
  startTime: z.string().regex(timeRegex, "Choose a valid time"),
  customerName: z.string().trim().min(2, "Enter a full name").max(80, "Name is too long"),
  customerPhone: z.string().trim().regex(phoneRegex, "Phone number does not look valid"),
  notes: z.string().trim().max(300, "Notes are too long").optional().or(z.literal("")),
});

export const demoRequestSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter the owner name").max(80, "Owner name is too long"),
  businessType: z.string().trim().min(2, "Enter a business type").max(80, "Business type is too long"),
  phone: z.string().trim().regex(phoneRegex, "Phone number does not look valid"),
  businessLink: z.string().trim().max(160, "Link is too long").optional().or(z.literal("")),
  message: z.string().trim().max(400, "Message is too long").optional().or(z.literal("")),
});

export const businessCreateSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter the owner name").max(80, "Owner name is too long"),
  businessName: z.string().trim().min(2, "Enter a business name").max(90, "Business name is too long"),
  category: categorySchema,
  phone: z.string().trim().regex(phoneRegex, "Phone number does not look valid"),
  whatsapp: z.string().trim().regex(phoneRegex, "WhatsApp number does not look valid").optional().or(z.literal("")),
  address: z.string().trim().max(140, "Address is too long").optional().or(z.literal("")),
  slug: z.string().trim().toLowerCase().min(3, "Link is too short").max(60, "Link is too long").regex(slugRegex),
  serviceName: z.string().trim().min(2, "Enter a service name").max(80, "Service name is too long"),
  servicePrice: z.coerce.number().min(0, "Enter a valid price").max(10000, "Price is too high"),
  serviceDurationMinutes: z.coerce.number().int().min(15, "Duration must be at least 15 minutes").max(360),
  paymentConfirmed: z.boolean().refine(Boolean, "Confirm purchase before creating a page"),
  defaultLanguage: languageSchema.optional(),
  supportedLanguages: z.array(languageSchema).min(1).max(2).optional(),
  showLanguageSwitcher: z.boolean().optional(),
});

export const serviceSchema = z.object({
  businessId: z.string().min(1, "Missing business id"),
  name: z.string().trim().min(2, "Enter a service name").max(80, "Service name is too long"),
  description: z.string().trim().max(180, "Description is too long").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Enter a valid price").max(10000, "Price is too high"),
  durationMinutes: z.coerce.number().int().min(15, "Duration must be at least 15 minutes").max(360),
  isActive: z.boolean().optional(),
});

export const servicePatchSchema = serviceSchema.partial().extend({
  businessId: z.string().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export const availabilityRuleSchema = z.object({
  id: z.string().optional(),
  businessId: z.string().min(1, "Missing business id"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Start time is not valid"),
  endTime: z.string().regex(timeRegex, "End time is not valid"),
  isActive: z.boolean(),
});

export const availabilityUpdateSchema = z.object({
  businessId: z.string().min(1, "Missing business id"),
  rules: z.array(availabilityRuleSchema).min(1, "Define at least one workday"),
});

export const businessPatchSchema = z.object({
  businessId: z.string().min(1, "Missing business id").optional(),
  slug: z.string().trim().min(3).max(60).regex(slugRegex).optional(),
  businessIcon: z.string().trim().min(1).max(40).regex(/^[a-z-]+$/).optional(),
  profileImage: z.string().trim().max(500000).optional().or(z.literal("")),
  category: categorySchema.optional(),
  coverTitle: z.string().trim().min(4).max(120).optional(),
  coverSubtitle: z.string().trim().min(4).max(160).optional(),
  coverTone: toneSchema.optional(),
  name: z.string().trim().min(2).max(90).optional(),
  description: z.string().trim().min(8).max(400).optional(),
  shortDescription: z.string().trim().min(4).max(140).optional(),
  phone: z.string().trim().regex(phoneRegex).optional(),
  whatsapp: z.string().trim().regex(phoneRegex).optional(),
  address: z.string().trim().max(140).optional(),
  defaultLanguage: languageSchema.optional(),
  supportedLanguages: z.array(languageSchema).min(1).max(2).optional(),
  showLanguageSwitcher: z.boolean().optional(),
});

export const smartSetupServiceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(180).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(10000),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  isActive: z.boolean().optional(),
});

export const smartSetupRuleSchema = availabilityRuleSchema.omit({ id: true, businessId: true });

export const smartSetupSaveSchema = z.object({
  ownerName: z.string().trim().min(2).max(80),
  businessName: z.string().trim().min(2).max(90),
  businessIcon: z.string().trim().min(1).max(40).regex(/^[a-z-]+$/).optional(),
  profileImage: z.string().trim().max(500000).optional().or(z.literal("")),
  category: categorySchema,
  phone: z.string().trim().regex(phoneRegex),
  whatsapp: z.string().trim().regex(phoneRegex).optional().or(z.literal("")),
  address: z.string().trim().max(140).optional().or(z.literal("")),
  slug: z.string().trim().toLowerCase().min(3).max(60).regex(slugRegex),
  description: z.string().trim().min(8).max(400),
  shortDescription: z.string().trim().min(4).max(140),
  coverTitle: z.string().trim().min(4).max(120),
  coverSubtitle: z.string().trim().min(4).max(160),
  coverTone: toneSchema,
  defaultLanguage: languageSchema,
  supportedLanguages: z.array(languageSchema).min(1).max(2),
  showLanguageSwitcher: z.boolean(),
  services: z.array(smartSetupServiceSchema).min(1).max(12),
  availabilityRules: z.array(smartSetupRuleSchema).min(1).max(14),
});

export const eventSchema = z.object({
  name: z.enum(["setup_started", "setup_preview_generated", "setup_saved", "booking_page_shared"]),
  businessId: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
