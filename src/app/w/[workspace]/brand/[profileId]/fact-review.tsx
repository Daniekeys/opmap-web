"use client";

import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Pencil, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { inputClass } from "@/components/input-class";
import { Button } from "@/components/ui/button";
import type {
  AddFactBody,
  ApproveProfileResponse,
  CrawledPage,
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
import { FactSource, foundOn, KINDS, kindLabel, PreviouslyApproved, SourceLine, sourceLabel, StaleFlag, StalePill } from "../facts";
import { emptyFactsMessage, factTabs } from "../kinds";
import { approveNote, pagesRead, reviewFinding } from "../review";

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

// A fact still to decide that may be out of date gets the amber card.
const flagged = (fact: Fact) => fact.possiblyStale && fact.status === "pending";

// What one fact's controls need from the review.
type FactControls = {
  busy: boolean;
  error: string | null;
  editing: string | null;
  onEdit: (text: string | null) => void;
  onApprove: () => void;
  onReject: () => void;
  onSave: (text: string) => void;
};

// Review one draft version (design/screens/BrandDNA.dc.html): approve, fix or
// reject each fact, one at a time (no bulk approve). Phones show one card at a
// time with kind tabs; from md up the facts are listed by kind, flagged ones
// first as cards; from xl the review's progress and the approve button sit in
// a side panel. Members decide facts; an owner approves the version.
export function FactReview({
  workspaceId,
  brandHref,
  profile,
  pages,
  approvedVersion,
  initialFacts,
  missing,
  isOwner,
}: {
  workspaceId: string;
  brandHref: string;
  profile: ProfileSummary;
  pages: CrawledPage[];
  approvedVersion: number | null;
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
  // Decided facts whose buttons were brought back with "Change".
  const [reopened, setReopened] = useState<string[]>([]);
  const [kept, setKept] = useState<string[]>([]);
  const [adding, setAdding] = useState<FactKind | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const visible = filter === "all" ? facts : facts.filter((f) => f.kind === filter);
  const current = Math.min(index, Math.max(0, visible.length - 1));
  const pending = facts.filter((f) => f.status === "pending").length;
  const decided = facts.length - pending;
  const share = facts.length ? (decided / facts.length) * 100 : 0;
  const readFrom = profile.source === "website" ? pagesRead(pages, profile.createdAt) : pagesRead([], profile.createdAt);

  // On phones, move on to the next fact still waiting for a decision.
  function advanceFrom(position: number, after: Fact[]) {
    const list = filter === "all" ? after : after.filter((f) => f.kind === filter);
    const next = list.findIndex((f, i) => i > position && f.status === "pending");
    const wrapped = next === -1 ? list.findIndex((f) => f.status === "pending") : next;
    if (wrapped !== -1) setIndex(wrapped);
  }

  async function act(fact: Fact, request: () => Promise<Result<FactResponse>>) {
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
    setFacts(after);
    setEditing(null);
    setReopened((ids) => ids.filter((id) => id !== fact.id));
    advanceFrom(visible.findIndex((f) => f.id === fact.id), after);
  }

  function controls(fact: Fact): FactControls {
    return {
      busy: busy === fact.id,
      error: errors[fact.id] ?? null,
      editing: editing?.id === fact.id ? editing.text : null,
      onEdit: (text) => setEditing(text === null ? null : { id: fact.id, text }),
      onApprove: () => act(fact, () => send<FactResponse>("POST", `${api}/facts/${fact.id}/approve`)),
      onReject: () => act(fact, () => send<FactResponse>("POST", `${api}/facts/${fact.id}/reject`)),
      onSave: (text) => act(fact, () => send<FactResponse>("PATCH", `${api}/facts/${fact.id}`, { text } satisfies EditFactBody)),
    };
  }

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

  const approve = (
    <ApproveControls
      version={profile.version}
      pending={pending}
      isOwner={isOwner}
      approving={approving}
      error={approveError}
      note={approveNote(approvedVersion)}
      onApprove={approveProfile}
    />
  );

  return (
    <>
      <header className="flex flex-col gap-1">
        <Link
          href={brandHref}
          className="-ml-2 inline-flex h-11 items-center gap-1 self-start px-2 text-sm font-medium text-muted hover:text-ink md:h-8"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All versions
        </Link>
        <h1 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] sm:text-title sm:tracking-[-0.02em]">Brand DNA</h1>
        <p className="text-sm text-muted sm:text-body">{reviewFinding(facts, profile.source)}</p>
      </header>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex w-full max-w-read min-w-0 flex-col gap-6">
          {/* Below xl the side panel's progress sits above the facts. */}
          <section aria-label="Review progress" className="flex flex-col gap-2 xl:hidden">
            <p className="text-sm font-medium">
              {decided} of {facts.length} facts decided
              {pending > 0 && <span className="text-muted">, {pending} to go</span>}
            </p>
            <ProgressBar share={share} />
            <p className="text-sm text-muted wrap-break-word">
              Version {profile.version}, read from {sourceLabel(profile)}. {readFrom}
            </p>
          </section>

          {/* Phones: one card at a time, with kind tabs. */}
          <div className="flex flex-col gap-3 md:hidden">
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
                      active ? "border-ink bg-primary text-on-primary" : "border-control bg-surface hover:bg-raised",
                    )}
                  >
                    {label} <span className={active ? "opacity-70" : "text-muted"}>{count}</span>
                  </button>
                );
              })}
            </div>
            {visible.length === 0 ? (
              <Empty>{emptyFactsMessage(filter)}</Empty>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="size-11" aria-label="Previous fact" disabled={current === 0} onClick={() => setIndex(current - 1)}>
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
                {flagged(visible[current]!) ? (
                  <FlaggedCard idPrefix="p" fact={visible[current]!} {...controls(visible[current]!)} />
                ) : (
                  <FactCard fact={visible[current]!} {...controls(visible[current]!)} />
                )}
              </>
            )}
          </div>

          {/* md and up: every kind as a section, flagged facts first. */}
          <div className="hidden flex-col gap-8 md:flex">
            {KINDS.map(({ kind, label }) => {
              const all = facts.filter((f) => f.kind === kind);
              const cards = all.filter(flagged);
              const rows = all.filter((f) => !flagged(f));
              const approved = all.filter((f) => f.status === "approved").length;
              return (
                <section key={kind} aria-labelledby={`kind-${kind}`} className="flex flex-col gap-3">
                  <h2 id={`kind-${kind}`} className="text-section font-semibold">
                    {label}{" "}
                    <span className="text-sm font-normal text-muted">
                      {all.length > 0 ? `${approved} of ${all.length} approved` : "none found"}
                    </span>
                  </h2>
                  {cards.map((fact) => (
                    <FlaggedCard key={fact.id} idPrefix="d" fact={fact} {...controls(fact)} />
                  ))}
                  {rows.length > 0 && (
                    <ul className="rounded-card border border-border bg-surface">
                      {rows.map((fact) => (
                        <FactRow
                          key={fact.id}
                          fact={fact}
                          open={fact.status === "pending" || reopened.includes(fact.id)}
                          onChange={() => setReopened((ids) => [...ids, fact.id])}
                          {...controls(fact)}
                        />
                      ))}
                    </ul>
                  )}
                  {all.length === 0 && (
                    <Empty>
                      {profile.source === "website" ? "None were found on the site." : "None were found in your description."}{" "}
                      <button type="button" className="font-medium text-accent-ink underline-offset-4 hover:underline" onClick={() => setAdding(kind)}>
                        Add one by hand
                      </button>
                    </Empty>
                  )}
                </section>
              );
            })}
          </div>

          {missing.length > kept.length && (
            <section aria-labelledby="missing-heading" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 id="missing-heading" className="text-section font-semibold">
                  No longer on your site
                </h2>
                <p className="text-sm text-muted">
                  These were approved last time but this crawl didn&apos;t find them. They drop out unless you keep them as your
                  own facts.
                </p>
              </div>
              <ul className="rounded-card border border-border bg-surface">
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

          <AddFact kind={adding} onOpen={(kind) => setAdding(kind)} onClose={() => setAdding(null)} onAdd={add} />

          {/* Below xl the approve button is pinned to the bottom of the screen once it can be used. */}
          <div
            className={cn(
              "-mx-4 flex flex-col gap-2 border-t border-border bg-ground px-4 py-3 sm:mx-0 sm:px-0 xl:hidden",
              pending === 0 && "sticky bottom-0",
            )}
          >
            {approve}
          </div>
        </div>

        <aside aria-label="Review progress" className="hidden flex-col gap-4 rounded-card border border-border bg-surface px-6 py-5 xl:sticky xl:top-6 xl:flex xl:w-92 xl:shrink-0">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Reviewed</span>
            <span className="text-figure font-medium tabular-nums">
              {decided} <span className="text-sm text-muted">of {facts.length} facts</span>
            </span>
            <ProgressBar share={share} />
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            {KINDS.map(({ kind, label }) => {
              const all = facts.filter((f) => f.kind === kind);
              if (all.length === 0) return null;
              return (
                <div key={kind} className="contents">
                  <dt>{label}</dt>
                  <dd className="text-right text-muted tabular-nums">
                    {all.filter((f) => f.status !== "pending").length} of {all.length}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="flex flex-col gap-0.5 rounded-control bg-raised px-3.5 py-3 text-sm">
            <span className="font-medium wrap-break-word">Read from {sourceLabel(profile)}</span>
            <span className="text-muted">{readFrom}</span>
          </div>
          {approve}
        </aside>
      </div>
    </>
  );
}

function ProgressBar({ share }: { share: number }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-accent-track" aria-hidden>
      <span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${share}%` }} />
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-card border border-dashed border-control bg-surface px-5 py-4 text-sm text-muted">{children}</p>;
}

function ApproveControls({
  version,
  pending,
  isOwner,
  approving,
  error,
  note,
  onApprove,
}: {
  version: number;
  pending: number;
  isOwner: boolean;
  approving: boolean;
  error: string | null;
  note: string;
  onApprove: () => void;
}) {
  const left = `${pending} ${pending === 1 ? "fact" : "facts"}`;
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
          {error}
        </p>
      )}
      {isOwner ? (
        <>
          <Button className="h-11 text-base sm:self-start xl:h-10 xl:self-stretch xl:text-sm" disabled={pending > 0 || approving} onClick={onApprove}>
            {approving ? "Approving" : `Approve version ${version}`}
          </Button>
          <p className="text-sm text-muted">{pending > 0 ? `Decide the ${left} left first.` : note}</p>
        </>
      ) : (
        <p className="text-sm text-muted">
          {pending > 0 ? `${left} left to decide. An owner approves the version once all are decided.` : "All decided. An owner can approve this version now."}
        </p>
      )}
    </div>
  );
}

function EditForm({ id, editing, busy, onEdit, onSave }: { id: string } & Pick<FactControls, "busy" | "onEdit" | "onSave"> & { editing: string }) {
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (editing.trim()) onSave(editing.trim());
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        Correct the wording
      </label>
      <textarea
        id={id}
        value={editing}
        onChange={(event) => onEdit(event.target.value)}
        rows={3}
        maxLength={500}
        autoFocus
        className={cn(inputClass, "h-auto min-h-24 py-2")}
      />
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Button type="submit" className="h-11 text-base md:h-9 md:text-sm" disabled={busy || !editing.trim()}>
          {busy ? "Saving" : "Save and approve"}
        </Button>
        <Button type="button" variant="outline" className="h-11 text-base md:h-9 md:text-sm" onClick={() => onEdit(null)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
      {error}
    </p>
  );
}

// A fact still to decide that may be out of date: what it is, where it was
// found and why it may be stale, with remove first.
function FlaggedCard({ fact, idPrefix, busy, error, editing, onEdit, onApprove, onReject, onSave }: { fact: Fact; idPrefix: string } & FactControls) {
  const textId = `${idPrefix}-fact-${fact.id}`;
  const reason = fact.staleReason?.trim().replace(/\.?$/, ".");
  const question = fact.kind === "service" ? "Do you still offer it?" : "Is it still true?";
  return (
    <article aria-labelledby={textId} className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-warning-ink bg-surface px-5 py-5 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        {editing === null && (
          <p id={textId} className="min-w-0 text-section font-semibold wrap-break-word">
            {fact.text}
          </p>
        )}
        {editing !== null && <span id={textId} className="sr-only">{fact.text}</span>}
        <StalePill />
      </div>
      {editing !== null && <EditForm id={`${textId}-edit`} editing={editing} busy={busy} onEdit={onEdit} onSave={onSave} />}
      <p className="text-sm text-muted wrap-break-word md:text-body">
        {foundOn(fact)} {reason && reason !== "May be out of date." && `${reason} `}
        {question}
      </p>
      {fact.excerpt && <p className="line-clamp-3 text-sm text-muted wrap-break-word">&ldquo;{fact.excerpt}&rdquo;</p>}
      {(fact.previouslyApproved || fact.originalText) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {fact.previouslyApproved && <PreviouslyApproved />}
          {fact.originalText && <span className="wrap-break-word">Site wording: {fact.originalText}</span>}
        </div>
      )}
      <ErrorNote error={error} />
      {editing === null && (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
          <Button className="h-11 text-base md:h-9 md:text-sm" disabled={busy} onClick={onReject}>
            {fact.kind === "service" ? "No longer offered, remove" : "No longer true, remove"}
          </Button>
          <Button variant="outline" className="h-11 text-base md:h-9 md:text-sm" disabled={busy} onClick={onApprove}>
            Still true, approve
          </Button>
          <Button variant="ghost" className="h-11 text-base text-accent-ink md:h-9 md:text-sm" disabled={busy} onClick={() => onEdit(fact.text)}>
            Edit wording
          </Button>
        </div>
      )}
    </article>
  );
}

// One fact in a kind's list (md and up): its text and source on one side,
// its buttons, or what was decided, on the other.
function FactRow({
  fact,
  open,
  onChange,
  busy,
  error,
  editing,
  onEdit,
  onApprove,
  onReject,
  onSave,
}: { fact: Fact; open: boolean; onChange: () => void } & FactControls) {
  const textId = `d-fact-${fact.id}`;
  const rejected = fact.status === "rejected";
  return (
    <li className="flex min-h-18 flex-col justify-center gap-3 border-b border-rule px-6 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
          <p id={textId} className={cn("font-medium wrap-break-word", rejected && "text-muted line-through")}>
            {fact.text}
            {rejected && <span className="sr-only"> (rejected)</span>}
          </p>
          <SourceLine fact={fact} />
          {(fact.previouslyApproved || fact.possiblyStale || fact.originalText) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              {fact.possiblyStale && <StalePill />}
              {fact.previouslyApproved && <PreviouslyApproved />}
              {fact.originalText && <span className="wrap-break-word">Site wording: {fact.originalText}</span>}
            </div>
          )}
        </div>
        {editing === null &&
          (open ? (
            <span className="flex gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onEdit(fact.text)} aria-describedby={textId}>
                Edit
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={onReject} aria-describedby={textId}>
                Reject
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={onApprove} aria-describedby={textId}>
                Approve
              </Button>
            </span>
          ) : (
            <span className="flex items-center gap-3">
              {rejected ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <X className="size-4" aria-hidden />
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-positive-ink">
                  <Check className="size-4" aria-hidden />
                  Approved
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={onChange} aria-describedby={textId}>
                Change
              </Button>
            </span>
          ))}
      </div>
      {editing !== null && <EditForm id={`${textId}-edit`} editing={editing} busy={busy} onEdit={onEdit} onSave={onSave} />}
      <ErrorNote error={error} />
    </li>
  );
}

function StatusChip({ status }: { status: Fact["status"] }) {
  if (status === "pending") return <span className="text-sm text-muted">Not decided</span>;
  return status === "approved" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 text-sm leading-[22px] font-medium text-positive-ink">
      <Check className="size-3.5" aria-hidden />
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-negative-soft px-2 text-sm leading-[22px] font-medium text-negative-ink">
      <X className="size-3.5" aria-hidden />
      Rejected
    </span>
  );
}

// One fact on a phone, with its three buttons always showing.
function FactCard({ fact, busy, error, editing, onEdit, onApprove, onReject, onSave }: { fact: Fact } & FactControls) {
  const textId = `p-fact-${fact.id}`;
  return (
    <article
      aria-labelledby={textId}
      className={cn(
        "flex flex-col gap-3 rounded-card border border-border bg-surface p-4",
        fact.status === "approved" && "border-positive/30",
        fact.status === "rejected" && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{kindLabel(fact.kind)}</span>
        {fact.previouslyApproved && <PreviouslyApproved />}
        <span className="ml-auto">
          <StatusChip status={fact.status} />
        </span>
      </div>

      {editing !== null ? (
        <>
          <span id={textId} className="sr-only">{fact.text}</span>
          <EditForm id={`${textId}-edit`} editing={editing} busy={busy} onEdit={onEdit} onSave={onSave} />
        </>
      ) : (
        <p id={textId} className={cn("text-section font-semibold wrap-break-word", fact.status === "rejected" && "line-through")}>
          {fact.text}
        </p>
      )}

      {fact.originalText && <p className="text-sm text-muted wrap-break-word">Site wording: {fact.originalText}</p>}
      {fact.possiblyStale && <StaleFlag reason={fact.staleReason} />}
      <FactSource fact={fact} />
      <ErrorNote error={error} />

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
            variant={fact.status === "rejected" ? "secondary" : "outline"}
            className="h-11 text-base text-negative-ink"
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
    <li className="flex flex-col gap-2 border-b border-rule px-4 py-3 last:border-b-0 md:flex-row md:flex-wrap md:items-center md:gap-3 md:px-6">
      <div className="flex min-w-0 flex-col gap-0.5 md:flex-[1_1_320px]">
        <p className="font-medium wrap-break-word">{fact.text}</p>
        <p className="text-sm text-muted">{kindLabel(fact.kind)}</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-negative-ink">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        className="h-11 md:h-9"
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

// "Add a fact by hand", opened from its own button or from an empty kind
// (which picks that kind).
function AddFact({
  kind,
  onOpen,
  onClose,
  onAdd,
}: {
  kind: FactKind | null;
  onOpen: (kind: FactKind) => void;
  onClose: () => void;
  onAdd: (body: AddFactBody) => Promise<Result<FactResponse>>;
}) {
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

  if (kind === null) {
    return (
      <Button variant="outline" className="h-11 text-base sm:self-start sm:px-5 md:h-10 md:text-sm" onClick={() => onOpen("service")}>
        <Plus aria-hidden />
        Add a fact by hand
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 md:px-6 md:py-5">
      <h2 className="text-section font-semibold">Add a fact by hand</h2>
      <p className="text-sm text-muted">
        For something true that your site doesn&apos;t say. It has no source page, so it is marked as added by you.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Kind
        <span className="relative">
          <select key={kind} name="kind" defaultValue={kind} className={cn(inputClass, "appearance-none pr-9")}>
            {KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.one}
              </option>
            ))}
          </select>
          <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Fact
        <textarea name="text" required rows={3} maxLength={500} autoFocus className={cn(inputClass, "h-auto min-h-24 py-2")} />
      </label>
      <ErrorNote error={error} />
      {added && !error && (
        <p role="status" className="text-sm text-muted wrap-break-word">
          Added &ldquo;{added}&rdquo;.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button type="submit" className="h-11 text-base sm:px-5 md:h-10 md:text-sm" disabled={pending}>
          {pending ? "Adding" : "Add fact"}
        </Button>
        <Button type="button" variant="outline" className="h-11 text-base sm:px-5 md:h-10 md:text-sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </form>
  );
}
