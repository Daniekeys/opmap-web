// Pieces shared by the Brand DNA screens.
import { ExternalLink, History, TriangleAlert, UserPen } from "lucide-react";
import type { Fact, ProfileSummary } from "@/lib/api-types/brand";
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

// Where a fact comes from: its page and the words on it, or the user.
export function FactSource({ fact }: { fact: Pick<Fact, "sourceUrl" | "excerpt" | "origin"> }) {
  if (!fact.sourceUrl) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <UserPen className="size-4 shrink-0" aria-hidden />
        Added by you. No source page.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {fact.excerpt && (
        <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground italic wrap-break-word">
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
    <p className={cn("flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900", className)}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <span className="font-medium">May be out of date.</span> {reason}
      </span>
    </p>
  );
}

export function PreviouslyApproved() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
      <History className="size-3.5" aria-hidden />
      Approved before
    </span>
  );
}

export function VersionBadge({ status, className }: { status: ProfileSummary["status"]; className?: string }) {
  const tone = {
    draft: "bg-amber-100 text-amber-900",
    approved: "bg-emerald-100 text-emerald-800",
    archived: "bg-muted text-muted-foreground",
    retired: "bg-destructive/10 text-destructive",
  }[status];
  return (
    <span className={cn("ml-1 inline-flex rounded-full px-2 py-0.5 align-middle text-xs font-medium capitalize", tone, className)}>
      {status}
    </span>
  );
}
