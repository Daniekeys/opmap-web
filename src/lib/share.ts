// Words and send links for a shared campaign (spec, Core pipelines > Sharing a campaign).
import type { SharedLead } from "./api-types/share";
import { whatsappSendHref } from "./outreach";

export const SHARE_CHANNEL_NAMES: Record<string, string> = { whatsapp: "WhatsApp", email: "Email", linkedin: "LinkedIn message", call: "Call opener" };

const STAGES: Record<string, string> = { new: "New", sent: "Sent", replied: "Replied", meeting: "Meeting", won: "Won", lost: "Lost" };
export const shareStageName = (stage: string) => STAGES[stage] ?? stage;

// Where a message can be sent from the shared page, as the app sends it: the
// WhatsApp draft opens in WhatsApp with its text, the email in the reader's
// mail app, the call opener dials. LinkedIn has no link: copy and paste.
export function messageLinks(targets: SharedLead["targets"], m: { channel: string; subject: string | null; body: string }) {
  const enc = encodeURIComponent;
  if (m.channel === "whatsapp" && targets.whatsapp) return [{ label: "Open in WhatsApp", href: whatsappSendHref(targets.whatsapp, m.body) }];
  if (m.channel === "email" && targets.email) return [{ label: "Open in email", href: `mailto:${targets.email}?subject=${enc(m.subject ?? "")}&body=${enc(m.body)}` }];
  if (m.channel === "call" && targets.call) return [{ label: "Call", href: `tel:${targets.call}` }];
  return [];
}
