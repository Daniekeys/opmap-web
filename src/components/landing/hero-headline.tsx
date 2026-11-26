"use client";

import { useEffect, useRef, useState } from "react";

// Sample tiles the headline cycles through. Every place is short enough that
// "is in [tile] Place." stays within the container at the headline's size
// (16.4cqw, about 6.1em of room): Surulere or Gbagada would run off the edge.
// The first one is what the server renders, so hydration matches.
export const HERO_TILES = [
  { count: 14, kind: "bakeries", place: "Lekki" },
  { count: 22, kind: "salons", place: "Yaba" },
  { count: 9, kind: "pharmacies", place: "Ikeja" },
  { count: 17, kind: "boutiques", place: "Ajah" },
  { count: 11, kind: "restaurants", place: "Ikoyi" },
  { count: 8, kind: "car washes", place: "Ojota" },
  { count: 19, kind: "barbers", place: "Ogba" },
  { count: 12, kind: "clinics", place: "Isolo" },
  { count: 16, kind: "eateries", place: "Ketu" },
  { count: 7, kind: "schools", place: "Epe" },
] as const;

const EVERY_MS = 3000;

// The hero headline. The lit tile and the place change every 3 seconds: the
// tile shutters open again, its number counts up, and the place rises in.
// It holds still under reduced motion, while the pointer is over it, when the
// hero is off screen and when the tab is hidden. Screen readers get one
// steady sentence instead of a line that changes under them.
export function HeroHeadline() {
  // How many times the tile has changed; 0 is the server-rendered first tile.
  const [turns, setTurns] = useState(0);
  const [n, setN] = useState<number>(HERO_TILES[0].count);
  const [hover, setHover] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [still, setStill] = useState(true);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still || hover || !onScreen) return;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      setTurns((x) => x + 1);
    }, EVERY_MS);
    return () => window.clearInterval(t);
  }, [still, hover, onScreen]);

  // Count up to the new number while the tile opens.
  useEffect(() => {
    if (turns === 0) return;
    const target = HERO_TILES[turns % HERO_TILES.length].count;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setN(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [turns]);

  const i = turns % HERO_TILES.length;
  const tile = HERO_TILES[i];
  const first = HERO_TILES[0];
  const swap = turns > 0;

  return (
    <h1
      ref={ref}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="lp-rise m-0 text-[clamp(40px,16.4cqw,256px)] leading-[0.92] font-bold tracking-[-0.05em] whitespace-nowrap"
    >
      <span className="sr-only">
        Your next client is in {first.place}: a lit map tile with {first.count} {first.kind}.
      </span>
      <span aria-hidden>
        Your next
        <br />
        client
        <br />
        is in{" "}
        <span key={`t${turns}`} className={`${swap ? "lp-swap" : "lp-shutter"} inline-block h-[0.7em] w-[1.7em] overflow-hidden bg-accent align-baseline text-on-primary`}>
          <span className="flex size-full flex-col justify-end px-[0.12em] py-[0.09em] text-[0.16em] leading-[1.15] font-semibold tracking-normal">
            <span className="text-[2.4em] leading-none tabular-nums">{swap ? n : tile.count}</span>
            <span>{tile.kind}</span>
          </span>
        </span>{" "}
        <span key={`p${turns}`} className={swap ? "lp-place inline-block" : "inline-block"}>
          {tile.place}.
        </span>
      </span>
    </h1>
  );
}
