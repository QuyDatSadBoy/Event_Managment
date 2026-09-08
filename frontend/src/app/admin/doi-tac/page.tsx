"use client";

import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { Partner, PartnerTier } from "@/lib/types";
import { PARTNER_TIER_LABEL, cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  AdminSearch, AsyncState, FilterChips, IconButton, RowActions, StatusPill,
  TableWrap, Td, Th,
} from "@/components/admin/DataShell";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { ImageInput } from "@/components/admin/ImageInput";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";

const TIERS: PartnerTier[] = [
  "diamond", "platinum", "gold", "silver", "bronze", "partner", "media",
];

const TIER_STYLE: Record<PartnerTier, string> = {
  diamond: "bg-cyan-glow/15 text-ocean-800 ring-cyan-glow/40",
  platinum: "bg-ocean-100 text-ocean-800 ring-ocean-200",
  gold: "bg-gold/15 text-[#8a5d00] ring-gold/40",
  silver: "bg-slate-100 text-slate-700 ring-slate-200",
  bronze: "bg-orange-50 text-orange-700 ring-orange-200",
  partner: "bg-ocean-50 text-ocean-700 ring-ocean-200",
  media: "bg-ocean-50 text-ocean-700 ring-ocean-200",
};

type FormState = {
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: PartnerTier;
  sort_order: number;
  is_published: boolean;
};

const EMPTY: FormState = {
  name: "", logo: "", website: "", description: "", tier: "partner",
  sort_order: 0, is_published: true,
};

export default function AdminPartnersPage() {
  const api = useApi();
  const { notify } = useToast();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<PartnerTier | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Partner | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPartners(await api.get<Partner[]>("/admin/partners"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách đối tác");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (tier !== "all" && p.tier !== tier) return false;
      if (!q) return true;
      return [p.name, p.description, p.website].join(" ").toLowerCase().includes(q);
    });
  }, [partners, search, tier]);

  const counts = useMemo(
    () => ({
      all: partners.length,
      ...Object.fromEntries(TIERS.map((t) => [t, partners.filter((p) => p.tier === t).length])),
    }),
    [partners],
  ) as Record<PartnerTier | "all", number>;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: partners.length });
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name,
      logo: p.logo,
      website: p.website,
      description: p.description,
      tier: p.tier,
      sort_order: p.sort_order,
      is_published: p.is_published,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFieldErrors({ name: "Vui lòng nhập tên đối tác" });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        logo: form.logo.trim(),
        website: form.website.trim(),
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        await api.put(`/admin/partners/${editing.id}`, payload);
        notify("Đã cập nhật đối tác");
      } else {
        await api.post("/admin/partners", payload);
        notify("Đã thêm đối tác mới");
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

  const togglePublished = async (p: Partner) => {
    try {
      await api.put(`/admin/partners/${p.id}`, { ...p, is_published: !p.is_published });
      setPartners((list) =>
        list.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)),
      );
      notify(p.is_published ? "Đã ẩn đối tác" : "Đã hiển thị đối tác");
    } catch {
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/partners/${deleting.id}`);
      setPartners((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá đối tác");
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
        title="Đối tác & Nhà tài trợ"
        description="Thêm và sắp xếp các đơn vị đồng hành. Hạng tài trợ quyết định kích thước logo trên trang công khai."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm đối tác
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={tier}
          onChange={setTier}
          options={[
            { value: "all" as const, label: "Tất cả", count: counts.all },
            ...TIERS.filter((t) => counts[t] > 0).map((t) => ({
              value: t,
              label: PARTNER_TIER_LABEL[t],
              count: counts[t],
            })),
          ]}
        />
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm đối tác…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={Handshake}
        emptyTitle={search || tier !== "all" ? "Không có đối tác phù hợp" : "Chưa có đối tác nào"}
        emptyDescription={
          search || tier !== "all"
            ? "Thử bỏ bộ lọc hoặc dùng từ khoá khác."
            : "Thêm đơn vị đồng hành đầu tiên."
        }
        emptyAction={
          !search &&
          tier === "all" && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm đối tác
            </Button>
          )
        }
        onRetry={load}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th className="w-24">Logo</Th>
              <Th>Tên đối tác</Th>
              <Th className="hidden lg:table-cell">Giới thiệu</Th>
              <Th className="w-36">Hạng</Th>
              <Th className="w-16 text-center">Thứ tự</Th>
              <Th className="w-28">Trạng thái</Th>
              <Th className="w-32 text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-ocean-50/40">
                <Td>
                  <span className="relative block h-10 w-20 overflow-hidden rounded-lg bg-ocean-50">
                    <SafeImage src={p.logo} alt={p.name} sizes="80px" className="object-contain p-1" />
                  </span>
                </Td>
                <Td>
                  <span className="font-semibold text-ocean-950">{p.name}</span>
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-0.5 flex items-center gap-1 text-xs text-ocean-600 hover:underline"
                    >
                      {p.website.replace(/^https?:\/\//, "").slice(0, 32)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </Td>
                <Td className="hidden lg:table-cell">
                  <span className="line-clamp-2 max-w-sm text-ocean-950/60">
                    {p.description || "—"}
                  </span>
                </Td>
                <Td>
                  <StatusPill className={TIER_STYLE[p.tier]}>
                    {PARTNER_TIER_LABEL[p.tier]}
                  </StatusPill>
                </Td>
                <Td className="text-center tabular-nums text-ocean-950/50">{p.sort_order}</Td>
                <Td>
                  <StatusPill
                    className={cn(
                      p.is_published
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200",
                    )}
                  >
                    {p.is_published ? "Hiển thị" : "Đã ẩn"}
                  </StatusPill>
                </Td>
                <Td>
                  <RowActions>
                    <IconButton
                      icon={p.is_published ? Eye : EyeOff}
                      label={p.is_published ? "Ẩn" : "Hiển thị"}
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
        title={editing ? "Sửa đối tác" : "Thêm đối tác mới"}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="h-11 rounded-full px-5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <Button type="submit" form="partner-form" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="partner-form" onSubmit={save} className="space-y-5">
          <TextField
            id="p-name"
            label="Tên đối tác"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Vietnam Hospitality Group"
          />

          <ImageInput
            value={form.logo}
            onChange={(url) => set("logo", url)}
            label="Logo"
            aspect="aspect-2/1 max-h-40"
            hint="Nền trong suốt (PNG/SVG) cho kết quả đẹp nhất."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              id="p-tier"
              label="Hạng tài trợ"
              value={form.tier}
              error={fieldErrors.tier}
              onChange={(e) => set("tier", e.target.value as PartnerTier)}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {PARTNER_TIER_LABEL[t]}
                </option>
              ))}
            </SelectField>
            <TextField
              id="p-order"
              type="number"
              label="Thứ tự trong hạng"
              value={String(form.sort_order)}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>

          <TextField
            id="p-website"
            type="url"
            label="Website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://example.com"
          />

          <TextAreaField
            id="p-desc"
            label="Giới thiệu ngắn"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ocean-200 px-4 py-3 transition hover:bg-ocean-50">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
            />
            <span className="text-sm font-medium text-ocean-950">Hiển thị công khai</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá đối tác"
        message={`Xoá “${deleting?.name}” khỏi danh sách đối tác? Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
