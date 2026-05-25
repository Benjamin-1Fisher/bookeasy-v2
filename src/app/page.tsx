import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Copy,
  LayoutDashboard,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DemoRequestForm } from "@/components/landing/DemoRequestForm";
import { formatPrice } from "@/lib/format";

const benefits = [
  "פחות הודעות הלוך-חזור",
  "שירותים, מחירים וזמנים פנויים בלינק אחד",
  "מתאים לאינסטגרם, וואטסאפ וטלפון",
  "הזמנות נכנסות בצורה מסודרת",
  "פשוט גם לעסק בלי ידע טכני",
];

const businessExamples = [
  "מספרות וברברים",
  "קוסמטיקה וציפורניים",
  "קליניקות קטנות",
  "מאמנים אישיים",
  "מורים פרטיים",
  "סטודיו לסדנאות ושיעורים",
];

const faq = [
  {
    question: "מה זה BookEasy?",
    answer: "לינק הזמנות חכם שמאפשר ללקוחות לבחור שירות, שעה ולשלוח בקשה מסודרת לעסק.",
  },
  {
    question: "זה מחליף את הוואטסאפ שלי?",
    answer: "לא. זה מוריד את כמות ההודעות המיותרות ומביא אליך הזמנות מסודרות יותר.",
  },
  {
    question: "צריך לבנות אתר?",
    answer: "לא. מקבלים לינק אחד שאפשר לשים בביו, לשלוח בוואטסאפ או לצרף לפרופיל העסקי.",
  },
  {
    question: "הלקוחות צריכים להוריד אפליקציה?",
    answer: "לא. הם נכנסים ללינק ומזמינים ישירות מהטלפון.",
  },
  {
    question: "אפשר לשנות שעות ושירותים?",
    answer: "כן. אפשר לעדכן שירותים, מחירים, זמינות ופרטי עסק מתוך לוח הניהול.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#f8f7f2]">
        <nav className="container-shell flex items-center justify-between py-5">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-[8px] font-black text-foreground">
            <span className="grid size-9 place-items-center rounded-[8px] bg-primary text-white">B</span>
            BookEasy
          </Link>
          <div className="hidden items-center gap-6 text-sm font-bold text-muted md:flex">
            <a href="#how" className="focus-ring rounded-[8px] hover:text-foreground">
              איך זה עובד
            </a>
            <a href="#demo" className="focus-ring rounded-[8px] hover:text-foreground">
              דמו
            </a>
            <a href="#faq" className="focus-ring rounded-[8px] hover:text-foreground">
              שאלות
            </a>
          </div>
          <a
            href="#demo-form"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            קבל דמו
            <ArrowLeft size={16} aria-hidden="true" />
          </a>
        </nav>

        <div className="container-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-primary">
              <Sparkles size={16} aria-hidden="true" />
              פחות הודעות. יותר סדר.
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal text-foreground sm:text-6xl">
              תן ללקוחות להזמין לבד
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              BookEasy מאפשר לעסק שלך להציג שירותים, מחירים וזמנים פנויים — והלקוחות מזמינים דרך לינק אחד.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo-form"
                className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-base font-black text-white transition hover:bg-[#0b5f5a]"
              >
                קבל דמו לעסק שלי
                <ArrowLeft size={18} aria-hidden="true" />
              </a>
              <Link
                href="/b/barber-demo"
                className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-6 py-4 text-base font-black text-foreground transition hover:border-primary"
              >
                צפה בדמו
                <MousePointerClick size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-bold text-foreground sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                ימין לשמאל מלא
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                מובייל קודם
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                דמו מוכן
              </span>
            </div>
          </div>

          <HeroProductPreview />
        </div>
      </section>

      <section className="border-y border-line bg-white py-10">
        <div className="container-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-[8px] border border-line bg-[#fbfaf6] p-4">
              <CheckCircle2 size={20} className="mb-3 text-primary" aria-hidden="true" />
              <p className="font-bold leading-7">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-16" id="how">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-primary">איך זה עובד</p>
          <h2 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">לינק אחד במקום שרשור הודעות</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["מגדירים שירותים", "שם, מחיר, משך וזמינות בסיסית."],
            ["מקבלים לינק", "שמים בביו, שולחים בוואטסאפ או מצרפים לפרופיל."],
            ["הלקוח בוחר לבד", "שירות, תאריך, שעה ופרטים אישיים."],
            ["ההזמנה נכנסת", "מסודרת בלוח הניהול עם סטטוס ברור."],
          ].map(([title, text], index) => (
            <article key={title} className="soft-card rounded-[8px] p-5">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[#e8f3ef] font-black text-primary">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#17343a] py-16 text-white" id="demo">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-[#f4b860]">דמו של דף הזמנות</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">ככה הלקוח רואה את העסק שלך</h2>
            <p className="mt-4 max-w-xl leading-8 text-white/75">
              בלי להסביר כל פעם מה פנוי. הלקוח רואה שירותים, מחירים ושעות, ומשאיר פרטים בצורה נקייה.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="focus-ring rounded-[8px] bg-white px-4 py-3 font-bold text-foreground" href="/b/barber-demo">
                ברבר סטודיו
              </Link>
              <Link className="focus-ring rounded-[8px] bg-white/10 px-4 py-3 font-bold text-white" href="/b/nails-demo">
                נייל סטודיו
              </Link>
              <Link className="focus-ring rounded-[8px] bg-white/10 px-4 py-3 font-bold text-white" href="/b/clinic-demo">
                קליניקת איזון
              </Link>
            </div>
          </div>
          <BookingPreview />
        </div>
      </section>

      <section className="container-shell grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold text-primary">דמו של לוח ניהול</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">פשוט מספיק לבעל עסק עסוק</h2>
          <p className="mt-4 leading-8 text-muted">
            סקירה יומית, הזמנות קרובות, שירותים, זמינות ולינק הזמנות להעתקה. בלי מערכת כבדה ובלי תפריטים מבלבלים.
          </p>
          <Link
            href="/dashboard"
            className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white"
          >
            פתח לוח ניהול
            <LayoutDashboard size={18} aria-hidden="true" />
          </Link>
        </div>
        <DashboardPreview />
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-primary">למי זה מתאים</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">עסקים קטנים שמקבלים הזמנות לפי זמן פנוי</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {businessExamples.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] border border-line bg-[#fbfaf6] p-4 font-bold">
                <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr]" id="faq">
        <div>
          <p className="text-sm font-bold text-primary">שאלות נפוצות</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">מה חשוב לדעת לפני שמתחילים?</h2>
        </div>
        <div className="grid gap-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-[8px] border border-line bg-white p-5">
              <summary className="cursor-pointer text-lg font-black">{item.question}</summary>
              <p className="mt-3 leading-7 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        <DemoRequestForm />
      </section>

      <footer className="border-t border-line bg-white py-8">
        <div className="container-shell flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>BookEasy הוא MVP דמו חדש, דמיוני ונקי להצגה לבעלי עסקים.</p>
          <div className="flex flex-wrap gap-4 font-bold text-foreground">
            <Link href="/terms">תנאי שימוש</Link>
            <Link href="/privacy">פרטיות</Link>
            <Link href="/copyright">זכויות יוצרים</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroProductPreview() {
  return (
    <div className="soft-card rounded-[8px] bg-white p-4">
      <div className="rounded-[8px] bg-[#17343a] p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/65">ברבר סטודיו</p>
            <h2 className="text-2xl font-black">הזמנת תור</h2>
          </div>
          <span className="rounded-full bg-[#f4b860] px-3 py-1 text-xs font-black text-[#17343a]">פתוח היום</span>
        </div>
        <div className="mt-5 grid gap-3">
          {[
            ["תספורת + זקן", 135, "75 דקות"],
            ["תספורת גבר", 90, "45 דקות"],
            ["עיצוב זקן", 55, "30 דקות"],
          ].map(([name, price, time]) => (
            <div key={name} className="rounded-[8px] bg-white p-4 text-foreground">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">{name}</p>
                  <p className="mt-1 text-sm text-muted">{time}</p>
                </div>
                <p className="font-black text-primary">{formatPrice(Number(price))}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-[8px] bg-white/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
            <Clock3 size={16} aria-hidden="true" />
            שעות פנויות היום
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["10:30", "11:00", "14:30", "16:00", "17:30", "18:00"].map((time) => (
              <span key={time} className="ltr rounded-[8px] bg-white px-3 py-2 text-center font-black text-foreground">
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingPreview() {
  return (
    <div className="rounded-[8px] bg-white p-4 text-foreground shadow-2xl">
      <div className="rounded-[8px] border border-line p-4">
        <div className="flex items-center gap-3">
          <CalendarCheck size={22} className="text-primary" aria-hidden="true" />
          <div>
            <p className="font-black">בחירת שעה</p>
            <p className="text-sm text-muted">יום שלישי, 26 במאי</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"].map((time, index) => (
            <span
              key={time}
              className={`ltr rounded-[8px] px-3 py-2 text-center font-black ${
                index === 1 ? "bg-primary text-white" : "bg-[#f1f5f3] text-foreground"
              }`}
            >
              {time}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-[8px] bg-[#f8f7f2] p-4">
        <p className="font-black">סיכום הזמנה</p>
        <div className="mt-3 grid gap-2 text-sm text-muted">
          <span>שירות: תספורת גבר</span>
          <span>משך: 45 דקות</span>
          <span>מחיר: ₪90</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="soft-card rounded-[8px] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["הזמנות היום", "8"],
          ["קרובות", "14"],
          ["פופולרי", "תספורת"],
          ["בקשות דמו", "3"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[8px] border border-line bg-[#fbfaf6] p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[8px] border border-line">
        {["10:00 אורי לוי - תספורת", "12:00 דניאל כהן - תספורת + זקן", "16:00 יובל ישראלי - עיצוב זקן"].map(
          (row) => (
            <div key={row} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
              <span className="font-bold">{row}</span>
              <span className="rounded-full bg-[#e8f3ef] px-3 py-1 text-xs font-black text-primary">מסודר</span>
            </div>
          ),
        )}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-primary px-4 py-3 font-black text-white">
        <Copy size={18} aria-hidden="true" />
        העתק לינק הזמנות
      </div>
    </div>
  );
}
