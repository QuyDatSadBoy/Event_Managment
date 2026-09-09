import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "cream" | "danger";
type Size = "sm" | "md" | "lg";

/** design.pen "Button Primary": brand-primary, radius 8, padding 14/26, label 15/700. */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-800",
  secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
  outline: "border border-line bg-white text-brand-600 hover:border-brand-400 hover:bg-brand-50",
  ghost: "text-brand-800 hover:bg-brand-50",
  cream: "bg-cream text-brand-800 hover:bg-white",
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
  "disabled:pointer-events-none disabled:opacity-55 whitespace-nowrap";

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

/** design.pen "Tag": brand-tint pill, 12/600, brand-primary-dark. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-200 px-3 py-1.5 text-xs font-semibold leading-none text-brand-800",
        className,
      )}
    >
      {children}
    </span>
  );
}
