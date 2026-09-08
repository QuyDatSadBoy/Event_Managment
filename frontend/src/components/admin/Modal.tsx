"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-abyss/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ocean-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ocean-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-ocean-950/50">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ocean-400 transition hover:bg-ocean-50 hover:text-ocean-700"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-ocean-100 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Xoá",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded-full px-5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-10 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ocean-950/70">{message}</p>
    </Modal>
  );
}
