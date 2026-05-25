import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background py-10">
      <article className="container-shell max-w-3xl rounded-[8px] border border-line bg-white p-6 leading-8">
        <Link href="/" className="font-bold text-primary">
          חזרה לדף הבית
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold">תנאי שימוש</h1>
        <p className="mt-4 font-bold text-red-700">
          מסמך זה הוא טיוטת דמה ראשונית בלבד. יש לבצע בדיקה משפטית מקצועית לפני השקה מסחרית.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">שימוש במערכת</h2>
        <p>
          BookEasy מיועד להצגת שירותים, זמינות ובקשות הזמנה לעסקים קטנים. בעל העסק אחראי לוודא שהמידע שמוצג ללקוחות
          נכון, מעודכן ומתאים לפעילות שלו.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">הזמנות ותקשורת עם לקוחות</h2>
        <p>
          ההזמנות במערכת הן בקשות הזמנה וניתנות לאישור, ביטול או שינוי על ידי בעל העסק. אין לראות במערכת התחייבות
          משפטית לשירות לפני אישור מפורש של העסק.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">אחריות</h2>
        <p>
          בשלב MVP זה המערכת מסופקת לצורכי דמו ופיתוח. לפני שימוש מסחרי יש להשלים תנאים מלאים, מדיניות ביטולים,
          אבטחת מידע ומנגנוני תמיכה.
        </p>
      </article>
    </main>
  );
}
