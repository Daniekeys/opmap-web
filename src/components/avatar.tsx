import { cn } from "@/lib/utils";

// Gradient pairs, one picked per name so a business keeps its colour everywhere.
const TONES = [
  "from-rose-400 to-pink-600",
  "from-orange-400 to-red-500",
  "from-amber-400 to-orange-500",
  "from-lime-400 to-emerald-600",
  "from-emerald-400 to-teal-600",
  "from-teal-400 to-cyan-600",
  "from-sky-400 to-blue-600",
  "from-indigo-400 to-violet-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
];

const SIZES = {
  sm: "size-9 rounded-lg text-xs",
  md: "size-11 rounded-xl text-sm",
  lg: "size-16 rounded-2xl text-xl",
};

// Up to two letters: "AB3 Cakes & Pastries" -> "AC", "Mimis" -> "MI".
export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function toneOf(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return TONES[hash % TONES.length]!;
}

// A business's monogram: we show no photos, so colour carries recognition.
export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold tracking-tight text-white shadow-sm ring-1 ring-black/5",
        toneOf(name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
