import { Dumbbell, HeartPulse, Scissors, Sparkles, Store, WandSparkles } from "lucide-react";

export const businessIconOptions = [
  { value: "scissors", label: "Barber", Icon: Scissors },
  { value: "sparkles", label: "Beauty", Icon: Sparkles },
  { value: "heart-pulse", label: "Clinic", Icon: HeartPulse },
  { value: "dumbbell", label: "Fitness", Icon: Dumbbell },
  { value: "wand", label: "Studio", Icon: WandSparkles },
  { value: "store", label: "Store", Icon: Store },
] as const;

export function BusinessIcon({ value, className = "size-6" }: { value?: string; className?: string }) {
  const option = businessIconOptions.find((item) => item.value === value) ?? businessIconOptions[5];
  const Icon = option.Icon;

  return <Icon className={className} aria-hidden="true" />;
}
