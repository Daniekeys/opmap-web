"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { LegalFormView } from "@/lib/api-types/outreach";
import { goToLogin } from "@/lib/go-to-login";
import { legalFormText } from "@/lib/legal-form";
import { cn } from "@/lib/utils";

// A UK lead's legal form (PECR): what Companies House found, or what a member
// checked, which wins; what that allows; and "I checked" buttons with an
// optional note, saved on this workspace's lead.
export function LegalFormBox({ base, view, onChange }: { base: string; view: LegalFormView; onChange: () => Promise<void> }) {
  const text = legalFormText(view);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"company" | "sole_trader" | "clear" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function save(form: "company" | "sole_trader" | null) {
    setBusy(form ?? "clear");
    setProblem(null);
    try {
      const res = await fetch(`${base}/legal-form`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form, note: form ? note.trim() || null : null }) });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(String(res.status));
      setNote("");
      await onChange();
    } catch {
      setProblem("That wasn't saved. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="legal-form-heading" className="flex flex-col gap-3 rounded-card border border-border bg-surface px-4 py-4 text-sm sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 id="legal-form-heading" className="flex items-center gap-2 font-semibold">
          <Building2 className="size-4 shrink-0" aria-hidden /> Legal form (UK rules)
        </h3>
        {text.badge && <span className="rounded-full bg-positive-soft px-2 text-xs/[22px] font-medium text-positive-ink">{text.badge}</span>}
      </div>
      <p className="wrap-anywhere">{text.status}</p>
      {view.confirmed?.note && <p className="wrap-anywhere text-muted">Note: {view.confirmed.note}</p>}
      <p role="note" className={cn("rounded-card px-3 py-2 text-xs", view.consentNeeded ? "bg-warning-soft text-warning-ink" : "bg-raised text-muted")}>
        {text.consequence} (A summary of PECR, not legal advice.)
      </p>

      {view.confirmed ? (
        <Button type="button" variant="outline" className="h-11 self-start sm:h-9" disabled={busy !== null} onClick={() => void save(null)}>
          {busy === "clear" ? "Undoing…" : "Undo our check"}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Checked it yourself? Note (optional)</span>
            <input className={inputClass} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: the owner told me on the phone" />
          </label>
          <div className="grid gap-2 sm:flex">
            <Button type="button" variant="outline" className="h-11 sm:h-9" disabled={busy !== null} onClick={() => void save("company")}>
              {busy === "company" ? "Saving…" : "I checked: limited company"}
            </Button>
            <Button type="button" variant="outline" className="h-11 sm:h-9" disabled={busy !== null} onClick={() => void save("sole_trader")}>
              {busy === "sole_trader" ? "Saving…" : "I checked: sole trader"}
            </Button>
          </div>
        </div>
      )}
      {problem && <p className="text-negative-ink">{problem}</p>}
    </section>
  );
}
