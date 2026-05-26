export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type DemoRequestStatus = "new" | "contacted" | "closed";

export type AvailabilityExceptionType = "closed" | "extra_open";

export type BusinessCategory = "barber" | "nails" | "clinic" | "fitness" | "other";

export type Language = "he" | "en";

export type AnalyticsEventName =
  | "setup_started"
  | "setup_preview_generated"
  | "setup_saved"
  | "booking_page_shared";

export type Business = {
  id: string;
  slug: string;
  name: string;
  businessIcon: string;
  profileImage?: string;
  category: BusinessCategory;
  description: string;
  shortDescription: string;
  phone: string;
  whatsapp: string;
  address: string;
  timezone: string;
  coverTitle: string;
  coverSubtitle: string;
  coverTone: "teal" | "rose" | "blue";
  defaultLanguage: Language;
  supportedLanguages: Language[];
  showLanguageSwitcher: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityRule = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AvailabilityException = {
  id: string;
  businessId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: AvailabilityExceptionType;
};

export type Booking = {
  id: string;
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

export type DemoRequest = {
  id: string;
  ownerName: string;
  businessType: string;
  phone: string;
  businessLink?: string;
  message?: string;
  status: DemoRequestStatus;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "business_owner";
  businessId?: string;
  isActive: boolean;
};

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  businessId?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
};

export type BookeasyStore = {
  businesses: Business[];
  services: Service[];
  availabilityRules: AvailabilityRule[];
  availabilityExceptions: AvailabilityException[];
  bookings: Booking[];
  demoRequests: DemoRequest[];
  users: User[];
  analyticsEvents: AnalyticsEvent[];
};

export type BusinessBundle = {
  business: Business;
  services: Service[];
  availabilityRules: AvailabilityRule[];
  bookings: Booking[];
};

export type Slot = {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
};
