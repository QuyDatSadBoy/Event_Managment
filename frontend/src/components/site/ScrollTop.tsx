"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Far enough down that the button never competes with content still on screen.
    const onScroll = () => setShow(window.scrollY > 1400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Lên đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed z-30 grid h-11 w-11 place-items-center rounded-full bg-brand-950/85 text-white backdrop-blur-md",
        "right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 sm:h-12 sm:w-12",
        "shadow-[0_12px_30px_-10px_rgb(13_20_40/0.7)] transition-[opacity,transform,background-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-brand-600",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
