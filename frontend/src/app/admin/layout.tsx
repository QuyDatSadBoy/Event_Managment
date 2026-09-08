import type { Metadata } from "next";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { ToastProvider } from "@/components/admin/Toast";
import { AdminGate } from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị VHD Summit" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <AdminGate>{children}</AdminGate>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
