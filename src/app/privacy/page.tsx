import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-10">
      <article className="container-shell max-w-3xl rounded-[8px] border border-line bg-white p-6 leading-8">
        <Link href="/" className="font-bold text-primary">
          חזרה לדף הבית
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold">מדיניות פרטיות</h1>
        <p className="mt-4 font-bold text-red-700">
          מסמך זה הוא טיוטת דמה ראשונית בלבד. יש לבצע בדיקה משפטית מקצועית לפני השקה מסחרית.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">איזה מידע נשמר</h2>
        <p>
          בדמו נשמרים פרטי הזמנה בסיסיים: שם לקוח, טלפון, שירות, תאריך, שעה והערות אופציונליות. צפייה בדפי הדמו
          ובלוח הניהול אינה דורשת השארת פרטים.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">איך משתמשים במידע</h2>
        <p>
          המידע נועד לניהול הזמנות ולהצגתן לבעל העסק. אין כאן התחייבות למדיניות מסחרית מלאה לפני השלמת ייעוץ משפטי
          ותשתית אבטחה.
        </p>
        <h2 className="mt-8 text-2xl font-extrabold">אחסון ואבטחה</h2>
        <p>
          בגרסת MVP זו הנתונים נשמרים בקובץ JSON מקומי לצורכי פיתוח. לפני השקה יש להעביר למסד נתונים מאובטח, להוסיף
          הרשאות, גיבויים, מחיקה לפי בקשה ומדיניות שמירת מידע.
        </p>
      </article>
    </main>
  );
}
