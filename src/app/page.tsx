import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Copy,
  LayoutDashboard,
  Link2,
  MessageCircle,
  MousePointerClick,
  Palette,
  Sparkles,
  Smartphone,
  WandSparkles,
} from "lucide-react";
import { DemoRequestForm } from "@/components/landing/DemoRequestForm";
import { BusinessIcon } from "@/components/ui/BusinessIcon";
import { formatPrice } from "@/lib/format";
import { launchPlan } from "@/lib/pricing";

const benefits = [
  {
    title: "פחות הודעות",
    text: "הלקוח רואה שירותים, מחירים וזמנים פנויים בלי לשאול שוב ושוב מה אפשרי.",
    Icon: MessageCircle,
  },
  {
    title: "לינק אחד ברור",
    text: "מתאים לביו באינסטגרם, לשיחה בוואטסאפ או לכל מקום שבו לקוחות מגיעים אליך.",
    Icon: Link2,
  },
  {
    title: "הזמנות מסודרות",
    text: "כל הזמנה נכנסת עם שירות, שעה, טלפון וסטטוס, במקום להיעלם בתוך צ'אטים.",
    Icon: CalendarCheck,
  },
  {
    title: "דף עסק ניתן לעריכה",
    text: "שם, אייקון, תיאור, צבעים, כתובת, וואטסאפ, שירותים וזמינות מתוך לוח ניהול פשוט.",
    Icon: Palette,
  },
];

const steps = [
  { title: "מגדירים את העסק", text: "שם, אייקון, תיאור, שירותים, מחירים וזמינות.", Icon: WandSparkles },
  { title: "מקבלים לינק", text: "שמים בביו, שולחים בוואטסאפ או מוסיפים לפרופיל העסק.", Icon: Link2 },
  { title: "הלקוח בוחר לבד", text: "שירות, תאריך, שעה ופרטים אישיים במובייל.", Icon: Smartphone },
  { title: "הכול נכנס מסודר", text: "ההזמנה מופיעה בלוח הניהול עם סטטוס ברור.", Icon: LayoutDashboard },
];

const businessExamples = [
  ["מספרות וברברים", "scissors"],
  ["קוסמטיקה וציפורניים", "sparkles"],
  ["קליניקות קטנות", "heart-pulse"],
  ["מאמנים אישיים", "dumbbell"],
  ["סטודיו לשיעורים", "wand"],
  ["עסק קטן לפי תורים", "store"],
];

const faq = [
  {
    question: "מה זה BookEasy?",
    answer: "לינק הזמנות חכם שמאפשר ללקוחות לבחור שירות, שעה ולשלוח בקשה מסודרת לעסק.",
  },
  {
    question: "זה מחליף את הוואטסאפ שלי?",
    answer: "לא. זה מוריד הודעות מיותרות ומביא אליך הזמנות מסודרות יותר.",
  },
  {
    question: "צריך לבנות אתר?",
    answer: "לא. מקבלים לינק אחד שאפשר לשים בביו, לשלוח בוואטסאפ או לצרף לפרופיל העסקי.",
  },
  {
    question: "אפשר לערוך את עמוד העסק?",
    answer: "כן. בלוח הניהול אפשר לערוך שם, אייקון, תיאור, צבע, טלפון, וואטסאפ, כתובת, שירותים וזמינות.",
  },
  {
    question: "מה המשמעות של מחיר ההשקה?",
    answer: `המנוי עולה כרגע ${launchPlan.priceLabel} ${launchPlan.periodLabel}. מי שמצטרף במחיר ההשקה שומר עליו למשך ${launchPlan.priceLockYears} שנים.`,
  },
];

