import { promises as fs } from "node:fs";
import path from "node:path";
import {
  generateCancellationMessage,
  generateConfirmationMessage,
  generateNoShowMessage,
  generateReminderMessage,
  generateWaitlistMessage,
  normalizeAssistantSettings,
  normalizeFaqTemplates,
} from "@/lib/assistant";
import { getBookingWindowDays, isDateInBookingWindow } from "@/lib/booking-window";
import { seedStore } from "@/lib/seed-data";
import type {
  AssistantMessage,
  AssistantMessageStatus,
  AssistantMessageType,
  AvailabilityRule,
  AssistantSettings,
  Booking,
  BookingStatus,
  BookeasyStore,
  Business,
  BusinessBundle,
  BusinessCategory,
  DemoRequest,
  FaqTemplates,
  Service,
  Slot,
  WaitlistEntry,
  WaitlistStatus,
} from "@/lib/types";

const DATA_FILE = process.env.BOOKEASY_DATA_FILE
  ? path.resolve(process.env.BOOKEASY_DATA_FILE)
  : path.join(process.cwd(), "data", "bookeasy.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function cloneStore(store: BookeasyStore): BookeasyStore {
  return JSON.parse(JSON.stringify(store)) as BookeasyStore;
}

function isEmptyStore(store: BookeasyStore) {
  return !store.businesses.length && !store.services.length;
}

function normalizeStore(store: BookeasyStore): BookeasyStore {
  const normalized = store as BookeasyStore & { waitlistEntries?: WaitlistEntry[]; assistantMessages?: AssistantMessage[] };

  normalized.waitlistEntries ??= [];
  normalized.assistantMessages ??= [];
  normalized.businesses = normalized.businesses.map((business) => ({
    ...business,
    bookingWindowDays: business.bookingWindowDays ?? 60,
    logoUrl: business.logoUrl ?? "",
    coverImageUrl: business.coverImageUrl ?? "",
    assistantSettings: normalizeAssistantSettings(business.assistantSettings),
    faqTemplates: normalizeFaqTemplates(business.faqTemplates),
  }));

  return normalized;
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(seedStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<BookeasyStore> {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, "utf8");
  const parsed = normalizeStore(JSON.parse(content) as BookeasyStore);

  if (isEmptyStore(parsed)) {
    const seeded = normalizeStore(cloneStore(seedStore));
    await writeStore(seeded);
    return seeded;
  }

  return parsed;
}

export async function writeStore(store: BookeasyStore) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

export async function updateStore<T>(mutator: (store: BookeasyStore) => T | Promise<T>) {
  const run = async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  };

  const current = writeQueue.then(run, run);
  writeQueue = current.catch(() => undefined);
  return current;
}

export function makeId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}

