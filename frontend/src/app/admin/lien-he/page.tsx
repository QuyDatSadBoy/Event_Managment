"use client";

import { useCallback, useMemo, useState } from "react";
import { Mail, MailOpen, MessageSquare, Phone, Trash2 } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import type { Contact } from "@/lib/types";
import { cn, formatDateTime, initials } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminSearch, AsyncState, FilterChips, IconButton } from "@/components/admin/DataShell";
import { ConfirmDialog } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";

export default function AdminContactsPage() {
  const api = useApi();
  const { notify } = useToast();

  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.list<Contact>("/admin/contacts?per_page=100");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách liên hệ");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (filter === "unread" && c.is_read) return false;
      if (!q) return true;
      return [c.name, c.email, c.subject, c.message].join(" ").toLowerCase().includes(q);
    });
  }, [rows, search, filter]);

  const unread = rows.filter((c) => !c.is_read).length;

  const toggleRead = async (c: Contact) => {
    try {
      await api.patch(`/admin/contacts/${c.id}/read`);
      setRows((list) => list.map((x) => (x.id === c.id ? { ...x, is_read: !x.is_read } : x)));
    } catch {
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/contacts/${deleting.id}`);
      setRows((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá liên hệ");
      setDeleting(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Liên hệ"
        description="Tin nhắn gửi qua biểu mẫu liên hệ trên trang công khai."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tất cả", count: rows.length },
            { value: "unread", label: "Chưa đọc", count: unread },
          ]}
        />
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm theo tên, email, nội dung…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={MessageSquare}
        emptyTitle={
          search || filter === "unread" ? "Không có liên hệ phù hợp" : "Chưa có liên hệ nào"
        }
        emptyDescription={
          search || filter === "unread"
            ? "Thử bỏ bộ lọc hoặc dùng từ khoá khác."
            : "Tin nhắn từ biểu mẫu liên hệ sẽ hiển thị tại đây."
        }
        onRetry={load}
      >
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-2xl border bg-white p-5 transition-[box-shadow,border-color,background-color] duration-300 hover:shadow-[0_16px_36px_-24px_rgb(8_42_77/0.35)]",
                c.is_read ? "border-ocean-100" : "border-ocean-300 bg-ocean-50/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3.5">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold",
                      c.is_read
                        ? "bg-ocean-50 text-ocean-600"
                        : "bg-linear-135 from-ocean-600 to-cyan-glow text-white",
                    )}
                  >
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ocean-950">{c.name}</span>
                      {!c.is_read && (
                        <span className="rounded-full bg-ocean-600 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-white">
                          Mới
                        </span>
                      )}
                      {c.subject && (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.6875rem] font-medium text-ocean-700 ring-1 ring-ocean-200">
                          {c.subject}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1.5 text-ocean-600 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {c.email}
                      </a>
                      {c.phone && (
                        <a
                          href={`tel:${c.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-ocean-600 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </a>
                      )}
                      <span className="text-ocean-950/40">{formatDateTime(c.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    icon={c.is_read ? MailOpen : Mail}
                    label={c.is_read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                    onClick={() => toggleRead(c)}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Xoá"
                    tone="danger"
                    onClick={() => setDeleting(c)}
                  />
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap border-l-2 border-ocean-200 pl-4 text-sm leading-relaxed text-ocean-950/70">
                {c.message}
              </p>

              <a
                href={`mailto:${c.email}?subject=${encodeURIComponent(
                  `Re: ${c.subject || "Liên hệ VHD Summit"}`,
                )}`}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-ocean-600 px-4 text-sm font-semibold text-white transition hover:bg-ocean-500"
              >
                <Mail className="h-3.5 w-3.5" />
                Trả lời qua email
              </a>
            </li>
          ))}
        </ul>
      </AsyncState>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá liên hệ"
        message={`Xoá tin nhắn từ “${deleting?.name}”? Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
