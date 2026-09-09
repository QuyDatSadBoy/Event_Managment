import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "white" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-linear-to-r from-ocean-700 to-ocean-600 text-white " +
    "shadow-[0_10px_30px_-12px_rgb(4_95_173/0.75)] " +
    "hover:from-ocean-600 hover:to-ocean-500 hover:shadow-[0_16px_40px_-12px_rgb(6_120_214/0.65)]",
  secondary: "bg-ocean-50 text-ocean-800 hover:bg-ocean-100",
  ghost: "text-ocean-800 hover:bg-ocean-50",
  outline: "border border-ocean-200 text-ocean-800 bg-white/60 hover:border-ocean-400 hover:bg-white",
  white: "bg-white text-ocean-900 hover:bg-ocean-50 shadow-lg",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

// Every size clears 44px on touch; the compact variants only shrink from sm up,
// where a pointer makes a 36px target fine.
const SIZES: Record<Size, string> = {
  sm: "h-11 px-4 text-sm gap-1.5 sm:h-9",
  md: "h-12 px-6 text-[0.9375rem] gap-2 sm:h-11",
  lg: "h-13 px-8 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-full font-semibold tracking-tight " +
  "transition-[background-color,box-shadow,transform,border-color,color] duration-300 " +
  "ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] " +
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
}: CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">) {
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