export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(total: number) {
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function bookingDateTime(booking: Booking) {
  return new Date(`${booking.date}T${booking.startTime}:00`);
}

function scheduledReminderTime(booking: Booking, hoursBefore: number) {
  const date = bookingDateTime(booking);
  date.setHours(date.getHours() - hoursBefore);
  return date.toISOString();
}

function addAssistantMessage(
  store: BookeasyStore,
  input: {
    businessId: string;
    bookingId?: string;
    waitlistEntryId?: string;
    type: AssistantMessageType;
    recipientName: string;
    recipientPhone: string;
    body: string;
    status?: AssistantMessageStatus;
    scheduledFor?: string;
  },
) {
  const duplicate = store.assistantMessages.some(
    (message) =>
      message.businessId === input.businessId &&
      message.type === input.type &&
      message.bookingId === input.bookingId &&
      message.waitlistEntryId === input.waitlistEntryId,
  );

  if (duplicate) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const message: AssistantMessage = {
    id: makeId("msg"),
    businessId: input.businessId,
    bookingId: input.bookingId,
    waitlistEntryId: input.waitlistEntryId,
    type: input.type,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    body: input.body,
    status: input.status ?? "ready",
    scheduledFor: input.scheduledFor,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.assistantMessages.unshift(message);
  return message;
}

function createBookingAssistantMessages(store: BookeasyStore, business: Business, service: Service, booking: Booking) {
  const settings = normalizeAssistantSettings(business.assistantSettings);

  if (settings.confirmationEnabled) {
    addAssistantMessage(store, {
      businessId: business.id,
      bookingId: booking.id,
      type: "confirmation",
      recipientName: booking.customerName,
      recipientPhone: booking.customerPhone,
      body: generateConfirmationMessage(business, service, booking),
    });
  }

  if (settings.remindersEnabled && settings.reminder24hEnabled) {
    addAssistantMessage(store, {
      businessId: business.id,
      bookingId: booking.id,
      type: "reminder_24h",
      recipientName: booking.customerName,
      recipientPhone: booking.customerPhone,
      body: generateReminderMessage(business, service, booking),
      status: "scheduled",
      scheduledFor: scheduledReminderTime(booking, 24),
    });
  }

  if (settings.remindersEnabled && settings.reminder3hEnabled) {
    addAssistantMessage(store, {
      businessId: business.id,
      bookingId: booking.id,
      type: "reminder_3h",
      recipientName: booking.customerName,
      recipientPhone: booking.customerPhone,
      body: generateReminderMessage(business, service, booking),
      status: "scheduled",
      scheduledFor: scheduledReminderTime(booking, 3),
    });
  }
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return minutesFromTime(startA) < minutesFromTime(endB) && minutesFromTime(endA) > minutesFromTime(startB);
}

export async function getBusinessBundle(slug: string): Promise<BusinessBundle | null> {
  const store = await readStore();
  const business = store.businesses.find((item) => item.slug === slug && item.isActive);

  if (!business) {
    return null;
  }

  return {
    business,
    services: store.services.filter((service) => service.businessId === business.id),
    availabilityRules: store.availabilityRules.filter((rule) => rule.businessId === business.id),
    bookings: store.bookings.filter((booking) => booking.businessId === business.id),
  };
}

export async function getAdminBusinessBundle(businessId = "biz_barber"): Promise<BusinessBundle | null> {
  const store = await readStore();
  const business = store.businesses.find((item) => item.id === businessId);

  if (!business) {
    return null;
  }

  return {
    business,
    services: store.services.filter((service) => service.businessId === business.id),
    availabilityRules: store.availabilityRules.filter((rule) => rule.businessId === business.id),
    bookings: store.bookings.filter((booking) => booking.businessId === business.id),
  };
}

export async function getSlotsForService(businessId: string, serviceId: string, date: string): Promise<Slot[]> {
  const store = await readStore();
  const service = store.services.find((item) => item.id === serviceId && item.businessId === businessId && item.isActive);
  const business = store.businesses.find((item) => item.id === businessId && item.isActive);

  if (!service || !business) {
    return [];
  }

  if (!isDateInBookingWindow(date, business)) {
    throw new Error(`אפשר לקבוע תור רק עד ${getBookingWindowDays(business)} ימים קדימה`);
  }

  return createSlots(store, businessId, service, date).filter((slot) => slot.available);
}

export function createSlots(store: BookeasyStore, businessId: string, service: Service, date: string): Slot[] {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const closedAllDay = store.availabilityExceptions.some(
    (item) => item.businessId === businessId && item.date === date && item.type === "closed" && !item.startTime,
  );

  if (closedAllDay) {
    return [];
  }

  const rules = store.availabilityRules.filter(
    (rule) => rule.businessId === businessId && rule.dayOfWeek === dayOfWeek && rule.isActive,
  );

  const slots = rules.flatMap((rule) => {
    const start = minutesFromTime(rule.startTime);
    const end = minutesFromTime(rule.endTime);
    const latestStart = end - service.durationMinutes;
    const generated: Slot[] = [];

    for (let minute = start; minute <= latestStart; minute += 30) {
      const startTime = timeFromMinutes(minute);
      const endTime = timeFromMinutes(minute + service.durationMinutes);
      generated.push({
        date,
        startTime,
        endTime,
        available: isSlotAvailable(store, businessId, date, startTime, endTime),
      });
    }

    return generated;
  });

  return slots;
}

export function isSlotAvailable(store: BookeasyStore, businessId: string, date: string, startTime: string, endTime: string) {
  const blocked = store.availabilityExceptions.some((item) => {
    if (item.businessId !== businessId || item.date !== date || item.type !== "closed") {
      return false;
    }

    if (!item.startTime || !item.endTime) {
      return true;
    }

    return rangesOverlap(startTime, endTime, item.startTime, item.endTime);
  });

  if (blocked) {
    return false;
  }

  return !store.bookings.some((booking) => {
    if (booking.businessId !== businessId || booking.date !== date) {
      return false;
    }

    if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "no_show") {
      return false;
    }

    return rangesOverlap(startTime, endTime, booking.startTime, booking.endTime);
  });
}

export async function createBooking(input: {
  businessId: string;
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}) {
  return updateStore((store) => {
    const business = store.businesses.find((item) => item.id === input.businessId && item.isActive);
    const service = store.services.find(
      (item) => item.id === input.serviceId && item.businessId === input.businessId && item.isActive,
    );

    if (!business || !service) {
      throw new Error("השירות שבחרת לא זמין כרגע");
    }

    if (!isDateInBookingWindow(input.date, business)) {
      throw new Error(`אפשר לקבוע תור רק עד ${getBookingWindowDays(business)} ימים קדימה`);
    }

    const endTime = timeFromMinutes(minutesFromTime(input.startTime) + service.durationMinutes);
    const slots = createSlots(store, input.businessId, service, input.date);
    const slot = slots.find((item) => item.startTime === input.startTime);

    if (!slot || !slot.available) {
      throw new Error("השעה הזו כבר לא פנויה. כדאי לבחור שעה אחרת");
    }

    const timestamp = new Date().toISOString();
    const booking: Booking = {
      id: makeId("book"),
      businessId: input.businessId,
      serviceId: input.serviceId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes ?? "",
      date: input.date,
      startTime: input.startTime,
      endTime,
      status: "confirmed",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.bookings.unshift(booking);
    createBookingAssistantMessages(store, business, service, booking);
    return booking;
  });
}

export async function createDemoRequest(input: Omit<DemoRequest, "id" | "status" | "createdAt">) {
  return updateStore((store) => {
    const request: DemoRequest = {
      id: makeId("demo"),
      status: "new",
      createdAt: new Date().toISOString(),
      ...input,
    };

    store.demoRequests.unshift(request);
    return request;
  });
}

const categoryDefaults: Record<
  BusinessCategory,
  {
    icon: string;
    tone: Business["coverTone"];
    coverTitle: string;
    coverSubtitle: string;
    serviceDescription: string;
  }
> = {
  barber: {
    icon: "scissors",
    tone: "teal",
    coverTitle: "תורים לתספורת ולזקן",
    coverSubtitle: "שירותים, מחירים ושעות פנויות בלינק אחד",
    serviceDescription: "שירות ראשון שהלקוחות יכולים להזמין כבר עכשיו.",
  },
  nails: {
    icon: "sparkles",
    tone: "rose",
    coverTitle: "טיפולי יופי בזמן שנוח לך",
    coverSubtitle: "בחירת שירות ושעה פנויה בכמה לחיצות",
    serviceDescription: "שירות טיפוח ראשון שאפשר להזמין דרך הלינק.",
  },
  clinic: {
    icon: "heart-pulse",
    tone: "blue",
    coverTitle: "זמני טיפול ופגישות ייעוץ",
    coverSubtitle: "הלקוח בוחר שעה, והתור נכנס ללוח",
    serviceDescription: "פגישה ראשונה שהלקוחות יכולים לקבוע אונליין.",
  },
  fitness: {
    icon: "dumbbell",
    tone: "blue",
    coverTitle: "אימונים ופגישות בזמן שנוח לך",
    coverSubtitle: "בחירת שירות ושעה פנויה בלי תיאומים ידניים",
    serviceDescription: "מפגש ראשון שאפשר להזמין דרך הלינק.",
  },
  other: {
    icon: "store",
    tone: "teal",
    coverTitle: "קביעת תור אונליין",
    coverSubtitle: "שירותים, מחירים ושעות פנויות במקום אחד",
    serviceDescription: "שירות ראשון שהלקוחות יכולים להזמין אונליין.",
  },
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getUniqueSlug(store: BookeasyStore, requestedSlug: string) {
  const baseSlug = normalizeSlug(requestedSlug) || "business";
  let slug = baseSlug;
  let suffix = 2;

  while (store.businesses.some((business) => business.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function getOnboardingSlugCandidate(input: { businessName: string; category: BusinessCategory }, businessId: string) {
  const nameSlug = normalizeSlug(input.businessName);

  if (nameSlug) {
    return nameSlug;
  }

  const categorySlugs: Record<BusinessCategory, string> = {
    barber: "barber",
    nails: "nails",
    clinic: "clinic",
    fitness: "fitness",
    other: "business",
  };
  const shortId = businessId.split("_").at(-1) ?? Date.now().toString(36);

  return `${categorySlugs[input.category]}-${shortId}`;
}

export async function createBusinessFromOnboarding(input: {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  category: BusinessCategory;
  phone: string;
  whatsapp?: string;
  address?: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
}) {
  return updateStore((store) => {
    const timestamp = new Date().toISOString();
    const defaults = categoryDefaults[input.category];
    const businessId = makeId("biz");
    const serviceId = makeId("srv");
    const slug = getUniqueSlug(store, getOnboardingSlugCandidate(input, businessId));
    const business: Business = {
      id: businessId,
      slug,
      businessIcon: defaults.icon,
      logoUrl: "",
      name: input.businessName,
      category: input.category,
      description: `${input.businessName} מאפשר ללקוחות לבחור שירות, תאריך ושעה פנויה דרך לינק אחד ברור.`,
      shortDescription: "דף הזמנות מהיר וברור ללקוחות.",
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      address: input.address || "",
      timezone: "Asia/Jerusalem",
      bookingWindowDays: 60,
      coverTitle: defaults.coverTitle,
      coverSubtitle: defaults.coverSubtitle,
      coverImageUrl: "",
      coverTone: defaults.tone,
      assistantSettings: normalizeAssistantSettings(),
      faqTemplates: normalizeFaqTemplates(),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const service: Service = {
      id: serviceId,
      businessId,
      name: input.serviceName,
      description: defaults.serviceDescription,
      price: input.servicePrice,
      durationMinutes: input.serviceDurationMinutes,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const availabilityRules: AvailabilityRule[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
      id: makeId("av"),
      businessId,
      dayOfWeek,
      startTime: dayOfWeek === 4 ? "10:00" : "09:00",
      endTime: dayOfWeek === 4 ? "15:00" : "18:00",
      isActive: true,
    }));

    store.businesses.unshift(business);
    store.services.unshift(service);
    store.availabilityRules.push(...availabilityRules);
    store.users.unshift({
      id: makeId("usr"),
      name: input.ownerName,
      email: input.ownerEmail,
      role: "business_owner",
      businessId,
      isActive: true,
    });

    return { business, service };
  });
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  return updateStore((store) => {
    const booking = store.bookings.find((item) => item.id === id);

    if (!booking) {
      throw new Error("ההזמנה לא נמצאה");
    }

    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    const business = store.businesses.find((item) => item.id === booking.businessId);
    const service = store.services.find((item) => item.id === booking.serviceId);

    if (business && service) {
      const settings = normalizeAssistantSettings(business.assistantSettings);

      if (status === "cancelled" && settings.cancellationFollowUpEnabled) {
        addAssistantMessage(store, {
          businessId: business.id,
          bookingId: booking.id,
          type: "cancellation",
          recipientName: booking.customerName,
          recipientPhone: booking.customerPhone,
          body: generateCancellationMessage(business, service, booking),
        });
      }

      if (status === "no_show" && settings.noShowFollowUpEnabled) {
        addAssistantMessage(store, {
          businessId: business.id,
          bookingId: booking.id,
          type: "no_show",
          recipientName: booking.customerName,
          recipientPhone: booking.customerPhone,
          body: generateNoShowMessage(business, service, booking),
        });
      }
    }

    return booking;
  });
}

export async function cancelBooking(id: string) {
  return updateBookingStatus(id, "cancelled");
}

export async function createWaitlistEntry(input: {
  businessId: string;
  serviceId?: string;
  customerName: string;
  customerPhone: string;
  preferredDate?: string;
  notes?: string;
}) {
  return updateStore((store) => {
    const business = store.businesses.find((item) => item.id === input.businessId && item.isActive);
    const service = input.serviceId
      ? store.services.find((item) => item.id === input.serviceId && item.businessId === input.businessId)
      : undefined;

    if (!business) {
      throw new Error("העסק לא נמצא");
    }

    if (input.serviceId && !service) {
      throw new Error("השירות לא נמצא");
    }

    const timestamp = new Date().toISOString();
    const entry: WaitlistEntry = {
      id: makeId("wait"),
      businessId: input.businessId,
      serviceId: input.serviceId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      preferredDate: input.preferredDate,
      notes: input.notes ?? "",
      status: "waiting",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.waitlistEntries.unshift(entry);

    if (normalizeAssistantSettings(business.assistantSettings).waitlistEnabled) {
      addAssistantMessage(store, {
        businessId: business.id,
        waitlistEntryId: entry.id,
        type: "waitlist",
        recipientName: entry.customerName,
        recipientPhone: entry.customerPhone,
        body: generateWaitlistMessage(business, entry, service),
      });
    }

    return entry;
  });
}

export async function updateWaitlistStatus(id: string, status: WaitlistStatus) {
  return updateStore((store) => {
    const entry = store.waitlistEntries.find((item) => item.id === id);

    if (!entry) {
      throw new Error("הלקוח לא נמצא ברשימת ההמתנה");
    }

    entry.status = status;
    entry.updatedAt = new Date().toISOString();
    return entry;
  });
}

export async function addService(input: Omit<Service, "id" | "createdAt" | "updatedAt">) {
  return updateStore((store) => {
    const timestamp = new Date().toISOString();
    const service: Service = {
      id: makeId("srv"),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };

    store.services.unshift(service);
    return service;
  });
}

export async function patchService(id: string, patch: Partial<Omit<Service, "id" | "createdAt">>) {
  return updateStore((store) => {
    const service = store.services.find((item) => item.id === id);

    if (!service) {
      throw new Error("השירות לא נמצא");
    }

    Object.assign(service, patch, { updatedAt: new Date().toISOString() });
    return service;
  });
}

export async function deleteService(id: string) {
  return updateStore((store) => {
    const serviceIndex = store.services.findIndex((item) => item.id === id);

    if (serviceIndex === -1) {
      throw new Error("השירות לא נמצא");
    }

    const hasActiveBookings = store.bookings.some(
      (booking) => booking.serviceId === id && booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show",
    );

    if (hasActiveBookings) {
      store.services[serviceIndex].isActive = false;
      store.services[serviceIndex].updatedAt = new Date().toISOString();
      return { deleted: false, deactivated: true };
    }

    store.services.splice(serviceIndex, 1);
    return { deleted: true, deactivated: false };
  });
}

export async function replaceAvailabilityRules(businessId: string, rules: Array<Omit<AvailabilityRule, "id"> & { id?: string }>) {
  return updateStore((store) => {
    store.availabilityRules = [
      ...store.availabilityRules.filter((rule) => rule.businessId !== businessId),
      ...rules.map((rule) => ({
        ...rule,
        id: rule.id || makeId("av"),
        businessId,
      })),
    ];

    return store.availabilityRules.filter((rule) => rule.businessId === businessId);
  });
}

export async function patchBusiness(
  businessId: string,
  patch: Partial<Omit<Business, "assistantSettings" | "faqTemplates">> & {
    assistantSettings?: Partial<AssistantSettings>;
    faqTemplates?: Partial<FaqTemplates>;
  },
) {
  return updateStore((store) => {
    const business = store.businesses.find((item) => item.id === businessId);

    if (!business) {
      throw new Error("העסק לא נמצא");
    }

    if (patch.slug && store.businesses.some((item) => item.id !== businessId && item.slug === patch.slug)) {
      throw new Error("הלינק הזה כבר תפוס על ידי עסק אחר");
    }

    Object.assign(business, patch, {
      assistantSettings: normalizeAssistantSettings(patch.assistantSettings ?? business.assistantSettings),
      faqTemplates: normalizeFaqTemplates(patch.faqTemplates ?? business.faqTemplates),
      updatedAt: new Date().toISOString(),
    });
    return business;
  });
}

function startOfWeekKey(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy.toISOString().slice(0, 10);
}

function countSummaryRange(bookings: Booking[], waitlistEntries: WaitlistEntry[], startDate: string, endDate: string, today: string) {
  const inDateRange = (date: string) => date >= startDate && date <= endDate;
  const createdInRange = (createdAt: string) => {
    const date = createdAt.slice(0, 10);
    return date >= startDate && date <= endDate;
  };

  return {
    newBookings: bookings.filter((booking) => createdInRange(booking.createdAt)).length,
    completedBookings: bookings.filter((booking) => booking.status === "completed" && inDateRange(booking.date)).length,
    cancelledBookings: bookings.filter((booking) => booking.status === "cancelled" && inDateRange(booking.date)).length,
    noShows: bookings.filter((booking) => booking.status === "no_show" && inDateRange(booking.date)).length,
    upcomingAppointments: bookings.filter(
      (booking) => booking.date >= today && booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show",
    ).length,
    waitlistCount: waitlistEntries.filter((entry) => entry.status === "waiting").length,
  };
}

export async function getAdminSummary(businessId = "biz_barber") {
  const store = await readStore();
  const business = store.businesses.find((item) => item.id === businessId) ?? store.businesses[0];
  const services = store.services.filter((service) => service.businessId === business.id);
  const bookings = store.bookings.filter((booking) => booking.businessId === business.id);
  const waitlistEntries = store.waitlistEntries.filter((entry) => entry.businessId === business.id);
  const assistantMessages = store.assistantMessages.filter((message) => message.businessId === business.id);
  const activeBookings = bookings.filter(
    (booking) => booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show",
  );
  const serviceCounts = services.map((service) => ({
    service,
    count: bookings.filter((booking) => booking.serviceId === service.id).length,
  }));
  const popular = serviceCounts.sort((a, b) => b.count - a.count)[0]?.service.name ?? "אין עדיין נתונים";
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeekKey(new Date());
  const weekEndDate = new Date(`${weekStart}T12:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  return {
    businesses: store.businesses,
    business,
    services,
    bookings,
    waitlistEntries,
    assistantMessages,
    availabilityRules: store.availabilityRules.filter((rule) => rule.businessId === business.id),
    assistantSummary: {
      daily: countSummaryRange(bookings, waitlistEntries, today, today, today),
      weekly: countSummaryRange(bookings, waitlistEntries, weekStart, weekEnd, today),
    },
    cards: {
      totalBookings: bookings.length,
      upcomingBookings: activeBookings.filter((booking) => booking.date >= today).length,
      popularService: popular,
      publicDemoPages: store.businesses.filter((item) => item.isActive).length,
    },
  };
}
