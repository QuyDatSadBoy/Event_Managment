"use client";

import { useCallback, useState } from "react";
import {
  CalendarDays, CalendarPlus, Clock, MapPin, Pencil, Plus, Trash2, Users,
} from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { AgendaDay, AgendaSession, SessionType, Speaker } from "@/lib/types";
import {
  SESSION_TYPE_LABEL, SESSION_TYPE_STYLE, cn, formatDate, initials,
} from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AsyncState, IconButton, RowActions } from "@/components/admin/DataShell";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/Toast";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SafeImage } from "@/components/ui/SafeImage";

const SESSION_TYPES: SessionType[] = [
  "keynote", "session", "panel", "workshop", "networking", "break", "ceremony",
];

type DayForm = { label: string; title: string; date: string; sort_order: number };
type SessionForm = {
  day_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  room: string;
  track: string;
  type: SessionType;
  sort_order: number;
  is_published: boolean;
  speaker_ids: string[];
};

const EMPTY_DAY: DayForm = { label: "", title: "", date: "", sort_order: 0 };
const EMPTY_SESSION: SessionForm = {
  day_id: "", title: "", description: "", start_time: "09:00", end_time: "10:00",
  room: "", track: "", type: "session", sort_order: 0, is_published: true, speaker_ids: [],
};

/** The API returns ISO timestamps; the date input needs YYYY-MM-DD. */
const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : "");

