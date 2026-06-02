export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type DemoRequestStatus = "new" | "contacted" | "closed";

export type AvailabilityExceptionType = "closed" | "extra_open";

export type BusinessCategory = "barber" | "nails" | "clinic" | "fitness" | "other";

export type AssistantSettings = {
  confirmationEnabled: boolean;
  remindersEnabled: boolean;
  reminder24hEnabled: boolean;
  reminder3hEnabled: boolean;
  reminderTemplate: string;
  cancellationFollowUpEnabled: boolean;
  cancellationFollowUpTemplate: string;
  noShowFollowUpEnabled: boolean;
  noShowFollowUpTemplate: string;
  waitlistEnabled: boolean;
  waitlistMessageTemplate: string;
  dailySummaryEnabled: boolean;
  weeklySummaryEnabled: boolean;
};

export type FaqTemplates = {
  prices: string;
  location: string;
  openingHours: string;
  cancellationPolicy: string;
  reschedule: string;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  businessIcon: string;
  logoUrl?: string;
  category: BusinessCategory;
  description: string;
  shortDescription: string;
  phone: string;
  whatsapp: string;
  address: string;
  timezone: string;
  bookingWindowDays: number;
  coverTitle: string;
  coverSubtitle: string;
  coverImageUrl?: string;
  coverTone: "teal" | "rose" | "blue";
  assistantSettings: AssistantSettings;
  faqTemplates: FaqTemplates;
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

export type WaitlistStatus = "waiting" | "contacted" | "closed";

export type WaitlistEntry = {
  id: string;
  businessId: string;
  serviceId?: string;
  customerName: string;
  customerPhone: string;
  preferredDate?: string;
  notes?: string;
  status: WaitlistStatus;
  createdAt: string;
  updatedAt: string;
};

export type AssistantMessageType = "confirmation" | "reminder_24h" | "reminder_3h" | "cancellation" | "no_show" | "waitlist";

export type AssistantMessageStatus = "ready" | "scheduled" | "sent";

export type AssistantMessage = {
  id: string;
  businessId: string;
  bookingId?: string;
  waitlistEntryId?: string;
  type: AssistantMessageType;
  recipientName: string;
  recipientPhone: string;
  body: string;
  status: AssistantMessageStatus;
  scheduledFor?: string;
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

export type BookeasyStore = {
  businesses: Business[];
  services: Service[];
  availabilityRules: AvailabilityRule[];
  availabilityExceptions: AvailabilityException[];
  bookings: Booking[];
  waitlistEntries: WaitlistEntry[];
  assistantMessages: AssistantMessage[];
  demoRequests: DemoRequest[];
  users: User[];
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
