"use client";

import { useState } from "react";
import { CONTACT_EMAIL, leadsRequestMailto } from "@/lib/landing";

// The closing sentence has a blank, and the blank is the form. Sending opens
// the visitor's email app with a message to us; nothing is posted anywhere.
// No mailto action on the form itself: on https, browsers flag a mailto form
// target as insecure. The address under the form covers anyone without
// JavaScript.
export function LeadsForm() {
  const [site, setSite] = useState("");
  const [opened, setOpened] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.trim()) return;
    window.location.href = leadsRequestMailto(site);
    setOpened(true);
  };

  return (
    <form onSubmit={onSubmit} className="m-0">
      <div className="text-[clamp(36px,8.8cqw,150px)] leading-[1.1] font-bold tracking-[-0.04em]">
        <h2 id="cta-h" className="m-0 sm:inline">
          Get five free leads for{" "}
        </h2>
        <div className="mt-3 flex gap-2 sm:mt-0 sm:inline">
          <label className="min-w-0 flex-1 sm:inline">
            <span className="sr-only">Your website or Instagram</span>
            <input
              type="text"
              name="site"
              required
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="your website"
              autoComplete="url"
              className="h-[1.3em] w-full rounded-none bg-raised px-[0.2em] text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent sm:h-[1.05em] sm:w-[6.4em] sm:align-[-0.12em]"
            />
          </label>{" "}
          <button
            type="submit"
            className="lp-btn h-[1.3em] flex-none cursor-pointer bg-primary px-[0.3em] text-on-primary hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent sm:h-[1.05em] sm:align-[-0.12em]"
          >
            Send
          </button>
        </div>
      </div>
      <p className="mt-6 text-base leading-6 text-muted">
        <span aria-live="polite">{opened ? "Your email app should open with the request ready to send. " : ""}</span>
        No email app? Send your site to {CONTACT_EMAIL}.
      </p>
    </form>
  );
}
