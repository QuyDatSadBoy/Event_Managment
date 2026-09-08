"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import type { Media } from "@/lib/types";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * Upload-or-paste image field. The URL stays editable so an editor can point at
 * an external asset instead of uploading a copy.
 */
export function ImageInput({
  value,
  onChange,
  label = "Hình ảnh",
  hint,
  aspect = "aspect-16/10",
  accept = "image/*",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspect?: string;
  accept?: string;
}) {
  const api = useApi();
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const media = await api.upload<Media>("/admin/upload", file);
      onChange(media.url);
      notify("Đã tải tệp lên");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không tải được tệp", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ocean-950">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors duration-300",
          dragging ? "border-ocean-500 bg-ocean-50" : "border-ocean-200 bg-ocean-50/40",
        )}
      >
        {value ? (
          <div className={cn("relative w-full", aspect)}>
            <SafeImage src={value} alt="" sizes="(max-width: 768px) 92vw, 40vw" className="object-contain" />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                aria-label="Thay ảnh"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ocean-700 shadow-sm transition hover:bg-white"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Gỡ ảnh"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn("flex w-full flex-col items-center justify-center gap-2 px-6 py-10", aspect)}
          >
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-ocean-500" />
            ) : (
              <ImageIcon className="h-7 w-7 text-ocean-400" />
            )}
            <span className="text-sm font-medium text-ocean-800">
              {busy ? "Đang tải lên…" : "Chọn tệp hoặc kéo thả vào đây"}
            </span>
            <span className="text-xs text-ocean-950/40">
              JPG, PNG, WebP, AVIF, SVG — tối đa 25MB
            </span>
          </button>
        )}

        {busy && value && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-ocean-600" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="hoặc dán đường dẫn ảnh…"
        className="mt-2 h-10 w-full rounded-xl border border-ocean-200 bg-white px-3.5 text-sm text-ocean-950 outline-hidden transition placeholder:text-ocean-950/30 focus:border-ocean-400 focus:ring-4 focus:ring-ocean-500/10"
      />
      {hint && <p className="mt-1.5 text-xs text-ocean-950/45">{hint}</p>}
    </div>
  );
}
