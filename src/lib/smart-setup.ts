import type { Business, BusinessCategory, Language } from "@/lib/types";

export type SmartSetupServiceDraft = {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
};

export type SmartSetupRuleDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type SmartSetupDraft = {
  ownerName: string;
  businessName: string;
  businessIcon: string;
  profileImage: string;
  category: BusinessCategory;
  phone: string;
  whatsapp: string;
  address: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverTitle: string;
  coverSubtitle: string;
  coverTone: Business["coverTone"];
  defaultLanguage: Language;
  supportedLanguages: Language[];
  showLanguageSwitcher: boolean;
  services: SmartSetupServiceDraft[];
  availabilityRules: SmartSetupRuleDraft[];
};

const categoryDefaults: Record<
  BusinessCategory,
  { heName: string; enName: string; iconTone: Business["coverTone"]; duration: number; price: number }
> = {
  barber: { heName: "ברבר סטודיו", enName: "Barber Studio", iconTone: "teal", duration: 45, price: 90 },
  nails: { heName: "סטודיו ציפורניים", enName: "Nail Studio", iconTone: "rose", duration: 75, price: 130 },
  clinic: { heName: "קליניקה", enName: "Clinic", iconTone: "blue", duration: 60, price: 220 },
  fitness: { heName: "אימון אישי", enName: "Personal Training", iconTone: "teal", duration: 60, price: 220 },
  other: { heName: "העסק שלי", enName: "My Business", iconTone: "blue", duration: 45, price: 120 },
};

const dayKeywords: Array<{ day: number; words: string[] }> = [
  { day: 0, words: ["ראשון", "א", "sunday", "sun"] },
  { day: 1, words: ["שני", "ב", "monday", "mon"] },
  { day: 2, words: ["שלישי", "ג", "tuesday", "tue"] },
  { day: 3, words: ["רביעי", "ד", "wednesday", "wed"] },
  { day: 4, words: ["חמישי", "ה", "thursday", "thu"] },
  { day: 5, words: ["שישי", "ו", "friday", "fri"] },
  { day: 6, words: ["שבת", "saturday", "sat"] },
];

function includesHebrew(text: string) {
  return /[\u0590-\u05ff]/.test(text);
}

export function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function detectCategory(text: string): BusinessCategory {
  const normalized = text.toLowerCase();
  if (/barber|hair|haircut|מספר|ספר|תספורת|זקן/.test(normalized)) {
    return "barber";
  }
  if (/nail|gel|לק|ציפור|מניקור|פדיקור|קוסמט/.test(normalized)) {
    return "nails";
  }
  if (/clinic|physio|therapy|doctor|קלינ|טיפול|ייעוץ|פיזיו|רופא/.test(normalized)) {
    return "clinic";
  }
  if (/trainer|training|fitness|coach|אימון|מאמן|כושר/.test(normalized)) {
    return "fitness";
  }

  return "other";
}

function detectPhone(text: string) {
  return text.match(/(?:\+?972|0)[0-9\-\s]{8,14}/)?.[0]?.replace(/\s+/g, "-") ?? "";
}

