"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Download, FileText, Image as ImageIcon,
  Play, Video, X, ExternalLink,
} from "lucide-react";
import type { GalleryItem, GalleryType } from "@/lib/types";
import { cn, formatFileSize, toEmbedUrl, videoThumbnail } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { Block } from "@/components/ui/Block";
import { EmptyState } from "@/components/ui/EmptyState";

const TYPE_TABS: Array<{ value: GalleryType | "all"; label: string; icon: typeof ImageIcon }> = [
  { value: "all", label: "Tất cả", icon: ImageIcon },
  { value: "image", label: "Hình ảnh", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Tài liệu", icon: FileText },
];

export function GalleryBrowser({ items }: { items: GalleryItem[] }) {
  const [type, setType] = useState<GalleryType | "all">("all");
  const [album, setAlbum] = useState("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const albums = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.album && set.add(i.album));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => (type === "all" || i.type === type) && (album === "all" || i.album === album),
      ),
    [items, type, album],
  );

  // Only images open in the lightbox; navigation walks that subset.
  const imageIndexes = useMemo(
    () => filtered.map((it, i) => (it.type === "image" ? i : -1)).filter((i) => i >= 0),
    [filtered],
  );

  const step = (dir: 1 | -1) => {
    if (lightbox === null) return;
    const pos = imageIndexes.indexOf(lightbox);
    if (pos < 0) return;
    const next = (pos + dir + imageIndexes.length) % imageIndexes.length;
    setLightbox(imageIndexes[next]);
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, imageIndexes]);

  const active = lightbox !== null ? filtered[lightbox] : null;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.value === "all"
                ? items.length
                : items.filter((i) => i.type === tab.value).length;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setType(tab.value)}
                aria-pressed={type === tab.value}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium sm:min-h-10",
                  "transition-[background-color,color,box-shadow] duration-300",
                  type === tab.value
                    ? "bg-brand-950 text-white shadow-[0_8px_20px_-10px_rgb(12_43_41/0.8)]"
                    : "bg-brand-50 text-brand-800 hover:bg-brand-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[0.6875rem] tabular-nums",
                    type === tab.value ? "bg-white/15" : "bg-white",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {albums.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAlbum("all")}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-3.5 text-sm sm:min-h-9",
                "transition-[background-color,color] duration-300",
                album === "all"
                  ? "bg-brand-700 text-white"
                  : "text-brand-700 hover:bg-brand-50",
              )}
            >
              Mọi bộ sưu tập
            </button>
            {albums.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlbum(a)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3.5 text-sm sm:min-h-9",
                  "transition-[background-color,color] duration-300",
                  album === a ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-50",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ImageIcon}
            title="Chưa có nội dung trong mục này"
            description="Thử chọn loại nội dung hoặc bộ sưu tập khác."
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => (
            <Block key={item.id}>
              <GalleryTile item={item} onOpen={() => item.type === "image" && setLightbox(i)} />
            </Block>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-brand-950/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.title || "Xem ảnh"}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Đóng"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {imageIndexes.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Ảnh trước"
                className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:left-8"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Ảnh sau"
                className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:right-8"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="relative max-h-[86dvh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl">
              <SafeImage src={active.url} alt={active.title || ""} sizes="90vw" quality={90} />
            </div>
            {(active.title || active.description) && (
              <figcaption className="mt-4 text-center">
                {active.title && <p className="font-semibold text-white">{active.title}</p>}
                {active.description && (
                  <p className="mt-1 text-sm text-brand-200">{active.description}</p>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}

function GalleryTile({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  if (item.type === "video") {
    const embed = toEmbedUrl(item.url);
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
        className="group relative block overflow-hidden rounded-2xl bg-brand-950 card-hover"
        title={item.title}
      >
        <div className="relative aspect-16/10">
          <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107">
            <SafeImage
              src={item.thumbnail || videoThumbnail(item.url)}
              alt={item.title || "Video"}
              sizes="(max-width: 640px) 92vw, 360px"
            quality={65}
            />
          </div>
          <div className="absolute inset-0 bg-brand-950/45 transition-colors duration-500 group-hover:bg-brand-950/30" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-brand-700 shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-brand-950/70 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Video
          </span>
        </div>
        <div className="p-4">
          <p className="line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs text-brand-200">{item.description}</p>
          )}
          {!embed && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-400">
              Mở liên kết
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </a>
    );
  }

  if (item.type === "document") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-6 card-hover"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-linear-135 from-brand-600 to-brand-400 text-white transition-transform duration-500 group-hover:scale-110">
          <FileText className="h-5.5 w-5.5" />
        </span>
        <p className="mt-5 line-clamp-2 text-base font-bold leading-snug text-brand-950">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-950/55">
            {item.description}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Download className="h-4 w-4" />
          Tải xuống
          {item.file_size > 0 && (
            <span className="font-normal text-brand-950/40">{formatFileSize(item.file_size)}</span>
          )}
        </span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-2xl bg-brand-100 card-hover"
      title={item.title}
    >
      <div className="relative aspect-4/3">
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107">
          <SafeImage
            src={item.thumbnail || item.url}
            alt={item.title || "Ảnh sự kiện"}
            sizes="(max-width: 640px) 92vw, 360px"
            quality={65}
          />
        </div>
        <div
          className="absolute inset-0 bg-linear-to-t from-brand-950/90 via-brand-950/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />
        {item.title && (
          <p className="absolute inset-x-4 bottom-4 translate-y-2 text-left text-sm font-semibold text-white opacity-0 transition-[transform,opacity] duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {item.title}
          </p>
        )}
      </div>
    </button>
  );
}
