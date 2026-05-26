import { promises as fs } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";
import { seedStore } from "@/lib/seed-data";
import type { SmartSetupDraft } from "@/lib/smart-setup";
import type {
  AvailabilityRule,
  Booking,
  BookingStatus,
  BookeasyStore,
  Business,
  BusinessBundle,
  BusinessCategory,
  DemoRequest,
  AnalyticsEventName,
  Language,
  Service,
  Slot,
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

const demoLanguageDefaults: Record<string, Language> = {
  "barber-demo": "he",
  "nails-demo": "he",
  "clinic-demo": "en",
};

const windows1255Decoder = new TextDecoder("windows-1255");
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
const windows1255BytesByCharacter = new Map<string, number>();

for (let byte = 0; byte < 256; byte += 1) {
  const character = windows1255Decoder.decode(Uint8Array.of(byte));
  if (!windows1255BytesByCharacter.has(character)) {
    windows1255BytesByCharacter.set(character, byte);
  }
}

function countMojibakeMarkers(value: string) {
  return value.match(/׳/g)?.length ?? 0;
}

function repairHebrewMojibake(value: string) {
  if (countMojibakeMarkers(value) < 2) {
    return value;
  }

  const bytes: number[] = [];
  for (const character of value) {
    const byte = windows1255BytesByCharacter.get(character);
    if (byte === undefined) {
      return value;
    }
    bytes.push(byte);
  }

  try {
    const repaired = utf8Decoder.decode(Uint8Array.from(bytes));
    if (countMojibakeMarkers(repaired) < countMojibakeMarkers(value) && /[\u0590-\u05ff]/.test(repaired)) {
      return repaired;
    }
  } catch {
    return value;
  }

  return value;
}

function repairMojibakeValue<T>(value: T): T {
  if (typeof value === "string") {
    return repairHebrewMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibakeValue(item)) as T;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      (value as Record<string, unknown>)[key] = repairMojibakeValue(item);
    }
  }

  return value;
}

function normalizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "he";
}

function normalizeSupportedLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) {
    return ["he", "en"];
  }

  const languages = value.map(normalizeLanguage).filter((language, index, list) => list.indexOf(language) === index);
  return languages.length ? languages : ["he", "en"];
}

