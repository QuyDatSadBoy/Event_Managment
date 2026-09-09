import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

type Crumb = { href: string; label: string };

export function PageHero({
  title,
  description,
  image,
  crumbs = [],
  children,
}: {
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
          <SafeImage
            src={image}
            alt=""
            // Fixed small request: at 92% scrim the detail is invisible, and a
            // full-width file made this the LCP on every inner page.
            sizes="768px"
            quality={40}
            priority
            fetchPriority="high"
          />
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

      <div className="container-page relative section-y">
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

        <h1 className="max-w-4xl text-balance text-[clamp(2rem,1.3rem+3vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
          {title}
        </h1>

        {description && (
          <p className="mt-5 max-w-[46ch] text-pretty text-base leading-relaxed text-ocean-100/78 lg:text-lg">
            {description}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
