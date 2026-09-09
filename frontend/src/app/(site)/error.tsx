"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page grid min-h-[70dvh] place-items-center py-24">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="mt-7 text-balance text-2xl font-bold tracking-tight text-ink">
          Đã có lỗi xảy ra
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-ink-muted">
          Trang này tạm thời không tải được. Vui lòng thử lại sau ít phút.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-muted">Mã lỗi: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-ink transition hover:bg-accent-400"
          >
            <RotateCw className="h-4 w-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-brand-200 px-6 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
