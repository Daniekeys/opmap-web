import { cn } from "@/lib/utils";

// The six monogram tints (design/tokens.json mono-1 to mono-6). Identity, not data.
const TONES = [
  "bg-mono-1 text-mono-1-ink",
  "bg-mono-2 text-mono-2-ink",
  "bg-mono-3 text-mono-3-ink",
  "bg-mono-4 text-mono-4-ink",
  "bg-mono-5 text-mono-5-ink",
  "bg-mono-6 text-mono-6-ink",
];

const SIZES = {
  xs: "size-7 text-xs",
  sm: "size-10 text-sm",
  md: "size-10 text-sm",
  lg: "size-12 text-[17px]",
};

// Up to two letters: "AB3 Cakes & Pastries" -> "AC", "Mimis" -> "MI".
export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

// A stable hash (of the business id, where there is one), so a business keeps
// its tint everywhere.
export function toneOf(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return TONES[hash % TONES.length]!;
}

// A business's monogram: we show no photos, so the tint carries recognition.
// `seed` picks the tint: pass the business id so the colour never depends on
// how the name is spelled.
export function Avatar({ name, seed, size = "md", className }: { name: string; seed?: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-control font-semibold", toneOf(seed ?? name), SIZES[size], className)}
    >
      {initials(name)}
    </span>
  );
}
