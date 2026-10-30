"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { goToLogin } from "@/lib/go-to-login";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "ghost" }) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    // Leave even if the request fails: the login page is the safe place to be.
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
    goToLogin();
  }

  return (
    <Button variant={variant} className={cn("h-11 px-3", className)} disabled={pending} onClick={signOut}>
      <LogOut />
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}
