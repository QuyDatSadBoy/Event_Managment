"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, Newspaper, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { Post, PostCategory, Speaker } from "@/lib/types";
import {
  POST_CATEGORY_LABEL, cn, formatDateShort, fromDateTimeInput, toDateTimeInput,
} from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  AdminSearch, AsyncState, FilterChips, IconButton, RowActions, StatusPill,
  TableWrap, Td, Th,
} from "@/components/admin/DataShell";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { ImageInput } from "@/components/admin/ImageInput";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";

const CATEGORIES: PostCategory[] = ["news", "announcement", "speech", "press"];

type FormState = {
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: PostCategory;
  tags: string;
  author_name: string;
  speaker_id: string;
  published_at: string;
  featured: boolean;
  is_published: boolean;
};

const EMPTY: FormState = {
  title: "", excerpt: "", content: "", cover: "", category: "news", tags: "",
  author_name: "", speaker_id: "", published_at: "", featured: false, is_published: true,
};

export default function AdminPostsPage() {
  const api = useApi();
  const { notify } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PostCategory | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Post | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, sp] = await Promise.all([
        api.list<Post>("/admin/posts?per_page=60"),
        api.list<Speaker>("/admin/speakers?per_page=100"),
      ]);
      setPosts(list.data);
      setSpeakers(sp.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return [p.title, p.excerpt, p.author_name, ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [posts, search, category]);

  const counts = useMemo(
    () => ({
      all: posts.length,
      ...Object.fromEntries(
        CATEGORIES.map((c) => [c, posts.filter((p) => p.category === c).length]),
      ),
    }),
    [posts],
  ) as Record<PostCategory | "all", number>;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, published_at: toDateTimeInput(new Date().toISOString()) });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = async (p: Post) => {
    setEditing(p);
    setFieldErrors({});
    // The list endpoint omits content to stay light; fetch the full row to edit.
    let full = p;
    try {
      full = await api.get<Post>(`/admin/posts/${p.id}`);
    } catch {
      notify("Không tải được nội dung đầy đủ, đang mở bản rút gọn", "error");
    }
    setForm({
      title: full.title,
      excerpt: full.excerpt,
      content: full.content,
      cover: full.cover,
      category: full.category,
      tags: (full.tags ?? []).join(", "),
      author_name: full.author_name,
      speaker_id: full.speaker_id ?? "",
      published_at: toDateTimeInput(full.published_at),
      featured: full.featured,
      is_published: full.is_published,
    });
    setModalOpen(true);
  };

  const payload = (f: FormState) => ({
    title: f.title.trim(),
    excerpt: f.excerpt.trim(),
    content: f.content,
    cover: f.cover.trim(),
    category: f.category,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    author_name: f.author_name.trim(),
    speaker_id: f.speaker_id,
    published_at: fromDateTimeInput(f.published_at),
    featured: f.featured,
    is_published: f.is_published,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFieldErrors({ title: "Vui lòng nhập tiêu đề" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing) {
        await api.put(`/admin/posts/${editing.id}`, payload(form));
        notify("Đã cập nhật bài viết");
      } else {
        await api.post("/admin/posts", payload(form));
        notify("Đã đăng bài viết mới");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        notify(err.message, "error");
      } else notify("Không lưu được bài viết", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (p: Post) => {
    try {
      const full = await api.get<Post>(`/admin/posts/${p.id}`);
      await api.put(`/admin/posts/${p.id}`, {
        ...payload({
          title: full.title,
          excerpt: full.excerpt,
          content: full.content,
          cover: full.cover,
          category: full.category,
          tags: (full.tags ?? []).join(", "),
          author_name: full.author_name,
          speaker_id: full.speaker_id ?? "",
          published_at: toDateTimeInput(full.published_at),
          featured: full.featured,
          is_published: full.is_published,
        }),
        is_published: !p.is_published,
      });
      setPosts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)),
      );
      notify(p.is_published ? "Đã ẩn bài viết" : "Đã đăng bài viết");
    } catch {
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/posts/${deleting.id}`);
      setPosts((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá bài viết");
      setDeleting(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <AdminPageHeader
        title="Tin tức & Bài viết"
        description="Viết bài mới, sửa hoặc gỡ bài cũ. Tin tức và bài phát biểu dùng chung một mẫu hiển thị."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Viết bài mới
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={category}
          onChange={setCategory}
          options={[
            { value: "all" as const, label: "Tất cả", count: counts.all },
            ...CATEGORIES.map((c) => ({
              value: c,
              label: POST_CATEGORY_LABEL[c],
              count: counts[c],
            })),
          ]}
        />
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm bài viết…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={Newspaper}
        emptyTitle={search || category !== "all" ? "Không có bài viết phù hợp" : "Chưa có bài viết"}
        emptyDescription={
          search || category !== "all"
            ? "Thử bỏ bộ lọc hoặc dùng từ khoá khác."
            : "Bắt đầu bằng cách viết bài đầu tiên."
        }
        emptyAction={
          !search &&
          category === "all" && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Viết bài mới
            </Button>
          )
        }
        onRetry={load}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th className="w-20">Ảnh bìa</Th>
              <Th>Tiêu đề</Th>
              <Th className="hidden md:table-cell w-36">Chuyên mục</Th>
              <Th className="hidden lg:table-cell w-28">Ngày đăng</Th>
              <Th className="hidden lg:table-cell w-20 text-center">Lượt xem</Th>
              <Th className="w-28">Trạng thái</Th>
              <Th className="w-32 text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-brand-50/40">
                <Td>
                  <span className="relative block h-11 w-16 overflow-hidden rounded-lg bg-brand-50">
                    <SafeImage src={p.cover} alt="" sizes="64px" />
                  </span>
                </Td>
                <Td>
                  <div className="flex items-start gap-2">
                    <span className="line-clamp-2 max-w-md font-semibold leading-snug text-brand-950">
                      {p.title}
                    </span>
                    {p.featured && (
                      <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-cream text-cream" aria-label="Nổi bật" />
                    )}
                  </div>
                  {p.author_name && (
                    <p className="mt-0.5 text-xs text-brand-950/45">{p.author_name}</p>
                  )}
                </Td>
                <Td className="hidden md:table-cell">
                  <StatusPill className="bg-brand-50 text-brand-700 ring-brand-200">
                    {POST_CATEGORY_LABEL[p.category]}
                  </StatusPill>
                </Td>
                <Td className="hidden lg:table-cell text-brand-950/60">
                  {formatDateShort(p.published_at)}
                </Td>
                <Td className="hidden lg:table-cell text-center tabular-nums text-brand-950/50">
                  {p.views}
                </Td>
                <Td>
                  <StatusPill
                    className={cn(
                      p.is_published
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200",
                    )}
                  >
                    {p.is_published ? "Đã đăng" : "Bản nháp"}
                  </StatusPill>
                </Td>
                <Td>
                  <RowActions>
                    <IconButton
                      icon={p.is_published ? Eye : EyeOff}
                      label={p.is_published ? "Chuyển về nháp" : "Đăng bài"}
                      onClick={() => togglePublished(p)}
                    />
                    <IconButton icon={Pencil} label="Sửa" onClick={() => openEdit(p)} />
                    <IconButton
                      icon={Trash2}
                      label="Xoá"
                      tone="danger"
                      onClick={() => setDeleting(p)}
                    />
                  </RowActions>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </AsyncState>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? "Sửa bài viết" : "Viết bài mới"}
        description="Đường dẫn bài viết được tạo tự động từ tiêu đề."
        size="xl"
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
            <Button type="submit" form="post-form" disabled={saving}>
              {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Đăng bài"}
            </Button>
          </>
        }
      >
        <form id="post-form" onSubmit={save} className="space-y-5">
          <TextField
            id="post-title"
            label="Tiêu đề"
            required
            value={form.title}
            error={fieldErrors.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Tiêu đề bài viết"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              id="post-category"
              label="Chuyên mục"
              value={form.category}
              error={fieldErrors.category}
              onChange={(e) => set("category", e.target.value as PostCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {POST_CATEGORY_LABEL[c]}
                </option>
              ))}
            </SelectField>
            <TextField
              id="post-author"
              label="Tác giả"
              value={form.author_name}
              onChange={(e) => set("author_name", e.target.value)}
              placeholder="Ban tổ chức"
            />
            <SelectField
              id="post-speaker"
              label="Gắn với diễn giả"
              value={form.speaker_id}
              onChange={(e) => set("speaker_id", e.target.value)}
              hint="Dùng cho bài phát biểu."
            >
              <option value="">— Không gắn —</option>
              {speakers.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </SelectField>
            <TextField
              id="post-date"
              type="datetime-local"
              label="Thời gian đăng"
              value={form.published_at}
              onChange={(e) => set("published_at", e.target.value)}
            />
          </div>

          <ImageInput
            value={form.cover}
            onChange={(url) => set("cover", url)}
            label="Ảnh bìa"
            aspect="aspect-16/9 max-h-72"
          />

          <TextAreaField
            id="post-excerpt"
            label="Tóm tắt"
            rows={2}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Một hoặc hai câu tóm tắt hiển thị trên thẻ bài viết"
            hint="Bỏ trống để tự sinh từ nội dung."
          />

          <RichTextEditor
            label="Nội dung"
            value={form.content}
            onChange={(html) => set("content", html)}
            minHeight="24rem"
          />

          <TextField
            id="post-tags"
            label="Thẻ"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="Chuyển đổi số, Bền vững"
            hint="Phân tách bằng dấu phẩy."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-200 px-4 py-3 transition hover:bg-brand-50">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-brand-950">Bài viết nổi bật</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-200 px-4 py-3 transition hover:bg-brand-50">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-brand-950">Đăng công khai</span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá bài viết"
        message={`Xoá “${deleting?.title}”? Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
