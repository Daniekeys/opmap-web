"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import aerial from "../../../design/photos/aerial.jpg";
import { SAMPLE_BAKERY } from "@/lib/landing";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    clause: "First, tell us what you sell.",
    detail: "Paste your website, or describe your business in a few lines if you don’t have one.",
    caption: "Sample: Daniekeys Studios reading its own website.",
  },
  {
    clause: "Then approve what is true.",
    detail: "We pull out your services and proof. You approve each fact, so nothing stale reaches a customer.",
    caption: "Nothing reaches a customer until you approve it.",
  },
  {
    clause: "We search the city tile by tile.",
    detail: "We cut your city into small map tiles and search each one, then keep only the businesses that fit.",
    caption: "Tile counts are sample data. Photo: a Nigerian market from above.",
  },
  {
    clause: "Finally, send it on WhatsApp.",
    detail: "Open a lead, read what to offer and why, and send the ready message. Then tap what happened.",
    caption: "Sample data. You always press send yourself, and anyone who asks to stop is never contacted again.",
  },
];

// Four steps on the left drive a product fragment on the right. Real tabs:
// arrow keys, Home and End move between them, and each stage is a tabpanel.
// All four panels sit in one grid cell so the card keeps its height and the
// stages crossfade.
export function HowItWorks() {
  const [stage, setStage] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const go = (next: number) => {
    const i = (next + STEPS.length) % STEPS.length;
    setStage(i);
    tabs.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowDown: stage + 1,
      ArrowRight: stage + 1,
      ArrowUp: stage - 1,
      ArrowLeft: stage - 1,
      Home: 0,
      End: STEPS.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    go(moves[e.key]);
  };

  const panels = [<Describe key={0} />, <Approve key={1} />, <Search key={2} />, <Send key={3} />];

  return (
    <div className="flex min-h-[760px] flex-wrap">
      <div className="flex flex-[1_1_520px] flex-col gap-12 bg-raised px-6 py-14">
        <h2 id="how-h" className="max-w-2xl text-[clamp(36px,4.6cqw,72px)] leading-none font-bold tracking-[-0.035em]">
          From your website to a sent message.
        </h2>
        <div role="tablist" aria-label="How it works" aria-orientation="vertical" className="flex flex-col gap-1" onKeyDown={onKeyDown}>
          {STEPS.map((s, i) => {
            const on = i === stage;
            return (
              <button
                key={s.clause}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`${id}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setStage(i)}
                className={cn(
                  "flex cursor-pointer items-start gap-5 py-3.5 text-left transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent",
                  on ? "text-ink" : "text-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[0.3em] size-5.5 flex-none rounded-tile transition-colors duration-200",
                    on ? "bg-accent" : i < stage ? "bg-accent-track" : "bg-control",
                  )}
                />
                <span className="flex max-w-xl flex-col gap-2.5">
                  <span className="text-[clamp(24px,2.6cqw,38px)] leading-[1.12] font-semibold tracking-[-0.02em]">{s.clause}</span>
                  {on && <span className="text-lg leading-7 text-muted">{s.detail}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-auto max-w-md text-base leading-6 text-muted">
          Your first five leads arrive within two working days. After that, a campaign keeps finding new ones as the map fills in.
        </p>
      </div>

      <div className="flex flex-[1_1_520px] flex-col items-center justify-center gap-4 bg-accent-soft px-6 py-14">
        <div className="grid min-h-[560px] w-full max-w-xl rounded-card border border-border bg-surface p-6 text-body">
          {panels.map((panel, i) => (
            <div
              key={i}
              id={`${id}-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${i}`}
              tabIndex={i === stage ? 0 : -1}
              className={cn(
                "lp-stage col-start-1 row-start-1 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent",
                i === stage ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              {panel}
            </div>
          ))}
        </div>
        <p className="w-full max-w-xl text-sm leading-5 text-muted">{STEPS[stage].caption}</p>
      </div>
    </div>
  );
}

const Pill = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span className={cn("flex-none rounded-full px-2 text-small leading-[22px] font-medium", className)}>{children}</span>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-baseline justify-between gap-4 border-b border-rule py-[11px]">{children}</span>
);

function Describe() {
  const pages = ["Home", "About", "Services", "Portfolio", "Contact", "4 case studies"];
  const sells = [
    ["Websites for small businesses", "/services"],
    ["Online order and booking pages", "/portfolio"],
    ["WhatsApp ordering setup", "/case-studies/ope-salon"],
    ["Product and brand photography", "/services"],
  ];
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <span className="text-small text-muted">Your website or Instagram</span>
        <span className="flex h-11 items-center justify-between gap-3 rounded-control border border-control pr-1.5 pl-3.5 text-base">
          <span className="truncate">daniekeysstudios.com</span>
          <span className="inline-flex h-8 flex-none items-center rounded-control bg-primary px-3 text-sm font-semibold text-on-primary">Read site</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="font-semibold">Read 9 pages</span>
        <span className="flex flex-wrap gap-1.5">
          {pages.map((p) => (
            <span key={p} className="rounded-full bg-raised px-2.5 text-small leading-[26px]">
              {p}
            </span>
          ))}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="pb-1.5 font-semibold">What you sell, as we found it</span>
        {sells.map(([what, src]) => (
          <Row key={what}>
            <span>{what}</span>
            <span className="flex-none text-small text-muted">{src}</span>
          </Row>
        ))}
      </div>
      <span className="text-sm text-muted">16 facts found in all. Next you check each one.</span>
    </div>
  );
}

function Approve() {
  const facts = [
    ["Websites for small businesses", "/services", true],
    ["Built 30+ sites for Nigerian businesses", "/portfolio", true],
    ["Sites from ₦150,000", "/services", false],
  ] as const;
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2.5">
        <span className="flex items-baseline gap-2.5">
          <span className="text-[32px] leading-none font-bold tracking-[-0.02em] tabular-nums">12 of 16</span>
          <span className="text-muted">facts approved</span>
        </span>
        <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-accent-track">
          <span className="block h-full w-3/4 bg-accent" />
        </span>
      </div>
      <div className="flex flex-col">
        {facts.map(([what, src, ok]) => (
          <span key={what} className="flex items-center justify-between gap-4 border-b border-rule py-3">
            <span className="flex flex-col">
              <span>{what}</span>
              <span className="text-small text-muted">{src}</span>
            </span>
            <Pill className={ok ? "bg-positive-soft text-positive-ink" : "bg-neutral-soft text-neutral-ink"}>{ok ? "Approved" : "Waiting"}</Pill>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-card bg-warning-soft p-4">
        <Pill className="self-start bg-surface text-warning-ink">May be out of date</Pill>
        <span className="text-[17px] font-semibold">Smart automation for small businesses</span>
        <span className="text-muted">Found on /services, last changed March 2025. Do you still offer it?</span>
        <span className="flex gap-2 pt-1">
          <span className="inline-flex h-[34px] items-center rounded-control bg-primary px-3 text-sm font-semibold text-on-primary">Remove</span>
          <span className="inline-flex h-[34px] items-center rounded-control border border-control bg-surface px-3 text-sm">Still true</span>
        </span>
      </div>
    </div>
  );
}

function Search() {
  const kpis = [
    { n: "46", l: "tiles searched", lit: false },
    { n: "612", l: "businesses read", lit: false },
    { n: "159", l: "good fits", lit: true },
  ];
  const tiles = [0, 0, 3, 0, 1, 9, 14, 2, 0, 4, 0, 0];
  return (
    <div className="flex flex-col gap-[18px]">
      <span className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <span key={k.l} className="flex flex-col gap-0.5">
            <span className={cn("text-[32px] leading-[1.1] font-bold tracking-[-0.02em] tabular-nums", k.lit ? "text-accent" : "text-ink")}>{k.n}</span>
            <span className="text-small text-muted">{k.l}</span>
          </span>
        ))}
      </span>
      <span className="relative block aspect-4/3 overflow-hidden rounded-control">
        <Image
          src={aerial}
          alt="A street market in Kaduna seen from above"
          fill
          sizes="(min-width: 768px) 530px, calc(100vw - 82px)"
          className="lp-photo object-cover"
        />
        <span aria-hidden className="absolute inset-0 grid grid-cols-4 grid-rows-3">
          {tiles.map((n, i) => (
            <span
              key={i}
              className={cn(
                "flex items-end border border-surface/50 px-2 py-1.5 text-sm font-semibold text-on-primary tabular-nums",
                n >= 8 ? "bg-accent/72" : n >= 3 ? "bg-accent/38" : "bg-ink/12",
              )}
            >
              {n || ""}
            </span>
          ))}
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span>
          <span className="font-semibold">Lekki Phase 1 tile:</span> 14 bakeries, 9 fit what you sell.
        </span>
        <span className="text-small text-muted">46 of 650 map searches used this month. We stop before the limit.</span>
      </span>
    </div>
  );
}

function Send() {
  return (
    <div className="flex flex-col gap-[18px]">
      <span className="flex items-center gap-3">
        <span className="inline-flex size-11 flex-none items-center justify-center rounded-control bg-mono-1 font-semibold text-mono-1-ink">
          {SAMPLE_BAKERY.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] font-semibold">{SAMPLE_BAKERY.name}</span>
          <span className="text-small text-muted">{SAMPLE_BAKERY.place}</span>
        </span>
        <Pill className="bg-accent-soft text-accent-ink">Strong fit</Pill>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-small text-muted">What to offer</span>
        <span className="text-[17px] font-semibold">An order page that sends each cake order to their WhatsApp</span>
      </span>
      <span className="flex flex-col gap-0.5 rounded-control bg-raised px-3.5 py-3">
        <span>&ldquo;DM to order. 3 days notice for custom cakes.&rdquo;</span>
        <span className="text-small text-muted">Instagram bio of {SAMPLE_BAKERY.handle}, read 28 Oct</span>
      </span>
      <span className="rounded-[8px_8px_8px_2px] bg-accent-soft px-4 py-3.5 leading-[23px]">
        Hi, I saw on your Instagram that you take cake orders by{" "}
        <mark className="bg-surface text-accent-ink underline decoration-accent decoration-2 underline-offset-3">DM with 3 days notice</mark>. We
        could set up a simple order page that sends each order straight to your WhatsApp, so nothing gets lost in DMs. Want me to send a quick
        example?
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-control bg-primary px-4 text-sm font-semibold text-on-primary">Open in WhatsApp</span>
        <span className="pl-2 text-small text-muted">Then tap</span>
        {["Replied", "No answer", "Not now"].map((o) => (
          <span key={o} className="rounded-full bg-neutral-soft px-2.5 text-small leading-7 text-neutral-ink">
            {o}
          </span>
        ))}
      </span>
    </div>
  );
}