function normalizeStore(store: BookeasyStore): BookeasyStore {
  repairMojibakeValue(store);
  store.analyticsEvents ??= [];

  for (const business of store.businesses) {
    business.defaultLanguage = normalizeLanguage(business.defaultLanguage ?? demoLanguageDefaults[business.slug]);
    business.supportedLanguages = normalizeSupportedLanguages(business.supportedLanguages);
    business.businessIcon ||= categoryDefaults[business.category]?.icon ?? "store";
    business.profileImage ??= "";
    if (typeof business.showLanguageSwitcher !== "boolean") {
      business.showLanguageSwitcher = true;
    }

    if (business.slug === "clinic-demo" && business.defaultLanguage === "en") {
      business.name = "Balance Clinic";
      business.description =
        "A small demo clinic for consultation and personal care appointments. Customers choose a service, available time, and contact details in one guided flow.";
      business.shortDescription = "Consultation and personal care appointments through one booking link.";
      business.address = "4 Health Avenue, Givatayim";
      business.coverTitle = "Book a consultation or personal session";
      business.coverSubtitle = "Clear services, prices, and available times in one smart link";
    }
  }

  const englishClinicServices: Record<string, Pick<Service, "name" | "description">> = {
    srv_clinic_intro: {
      name: "Intro consultation",
      description: "A first meeting for questions, intake, and choosing the right direction.",
    },
    srv_clinic_personal: {
      name: "Personal treatment",
      description: "A focused personal session based on the customer's needs.",
    },
    srv_clinic_training: {
      name: "Personal coaching",
      description: "A practical session for habits, focus, and routine.",
    },
    srv_clinic_package: {
      name: "Intro package",
      description: "Two intro sessions at a special package price.",
    },
  };

  for (const service of store.services) {
    const clinicCopy = englishClinicServices[service.id];
    if (clinicCopy) {
      service.name = clinicCopy.name;
      service.description = clinicCopy.description;
    }
  }

  return store;
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
  const parsed = JSON.parse(content) as BookeasyStore;

  if (isEmptyStore(parsed)) {
    const seeded = normalizeStore(cloneStore(seedStore));
    await writeStore(seeded);
    return seeded;
  }

  return normalizeStore(parsed);
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

  return createSlots(store, businessId, service, date);
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

    if (booking.status === "cancelled" || booking.status === "completed") {
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

export async function trackEvent(input: {
  name: AnalyticsEventName;
  businessId?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  return updateStore((store) => {
    const event = {
      id: makeId("evt"),
      name: input.name,
      businessId: input.businessId,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

    store.analyticsEvents.unshift(event);
    store.analyticsEvents = store.analyticsEvents.slice(0, 500);
    return event;
  });
}

const categoryDefaults: Record<BusinessCategory, { icon: string; coverTone: Business["coverTone"] }> = {
  barber: { icon: "scissors", coverTone: "teal" },
  nails: { icon: "sparkles", coverTone: "rose" },
  clinic: { icon: "heart-pulse", coverTone: "blue" },
  fitness: { icon: "dumbbell", coverTone: "teal" },
  other: { icon: "store", coverTone: "blue" },
};

export async function createBusinessPage(input: {
  ownerName: string;
  businessName: string;
  category: BusinessCategory;
  phone: string;
  whatsapp?: string;
  address?: string;
  slug: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  defaultLanguage?: Language;
  supportedLanguages?: Language[];
  showLanguageSwitcher?: boolean;
}) {
  return updateStore((store) => {
    if (store.businesses.some((business) => business.slug === input.slug)) {
      throw new Error("הלינק הזה כבר תפוס. כדאי לבחור שם אחר לעמוד העסק");
    }

    const timestamp = new Date().toISOString();
    const businessId = makeId("biz");
    const defaults = categoryDefaults[input.category];
    const business: Business = {
      id: businessId,
      slug: input.slug,
      name: input.businessName,
      businessIcon: defaults.icon,
      profileImage: "",
      category: input.category,
      description: `כאן קובעים תור ל${input.businessName}. בוחרים שירות, תאריך ושעה והתור נשמר מיד.`,
      shortDescription: "קביעת תור דרך לינק אחד ברור.",
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      address: input.address || "",
      timezone: "Asia/Jerusalem",
      coverTitle: `קביעת תור ל${input.businessName}`,
      coverSubtitle: "בחרו שירות, תאריך ושעה פנויה בכמה לחיצות",
      coverTone: defaults.coverTone,
      defaultLanguage: normalizeLanguage(input.defaultLanguage),
      supportedLanguages: normalizeSupportedLanguages(input.supportedLanguages),
      showLanguageSwitcher: input.showLanguageSwitcher ?? true,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const service: Service = {
      id: makeId("srv"),
      businessId,
      name: input.serviceName,
      description: "השירות הראשון בעמוד. אפשר לערוך שם, מחיר ומשך מתוך לוח הניהול.",
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
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    }));

    store.businesses.unshift(business);
    store.services.unshift(service);
    store.availabilityRules.push(...availabilityRules);
    store.users.unshift({
      id: makeId("user"),
      name: input.ownerName,
      email: `${input.slug}@bookeasy.local`,
      role: "business_owner",
      businessId,
      isActive: true,
    });

    return { business, service, availabilityRules };
  });
}

export async function createSmartSetupBusinessPage(input: SmartSetupDraft) {
  return updateStore((store) => {
    if (store.businesses.some((business) => business.slug === input.slug)) {
      throw new Error("This booking page link is already taken. Choose another link.");
    }

    const timestamp = new Date().toISOString();
    const businessId = makeId("biz");
    const business: Business = {
      id: businessId,
      slug: input.slug,
      name: input.businessName,
      businessIcon: input.businessIcon || categoryDefaults[input.category].icon,
      profileImage: input.profileImage || "",
      category: input.category,
      description: input.description,
      shortDescription: input.shortDescription,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      address: input.address,
      timezone: "Asia/Jerusalem",
      coverTitle: input.coverTitle,
      coverSubtitle: input.coverSubtitle,
      coverTone: input.coverTone,
      defaultLanguage: normalizeLanguage(input.defaultLanguage),
      supportedLanguages: normalizeSupportedLanguages(input.supportedLanguages),
      showLanguageSwitcher: input.showLanguageSwitcher,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const services: Service[] = input.services.map((service) => ({
      id: makeId("srv"),
      businessId,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const availabilityRules: AvailabilityRule[] = input.availabilityRules.map((rule) => ({
      id: makeId("av"),
      businessId,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      isActive: rule.isActive,
    }));

    store.businesses.unshift(business);
    store.services.unshift(...services);
    store.availabilityRules.push(...availabilityRules);
    store.users.unshift({
      id: makeId("user"),
      name: input.ownerName,
      email: `${input.slug}@bookeasy.local`,
      role: "business_owner",
      businessId,
      isActive: true,
    });

    return { business, services, availabilityRules };
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
    return booking;
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
      (booking) => booking.serviceId === id && booking.status !== "cancelled" && booking.status !== "completed",
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

export async function patchBusiness(businessId: string, patch: Partial<Business>) {
  return updateStore((store) => {
    const business = store.businesses.find((item) => item.id === businessId);

    if (!business) {
      throw new Error("העסק לא נמצא");
    }

    if (patch.slug && store.businesses.some((item) => item.id !== businessId && item.slug === patch.slug)) {
      throw new Error("הלינק הזה כבר תפוס על ידי עסק אחר");
    }

    Object.assign(business, patch, { updatedAt: new Date().toISOString() });
    return business;
  });
}

export async function getAdminSummary(businessId = "biz_barber") {
  const store = await readStore();
  const business = store.businesses.find((item) => item.id === businessId) ?? store.businesses[0];
  const services = store.services.filter((service) => service.businessId === business.id);
  const bookings = store.bookings.filter((booking) => booking.businessId === business.id);
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const serviceCounts = services.map((service) => ({
    service,
    count: bookings.filter((booking) => booking.serviceId === service.id).length,
  }));
  const popular = serviceCounts.sort((a, b) => b.count - a.count)[0]?.service.name ?? "אין עדיין נתונים";
  const today = new Date().toISOString().slice(0, 10);

  return {
    businesses: store.businesses,
    business,
    services,
    bookings,
    availabilityRules: store.availabilityRules.filter((rule) => rule.businessId === business.id),
    demoRequests: store.demoRequests,
    cards: {
      totalBookings: bookings.length,
      upcomingBookings: activeBookings.filter((booking) => booking.date >= today).length,
      popularService: popular,
      totalBusinesses: store.businesses.filter((item) => item.isActive).length,
    },
  };
}
