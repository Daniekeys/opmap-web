"use client";

import { useId, useState } from "react";
import { type ContactKindGroup, labelText } from "@/lib/leads";
import { cn } from "@/lib/utils";

const TONES = {
  good: "bg-positive-soft text-positive-ink",
  fair: "bg-neutral-soft text-neutral-ink",
  weak: "bg-warning-soft text-warning-ink",
};

// A contact's label in plain words. Hover shows why; on a phone, a tap
// shows it under the chip ("Single source: one place listed this number").
export function LabelChip({ group, label }: { group: ContactKindGroup; label: string }) {
  const { word, tip, tone } = labelText(group, label);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        title={tip ? `${word}: ${tip}` : word}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap underline decoration-dotted underline-offset-2", TONES[tone])}
      >
        {word}
      </button>
      {open && tip && (
        <span id={id} role="note" className="mt-1 text-xs text-muted">
          {word}: {tip}
        </span>
      )}
    </span>
  );
}
