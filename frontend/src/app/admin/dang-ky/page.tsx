"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import {
  ClipboardList, Download, Mail, Phone, Trash2, Building2, ChevronDown,
} from "lucide-react";
import { useApi, useAuth } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import type { Registration, RegistrationStatus, TicketType } from "@/lib/types";
import {
  STATUS_LABEL, STATUS_STYLE, TICKET_LABEL, cn, formatDateTime,
} from "@/lib/utils";
import { apiBase } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  AdminSearch, AsyncState, FilterChips, IconButton, RowActions, StatusPill,
  TableWrap, Td, Th,
} from "@/components/admin/DataShell";
import { ConfirmDialog } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";

const STATUSES: RegistrationStatus[] = ["pending", "confirmed", "checked_in", "cancelled"];

export default function AdminRegistrationsPage() {
  const api = useApi();
  const { token } = useAuth();
  const { notify } = useToast();

  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RegistrationStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Registration | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.list<Registration>("/admin/registrations?per_page=200");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách đăng ký");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.full_name, r.email, r.company, r.code, r.phone]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, status]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      ...Object.fromEntries(STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])),
    }),
    [rows],
  ) as Record<RegistrationStatus | "all", number>;

  const changeStatus = async (r: Registration, next: RegistrationStatus) => {
    const previous = r.status;
    // Optimistic: the select should feel instant on a long list.
    setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    try {
      await api.patch(`/admin/registrations/${r.id}`, { status: next });
      notify(`Đã chuyển sang “${STATUS_LABEL[next]}”`);
    } catch {
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status: previous } : x)));
      notify("Không đổi được trạng thái", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.del(`/admin/registrations/${deleting.id}`);
      setRows((list) => list.filter((x) => x.id !== deleting.id));
      notify("Đã xoá đăng ký");
      setDeleting(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  /**
   * The export endpoint needs the bearer header, so it cannot be a plain link.
   * Fetch it, then hand the blob to a synthetic anchor.
   */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${apiBase()}/api/admin/registrations/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dang-ky-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify("Đã tải tệp CSV");
    } catch {
      notify("Không xuất được tệp CSV", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Đăng ký tham dự"
        description="Duyệt, check-in và xuất danh sách khách đăng ký."
        action={
          <Button variant="outline" onClick={exportCsv} disabled={exporting || rows.length === 0}>
            <Download className="h-4 w-4" />
            {exporting ? "Đang xuất…" : "Xuất CSV"}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { value: "all" as const, label: "Tất cả", count: counts.all },
            ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: counts[s] })),
          ]}
        />
        <AdminSearch value={search} onChange={setSearch} placeholder="Tìm tên, email, mã vé…" />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyIcon={ClipboardList}
        emptyTitle={
          search || status !== "all" ? "Không có đăng ký phù hợp" : "Chưa có ai đăng ký"
        }
        emptyDescription={
          search || status !== "all"
            ? "Thử bỏ bộ lọc hoặc dùng từ khoá khác."
            : "Danh sách sẽ xuất hiện ngay khi có người đăng ký qua trang công khai."
        }
        onRetry={load}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th className="w-32">Mã vé</Th>
              <Th>Người đăng ký</Th>
              <Th className="hidden lg:table-cell">Đơn vị</Th>
              <Th className="hidden md:table-cell w-36">Loại vé</Th>
              <Th className="w-40">Trạng thái</Th>
              <Th className="hidden xl:table-cell w-36">Thời gian</Th>
              <Th className="w-24 text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <Fragment key={r.id}>
                <tr className="transition-colors hover:bg-ocean-50/40">
                  <Td>
                    <span className="font-mono text-xs font-semibold text-ocean-700">{r.code}</span>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="flex items-center gap-1.5 text-left"
                    >
                      <span>
                        <span className="block font-semibold text-ocean-950">{r.full_name}</span>
                        <span className="block text-xs text-ocean-950/45">{r.email}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-ocean-400 transition-transform duration-300",
                          expanded === r.id && "rotate-180",
                        )}
                      />
                    </button>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-ocean-950/70">{r.company || "—"}</span>
                    {r.job_title && <p className="text-xs text-ocean-950/40">{r.job_title}</p>}
                  </Td>
                  <Td className="hidden md:table-cell">
                    <StatusPill className="bg-ocean-50 text-ocean-700 ring-ocean-200">
                      {TICKET_LABEL[r.ticket_type as TicketType] ?? r.ticket_type}
                    </StatusPill>
                  </Td>
                  <Td>
                    <select
                      value={r.status}
                      onChange={(e) => changeStatus(r, e.target.value as RegistrationStatus)}
                      aria-label={`Trạng thái của ${r.full_name}`}
                      className={cn(
                        "h-8 w-full cursor-pointer rounded-lg border-0 px-2 text-xs font-semibold ring-1 ring-inset outline-hidden transition focus:ring-2",
                        STATUS_STYLE[r.status],
                      )}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="hidden xl:table-cell text-xs text-ocean-950/50">
                    {formatDateTime(r.created_at)}
                  </Td>
                  <Td>
                    <RowActions>
                      <IconButton
                        icon={Trash2}
                        label="Xoá"
                        tone="danger"
                        onClick={() => setDeleting(r)}
                      />
                    </RowActions>
                  </Td>
                </tr>

                {expanded === r.id && (
                  <tr className="bg-ocean-50/50">
                    <td colSpan={7} className="border-b border-ocean-100 px-4 py-4">
                      <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ocean-950/40">
                            Liên hệ
                          </dt>
                          <dd className="mt-1.5 space-y-1">
                            <a
                              href={`mailto:${r.email}`}
                              className="flex items-center gap-1.5 text-ocean-700 hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {r.email}
                            </a>
                            {r.phone && (
                              <a
                                href={`tel:${r.phone.replace(/\s/g, "")}`}
                                className="flex items-center gap-1.5 text-ocean-700 hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {r.phone}
                              </a>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ocean-950/40">
                            Đơn vị
                          </dt>
                          <dd className="mt-1.5 flex items-start gap-1.5 text-ocean-950/70">
                            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              {r.company || "—"}
                              {r.job_title && (
                                <>
                                  <br />
                                  <span className="text-xs text-ocean-950/45">{r.job_title}</span>
                                </>
                              )}
                              <br />
                              <span className="text-xs text-ocean-950/45">{r.country}</span>
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ocean-950/40">
                            Chủ đề quan tâm
                          </dt>
                          <dd className="mt-1.5 flex flex-wrap gap-1">
                            {r.interests?.length > 0 ? (
                              r.interests.map((t) => (
                                <span
                                  key={t}
                                  className="rounded bg-white px-1.5 py-0.5 text-xs text-ocean-700 ring-1 ring-ocean-200"
                                >
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-ocean-950/40">—</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ocean-950/40">
                            Ghi chú
                          </dt>
                          <dd className="mt-1.5 text-ocean-950/70">{r.note || "—"}</dd>
                        </div>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </TableWrap>
      </AsyncState>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title="Xoá đăng ký"
        message={`Xoá đăng ký của “${deleting?.full_name}” (${deleting?.code})? Thao tác này không thể hoàn tác.`}
      />
    </>
  );
}
