import tokens from "../../design/tokens.json";

// The public address, for absolute links in share previews, robots.txt and the
// sitemap. Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every build;
// NEXT_PUBLIC_SITE_URL overrides it (a custom domain later).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3001")
).replace(/\/$/, "");

export const SITE_TITLE = "Opportunity Map: your next client, street by street";
// One line, from the hero subhead.
export const SITE_DESCRIPTION =
  "Finds the local businesses most likely to buy what you sell, shows what to offer each one with proof, and writes the WhatsApp message for you.";

// Light-theme colours from design/tokens.json, for images drawn outside CSS
// (the share image and the app icons).
const light = (name: string) => {
  const token = tokens.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`No colour token ${name}`);
  return token.value.light;
};
export const BRAND = {
  ground: light("ground"),
  ink: light("ink"),
  muted: light("muted"),
  accent: light("accent"),
  // Unlit tiles: control, one step stronger than the logo's border tint, so
  // the mark still reads in a small preview or a browser tab.
  tile: light("control"),
};
