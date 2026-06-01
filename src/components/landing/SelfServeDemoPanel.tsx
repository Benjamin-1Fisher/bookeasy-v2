import Link from "next/link";
import { ArrowLeft, LayoutDashboard, MousePointerClick } from "lucide-react";
import { BusinessIcon } from "@/components/ui/BusinessIcon";

const demoPages = [
  {
    title: "ברבר סטודיו",
    text: "דף הזמנות עם שירותים, מחירים ושעות פנויות.",
    href: "/b/barber-demo",
    icon: "scissors",
  },
  {
    title: "נייל סטודיו",
    text: "חוויה מוביילית להזמנת תור לציפורניים וקוסמטיקה.",
    href: "/b/nails-demo",
    icon: "sparkles",
  },
  {
    title: "קליניקת איזון",
    text: "דמו רגוע לקליניקה עם זמינות ושירותים קצרים.",
    href: "/b/clinic-demo",
    icon: "heart-pulse",
  },
];

export function SelfServeDemoPanel() {
  return (
    <section className="container-shell py-10 sm:py-16" id="demo-access">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p className="text-sm font-extrabold text-primary">דמו עצמאי</p>
          <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-4xl">פותחים דמו בלי להשאיר פרטים</h2>
          <p className="mt-3 leading-7 text-muted sm:mt-4 sm:leading-8">
            כל מסכי הדמו פתוחים לצפייה מיידית. אפשר לבדוק דף הזמנות של לקוח, לפתוח את לוח הניהול ולהבין לבד אם זה מתאים לעסק.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/b/nails-demo"
              className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-bold text-white shadow-sm transition hover:bg-primary-strong sm:w-auto"
            >
              פתח דף הזמנות
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-5 py-3 font-bold text-foreground transition hover:border-primary sm:w-auto"
            >
              פתח לוח ניהול
              <LayoutDashboard size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {demoPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="focus-ring group grid grid-cols-[auto_1fr] gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm transition hover:border-primary sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4"
            >
              <span className="icon-tile size-11">
                <BusinessIcon value={page.icon} className="size-6" />
              </span>
              <span>
                <span className="block text-base font-extrabold text-foreground sm:text-lg">{page.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted sm:text-base sm:leading-7">{page.text}</span>
              </span>
              <span className="col-span-2 inline-flex items-center gap-2 font-bold text-primary sm:col-span-1">
                צפייה
                <MousePointerClick size={18} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
