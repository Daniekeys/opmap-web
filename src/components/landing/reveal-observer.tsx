"use client";

import { useEffect } from "react";

// Scroll reveals use animation-timeline: view() in CSS (landing.css). Where a
// browser lacks it (Safari, Firefox), this marks each block as it scrolls into
// view instead. It does nothing under reduced motion.
export function RevealObserver() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("lp-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll(".lp-reveal, .lp-opening").forEach((el) => io.observe(el));
    root.classList.add("lp-io");
    return () => {
      io.disconnect();
      root.classList.remove("lp-io");
    };
  }, []);
  return null;
}
