"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  CalendarDays, ClipboardList, Handshake, Images, MessageSquare, Newspaper,
  TrendingUp, Users, ArrowRight, CheckCircle2, Clock,
} from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import type { DashboardStats } from "@/lib/types";
import { STATUS_LABEL, STATUS_STYLE, TICKET_LABEL, formatNumber, timeAgo } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminCard, AsyncState, StatusPill } from "@/components/admin/DataShell";
import { TrendChart } from "@/components/admin/TrendChart";

const CARDS = [
  {
    key: "registrations" as const,
    label: "Lượt đăng ký",
    icon: ClipboardList,
    href: "/admin/dang-ky",
    accent: "from-brand-600 to-brand-400",
  },
  {
    key: "speakers" as const,
    label: "Diễn giả",
    icon: Users,
    href: "/admin/dien-gia",
    accent: "from-brand-700 to-brand-500",
  },
  {
    key: "sessions" as const,
    label: "Phiên chương trình",
    icon: CalendarDays,
    href: "/admin/chuong-trinh",
    accent: "from-brand-800 to-brand-600",
  },
  {
    key: "posts" as const,
    label: "Bài viết",
    icon: Newspaper,
    href: "/admin/tin-tuc",
    accent: "from-brand-600 to-brand-400",
  },
  {
    key: "gallery" as const,
    label: "Mục thư viện",
    icon: Images,
    href: "/admin/thu-vien",
    accent: "from-brand-700 to-brand-400",
  },
  {
    key: "partners" as const,
    label: "Đối tác",
    icon: Handshake,
    href: "/admin/doi-tac",
    accent: "from-brand-800 to-brand-500",
  },
];

export default function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await api.get<DashboardStats>("/admin/stats"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  return (
    <>
      <AdminPageHeader
        title="Tổng quan"
        description="Số liệu đăng ký và nội dung của sự kiện, cập nhật theo thời gian thực."
      />

      <AsyncState
        loading={loading}
        error={error}
        empty={!stats}
        emptyTitle="Chưa có dữ liệu"
        onRetry={load}
      >
        {stats && (
          <div className="space-y-6">
            {/* Counters */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.key}
                    href={card.href}
                    className="group relative overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 transition-[transform,border-color,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_44px_-24px_rgb(12_43_41/0.4)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-brand-950/50">{card.label}</p>
                        <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-brand-950">
                          {formatNumber(stats.counts[card.key])}
                        </p>
                      </div>
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-xl bg-linear-135 ${card.accent} text-white transition-transform duration-400 group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                      Quản lý
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Registration status + unread contacts */}
            <div className="grid gap-4 lg:grid-cols-3">
              <AdminCard>
                <p className="text-sm font-medium text-brand-950/50">Chờ duyệt</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums text-amber-600">
                    {formatNumber(stats.counts.registrations_pending)}
                  </span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </p>
              </AdminCard>
              <AdminCard>
                <p className="text-sm font-medium text-brand-950/50">Đã xác nhận</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums text-emerald-600">
                    {formatNumber(stats.counts.registrations_confirmed)}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </p>
              </AdminCard>
              <Link
                href="/admin/lien-he"
                className="group rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_1px_2px_rgb(12_43_41/0.04),0_12px_28px_-20px_rgb(12_43_41/0.25)] transition hover:border-brand-300"
              >
                <p className="text-sm font-medium text-brand-950/50">Liên hệ chưa đọc</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums text-brand-700">
                    {formatNumber(stats.counts.contacts_unread)}
                  </span>
                  <MessageSquare className="h-4 w-4 text-brand-500" />
                </p>
              </Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              {/* Trend */}
              <AdminCard>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-brand-950">
                      Đăng ký 14 ngày qua
                    </h2>
                    <p className="mt-0.5 text-xs text-brand-950/45">
                      Tổng {formatNumber(stats.trend.reduce((s, d) => s + d.count, 0))} lượt trong
                      hai tuần
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-brand-400" />
                </div>
                <div className="mt-6">
                  <TrendChart data={stats.trend} />
                </div>
              </AdminCard>

              {/* By ticket type */}
              <AdminCard>
                <h2 className="text-base font-bold tracking-tight text-brand-950">
                  Phân bổ loại vé
                </h2>
                <ul className="mt-5 space-y-3.5">
                  {stats.by_ticket.length === 0 && (
                    <li className="text-sm text-brand-950/45">Chưa có đăng ký nào.</li>
                  )}
                  {stats.by_ticket.map((row) => {
                    const total = stats.counts.registrations || 1;
                    const pct = Math.round((row.count / total) * 100);
                    return (
                      <li key={row.ticket_type}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium text-brand-950">
                            {TICKET_LABEL[row.ticket_type] ?? row.ticket_type}
                          </span>
                          <span className="tabular-nums text-brand-950/50">
                            {row.count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-50">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-brand-600 to-brand-400 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </AdminCard>
            </div>

            {/* Recent registrations */}
            <AdminCard padded={false}>
              <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-4 lg:px-6">
                <h2 className="text-base font-bold tracking-tight text-brand-950">
                  Đăng ký gần đây
                </h2>
                <Link
                  href="/admin/dang-ky"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800"
                >
                  Xem tất cả
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {stats.recent.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-brand-950/45 lg:px-6">
                  Chưa có đăng ký nào.
                </p>
              ) : (
                <ul className="divide-y divide-brand-50">
                  {stats.recent.map((reg) => (
                    <li
                      key={reg.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 lg:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-950">
                          {reg.full_name}
                        </p>
                        <p className="truncate text-xs text-brand-950/45">
                          {reg.email}
                          {reg.company && ` · ${reg.company}`}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-brand-950/40">{reg.code}</span>
                      <StatusPill className={STATUS_STYLE[reg.status]}>
                        {STATUS_LABEL[reg.status]}
                      </StatusPill>
                      <span className="w-24 text-right text-xs text-brand-950/40">
                        {timeAgo(reg.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        )}
      </AsyncState>
    </>
  );
}
