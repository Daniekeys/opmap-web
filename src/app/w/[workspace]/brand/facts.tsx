// Pieces shared by the Brand DNA screens.
import { ExternalLink, History, NotebookPen, TriangleAlert, UserPen } from "lucide-react";
import { DESCRIPTION_SOURCE, type Fact, type ProfileSummary } from "@/lib/api-types/brand";
import { cn } from "@/lib/utils";

export { KINDS, kindLabel } from "./kinds";

// "daniekeysstudios.com/services" from the full URL.
export function shortUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname.replace(/^www\./, "")}${pathname === "/" ? "" : pathname}`;
  } catch {
    return url;
  }
}

// Where a version was read from: "daniekeysstudios.com", or "your description
// (Instagram @handle)".
export function sourceLabel(profile: Pick<ProfileSummary, "source" | "website" | "instagram">) {
  if (profile.source === "website" && profile.website) return shortUrl(profile.website);
  return profile.instagram ? `your description (Instagram @${profile.instagram})` : "your description";
}

// Where a fact comes from: its page and the words on it, or the member who
// typed it in.
export function FactSource({ fact }: { fact: Pick<Fact, "sourceUrl" | "excerpt" | "origin"> & { addedBy?: string | null } }) {
  if (!fact.sourceUrl) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <UserPen className="size-4 shrink-0" aria-hidden />
        Added by {fact.addedBy ?? "hand"}. No source page.
      </p>
    );
  }
  if (fact.sourceUrl === DESCRIPTION_SOURCE) {
    return (
      <div className="flex flex-col gap-1.5">
        {fact.excerpt && (
          <blockquote className="border-l-2 pl-3 text-sm text-muted italic wrap-break-word">
            &ldquo;{fact.excerpt}&rdquo;
          </blockquote>
        )}
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <NotebookPen className="size-4 shrink-0" aria-hidden />
          From your description
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {fact.excerpt && (
        <blockquote className="border-l-2 pl-3 text-sm text-muted italic wrap-break-word">
          &ldquo;{fact.excerpt}&rdquo;
        </blockquote>
      )}
      <a
        href={fact.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden />
        <span className="break-all">{shortUrl(fact.sourceUrl)}</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}

export function StaleFlag({ reason, className }: { reason: string | null; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink", className)}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <span className="font-medium">May be out of date.</span> {reason}
      </span>
    </p>
  );
}

export function PreviouslyApproved() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-soft px-2 py-0.5 text-xs font-medium text-neutral-ink">
      <History className="size-3.5" aria-hidden />
      Approved before
    </span>
  );
}

export function VersionBadge({ status, className }: { status: ProfileSummary["status"]; className?: string }) {
  const tone = {
    draft: "bg-warning-soft text-warning-ink",
    approved: "bg-positive-soft text-positive-ink",
    archived: "bg-raised text-muted",
    retired: "bg-negative-soft text-negative-ink",
  }[status];
  return (
    <span className={cn("ml-1 inline-flex rounded-full px-2 py-0.5 align-middle text-xs font-medium capitalize", tone, className)}>
      {status}
    </span>
  );
}
