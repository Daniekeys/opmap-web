"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import dough from "../../../design/photos/dough.jpg";
import { otherExamples, sampleAnswer } from "@/lib/landing";

const MONOS = ["bg-mono-1 text-mono-1-ink", "bg-mono-3 text-mono-3-ink", "bg-mono-5 text-mono-5-ink"];

// "Type who you sell to": the headline-sized field answers from local sample
// data only. Nothing is sent anywhere.
export function TrySearch() {
  const [query, setQuery] = useState("cake shops in Lekki");
  const field = useRef<HTMLTextAreaElement>(null);
  const answer = sampleAnswer(query);

  // A textarea, so a long query wraps instead of being cut off on a phone.
  // It grows to fit its text (field-sizing where supported, this elsewhere).
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [query]);

  return (
    <div className="flex flex-col gap-10">
      <label className="block">
        <span className="sr-only">Kind of business and place</span>
        <textarea
          ref={field}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/\n/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          spellCheck={false}
          autoComplete="off"
          className="block w-full resize-none overflow-hidden bg-transparent p-0 text-[clamp(40px,11.8cqw,184px)] leading-[1.05] font-bold tracking-[-0.04em] text-ink caret-accent outline-none [field-sizing:content] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
        />
      </label>
      <div className="flex flex-wrap items-start gap-12">
        <div aria-live="polite" className="max-w-4xl flex-[3_1_560px] rounded-card border border-border bg-surface text-body">
          {answer ? (
            <div>
              {answer.rows.map((r, j) => (
                <div key={r.name} className="flex min-h-18 items-center gap-3 border-b border-rule px-4 py-3">
                  <span className={`inline-flex size-10 flex-none items-center justify-center rounded-control text-sm font-semibold ${MONOS[j]}`}>
                    {r.initials}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-small text-muted">{r.why}</span>
                  </span>
                  <span className="flex-none text-small font-medium text-accent-ink">{r.fit}</span>
                </div>
              ))}
              <div className="px-4 py-3 text-small text-muted">{answer.note}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 px-4 py-5">
              <span className="font-semibold">We&rsquo;d cut that place into map tiles and search every one.</span>
              <span className="text-muted">Ask for the 5 free leads below and we&rsquo;ll run it for you.</span>
            </div>
          )}
        </div>
        <div className="flex flex-[2_1_320px] flex-col gap-2">
          <Image
            src={dough}
            alt="Bread dough rising on wooden racks in a small bakery"
            sizes="(min-width: 1280px) 460px, (min-width: 768px) 40vw, 100vw"
            className="lp-photo mb-5 aspect-4/3 w-full object-cover"
          />
          <span className="text-lg text-muted">Or try</span>
          {otherExamples(query).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuery(q)}
              className="cursor-pointer py-1.5 text-left text-[clamp(22px,2.4cqw,34px)] leading-[1.25] font-medium tracking-[-0.015em] text-ink underline decoration-control underline-offset-5 transition-colors hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
