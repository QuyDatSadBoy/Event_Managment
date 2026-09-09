import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "cream" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * The primary button is the site's one orange object, and it is the same orange
 * on white and on navy — that is what makes the CTA findable on a page that
 * alternates between the two grounds.
 *
 * Its label is ink, not white. White on #ff6b1a measures 2.85:1, which fails at
 * any size; ink on the same fill is 5.44:1, and 6.35:1 once hover lightens it.
 * Darkening the orange until white passed would have cost the accent its
 * vividness, which is the thing the design is built on.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-500 text-ink hover:bg-accent-400 shadow-[0_10px_24px_-12px_rgb(217_96_15/0.7)]",
  secondary: "bg-brand-100 text-brand-700 hover:bg-brand-200",
  outline: "border border-brand-400 bg-white text-brand-700 hover:border-accent-500 hover:bg-accent-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  // The quiet button for a navy ground, where `outline` would disappear.
  cream: "bg-white text-brand-900 hover:bg-brand-50",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

const SIZES: Record<Size, string> = {
  // Every size clears 44px on touch; the compact ones shrink only where a
  // pointer makes a smaller target fine.
  sm: "h-11 px-4 text-sm gap-1.5 sm:h-9",
  md: "h-12 px-[26px] text-[0.9375rem] gap-2 sm:h-11",
  lg: "h-13 px-8 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-control font-bold tracking-tight " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-300 " +
  "ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] " +
  // 0.5 is the top of the 0.38–0.5 range a disabled control is meant to sit in.
  // pointer-events-none stays: it is what suppresses the hover background as
  // well as the click, and it drops the cursor back to an arrow, which is the
  // signal that the control is not interactive. (A `not-allowed` cursor cannot
  // coexist with it — the rule in globals.css covers the fieldset-disabled
  // inputs, which do still take pointer events.)
  "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >) {
  const external = /^https?:\/\//.test(href);
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

/** Neutral pill: navy tint, 12/600. Reads as metadata, never as a control. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold leading-none text-brand-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The tracked label above a section title. Orange steps down to accent-700 on
 * light grounds — the display orange is 2.85:1 on white and cannot carry text
 * this small — and back up to accent-400 on navy, where it is 6.9:1.
 */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-eyebrow font-extrabold uppercase",
        tone === "dark" ? "text-accent-400" : "text-accent-700",
        className,
      )}
    >
      {children}
    </p>
  );
}