export default function AdminAgendaPage() {
  const api = useApi();
  const { notify } = useToast();

  const [days, setDays] = useState<AgendaDay[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(0);

  const [dayModal, setDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState<AgendaDay | null>(null);
  const [dayForm, setDayForm] = useState<DayForm>(EMPTY_DAY);

  const [sessionModal, setSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AgendaSession | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(EMPTY_SESSION);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<{ kind: "day" | "session"; id: string; name: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [agenda, sp] = await Promise.all([
        api.get<AgendaDay[]>("/admin/agenda"),
        api.list<Speaker>("/admin/speakers?per_page=100"),
      ]);
      setDays(agenda);
      setSpeakers(sp.data);
      setActiveDay((i) => Math.min(i, Math.max(0, agenda.length - 1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chương trình");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const day = days[activeDay];

  // ---------- Day ----------
  const openCreateDay = () => {
    setEditingDay(null);
    setDayForm({ ...EMPTY_DAY, label: `Ngày ${days.length + 1}`, sort_order: days.length });
    setFieldErrors({});
    setDayModal(true);
  };

  const openEditDay = (d: AgendaDay) => {
    setEditingDay(d);
    setDayForm({
      label: d.label,
      title: d.title,
      date: toDateInput(d.date),
      sort_order: d.sort_order,
    });
    setFieldErrors({});
    setDayModal(true);
  };

  const saveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!dayForm.label.trim()) errs.label = "Vui lòng nhập nhãn ngày";
    if (!dayForm.date) errs.date = "Vui lòng chọn ngày";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...dayForm, sort_order: Number(dayForm.sort_order) || 0 };
      if (editingDay) {
        await api.put(`/admin/agenda/days/${editingDay.id}`, payload);
        notify("Đã cập nhật ngày");
      } else {
        await api.post("/admin/agenda/days", payload);
        notify("Đã thêm ngày mới");
      }
      setDayModal(false);
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

  // ---------- Session ----------
  const openCreateSession = () => {
    if (!day) return;
    setEditingSession(null);
    setSessionForm({
      ...EMPTY_SESSION,
      day_id: day.id,
      sort_order: day.sessions.length,
    });
    setFieldErrors({});
    setSessionModal(true);
  };

  const openEditSession = (s: AgendaSession) => {
    setEditingSession(s);
    setSessionForm({
      day_id: s.day_id,
      title: s.title,
      description: s.description,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room,
      track: s.track,
      type: s.type,
      sort_order: s.sort_order,
      is_published: s.is_published,
      speaker_ids: s.speakers?.map((x) => x.id) ?? [],
    });
    setFieldErrors({});
    setSessionModal(true);
  };

  const saveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!sessionForm.title.trim()) errs.title = "Vui lòng nhập tên phiên";
    if (!sessionForm.start_time) errs.start_time = "Vui lòng nhập giờ bắt đầu";
    if (!sessionForm.day_id) errs.day_id = "Vui lòng chọn ngày";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...sessionForm, sort_order: Number(sessionForm.sort_order) || 0 };
      if (editingSession) {
        await api.put(`/admin/agenda/sessions/${editingSession.id}`, payload);
        notify("Đã cập nhật phiên");
      } else {
        await api.post("/admin/agenda/sessions", payload);
        notify("Đã thêm phiên mới");
      }
      setSessionModal(false);
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const path =
        deleteTarget.kind === "day"
          ? `/admin/agenda/days/${deleteTarget.id}`
          : `/admin/agenda/sessions/${deleteTarget.id}`;
      await api.del(path);
      notify(deleteTarget.kind === "day" ? "Đã xoá ngày" : "Đã xoá phiên");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xoá được", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleSpeaker = (id: string) =>
    setSessionForm((f) => ({
      ...f,
      speaker_ids: f.speaker_ids.includes(id)
        ? f.speaker_ids.filter((x) => x !== id)
        : [...f.speaker_ids, id],
    }));

  return (
    <>
      <AdminPageHeader
        title="Chương trình"
        description="Quản lý các ngày, phiên toạ đàm, giờ giấc và diễn giả tham gia từng phiên."
        action={
          <>
            <Button variant="outline" onClick={openCreateDay}>
              <CalendarPlus className="h-4 w-4" />
              Thêm ngày
            </Button>
            <Button onClick={openCreateSession} disabled={!day}>
              <Plus className="h-4 w-4" />
              Thêm phiên
            </Button>
          </>
        }
      />

      <AsyncState
        loading={loading}
        error={error}
        empty={days.length === 0}
        emptyIcon={CalendarDays}
        emptyTitle="Chưa có ngày nào trong chương trình"
        emptyDescription="Tạo ngày đầu tiên, sau đó thêm các phiên vào ngày đó."
        emptyAction={
          <Button onClick={openCreateDay}>
            <CalendarPlus className="h-4 w-4" />
            Thêm ngày đầu tiên
          </Button>
        }
        onRetry={load}
      >
        {/* Day tabs */}
        <div className="flex flex-wrap gap-3">
          {days.map((d, i) => (
            <div
              key={d.id}
              className={cn(
                "group relative flex min-w-[15rem] flex-1 items-center gap-3 rounded-2xl border px-5 py-4 transition-[transform,opacity,border-color,box-shadow] duration-400",
                i === activeDay
                  ? "border-transparent bg-linear-135 from-ocean-950 to-ocean-800 text-white shadow-[0_16px_36px_-18px_rgb(8_42_77/0.55)]"
                  : "border-ocean-200 bg-white hover:border-ocean-400",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveDay(i)}
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className={cn(
                    "block text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
                    i === activeDay ? "text-cyan-soft" : "text-ocean-700",
                  )}
                >
                  {d.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-sm font-bold",
                    i === activeDay ? "text-white" : "text-ocean-950",
                  )}
                >
                  {d.title || formatDate(d.date)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    i === activeDay ? "text-ocean-100/85" : "text-ocean-950/55",
                  )}
                >
                  {formatDate(d.date)} · {d.sessions.length} phiên
                </span>
              </button>

              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => openEditDay(d)}
                  aria-label={`Sửa ${d.label}`}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg transition",
                    i === activeDay
                      ? "text-white/70 hover:bg-white/15 hover:text-white"
                      : "text-ocean-400 hover:bg-ocean-50 hover:text-ocean-700",
                  )}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ kind: "day", id: d.id, name: d.label })}
                  aria-label={`Xoá ${d.label}`}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg transition",
                    i === activeDay
                      ? "text-white/70 hover:bg-white/15 hover:text-white"
                      : "text-rose-400 hover:bg-rose-50 hover:text-rose-600",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sessions */}
        {day && (
          <div className="mt-7">
            {day.sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/40 px-6 py-14 text-center">
                <Clock className="mx-auto h-8 w-8 text-ocean-400" />
                <p className="mt-4 font-semibold text-ocean-950">
                  {day.label} chưa có phiên nào
                </p>
                <p className="mt-1.5 text-sm text-ocean-950/50">
                  Thêm phiên đầu tiên cho ngày này.
                </p>
                <Button onClick={openCreateSession} className="mt-6">
                  <Plus className="h-4 w-4" />
                  Thêm phiên
                </Button>
              </div>
            ) : (
              <ol className="space-y-2.5">
                {day.sessions.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow,background-color] duration-300 hover:border-ocean-300 hover:shadow-[0_14px_32px_-22px_rgb(8_42_77/0.35)] lg:flex-row lg:items-center lg:gap-5",
                      s.is_published ? "border-ocean-100" : "border-dashed border-ocean-200 bg-ocean-50/40",
                    )}
                  >
                    <div className="flex shrink-0 items-baseline gap-2 lg:w-20 lg:flex-col lg:gap-0">
                      <span className="font-mono text-base font-bold tabular-nums text-ocean-800">
                        {s.start_time}
                      </span>
                      {s.end_time && (
                        <span className="font-mono text-xs tabular-nums text-ocean-950/40">
                          {s.end_time}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ring-1 ring-inset",
                            SESSION_TYPE_STYLE[s.type],
                          )}
                        >
                          {SESSION_TYPE_LABEL[s.type]}
                        </span>
                        {s.track && (
                          <span className="text-[0.6875rem] text-ocean-950/45">{s.track}</span>
                        )}
                        {!s.is_published && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-600">
                            Đã ẩn
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 font-semibold leading-snug text-ocean-950">{s.title}</p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ocean-950/45">
                        {s.room && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.room}
                          </span>
                        )}
                        {s.speakers?.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {s.speakers.length} diễn giả
                          </span>
                        )}
                      </div>
                    </div>

                    {s.speakers?.length > 0 && (
                      <div className="flex shrink-0 -space-x-2">
                        {s.speakers.slice(0, 4).map((sp) => (
                          <span
                            key={sp.id}
                            title={sp.name}
                            className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white"
                          >
                            <SafeImage
                              src={sp.photo}
                              alt={sp.name}
                              fallbackLabel={initials(sp.name)}
                              sizes="32px"
                            />
                          </span>
                        ))}
                      </div>
                    )}

                    <RowActions>
                      <IconButton icon={Pencil} label="Sửa phiên" onClick={() => openEditSession(s)} />
                      <IconButton
                        icon={Trash2}
                        label="Xoá phiên"
                        tone="danger"
                        onClick={() => setDeleteTarget({ kind: "session", id: s.id, name: s.title })}
                      />
                    </RowActions>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </AsyncState>

      {/* ---------- Day modal ---------- */}
      <Modal
        open={dayModal}
        onClose={() => !saving && setDayModal(false)}
        title={editingDay ? "Sửa ngày" : "Thêm ngày mới"}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDayModal(false)}
              disabled={saving}
              className="h-11 rounded-full px-5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <Button type="submit" form="day-form" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="day-form" onSubmit={saveDay} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="day-label"
              label="Nhãn ngày"
              required
              value={dayForm.label}
              error={fieldErrors.label}
              onChange={(e) => setDayForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ngày 1"
            />
            <TextField
              id="day-date"
              type="date"
              label="Ngày diễn ra"
              required
              value={dayForm.date}
              error={fieldErrors.date}
              onChange={(e) => setDayForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <TextField
            id="day-title"
            label="Tiêu đề ngày"
            value={dayForm.title}
            onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Khai mạc & Diễn đàn cấp cao"
          />
          <TextField
            id="day-order"
            type="number"
            label="Thứ tự"
            value={String(dayForm.sort_order)}
            onChange={(e) => setDayForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            hint="Số nhỏ hiển thị trước."
          />
        </form>
      </Modal>

      {/* ---------- Session modal ---------- */}
      <Modal
        open={sessionModal}
        onClose={() => !saving && setSessionModal(false)}
        title={editingSession ? "Sửa phiên" : "Thêm phiên mới"}
        description="Chọn diễn giả để hiển thị trên trang chương trình và trang cá nhân của họ."
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSessionModal(false)}
              disabled={saving}
              className="h-11 rounded-full px-5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <Button type="submit" form="session-form" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu phiên"}
            </Button>
          </>
        }
      >
        <form id="session-form" onSubmit={saveSession} className="space-y-5">
          <TextField
            id="ses-title"
            label="Tên phiên / toạ đàm"
            required
            value={sessionForm.title}
            error={fieldErrors.title}
            onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Toạ đàm: Chuyển đổi số ngành lưu trú"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              id="ses-day"
              label="Ngày"
              required
              value={sessionForm.day_id}
              error={fieldErrors.day_id}
              onChange={(e) => setSessionForm((f) => ({ ...f, day_id: e.target.value }))}
            >
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {formatDate(d.date)}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="ses-type"
              label="Loại phiên"
              value={sessionForm.type}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, type: e.target.value as SessionType }))
              }
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SESSION_TYPE_LABEL[t]}
                </option>
              ))}
            </SelectField>
            <TextField
              id="ses-start"
              type="time"
              label="Giờ bắt đầu"
              required
              value={sessionForm.start_time}
              error={fieldErrors.start_time}
              onChange={(e) => setSessionForm((f) => ({ ...f, start_time: e.target.value }))}
            />
            <TextField
              id="ses-end"
              type="time"
              label="Giờ kết thúc"
              value={sessionForm.end_time}
              onChange={(e) => setSessionForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              id="ses-room"
              label="Phòng / khu vực"
              value={sessionForm.room}
              onChange={(e) => setSessionForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="Grand Ballroom"
            />
            <TextField
              id="ses-track"
              label="Chủ đề"
              value={sessionForm.track}
              onChange={(e) => setSessionForm((f) => ({ ...f, track: e.target.value }))}
              placeholder="Vận hành"
            />
            <TextField
              id="ses-order"
              type="number"
              label="Thứ tự"
              value={String(sessionForm.sort_order)}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
              }
            />
          </div>

          <TextAreaField
            id="ses-desc"
            label="Mô tả"
            rows={3}
            value={sessionForm.description}
            onChange={(e) => setSessionForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Nội dung phiên sẽ bàn về điều gì?"
          />

          <div>
            <p className="mb-2.5 text-sm font-semibold text-ocean-950">
              Diễn giả tham gia
              <span className="ml-2 font-normal text-ocean-950/45">
                ({sessionForm.speaker_ids.length} đã chọn)
              </span>
            </p>
            {speakers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ocean-200 px-4 py-6 text-center text-sm text-ocean-950/45">
                Chưa có diễn giả nào. Thêm diễn giả trước để gán vào phiên.
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ocean-200 p-2">
                {speakers.map((sp) => {
                  const checked = sessionForm.speaker_ids.includes(sp.id);
                  return (
                    <label
                      key={sp.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition",
                        checked ? "bg-ocean-50" : "hover:bg-ocean-50/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSpeaker(sp.id)}
                        className="h-4 w-4 rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                        <SafeImage
                          src={sp.photo}
                          alt={sp.name}
                          fallbackLabel={initials(sp.name)}
                          sizes="32px"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ocean-950">
                          {sp.name}
                        </span>
                        <span className="block truncate text-xs text-ocean-950/45">
                          {[sp.title, sp.company].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ocean-200 px-4 py-3 transition hover:bg-ocean-50">
            <input
              type="checkbox"
              checked={sessionForm.is_published}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, is_published: e.target.checked }))
              }
              className="h-4 w-4 rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
            />
            <span className="text-sm font-medium text-ocean-950">
              Hiển thị phiên này trên trang công khai
            </span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
        title={deleteTarget?.kind === "day" ? "Xoá ngày" : "Xoá phiên"}
        message={
          deleteTarget?.kind === "day"
            ? `Xoá “${deleteTarget?.name}”? Toàn bộ phiên thuộc ngày này cũng sẽ bị xoá. Thao tác không thể hoàn tác.`
            : `Xoá phiên “${deleteTarget?.name}”? Thao tác không thể hoàn tác.`
        }
      />
    </>
  );
}
