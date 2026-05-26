"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="rounded-[8px] border border-line bg-white p-8">
        <h1 className="text-3xl font-extrabold">{t.errors.pageNotFoundTitle}</h1>
        <p className="mt-3 text-muted">{t.errors.pageNotFoundText}</p>
        <Link className="mt-6 inline-flex rounded-[8px] bg-primary px-5 py-3 font-bold text-white" href="/">
          {t.common.backHome}
        </Link>
      </div>
    </main>
  );
}
