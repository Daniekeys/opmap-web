"use client";

import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type {
  AddFactBody,
  ApproveProfileResponse,
  EditFactBody,
  Fact,
  FactKind,
  FactResponse,
  MissingFact,
  ProfileSummary,
} from "@/lib/api-types/brand";
import type { ApiErrorResponse } from "@/lib/api-types/errors";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";
import { FactSource, KINDS, kindLabel, PreviouslyApproved, StaleFlag } from "../facts";
import { emptyFactsMessage, factTabs } from "../kinds";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

async function send<T>(method: "POST" | "PATCH", path: string, body?: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    if (res.status === 401) {
      goToLogin();
      return { ok: false, message: "Signing you in again." };
    }
    if (res.ok) return { ok: true, data: (await res.json()) as T };
    if (res.status === 403) return { ok: false, message: "Owners only." };
    const error = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    return { ok: false, message: error?.error.message ?? "That didn't save. Please try again." };
  } catch {
    return { ok: false, message: "Could not reach the server. Check your connection and try again." };
  }
}

const KIND_ORDER = Object.fromEntries(KINDS.map((k, i) => [k.kind, i])) as Record<FactKind, number>;

// Review one draft version: approve, fix or reject each fact (one card at a
// time on phones, the whole list from md up), add facts by hand, then an owner
// approves the version.
export function FactReview({
  workspaceId,
  brandHref,
  profile,
  initialFacts,
  missing,
  isOwner,
}: {
  workspaceId: string;
  brandHref: string;
  profile: ProfileSummary;
  initialFacts: Fact[];
  missing: MissingFact[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const api = `/api/w/${workspaceId}/brand`;
  const [facts, setFacts] = useState(() =>
    [...initialFacts].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
  );
  const [filter, setFilter] = useState<FactKind | "all">("all");
  const [index, setIndex] = useState(() => Math.max(0, facts.findIndex((f) => f.status === "pending")));
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const visible = filter === "all" ? facts : facts.filter((f) => f.kind === filter);
  const current = Math.min(index, Math.max(0, visible.length - 1));
  const pending = facts.filter((f) => f.status === "pending").length;
  const decided = facts.length - pending;

  function replace(fact: Fact) {
    setFacts((all) => all.map((f) => (f.id === fact.id ? fact : f)));
  }

  // On phones, move on to the next fact still waiting for a decision.
  function advanceFrom(position: number, after: Fact[]) {
    const list = filter === "all" ? after : after.filter((f) => f.kind === filter);
    const next = list.findIndex((f, i) => i > position && f.status === "pending");
    const wrapped = next === -1 ? list.findIndex((f) => f.status === "pending") : next;
    if (wrapped !== -1) setIndex(wrapped);
  }

  async function act(fact: Fact, position: number, request: () => Promise<Result<FactResponse>>) {
    setBusy(fact.id);
    setErrors((all) => {
      const rest = { ...all };
      delete rest[fact.id];
      return rest;
    });
    const result = await request();
    setBusy(null);
    if (!result.ok) {
      setErrors((e) => ({ ...e, [fact.id]: result.message }));
      return;
    }
    const after = facts.map((f) => (f.id === fact.id ? result.data.fact : f));
    replace(result.data.fact);
    setEditing(null);
    advanceFrom(position, after);
  }

  const decide = (fact: Fact, position: number, action: "approve" | "reject") =>
    act(fact, position, () => send<FactResponse>("POST", `${api}/facts/${fact.id}/${action}`));

  const saveEdit = (fact: Fact, position: number, text: string) =>
    act(fact, position, () => send<FactResponse>("PATCH", `${api}/facts/${fact.id}`, { text } satisfies EditFactBody));

  async function add(body: AddFactBody) {
    const result = await send<FactResponse>("POST", `${api}/profiles/${profile.id}/facts`, body);
    if (result.ok) setFacts((all) => [...all, result.data.fact].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]));
    return result;
  }

  async function approveProfile() {
    setApproving(true);
    setApproveError(null);
    const result = await send<ApproveProfileResponse>("POST", `${api}/profiles/${profile.id}/approve`);
    if (result.ok) {
      router.push(brandHref);
      router.refresh();
      return;
    }
    setApproveError(result.message);
    setApproving(false);
  }

  return (
    <>
      <section aria-label="Review progress" className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          {decided} of {facts.length} facts decided
          {pending > 0 && <span className="text-muted">, {pending} to go</span>}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
          <div className="h-full bg-accent transition-all" style={{ width: `${facts.length ? (decided / facts.length) * 100 : 0}%` }} />
        </div>
        <p className="hidden text-sm text-muted sm:block">
          Approve what is true today, fix the wording, reject the rest. Only approved facts can appear in messages to leads.
        </p>
      </section>

      <div role="group" aria-label="Show facts of one kind" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {factTabs(facts).map(({ kind, label, count }) => {
          const active = filter === kind;
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(kind);
                setIndex(0);
              }}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap",
                active ? "border-ink bg-primary text-on-primary" : "bg-card hover:bg-raised",
              )}
            >
              {label} <span className={active ? "opacity-70" : "text-muted"}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted">
          {emptyFactsMessage(filter)}
        </p>
      ) : (
        <>
          {/* Phones: one card at a time. */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              className="size-11"
              aria-label="Previous fact"
              disabled={current === 0}
              onClick={() => setIndex(current - 1)}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <p className="flex-1 text-center text-sm text-muted tabular-nums" aria-live="polite">
              Fact {current + 1} of {visible.length}
            </p>
            <Button
              variant="outline"
              className="size-11"
              aria-label="Next fact"
              disabled={current >= visible.length - 1}
              onClick={() => setIndex(current + 1)}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>

          <ol className="flex flex-col gap-3">
            {visible.map((fact, position) => (
              <li key={fact.id} className={cn(position !== current && "hidden md:block")}>
                <FactCard
                  fact={fact}
                  busy={busy === fact.id}
                  error={errors[fact.id] ?? null}
                  editing={editing?.id === fact.id ? editing.text : null}
                  onEdit={(text) => setEditing(text === null ? null : { id: fact.id, text })}
                  onApprove={() => decide(fact, position, "approve")}
                  onReject={() => decide(fact, position, "reject")}
                  onSave={(text) => saveEdit(fact, position, text)}
                />
              </li>
            ))}
          </ol>
        </>
      )}

      {missing.length > kept.length && (
        <section aria-labelledby="missing-heading" className="flex flex-col gap-2">
          <h2 id="missing-heading" className="font-medium">
            No longer on your site
          </h2>
          <p className="text-sm text-muted">
            These were approved last time but this crawl didn&apos;t find them. They drop out unless you keep them as your
            own facts.
          </p>
          <ul className="divide-y rounded-xl border bg-card">
            {missing
              .filter((m) => !kept.includes(`${m.kind}:${m.text}`))
              .map((m) => (
                <MissingRow
                  key={`${m.kind}:${m.text}`}
                  fact={m}
                  onKeep={async () => {
                    const result = await add({ kind: m.kind, text: m.text });
                    if (result.ok) setKept((k) => [...k, `${m.kind}:${m.text}`]);
                    return result;
                  }}
                />
              ))}
          </ul>
        </section>
      )}

      <AddFact onAdd={add} />

      {/* Pinned to the bottom of the screen only once it can be used. */}
      <div
        className={cn(
          "-mx-4 flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center",
          pending === 0 && "sticky bottom-0",
        )}
      >
        {approveError && (
          <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink sm:order-last">
            {approveError}
          </p>
        )}
        {isOwner ? (
          <>
            <Button className="h-11 text-base sm:px-5" disabled={pending > 0 || approving} onClick={approveProfile}>
              {approving ? "Approving" : `Approve version ${profile.version}`}
            </Button>
            <p className="text-sm text-muted">
              {pending > 0
                ? `Decide the ${pending} remaining ${pending === 1 ? "fact" : "facts"} first.`
                : "Replaces the approved profile used in messages."}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            {pending > 0
              ? `${pending} ${pending === 1 ? "fact" : "facts"} left to decide. An owner approves the version once all are decided.`
              : "All decided. An owner can approve this version now."}
          </p>
        )}
      </div>
    </>
  );
}

