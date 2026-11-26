"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type { WorkspaceSettingsResponse } from "@/lib/api-types/access";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";

// Who signs the workspace's messages (spec, Core pipelines > 4): a person's
// name reads like a person wrote it. Empty means the default, the first
// owner's first name. Owners change it; members see it.
export function SignAsForm({ workspaceId, settings, canEdit }: { workspaceId: string; settings: WorkspaceSettingsResponse; canEdit: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState(settings.signAs);
  const [value, setValue] = useState(settings.signAs.saved ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/w/${workspaceId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signAs: value.trim() || null }),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.ok) {
        const saved: WorkspaceSettingsResponse = await res.json();
        setCurrent(saved.signAs);
        setValue(saved.signAs.saved ?? "");
        setMessage({ ok: true, text: saved.signAs.name ? `Saved. New messages are signed "${saved.signAs.name}".` : "Saved. New messages are signed with the business name." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: res.status === 403 ? "Owners only." : "That name couldn't be saved. Keep it under 60 characters." });
      }
    } catch {
      setMessage({ ok: false, text: "Could not reach the server. Check your connection and try again." });
    }
    setPending(false);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Sign messages as</h2>
        <p className="text-sm text-muted wrap-break-word">
          {current.name
            ? `New messages end "${current.name} | your website", and the call opener says "This is ${current.name}". A name reads like a person wrote it.`
            : "New messages are signed with the business name."}{" "}
          {current.default && !current.saved ? `That's the first owner's first name, the default.` : ""}
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input
          name="signAs"
          value={value}
          maxLength={60}
          disabled={!canEdit || pending}
          onChange={(e) => setValue(e.target.value)}
          placeholder={current.default ?? "Your first name"}
          autoComplete="off"
          className={inputClass}
        />
        <span className="font-normal text-muted">Leave it empty to use {current.default ? `"${current.default}"` : "the default"}. Messages already written keep their sign-off.</span>
      </label>
      {canEdit ? (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save name"}
        </Button>
      ) : (
        <p className="text-sm text-muted">Only an owner can change it.</p>
      )}
      {message && (
        <p role={message.ok ? "status" : "alert"} className={cn("text-sm", message.ok ? "text-positive-ink" : "text-negative-ink")}>
          {message.text}
        </p>
      )}
    </form>
  );
}
