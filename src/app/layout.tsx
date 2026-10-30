import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

// The one family (design/brand-book.md), as a variable font: 400 to 700.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
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
