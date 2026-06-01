# BookEasy v2

BookEasy v2 הוא MVP חדש ונקי בעברית מלאה, RTL מלא, שמציג לינק הזמנות חכם לבעלי עסקים קטנים.

המסר המרכזי: **תן ללקוחות להזמין לבד דרך לינק חכם אחד.**

## מה נבנה

- דף נחיתה בעברית לבעלי עסקים
- דפי הזמנות ציבוריים: `/b/barber-demo`, `/b/nails-demo`, `/b/clinic-demo`
- לוח ניהול בעברית: `/dashboard`
- ניהול שירותים: הוספה, עריכה, מחיקה, הפעלה וכיבוי
- ניהול זמינות שבועית פשוטה
- ניהול הזמנות וסטטוסים
- אזור דמו עצמאי עם כניסה ישירה לדפי דמו וללוח הניהול
- עמודי תנאי שימוש, פרטיות וזכויות יוצרים כטיוטות ראשוניות
- קובץ `ASSETS_NOTES.md` לתיעוד נכסים ורישיונות

## סטאק

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zod לוולידציה
- lucide-react לאייקונים
- אחסון JSON מקומי לפיתוח בתוך `data/bookeasy.json`

## הרצה מקומית

```bash
npm install
npm run dev
```

פתחו בדפדפן:

```txt
http://localhost:3000
```

## בדיקות

```bash
npm run lint
npm run typecheck
npm run build
```

## משתני סביבה

אין חובה להגדיר משתני סביבה כדי להריץ את הדמו.

אופציונלי:

```env
ADMIN_API_KEY=change-me
BOOKEASY_DATA_FILE=./data/bookeasy.json
```

אם מגדירים `ADMIN_API_KEY`, יש לשלוח אותו ב-header בשם `x-admin-api-key` לקריאות אדמין. ב-MVP המקומי ברירת המחדל
פתוחה כדי שהדשבורד יעבוד בלי התחברות.

## נתונים

הנתונים נשמרים בקובץ:

```txt
data/bookeasy.json
```

אם הקובץ ריק, המערכת מזריעה נתוני דמו בעברית מתוך `src/lib/seed-data.ts`.

## מה עדיין דמה

- אין התחברות אמיתית
- אין SMS אמיתי
- אין תשלומים
- אין סנכרון יומן מתקדם
- האחסון המקומי אינו מתאים לפרודקשן
- מסמכים משפטיים הם טיוטות בלבד

## לפני השקה מסחרית

- להעביר למסד נתונים אמיתי עם הרשאות וטרנזקציות
- להוסיף התחברות והרשאות לבעלי עסקים
- להחליף מספרי קשר ונוסחים משפטיים
- להשלים בדיקת אבטחה ופרטיות
- להוסיף rate limiting אמיתי
- להוסיף תיעוד תמיכה ומדיניות ביטולים

## העלאה לריפו GitHub חדש

אם עדיין לא נוצר ריפו בשם `bookeasy-v2`, אפשר להריץ:

```bash
git init
git add .
git commit -m "Initial BookEasy v2 MVP"
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/bookeasy-v2.git
git push -u origin main
```
