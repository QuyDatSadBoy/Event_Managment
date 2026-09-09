"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Block } from "@/components/ui/Block";

/** Shows the ticket code passed back from the registration API, if present. */
export function TicketCode() {
  const code = useSearchParams().get("code")?.trim();
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still readable on screen.
    }
  };

  return (
    <Block>
      <div className="mx-auto mt-9 max-w-sm rounded-2xl border border-brand-400/25 bg-white/8 p-6 backdrop-blur-md">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
          Mã tham dự của bạn
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <code className="font-mono text-2xl font-bold tracking-wider text-cream">
            {code}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Sao chép mã tham dự"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            {copied ? <Check className="h-4 w-4 text-brand-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-3 text-xs text-brand-200">
          Xuất trình mã này tại quầy đón khách để nhận thẻ tham dự.
        </p>
      </div>
    </Block>
  );
}