function StatusChip({ status }: { status: Fact["status"] }) {
  if (status === "pending") return <span className="text-xs font-medium text-muted">Not decided</span>;
  return status === "approved" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-xs font-medium text-positive-ink">
      <Check className="size-3.5" aria-hidden />
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-negative-soft px-2 py-0.5 text-xs font-medium text-negative-ink">
      <X className="size-3.5" aria-hidden />
      Rejected
    </span>
  );
}

function FactCard({
  fact,
  busy,
  error,
  editing,
  onEdit,
  onApprove,
  onReject,
  onSave,
}: {
  fact: Fact;
  busy: boolean;
  error: string | null;
  editing: string | null;
  onEdit: (text: string | null) => void;
  onApprove: () => void;
  onReject: () => void;
  onSave: (text: string) => void;
}) {
  const textId = `fact-${fact.id}`;
  return (
    <article
      aria-labelledby={textId}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4",
        fact.status === "approved" && "border-positive/30",
        fact.status === "rejected" && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">{kindLabel(fact.kind)}</span>
        {fact.previouslyApproved && <PreviouslyApproved />}
        <span className="ml-auto">
          <StatusChip status={fact.status} />
        </span>
      </div>

      {editing !== null ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            if (editing.trim()) onSave(editing.trim());
          }}
        >
          <label htmlFor={`${textId}-edit`} className="text-sm font-medium">
            Correct the wording
          </label>
          <textarea
            id={`${textId}-edit`}
            value={editing}
            onChange={(event) => onEdit(event.target.value)}
            rows={3}
            maxLength={500}
            autoFocus
            className={cn(inputClass, "h-auto min-h-24 py-2")}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" className="h-11 text-base" disabled={busy || !editing.trim()}>
              {busy ? "Saving" : "Save and approve"}
            </Button>
            <Button type="button" variant="outline" className="h-11 text-base" onClick={() => onEdit(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p id={textId} className={cn("text-lg font-medium wrap-break-word", fact.status === "rejected" && "line-through")}>
          {fact.text}
        </p>
      )}

      {fact.originalText && <p className="text-sm text-muted wrap-break-word">Site wording: {fact.originalText}</p>}
      {fact.possiblyStale && <StaleFlag reason={fact.staleReason} />}
      <FactSource fact={fact} />

      {error && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink">
          {error}
        </p>
      )}

      {editing === null && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="h-11 text-base"
            variant={fact.status === "approved" ? "secondary" : "default"}
            disabled={busy}
            aria-pressed={fact.status === "approved"}
            onClick={onApprove}
          >
            <Check aria-hidden />
            Approve
          </Button>
          <Button variant="outline" className="h-11 text-base" disabled={busy} onClick={() => onEdit(fact.text)}>
            <Pencil aria-hidden />
            Edit
          </Button>
          <Button
            variant={fact.status === "rejected" ? "secondary" : "destructive"}
            className="h-11 text-base"
            disabled={busy}
            aria-pressed={fact.status === "rejected"}
            onClick={onReject}
          >
            <X aria-hidden />
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}

