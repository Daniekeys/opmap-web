import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "./site";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const SHARE_IMAGE_ALT = "Opportunity Map: the lit 2x2 tile mark and the wordmark";

const WORDMARK = "Opportunity Map";
const LINE = "Your next client, street by street.";

// DM Sans 700 as TrueType (the image renderer can't read the woff2 that
// next/font serves). The file is in the repo (SIL Open Font License), so the
// image builds without the network.
const dmSans = () => readFile(join(process.cwd(), "src/assets/dm-sans-700.ttf"));

// The share preview: the lit 2x2 tile mark and the wordmark on the ground.
export async function shareImage() {
  const font = await dmSans();
  const tile = (lit: boolean) => (
    <div style={{ width: 112, height: 112, borderRadius: 16, background: lit ? BRAND.accent : BRAND.tile }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 72,
          padding: "0 104px",
          background: BRAND.ground,
          fontFamily: "DM Sans",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16 }}>
            {tile(false)}
            {tile(true)}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {tile(false)}
            {tile(false)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: BRAND.ink }}>{WORDMARK}</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, color: BRAND.muted }}>{LINE}</div>
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts: [{ name: "DM Sans", data: font, weight: 700, style: "normal" }] },
  );
}
