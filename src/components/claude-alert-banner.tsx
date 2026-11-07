import { TriangleAlert } from "lucide-react";
import type { ClaudeAlert } from "@/lib/api-types/access";

const usd = (n: number) => `$${n.toFixed(2)}`;

// The Internal plan's Claude daily alert (billing.claude_daily_alert), shown to
// owners on every workspace page until the UTC day ends. Nothing is blocked.
export function ClaudeAlertBanner({ alert }: { alert: ClaudeAlert }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-sm text-warning-ink">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-medium">Claude spend today passed the {usd(alert.thresholdUsd)} alert:</span> {usd(alert.spentUsd)} so far (UTC day). Nothing is
        blocked; this goes away at midnight UTC.
      </p>
    </div>
  );
}
