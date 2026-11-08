"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "ghost" }) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    // The web's own route revokes the session on the API and clears every
    // auth cookie (src/app/auth/sign-out/route.ts). Leave even if it fails:
    // the login page is the safe place to be.
    await fetch("/auth/sign-out", { method: "POST" }).catch(() => {});
    // A full load, replacing this page in history, so Back can't bring the
    // signed-in screen (or the router's in-memory cache) back.
    window.location.replace("/login");
  }

  return (
    <Button variant={variant} className={cn("h-11 px-3", className)} disabled={pending} onClick={signOut}>
      <LogOut />
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}
