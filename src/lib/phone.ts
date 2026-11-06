// Phone display, on its own so only the screens that show a number load
// libphonenumber-js (min metadata, about 30 KB gzip): the campaigns list and
// the status badge import lib/leads.ts and never show a phone.
import { type CountryCode, getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString } from "libphonenumber-js/min";

// A number for a reader in `home` (the workspace's country): national when
// the number is from there ("+2348033718771" is "0803 371 8771" in Nigeria),
// international otherwise ("+234 803 371 8771" in the UK, or with no
// country). "From there" means the same calling code, so the same dialling:
// a Guernsey mobile (+44 7911) reads 07911 in the UK, as people there dial
// it. An invalid number is shown as stored. Links (tel:, wa.me) always
// use the stored E.164 value, never this text.
// A WhatsApp value can be a link with no number (wa.me/message/...).
export function formatPhone(e164: string, home: string | null) {
  if (/^https?:/.test(e164)) return "WhatsApp link";
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed?.isValid()) return e164;
  const local = home !== null && isSupportedCountry(home) && getCountryCallingCode(home as CountryCode) === parsed.countryCallingCode;
  return local ? parsed.formatNational() : parsed.formatInternational();
}
