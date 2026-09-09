import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

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
      <div className="band band-br relative isolate overflow-hidden bg-brand-900 pt-[var(--header-h)]">
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
        <div className="absolute inset-0 -z-10 bg-brand-900/88" aria-hidden />
        <div className="hex-field-dark absolute inset-0 -z-10" aria-hidden />
        <div
          className="absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-accent-500/10 blur-3xl"
          aria-hidden
        />

        <div className="container-page relative py-10 lg:py-14">
          {/* Breadcrumb links are a list of controls, not links inside prose, so
              they get no inline exception from the 24×24 pointer-target floor.
              At caption size the text box is only 16px tall, so each link
              carries its own min-height instead. */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-x-1.5 text-caption text-brand-300">
              <li>
                <Link
                  href="/"
                  className="inline-flex min-h-6 items-center transition-colors duration-300 hover:text-white"
                >
                  Trang chủ
                </Link>
              </li>
              {crumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-brand-500" aria-hidden />
                  {i === crumbs.length - 1 ? (
                    <span className="inline-flex min-h-6 items-center font-medium text-white">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="inline-flex min-h-6 items-center transition-colors duration-300 hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="max-w-4xl text-balance text-[clamp(1.875rem,1.25rem+2.4vw,2.875rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-white">
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