function MissingRow({ fact, onKeep }: { fact: MissingFact; onKeep: () => Promise<Result<FactResponse>> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{kindLabel(fact.kind)}</p>
      <p className="font-medium wrap-break-word">{fact.text}</p>
      {error && (
        <p role="alert" className="text-sm text-negative-ink">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        className="h-11 sm:self-start sm:px-4"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await onKeep();
          if (!result.ok) setError(result.message);
          setBusy(false);
        }}
      >
        {busy ? "Keeping" : "Keep as my own fact"}
      </Button>
    </li>
  );
}

function AddFact({ onAdd }: { onAdd: (body: AddFactBody) => Promise<Result<FactResponse>> }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: AddFactBody = { kind: data.get("kind") as FactKind, text: String(data.get("text") ?? "").trim() };
    if (!body.text) return;
    setPending(true);
    setError(null);
    const result = await onAdd(body);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setAdded(body.text);
    form.reset();
  }

  if (!open) {
    return (
      <Button variant="outline" className="h-11 text-base sm:self-start sm:px-5" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add a fact by hand
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="font-medium">Add a fact by hand</h2>
      <p className="text-sm text-muted">
        For something true that your site doesn&apos;t say. It has no source page, so it is marked as added by you.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Kind
        <span className="relative">
          <select name="kind" defaultValue="service" className={cn(inputClass, "appearance-none pr-9")}>
            {KINDS.map(({ kind, one }) => (
              <option key={kind} value={kind}>
                {one}
              </option>
            ))}
          </select>
          <ChevronsUpDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Fact
        <textarea name="text" required rows={3} maxLength={500} className={cn(inputClass, "h-auto min-h-24 py-2")} />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink">
          {error}
        </p>
      )}
      {added && !error && (
        <p role="status" className="text-sm text-muted wrap-break-word">
          Added &ldquo;{added}&rdquo;.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button type="submit" className="h-11 text-base sm:px-5" disabled={pending}>
          {pending ? "Adding" : "Add fact"}
        </Button>
        <Button type="button" variant="outline" className="h-11 text-base sm:px-5" onClick={() => setOpen(false)}>
          Done
        </Button>
      </div>
    </form>
  );
}
