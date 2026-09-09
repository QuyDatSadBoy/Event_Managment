"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2, Users } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { Speaker } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  AdminSearch, AsyncState, IconButton, RowActions, StatusPill, TableWrap, Td, Th,
} from "@/components/admin/DataShell";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { ImageInput } from "@/components/admin/ImageInput";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";

type FormState = {
  name: string;
  title: string;
  company: string;
  country: string;
  photo: string;
  short_bio: string;
  bio: string;
  topics: string;
  linkedin: string;
  facebook: string;
  featured: boolean;
  is_published: boolean;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  name: "", title: "", company: "", country: "", photo: "", short_bio: "", bio: "",
  topics: "", linkedin: "", facebook: "", featured: false, is_published: true, sort_order: 0,
};

function toForm(s: Speaker): FormState {
  return {
    name: s.name,
    title: s.title,
    company: s.company,
    country: s.country,
    photo: s.photo,
    short_bio: s.short_bio,
    bio: s.bio,
    topics: (s.topics ?? []).join(", "),
    linkedin: s.socials?.linkedin ?? "",
    facebook: s.socials?.facebook ?? "",
    featured: s.featured,
    is_published: s.is_published,
    sort_order: s.sort_order,
  };
}

function toPayload(f: FormState) {
  const socials: Record<string, string> = {};
  if (f.linkedin.trim()) socials.linkedin = f.linkedin.trim();
  if (f.facebook.trim()) socials.facebook = f.facebook.trim();
  return {
    name: f.name.trim(),
    title: f.title.trim(),
    company: f.company.trim(),
    country: f.country.trim(),
    photo: f.photo.trim(),
    short_bio: f.short_bio.trim(),
    bio: f.bio,
    topics: f.topics.split(",").map((t) => t.trim()).filter(Boolean),
    socials,
    featured: f.featured,
    is_published: f.is_published,
    sort_order: Number(f.sort_order) || 0,
  };
}

