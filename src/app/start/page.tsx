import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { BookEasyMark } from "@/components/ui/BookEasyMark";

export const dynamic = "force-dynamic";

export default function StartPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex items-center justify-between gap-3 py-4 sm:py-5">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-[8px] font-extrabold text-foreground">
            <span className="grid size-9 place-items-center rounded-[8px] bg-primary text-white">
              <BookEasyMark size={18} aria-hidden={true} />
            </span>
            BookEasy
          </Link>
          <Link href="/" className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-[8px] text-sm font-bold text-muted hover:text-foreground">
            <ArrowRight size={16} aria-hidden="true" />
            חזרה לאתר
          </Link>
        </div>
      </header>

      <OnboardingFlow />
    </main>
  );
}
