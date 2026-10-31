// Words for the messages queue (Composer.dc.html): each row's line and pill,
// and the page's one finding sentence.
import type { MessageRow, MessagesResponse } from "./api-types/outreach";
import { dayText } from "./pipeline";

// A reply row quotes the note the user wrote, or says when they replied; a
// draft row names the offer the messages were written for.
export function rowLine(row: MessageRow, now = new Date()) {
  if (row.kind === "reply") return row.note ? `Replied: "${row.note}"` : `Replied ${dayText(row.at, now)}`;
  return row.offer ?? "Messages ready";
}

export const rowStatus = (row: MessageRow) => (row.kind === "reply" ? "Reply now" : "Draft ready");

// "Messages for 4 businesses are ready. Rossycakes replied today and is waiting on you."
export function messagesFinding(m: MessagesResponse, now = new Date()) {
  const ready = m.toSend === 0 ? "" : `Messages for ${m.toSend} ${m.toSend === 1 ? "business" : "businesses"} are ready.`;
  const first = m.queue.find((r) => r.kind === "reply");
  const waiting = first
    ? m.newReplies === 1
      ? `${first.name} replied ${dayText(first.at, now)} and is waiting on you.`
      : `${m.newReplies} replies are waiting on you, newest from ${first.name}.`
    : "";
  return [ready, waiting].filter(Boolean).join(" ") || "Nothing waiting. Messages show here once they're written.";
}
