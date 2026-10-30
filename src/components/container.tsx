import { cn } from "@/lib/utils";

// Width rules (design/HANDOFF.md, Layout widths). "page" (1280) and "wide"
// (1440) are the landing page's centred containers, with its side padding.
// "read" (720) caps forms and long reading inside an app pane, left-aligned.
const SIZES = {
  page: "mx-auto box-content max-w-page px-4 md:px-6 xl:px-10",
  wide: "mx-auto box-content max-w-wide px-4 md:px-6 xl:px-10",
  read: "max-w-read",
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
  return <Tag className={cn("w-full", SIZES[size], className)}>{children}</Tag>;
}
