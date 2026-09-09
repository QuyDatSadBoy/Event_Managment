import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-brand-800 relative isolate grid min-h-dvh place-items-center overflow-hidden px-5">
      <div
        className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-brand-400/15 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-lg text-center">
        <p className="font-mono text-7xl font-extrabold tracking-tighter text-brand-400/25 sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Không tìm thấy trang bạn cần
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-brand-100/65">
          Đường dẫn có thể đã thay đổi hoặc nội dung đã được gỡ. Thử quay lại trang chủ hoặc xem
          chương trình sự kiện.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/chuong-trinh"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
          >
            <Compass className="h-4 w-4" />
            Xem chương trình
          </Link>
        </div>
      </div>
    </main>
  );
}
