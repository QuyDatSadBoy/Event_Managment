import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

/**
 * A layout wrapper. It used to fade its children in on scroll.
 *
 * That entrance ran on fifty-five elements across the home page — the same
 * fade-up on every card and every section, which reads as a template rather
 * than a decision, and it made content depend on JavaScript and an observer
 * firing before anyone could read it.
 *
 * Motion on this site is now input-driven instead: cards lift under the
 * pointer, agenda rows expand, the hero carousel advances, the countdown ticks.
 * Those respond to a person; an entrance animation only delays them.
 */
export function Block({ children, className, as: Tag = "div" }: Props) {
  return <Tag className={cn(className)}>{children}</Tag>;
}
