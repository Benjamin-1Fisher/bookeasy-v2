"use client";

import { useI18n } from "@/i18n";

export default function Loading() {
  const { t } = useI18n();

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="rounded-[8px] border border-line bg-white p-6 text-center shadow-sm">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-line border-t-primary" />
        <p className="mt-4 font-bold text-muted">{t.common.loading}</p>
      </div>
    </div>
  );
}
