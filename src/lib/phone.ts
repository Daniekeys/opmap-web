// Phone display, on its own so only the screens that show a number load
// libphonenumber-js (min metadata, about 30 KB gzip): the campaigns list and
// the status badge import lib/leads.ts and never show a phone.
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

// A number as people in its own country write it: "+2348033718771" is
// "0803 371 8771", "+447911123456" is "07911 123456". The country comes from
// the number itself. An invalid number is shown as stored.
// A WhatsApp value can be a link with no number (wa.me/message/...).
export function formatPhone(e164: string) {
  if (/^https?:/.test(e164)) return "WhatsApp link";
  const parsed = parsePhoneNumberFromString(e164);
  return parsed?.isValid() ? parsed.formatNational() : e164;
}
