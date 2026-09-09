"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/admin-auth";
import { AdminShell } from "./AdminShell";

/**
 * The login screen renders bare; every other admin route waits for the session
 * check and then renders inside the shell.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname === "/admin/login") return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-brand-50/40">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-500" />
          <p className="mt-4 text-sm text-brand-950/50">Đang kiểm tra phiên đăng nhập…</p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
