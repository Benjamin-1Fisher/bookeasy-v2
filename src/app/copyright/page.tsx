import Link from "next/link";

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-background py-10">
      <article className="container-shell max-w-3xl rounded-[8px] border border-line bg-white p-6 leading-8">
        <Link href="/" className="font-bold text-primary">
          חזרה לדף הבית
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold">מדיניות זכויות יוצרים</h1>
        <p className="mt-4 font-bold text-red-700">
          מסמך זה הוא טיוטת דמה ראשונית בלבד. יש לבצע בדיקה משפטית מקצועית לפני השקה מסחרית.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">נכסי הדמו</h2>
        <p>
          שמות העסקים, הטקסטים והנתונים בפרויקט הם דמיוניים בלבד ונועדו להדגמה. אין להשתמש בלוגואים או תמונות של
          עסקים אמיתיים ללא רישיון מפורש.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">תוכן של לקוחות</h2>
        <p>
          בעל עסק שמעלה תוכן למערכת אחראי לוודא שיש לו זכויות שימוש בתמונות, טקסטים, סימנים מסחריים וכל נכס אחר.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">דיווח</h2>
        <p>לפני השקה מסחרית יש להוסיף כתובת קשר מסודרת לדיווח על הפרות זכויות יוצרים ותהליך טיפול בפניות.</p>
      </article>
    </main>
  );
}
