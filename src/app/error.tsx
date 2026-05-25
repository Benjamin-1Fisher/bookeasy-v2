"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="rounded-[8px] border border-line bg-white p-8">
        <h1 className="text-3xl font-extrabold">משהו השתבש</h1>
        <p className="mt-3 text-muted">לא הצלחנו לטעון את המסך כרגע.</p>
        <button onClick={reset} className="mt-6 rounded-[8px] bg-primary px-5 py-3 font-bold text-white">
          נסה שוב
        </button>
      </div>
    </main>
  );
}
