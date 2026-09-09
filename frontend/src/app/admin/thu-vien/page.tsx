"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Eye, EyeOff, FileText, Images, Loader2, Pencil, Plus, Trash2, Upload, Video,
} from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { GalleryItem, GalleryType, Media } from "@/lib/types";
import { cn, formatFileSize, videoThumbnail } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminSearch, AsyncState, FilterChips } from "@/components/admin/DataShell";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";

const TYPES: GalleryType[] = ["image", "video", "document"];
const TYPE_LABEL: Record<GalleryType, string> = {
  image: "Hình ảnh",
  video: "Video",
  document: "Tài liệu",
};

type FormState = {
  title: string;
  description: string;
  type: GalleryType;
  url: string;
  thumbnail: string;
  album: string;
  file_size: number;
  sort_order: number;
  is_published: boolean;
};

const EMPTY: FormState = {
  title: "", description: "", type: "image", url: "", thumbnail: "", album: "",
  file_size: 0, sort_order: 0, is_published: true,
};

export default function AdminGalleryPage() {
  const api = useApi();
  const { notify } = useToast();
  const bulkRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<GalleryType | "all">("all");
  const [bulkBusy, setBulkBusy] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.list<GalleryItem>("/admin/gallery?per_page=120");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được thư viện");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const albums = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.album && set.add(i.album));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (!q) return true;
      return [i.title, i.description, i.album].join(" ").toLowerCase().includes(q);
    });
  }, [items, search, type]);

  const counts = useMemo(
    () => ({
      all: items.length,
      ...Object.fromEntries(TYPES.map((t) => [t, items.filter((i) => i.type === t).length])),
    }),
    [items],
  ) as Record<GalleryType | "all", number>;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length, type: type === "all" ? "image" : type });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (g: GalleryItem) => {
    setEditing(g);
    setForm({
      title: g.title,
      description: g.description,
      type: g.type,
      url: g.url,
      thumbnail: g.thumbnail,
      album: g.album,
      file_size: g.file_size,
      sort_order: g.sort_order,
      is_published: g.is_published,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim()) {
      setFieldErrors({ url: "Vui lòng tải tệp lên hoặc dán đường dẫn" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        url: form.url.trim(),
        thumbnail: form.thumbnail.trim(),
        album: form.album.trim(),
        file_size: Number(form.file_size) || 0,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        await api.put(`/admin/gallery/${editing.id}`, payload);
        notify("Đã cập nhật mục thư viện");
      } else {
        await api.post("/admin/gallery", payload);
        notify("Đã thêm vào thư viện");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        notify(err.message, "error");
      } else notify("Không lưu được", "error");
    } finally {
      setSaving(false);
    }
  };

  /** Bulk upload: each file becomes an image row named after the original file. */
  const bulkUpload = async (files: FileList) => {
    const list = Array.from(files);
    setBulkBusy(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        const media = await api.upload<Media>("/admin/upload", file);
        const kind: GalleryType = media.mime_type.startsWith("video/")
          ? "video"
          : media.mime_type === "application/pdf"
            ? "document"
            : "image";
        await api.post("/admin/gallery", {
          title: file.name.replace(/\.[^.]+$/, ""),
          type: kind,
          url: media.url,
          thumbnail: kind === "image" ? media.url : "",
          file_size: media.size,
          is_published: true,
          sort_order: items.length + ok,
        });
        ok += 1;
      } catch {
        // Keep going; the summary below reports how many made it.
      }
      setBulkBusy((n) => n - 1);
    }
    notify(
      ok === list.length
        ? `Đã tải lên ${ok} tệp`
        : `Đã tải lên ${ok}/${list.length} tệp, một số tệp bị bỏ qua`,
      ok === list.length ? "success" : "error",
    );
    await load();
  };

  const togglePublished = async (g: GalleryItem) => {
    try {
      await api.put(`/admin/gallery/${g.id}`, { ...g, is_published: !g.is_published });
      setItems((list) =>
        list.map((x) => (x.id === g.id ? { ...x, is_published: !x.is_published } : x)),
      );
      notify(g.is_published ? "Đã ẩn khỏi thư viện công khai" : "Đã hiển thị công khai");
    } catch {
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/gallery/${deleting.id}`);
      setItems((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá khỏi thư viện");
      setDeleting(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const TypeIcon = ({ kind }: { kind: GalleryType }) =>
    kind === "video" ? (
      <Video className="h-3.5 w-3.5" />
    ) : kind === "document" ? (
      <FileText className="h-3.5 w-3.5" />
    ) : (
      <Images className="h-3.5 w-3.5" />
    );

  return (
    <>
      <AdminPageHeader
        title="Thư viện"
        description="Tải ảnh mới, thêm liên kết video và đăng tài liệu báo chí cho sự kiện."
        action={
          <>
            <Button
              variant="outline"
              onClick={() => bulkRef.current?.click()}
              disabled={bulkBusy > 0}
            >
              {bulkBusy > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Còn {bulkBusy} tệp…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Tải nhiều ảnh
                </>
              )}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm mục
            </Button>
          </>
        }
      />

      <input
        ref={bulkRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) bulkUpload(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={type}
          onChange={setType}
          options={[
            { value: "all" as const, label: "Tất cả", count: counts.all },
            ...TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t], count: counts[t] })),
          ]}
        />
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm theo tên, bộ sưu tập…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={Images}
        emptyTitle={search || type !== "all" ? "Không có mục phù hợp" : "Thư viện đang trống"}
        emptyDescription={
          search || type !== "all"
            ? "Thử bỏ bộ lọc hoặc dùng từ khoá khác."
            : "Tải ảnh đầu tiên hoặc thêm liên kết video."
        }
        emptyAction={
          !search &&
          type === "all" && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm mục
            </Button>
          )
        }
        onRetry={load}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className={cn(
                "group overflow-hidden rounded-2xl border bg-white transition-[transform,box-shadow,border-color,opacity] duration-400 hover:-translate-y-1 hover:shadow-[0_20px_44px_-24px_rgb(12_43_41/0.4)]",
                g.is_published ? "border-brand-100" : "border-dashed border-brand-200 opacity-70",
              )}
            >
              <div className="relative aspect-4/3 bg-brand-50">
                {g.type === "document" ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <FileText className="h-10 w-10 text-brand-400" />
                  </div>
                ) : (
                  <SafeImage
                    src={g.thumbnail || (g.type === "image" ? g.url : videoThumbnail(g.url))}
                    alt={g.title || ""}
                    sizes="(max-width: 640px) 92vw, 25vw"
                  />
                )}

                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-950/70 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  <TypeIcon kind={g.type} />
                  {TYPE_LABEL[g.type]}
                </span>

                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => togglePublished(g)}
                    aria-label={g.is_published ? "Ẩn" : "Hiển thị"}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-700 shadow-sm transition hover:bg-white"
                  >
                    {g.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(g)}
                    aria-label="Sửa"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-700 shadow-sm transition hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(g)}
                    aria-label="Xoá"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5">
                <p className="line-clamp-1 text-sm font-semibold text-brand-950">
                  {g.title || "(chưa đặt tên)"}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-brand-950/45">
                  {g.album || "Chưa phân bộ"}
                  {g.file_size > 0 && <span>· {formatFileSize(g.file_size)}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AsyncState>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? "Sửa mục thư viện" : "Thêm vào thư viện"}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="h-11 rounded-full px-5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <Button type="submit" form="gallery-form" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="gallery-form" onSubmit={save} className="space-y-5">
          <SelectField
            id="g-type"
            label="Loại nội dung"
            value={form.type}
            onChange={(e) => set("type", e.target.value as GalleryType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </SelectField>

          {form.type === "image" ? (
            <ImageInput
              value={form.url}
              onChange={(url) => set("url", url)}
              label="Ảnh"
              aspect="aspect-4/3 max-h-64"
            />
          ) : (
            <TextField
              id="g-url"
              type="url"
              label={form.type === "video" ? "Liên kết video" : "Đường dẫn tài liệu"}
              required
              value={form.url}
              error={fieldErrors.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder={
                form.type === "video"
                  ? "https://www.youtube.com/watch?v=…"
                  : "https://…/tai-lieu.pdf"
              }
              hint={
                form.type === "document"
                  ? "Tải PDF lên qua ô ảnh bìa bên dưới nếu chưa có đường dẫn."
                  : undefined
              }
            />
          )}

          {form.type !== "image" && (
            <ImageInput
              value={form.thumbnail}
              onChange={(url) => set("thumbnail", url)}
              label="Ảnh đại diện"
              aspect="aspect-16/9 max-h-56"
              accept={form.type === "document" ? "image/*,application/pdf" : "image/*"}
            />
          )}

          <TextField
            id="g-title"
            label="Tiêu đề"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Phiên toàn thể sáng ngày 1"
          />

          <TextAreaField
            id="g-desc"
            label="Mô tả"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="g-album"
              label="Bộ sưu tập"
              value={form.album}
              onChange={(e) => set("album", e.target.value)}
              placeholder="VHD Summit 2025"
              list="album-list"
            />
            <TextField
              id="g-order"
              type="number"
              label="Thứ tự"
              value={String(form.sort_order)}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
          <datalist id="album-list">
            {albums.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-200 px-4 py-3 transition hover:bg-brand-50">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-brand-950">Hiển thị công khai</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá khỏi thư viện"
        message={`Xoá “${deleting?.title || "mục này"}”? Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
