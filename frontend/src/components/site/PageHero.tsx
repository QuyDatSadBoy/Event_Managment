import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

type Crumb = { href: string; label: string };

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div className="absolute inset-0 -z-20">
        {image ? (
          <SafeImage src={image} alt="" sizes="100vw" priority quality={75} />
        ) : (
          <div className="surface-deep absolute inset-0" />
        )}
      </div>
      <div
        className="absolute inset-0 -z-10 bg-linear-to-br from-abyss/94 via-abyss/85 to-ocean-900/78"
        aria-hidden
      />
      <div className="grid-overlay absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div
        className="absolute -right-32 -top-24 -z-10 h-80 w-80 rounded-full bg-cyan-glow/15 blur-3xl"
        aria-hidden
      />

      <div className="container-page relative py-16 lg:py-24">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ocean-100/55">
            <li>
              <Link href="/" className="transition hover:text-white">
                Trang chủ
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 opacity-50" />
                {i === crumbs.length - 1 ? (
                  <span className="text-ocean-100/85">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="transition hover:text-white">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ocean-100 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow" />
            {eyebrow}
          </p>
        )}

        <h1 className="max-w-4xl text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {description && (
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-ocean-100/75 lg:text-lg">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
