import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f7f2] p-6 text-center">
      <div className="rounded-[8px] border border-line bg-white p-8">
        <h1 className="text-3xl font-black">דף ההזמנות לא נמצא</h1>
        <p className="mt-3 text-muted">יכול להיות שהלינק השתנה או שהעסק לא פעיל כרגע.</p>
        <Link className="mt-6 inline-flex rounded-[8px] bg-primary px-5 py-3 font-bold text-white" href="/">
          חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