export default function AdminSpeakersPage() {
  const api = useApi();
  const { notify } = useToast();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Speaker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Speaker | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.list<Speaker>("/admin/speakers?per_page=100");
      setSpeakers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return speakers;
    return speakers.filter((s) =>
      [s.name, s.title, s.company, s.country].join(" ").toLowerCase().includes(q),
    );
  }, [speakers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: speakers.length });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Speaker) => {
    setEditing(s);
    setForm(toForm(s));
    setFieldErrors({});
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFieldErrors({ name: "Vui lòng nhập tên diễn giả" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = toPayload(form);
      if (editing) {
        await api.put<Speaker>(`/admin/speakers/${editing.id}`, payload);
        notify("Đã cập nhật diễn giả");
      } else {
        await api.post<Speaker>("/admin/speakers", payload);
        notify("Đã thêm diễn giả mới");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        notify(err.message, "error");
      } else {
        notify("Không lưu được diễn giả", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (s: Speaker) => {
    try {
      await api.put<Speaker>(`/admin/speakers/${s.id}`, {
        ...toPayload(toForm(s)),
        is_published: !s.is_published,
      });
      setSpeakers((list) =>
        list.map((x) => (x.id === s.id ? { ...x, is_published: !x.is_published } : x)),
      );
      notify(s.is_published ? "Đã ẩn khỏi trang công khai" : "Đã hiển thị trên trang công khai");
    } catch {
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/speakers/${deleting.id}`);
      setSpeakers((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá diễn giả");
      setDeleting(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <AdminPageHeader
        title="Diễn giả"
        description="Thêm, sửa và sắp xếp danh sách diễn giả hiển thị trên trang công khai."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm diễn giả
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-950/55">
          <span className="font-bold text-brand-950">{filtered.length}</span> diễn giả
          {search && ` khớp với “${search}”`}
        </p>
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm theo tên, đơn vị…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={Users}
        emptyTitle={search ? "Không tìm thấy diễn giả" : "Chưa có diễn giả nào"}
        emptyDescription={
          search ? "Thử từ khoá khác." : "Bắt đầu bằng cách thêm diễn giả đầu tiên."
        }
        emptyAction={
          !search && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm diễn giả
            </Button>
          )
        }
        onRetry={load}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th className="w-16">Ảnh</Th>
              <Th>Diễn giả</Th>
              <Th className="hidden md:table-cell">Đơn vị</Th>
              <Th className="hidden lg:table-cell">Chủ đề</Th>
              <Th className="w-28">Trạng thái</Th>
              <Th className="w-16 text-center">Thứ tự</Th>
              <Th className="w-32 text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-brand-50/40">
                <Td>
                  <span className="relative block h-11 w-11 overflow-hidden rounded-xl">
                    <SafeImage
                      src={s.photo}
                      alt={s.name}
                      fallbackLabel={initials(s.name)}
                      sizes="44px"
                    />
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-950">{s.name}</span>
                    {s.featured && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-cream text-cream" aria-label="Nổi bật" />
                    )}
                  </div>
                  <p className="text-xs text-brand-950/45">{s.title || "—"}</p>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className="text-brand-950/70">{s.company || "—"}</span>
                  {s.country && <p className="text-xs text-brand-950/40">{s.country}</p>}
                </Td>
                <Td className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(s.topics ?? []).slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-brand-50 px-1.5 py-0.5 text-[0.6875rem] text-brand-700"
                      >
                        {t}
                      </span>
                    ))}
                    {(s.topics?.length ?? 0) > 2 && (
                      <span className="text-[0.6875rem] text-brand-950/40">
                        +{s.topics.length - 2}
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <StatusPill
                    className={cn(
                      s.is_published
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200",
                    )}
                  >
                    {s.is_published ? "Hiển thị" : "Đã ẩn"}
                  </StatusPill>
                </Td>
                <Td className="text-center tabular-nums text-brand-950/50">{s.sort_order}</Td>
                <Td>
                  <RowActions>
                    <IconButton
                      icon={s.is_published ? Eye : EyeOff}
                      label={s.is_published ? "Ẩn khỏi trang" : "Hiển thị trên trang"}
                      onClick={() => togglePublished(s)}
                    />
                    <IconButton icon={Pencil} label="Sửa" onClick={() => openEdit(s)} />
                    <IconButton
                      icon={Trash2}
                      label="Xoá"
                      tone="danger"
                      onClick={() => setDeleting(s)}
                    />
                  </RowActions>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </AsyncState>

      {/* ---------- Create / edit ---------- */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? "Sửa thông tin diễn giả" : "Thêm diễn giả mới"}
        description="Đường dẫn trang diễn giả được tạo tự động từ tên."
        size="lg"
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
            <Button type="submit" form="speaker-form" disabled={saving}>
              {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Thêm diễn giả"}
            </Button>
          </>
        }
      >
        <form id="speaker-form" onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="sp-name"
              label="Họ và tên"
              required
              value={form.name}
              error={fieldErrors.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            <TextField
              id="sp-title"
              label="Chức danh"
              value={form.title}
              error={fieldErrors.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Tổng Giám đốc"
            />
            <TextField
              id="sp-company"
              label="Đơn vị"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Tên công ty / tổ chức"
            />
            <TextField
              id="sp-country"
              label="Quốc gia"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="Việt Nam"
            />
          </div>

          <ImageInput
            value={form.photo}
            onChange={(url) => set("photo", url)}
            label="Ảnh chân dung"
            aspect="aspect-square max-h-64"
            hint="Ảnh vuông cho kết quả đẹp nhất trên lưới diễn giả."
          />

          <TextField
            id="sp-short-bio"
            label="Giới thiệu ngắn"
            value={form.short_bio}
            onChange={(e) => set("short_bio", e.target.value)}
            placeholder="Một câu tóm tắt hiển thị trên thẻ diễn giả"
            hint="Bỏ trống để tự sinh từ tiểu sử."
          />

          <RichTextEditor
            label="Tiểu sử"
            value={form.bio}
            onChange={(html) => set("bio", html)}
            minHeight="14rem"
            placeholder="Tiểu sử đầy đủ hiển thị trên trang chi tiết…"
          />

          <TextField
            id="sp-topics"
            label="Chủ đề chuyên môn"
            value={form.topics}
            onChange={(e) => set("topics", e.target.value)}
            placeholder="Chuyển đổi số, Vận hành, ESG"
            hint="Phân tách bằng dấu phẩy."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="sp-linkedin"
              type="url"
              label="LinkedIn"
              value={form.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
            <TextField
              id="sp-facebook"
              type="url"
              label="Facebook"
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              placeholder="https://facebook.com/…"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              id="sp-order"
              type="number"
              label="Thứ tự hiển thị"
              value={String(form.sort_order)}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              hint="Số nhỏ hiển thị trước."
            />
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-brand-200 px-4 py-3 transition hover:bg-brand-50">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-brand-950">Diễn giả nổi bật</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-brand-200 px-4 py-3 transition hover:bg-brand-50">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
                className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-brand-950">Hiển thị công khai</span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá diễn giả"
        message={`Xoá “${deleting?.name}” khỏi hệ thống? Diễn giả sẽ bị gỡ khỏi mọi phiên trong chương trình. Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
