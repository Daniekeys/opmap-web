import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This page does not exist, or it belongs to a workspace you are not a member of.
      </p>
      <Link href="/" className={buttonVariants({ className: "h-11 self-start px-4" })}>
        Go to your workspace
      </Link>
    </main>
  );
}
