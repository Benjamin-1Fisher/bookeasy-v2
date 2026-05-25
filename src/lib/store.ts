import { promises as fs } from "node:fs";
import path from "node:path";
import { seedStore } from "@/lib/seed-data";
import type {
  AvailabilityRule,
  Booking,
  BookingStatus,
  BookeasyStore,
  Business,
  BusinessBundle,
  DemoRequest,
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
    const seeded = cloneStore(seedStore);
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
      status: "pending",
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
    business,
    services,
    bookings,
    availabilityRules: store.availabilityRules.filter((rule) => rule.businessId === business.id),
    demoRequests: store.demoRequests,
    cards: {
      totalBookings: bookings.length,
      upcomingBookings: activeBookings.filter((booking) => booking.date >= today).length,
      popularService: popular,
      newDemoRequests: store.demoRequests.filter((request) => request.status === "new").length,
    },
  };
}