function detectBusinessName(text: string, category: BusinessCategory, language: Language) {
  const firstLine = text
    .split(/\n|\.|!|\?/)
    .map((line) => line.trim())
    .find(Boolean);
  const ownerMatch =
    text.match(/(?:אני|קוראים לי)\s+([\u0590-\u05ffA-Za-z ]{2,30})/) ??
    text.match(/(?:i am|i'm|my name is)\s+([A-Za-z ]{2,30})/i);
  const ownerName = ownerMatch?.[1]?.trim().replace(/[,.;:].*$/, "") ?? "";
  const runMatch = text.match(/(?:i run|i own|my business is)\s+([A-Za-z0-9' ]{2,46}?)(?:\s+in|\.|,)/i)?.[1]?.trim();
  const latinName = text.match(/([A-Z][A-Za-z0-9' ]{2,36}(?:Studio|Clinic|Nails|Barber|Beauty|Fitness))/)?.[1]?.trim();
  const defaultName = language === "he" ? categoryDefaults[category].heName : categoryDefaults[category].enName;

  if (runMatch) {
    return { businessName: runMatch, ownerName };
  }

  if (latinName) {
    return { businessName: latinName, ownerName };
  }

  if (firstLine && firstLine.length <= 46 && !/\d{2,}/.test(firstLine)) {
    return { businessName: firstLine.replace(/^אני\s+/, "").trim(), ownerName };
  }

  return { businessName: ownerName ? `${ownerName} ${defaultName}` : defaultName, ownerName };
}

function parseDuration(text: string, fallback: number) {
  const normalized = text.toLowerCase();
  const explicit =
    normalized.match(/(\d{2,3})\s*(?:דק|דקות|min|minutes)/)?.[1] ??
    normalized.match(/(?:משך|takes?)\s*(\d{2,3})/)?.[1];

  if (explicit) {
    return Number(explicit);
  }

  const hourNumber = normalized.match(/(\d+(?:\.\d+)?)\s*(?:שעה|שעות|hour|hours)/)?.[1];
  if (hourNumber) {
    return Math.max(15, Math.round(Number(hourNumber) * 60));
  }

  if (/שעתיים|two hours/.test(normalized)) {
    return 120;
  }
  if (/שעה וחצי|hour and a half|90/.test(normalized)) {
    return 90;
  }
  if (/שעה ורבע|75/.test(normalized)) {
    return 75;
  }
  if (/חצי שעה|half an hour/.test(normalized)) {
    return 30;
  }

  return fallback;
}

function cleanupServiceName(value: string) {
  const lastSentence = value.split(".").pop() ?? value;
  return lastSentence
    .replace(/(?:מחיר|price|cost|עולה|\bis\b|₪|nis|שקל|shekel).*/i, "")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .replace(/^(ו|and)\s+/i, "")
    .trim();
}

function parseServices(text: string, category: BusinessCategory, language: Language): SmartSetupServiceDraft[] {
  const fallback = categoryDefaults[category];
  const chunks = text
    .split(/\n|;|•|\*/)
    .flatMap((line) => line.split(/,(?=\s*[\u0590-\u05ffA-Za-z])/))
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const services = chunks
    .map((chunk) => {
      const priceMatch = chunk.match(/(?:₪\s*)?(\d{2,5})(?:\s*(?:₪|שח|ש"ח|שקל|nis|shekels?))?/i);
      if (!priceMatch) {
        return null;
      }

      const beforePrice = chunk.slice(0, priceMatch.index).trim();
      const name = cleanupServiceName(beforePrice || chunk.slice(0, priceMatch.index));
      if (!name || name.length < 2 || /פתוח|שעות|open|hours|whatsapp|טלפון/i.test(name)) {
        return null;
      }

      return {
        name: name.slice(0, 80),
        description:
          language === "he"
            ? "שירות שנוצר מטקסט ההיכרות שלך. אפשר לערוך את התיאור לפני פרסום."
            : "Created from your setup text. You can edit this description before publishing.",
        price: Number(priceMatch[1]),
        durationMinutes: parseDuration(chunk, fallback.duration),
        isActive: true,
      };
    })
    .filter((service): service is SmartSetupServiceDraft => Boolean(service));

  const unique = services.filter((service, index, list) => list.findIndex((item) => item.name === service.name) === index);

  if (unique.length) {
    return unique.slice(0, 8);
  }

  return [
    {
      name: language === "he" ? "שירות ראשון" : "First service",
      description: language === "he" ? "אפשר לערוך את השירות לפני פרסום העמוד." : "Edit this service before publishing.",
      price: fallback.price,
      durationMinutes: fallback.duration,
      isActive: true,
    },
  ];
}

function normalizeTime(value: string) {
  const [rawHours, rawMinutes = "00"] = value.split(":");
  const hours = rawHours.padStart(2, "0");
  const minutes = rawMinutes.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTimeRanges(text: string) {
  return Array.from(text.matchAll(/(\d{1,2}(?::\d{2})?)\s*(?:-|עד|to|–)\s*(\d{1,2}(?::\d{2})?)/gi)).map((match) => ({
    startTime: normalizeTime(match[1]),
    endTime: normalizeTime(match[2]),
    index: match.index ?? 0,
  }));
}

function parseAvailability(text: string): SmartSetupRuleDraft[] {
  const ranges = parseTimeRanges(text);
  const defaultRange = ranges[0] ?? { startTime: "09:00", endTime: "17:00", index: 0 };
  const fridayRange = ranges[1] ?? { startTime: "09:00", endTime: "13:00", index: 0 };
  const rules: SmartSetupRuleDraft[] = [];

  const mentionsFriday = /שישי|friday|fri/i.test(text);
  const mentionsSaturday = /שבת|saturday|sat/i.test(text);
  const mentionedDays = dayKeywords
    .filter((item) => item.words.some((word) => new RegExp(`(^|\\s|[-,])${word}($|\\s|[-,])`, "i").test(text)))
    .map((item) => item.day);

  const activeDays = mentionedDays.length ? mentionedDays : [0, 1, 2, 3, 4];
  for (const dayOfWeek of [0, 1, 2, 3, 4, 5, 6]) {
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    const isActive = activeDays.includes(dayOfWeek) || (isFriday && mentionsFriday) || (isSaturday && mentionsSaturday);
    const range = isFriday && mentionsFriday ? fridayRange : defaultRange;

    rules.push({
      dayOfWeek,
      startTime: range.startTime,
      endTime: range.endTime,
      isActive,
    });
  }

  return rules;
}

function detectAddress(text: string) {
  const addressMatch =
    text.match(/(?:כתובת|בכתובת|address)\s*[:\-]?\s*([^\n.]{4,90})/i) ??
    text.match(/(?:בתל אביב|ברמת גן|בחיפה|בירושלים|בבאר שבע|in tel aviv|in haifa|in jerusalem)[^\n.]*/i);
  return addressMatch?.[1]?.trim() ?? addressMatch?.[0]?.trim() ?? "";
}

export function parseSmartSetupText(text: string): SmartSetupDraft {
  const language: Language = includesHebrew(text) ? "he" : "en";
  const category = detectCategory(text);
  const defaults = categoryDefaults[category];
  const { businessName, ownerName } = detectBusinessName(text, category, language);
  const phone = detectPhone(text);
  const services = parseServices(text, category, language);
  const address = detectAddress(text);
  const slug = cleanSlug(businessName) || `${category}-${Date.now().toString(36).slice(-5)}`;

  return {
    ownerName: ownerName || (language === "he" ? "בעל העסק" : "Business owner"),
    businessName,
    businessIcon:
      category === "barber"
        ? "scissors"
        : category === "nails"
          ? "sparkles"
          : category === "clinic"
            ? "heart-pulse"
            : category === "fitness"
              ? "dumbbell"
              : "store",
    profileImage: "",
    category,
    phone,
    whatsapp: phone,
    address,
    slug,
    description:
      language === "he"
        ? `${businessName} מאפשר ללקוחות לבחור שירות, לראות זמינות ולקבוע תור בלינק אחד.`
        : `${businessName} lets customers choose a service, see availability, and book instantly through one link.`,
    shortDescription:
      language === "he"
        ? "עמוד הזמנות חכם לשירותים, מחירים ושעות פנויות."
        : "A smart booking page for services, prices, and available times.",
    coverTitle: language === "he" ? `הזמנת תור ל${businessName}` : `Book with ${businessName}`,
    coverSubtitle:
      language === "he"
        ? "בחרו שירות, שעה ופרטים בכמה צעדים קצרים"
        : "Choose a service, time, and details in a few short steps",
    coverTone: defaults.iconTone,
    defaultLanguage: language,
    supportedLanguages: language === "he" ? ["he", "en"] : ["en", "he"],
    showLanguageSwitcher: true,
    services,
    availabilityRules: parseAvailability(text),
  };
}

export function buildWhatsappShareMessage(draft: SmartSetupDraft, bookingUrl?: string) {
  const serviceList = draft.services.map((service) => `${service.name} - ₪${service.price}`).join(", ");
  const linkLine = bookingUrl ? `\n${bookingUrl}` : "";

  if (draft.defaultLanguage === "he") {
    return `היי, אפשר להזמין תור ל${draft.businessName} דרך הלינק החדש שלנו. בוחרים שירות, שעה ופרטים בכמה לחיצות.${linkLine}\nשירותים לדוגמה: ${serviceList}`;
  }

  return `Hi, you can now book ${draft.businessName} through our new booking link. Choose a service, time, and details in a few taps.${linkLine}\nServices: ${serviceList}`;
}

export function buildInstagramBioText(draft: SmartSetupDraft, bookingUrl?: string) {
  const link = bookingUrl ?? "booking link";
  if (draft.defaultLanguage === "he") {
    return `${draft.businessName} | הזמנות בלינק אחד | ${link}`;
  }

  return `${draft.businessName} | Book in one smart link | ${link}`;
}
