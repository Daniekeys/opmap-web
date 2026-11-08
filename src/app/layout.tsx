import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

// The one family (design/brand-book.md), as a variable font: 400 to 700, with
// its optical size axis. Optical sizing is off by default (globals.css), so app
// text uses the standard instance; the landing page turns it on for its
// display type, as the design does.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Opportunity Map",
  description: "Find and research leads for Daniekeys Studios and Afriment.",
};

// suppressHydrationWarning covers only <html>'s own attributes, which browser
// extensions (Scribe, QuillBot) add before React hydrates.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-ground">{children}</body>
    </html>
  );
}
