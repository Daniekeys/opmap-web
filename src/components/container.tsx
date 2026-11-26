import { cn } from "@/lib/utils";

// Width rules (design/HANDOFF.md, Layout widths). "page" (1280) and "wide"
// (1440) are the landing page's centred containers, with its side padding.
// "read" (720) caps forms and long reading inside an app pane, left-aligned.
// The landing widths are the content box with the padding outside it, so the
// width is 100% less the padding at each step (w-full would add the padding
// on top and overflow a phone by 32px).
const PADDED = "mx-auto box-content px-4 w-[calc(100%-2rem)] md:px-6 md:w-[calc(100%-3rem)] xl:px-10 xl:w-[calc(100%-5rem)]";
const SIZES = {
  page: `${PADDED} max-w-page`,
  wide: `${PADDED} max-w-wide`,
  read: "w-full max-w-read",
};

export function Container({
  size = "page",
  as: Tag = "div",
  className,
  children,
}: {
  size?: keyof typeof SIZES;
  as?: "div" | "section" | "header" | "footer" | "nav" | "main" | "form";
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={cn(SIZES[size], className)}>{children}</Tag>;
}
