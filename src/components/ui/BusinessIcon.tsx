import { Dumbbell, HeartPulse, Scissors, Sparkles, Store, WandSparkles } from "lucide-react";

export const businessIconOptions = [
  { value: "scissors", label: "מספרה", Icon: Scissors },
  { value: "sparkles", label: "יופי וטיפוח", Icon: Sparkles },
  { value: "heart-pulse", label: "קליניקה", Icon: HeartPulse },
  { value: "dumbbell", label: "אימון", Icon: Dumbbell },
  { value: "wand", label: "סטודיו", Icon: WandSparkles },
  { value: "store", label: "עסק כללי", Icon: Store },
] as const;

export function BusinessIcon({ value, className = "size-6" }: { value?: string; className?: string }) {
  const option = businessIconOptions.find((item) => item.value === value) ?? businessIconOptions[5];
  const Icon = option.Icon;

  return <Icon className={className} aria-hidden="true" />;
}
