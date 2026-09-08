"use client";

import { useEffect, type DependencyList } from "react";

/**
 * Runs an effect once after mount.
 *
 * Admin screens fetch with a bearer token held in the browser, so a Server
 * Component cannot pre-load them — a mount effect is the documented React
 * pattern here. `react-hooks/set-state-in-effect` cannot see that the loader's
 * state updates all happen in async continuations, so it reports every one of
 * these as a synchronous update. The exception is acknowledged once, here,
 * rather than repeated in every page.
 */
export function useMountEffect(fn: () => void, deps: DependencyList = []) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
