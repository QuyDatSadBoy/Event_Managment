export default function SiteLoading() {
  return (
    <div className="pt-[var(--header-h)]">
      {/* Skeleton mirrors the common page shape: hero band, then a content grid. */}
      <div className="surface-deep h-64 animate-pulse lg:h-80" />
      <div className="container-page py-16">
        <div className="h-8 w-56 animate-pulse rounded-full bg-ocean-100" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-4/5 animate-pulse rounded-3xl bg-ocean-100" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Đang tải nội dung…</span>
    </div>
  );
}
