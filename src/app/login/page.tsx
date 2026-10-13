import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in - Opportunity Map" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Opportunity Map</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      </div>
      {/* The form reads ?next= from the URL, which is only known at request time. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        Access is by invite only. Ask a workspace owner for an invite link.
      </p>
    </main>
  );
}
