"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/** Debounced search box that keeps the query in the URL so results are shareable. */
export function SpeakerSearch({
  defaultValue = "",
  placeholder = "Tìm theo tên, chức danh, đơn vị…",
  basePath = "/dien-gia",
}: {
  defaultValue?: string;
  placeholder?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page"); // a new query always starts from page 1
      const qs = next.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    }, 350);
    return () => clearTimeout(id);
    // searchParams is intentionally excluded: reacting to it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-full border border-brand-400 bg-white pl-11 pr-10 text-sm text-ink outline-hidden transition duration-300 placeholder:text-ink-muted focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Xoá tìm kiếm"
          className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-400 transition hover:bg-brand-50 hover:text-brand-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
