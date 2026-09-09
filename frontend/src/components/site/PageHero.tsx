import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { DecoRings } from "@/components/ui/Deco";

type Crumb = { href: string; label: string };

/**
 * design.pen D2–D9 "Page hero": the same brand-primary-dark band as the home
 * hero, cutting bottom-right onto the white page below.
 *
 * The photograph is optional and sits far under the overlay, so it is requested
 * small — at this opacity a full-width file only costs the LCP its bandwidth.
 */
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
    <section className="bg-white">
      <div className="band band-br relative isolate overflow-hidden bg-brand-800 pt-[var(--header-h)]">
        {image && (
          <div className="absolute inset-0 -z-20">
            <SafeImage
              src={image}
              alt=""
              sizes="768px"
              quality={40}
              priority
              fetchPriority="high"
            />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-brand-800/88" aria-hidden />
        <DecoRings tone="dark" className="-right-40 -top-56 hidden h-[560px] w-[560px] lg:block" />

        <div className="container-page relative py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-caption text-brand-200">
              <li>
                <Link href="/" className="transition-colors duration-300 hover:text-white">
                  Trang chủ
                </Link>
              </li>
              {crumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
                  {i === crumbs.length - 1 ? (
                    <span className="text-brand-200">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors duration-300 hover:text-white">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="max-w-4xl text-balance text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-bold leading-[1.15] tracking-[-0.02em] text-white">
            {title}
          </h1>

          {description && (
            <p className="mt-4 max-w-[52ch] text-pretty leading-relaxed text-brand-200 lg:text-lg">
              {description}
            </p>
          )}

          {children && <div className="mt-7">{children}</div>}
        </div>
      </div>
    </section>
  );
}