export default function Home() {
  return (
    <main>
      <section className="elegant-gradient relative overflow-hidden">
        <nav className="container-shell flex items-center justify-between py-5">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-[8px] font-extrabold text-foreground">
            <span className="grid size-9 place-items-center rounded-[8px] bg-primary text-white">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            BookEasy
          </Link>
          <div className="hidden items-center gap-6 text-sm font-bold text-muted md:flex">
            <a href="#how" className="focus-ring rounded-[8px] hover:text-foreground">
              איך זה עובד
            </a>
            <a href="#demo" className="focus-ring rounded-[8px] hover:text-foreground">
              דמו
            </a>
            <a href="#pricing" className="focus-ring rounded-[8px] hover:text-foreground">
              מחיר
            </a>
            <a href="#faq" className="focus-ring rounded-[8px] hover:text-foreground">
              שאלות
            </a>
          </div>
          <a
            href="#demo-form"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm"
          >
            קבל דמו
            <ArrowLeft size={16} aria-hidden="true" />
          </a>
        </nav>

        <div className="container-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:py-14">
          <div>
            <div className="gold-chip mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold">
              <BadgeDollarSign size={16} aria-hidden="true" />
              מחיר השקה: {launchPlan.priceLabel} {launchPlan.periodLabel}, נשמר ל-5 שנים
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-foreground sm:text-5xl">
              תן ללקוחות להזמין לבד
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              BookEasy מאפשר לעסק שלך להציג שירותים, מחירים וזמנים פנויים, והלקוחות מזמינים דרך לינק אחד.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo-form"
                className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-primary-strong"
              >
                קבל דמו לעסק שלי
                <ArrowLeft size={18} aria-hidden="true" />
              </a>
              <Link
                href="/b/nails-demo"
                className="focus-ring inline-flex min-h-13 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-6 py-4 text-base font-extrabold text-foreground transition hover:border-primary"
              >
                צפה בדמו
                <MousePointerClick size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-bold text-foreground sm:grid-cols-3">
              {["RTL מלא", "מותאם למובייל", "עריכת עמוד עסק"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroProductPreview />
        </div>
      </section>

      <section className="border-y border-line bg-white py-12">
        <div className="container-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, text, Icon }) => (
            <article key={title} className="quiet-card rounded-[8px] p-5">
              <span className="icon-tile size-11">
                <Icon size={21} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
              <p className="mt-2 leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell py-16" id="how">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold text-primary">איך זה עובד</p>
          <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">לינק אחד במקום שרשור הודעות</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(({ title, text, Icon }, index) => (
            <article key={title} className="soft-card rounded-[8px] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="icon-tile size-11">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold text-accent">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 leading-7 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#0e2b30] py-16 text-white" id="demo">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-extrabold text-[#d7a44a]">דמו של דף הזמנות</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">ככה הלקוח רואה את העסק שלך</h2>
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
          <p className="text-sm font-extrabold text-primary">דמו של לוח ניהול</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">פשוט מספיק לבעל עסק עסוק</h2>
          <p className="mt-4 leading-8 text-muted">
            סקירה יומית, הזמנות קרובות, שירותים, זמינות, עריכת עמוד העסק ולינק הזמנות להעתקה. בלי מערכת כבדה ובלי תפריטים מבלבלים.
          </p>
          <Link
            href="/dashboard"
            className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white shadow-sm"
          >
            פתח לוח ניהול
            <LayoutDashboard size={18} aria-hidden="true" />
          </Link>
        </div>
        <DashboardPreview />
      </section>

      <section className="border-y border-line bg-white py-16" id="pricing">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold text-primary">{launchPlan.badge}</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">מצטרפים עכשיו ושומרים על המחיר</h2>
            <p className="mt-4 leading-8 text-muted">{launchPlan.lockMessage}</p>
          </div>
          <div className="soft-card rounded-[8px] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-extrabold text-foreground">{launchPlan.name}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-foreground">{launchPlan.priceLabel}</span>
                  <span className="pb-2 font-bold text-muted">{launchPlan.periodLabel}</span>
                </div>
                <p className="mt-2 text-sm font-bold text-accent">מחיר השקה שנשמר ל-5 שנים</p>
              </div>
              <a
                href="#demo-form"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white"
              >
                שמור מחיר השקה
                <ArrowLeft size={18} aria-hidden="true" />
              </a>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {launchPlan.features.map((feature) => (
                <span key={feature} className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 size={18} className="text-primary" aria-hidden="true" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold text-primary">למי זה מתאים</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">עסקים קטנים שמקבלים הזמנות לפי זמן פנוי</h2>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {businessExamples.map(([item, icon]) => (
            <div key={item} className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 font-bold shadow-sm">
              <span className="icon-tile size-10">
                <BusinessIcon value={icon} className="size-5" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr]" id="faq">
        <div>
          <p className="text-sm font-extrabold text-primary">שאלות נפוצות</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">מה חשוב לדעת לפני שמתחילים?</h2>
        </div>
        <div className="grid gap-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-[8px] border border-line bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-lg font-extrabold">{item.question}</summary>
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
      <div className="rounded-[8px] bg-[#0e2b30] p-4 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[8px] bg-white text-primary">
              <BusinessIcon value="scissors" className="size-6" />
            </span>
            <div>
              <p className="text-sm text-white/65">ברבר סטודיו</p>
              <h2 className="text-2xl font-extrabold">הזמנת תור</h2>
            </div>
          </div>
          <span className="gold-chip rounded-full px-3 py-1 text-xs font-extrabold">פתוח היום</span>
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
                  <p className="font-extrabold">{name}</p>
                  <p className="mt-1 text-sm text-muted">{time}</p>
                </div>
                <p className="font-extrabold text-primary">{formatPrice(Number(price))}</p>
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
              <span key={time} className="ltr rounded-[8px] bg-white px-3 py-2 text-center font-extrabold text-foreground">
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
          <span className="icon-tile size-10">
            <CalendarCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="font-extrabold">בחירת שעה</p>
            <p className="text-sm text-muted">יום שלישי, 26 במאי</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"].map((time, index) => (
            <span
              key={time}
              className={`ltr rounded-[8px] px-3 py-2 text-center font-extrabold ${
                index === 1 ? "bg-primary text-white" : "bg-[#f1f5f3] text-foreground"
              }`}
            >
              {time}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-[8px] bg-[#f4f7f5] p-4">
        <p className="font-extrabold">סיכום הזמנה</p>
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
          <div key={label} className="rounded-[8px] border border-line bg-[#f4f7f5] p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[8px] border border-line bg-white">
        {["10:00 אורי לוי - תספורת", "12:00 דניאל כהן - תספורת + זקן", "16:00 יובל ישראלי - עיצוב זקן"].map((row) => (
          <div key={row} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
            <span className="font-bold">{row}</span>
            <span className="rounded-full bg-[#e8f3ef] px-3 py-1 text-xs font-extrabold text-primary">מסודר</span>
          </div>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-primary px-4 py-3 font-extrabold text-white">
        <Copy size={18} aria-hidden="true" />
        העתק לינק הזמנות
      </div>
    </div>
  );
}
