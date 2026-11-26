"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Copies `text`; says "Copied" for two seconds. A browser that refuses the
// clipboard says so instead of failing quietly.
export function CopyButton({ text, label = "Copy", className, variant = "outline" }: { text: string; label?: string; className?: string; variant?: "outline" | "default" | "secondary" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <Button
      type="button"
      variant={variant}
      className={cn("h-11 gap-1.5 sm:h-9", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy blocked" : label}</span>
    </Button>
  );
}
