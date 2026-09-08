"use client";

import { useCallback, useState } from "react";
import { Loader2, Plus, Save, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useApi } from "@/lib/admin-auth";
import { useMountEffect } from "@/lib/use-mount";
import { ApiError } from "@/lib/api";
import type { HeroSlide, Highlight, Settings, StatItem } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminCard, AsyncState } from "@/components/admin/DataShell";
import { useToast } from "@/components/admin/Toast";
import { ImageInput } from "@/components/admin/ImageInput";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { cn, fromDateTimeInput, toDateTimeInput } from "@/lib/utils";

const TABS = [
  { id: "general", label: "Thông tin chung" },
  { id: "hero", label: "Trang chủ" },
  { id: "about", label: "Giới thiệu" },
  { id: "contact", label: "Liên hệ & Mạng xã hội" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminSettingsPage() {
  const api = useApi();
  const { notify } = useToast();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSettings(await api.get<Settings>("/admin/settings"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được cấu hình");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useMountEffect(() => {
    void load();
  });

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (!settings.event_name.trim()) {
      setFieldErrors({ event_name: "Vui lòng nhập tên sự kiện" });
      setTab("general");
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const updated = await api.put<Settings>("/admin/settings", {
        ...settings,
        start_date: fromDateTimeInput(settings.start_date ?? ""),
        end_date: fromDateTimeInput(settings.end_date ?? ""),
      });
      setSettings(updated);
      notify("Đã lưu cấu hình sự kiện");
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {});
        notify(err.message, "error");
      } else notify("Không lưu được cấu hình", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- repeatable list helpers ----
  const updateStat = (i: number, patch: Partial<StatItem>) =>
    set("stats", settings!.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateHighlight = (i: number, patch: Partial<Highlight>) =>
    set("highlights", settings!.highlights.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  const updateSlide = (i: number, patch: Partial<HeroSlide>) =>
    set("hero_slides", settings!.hero_slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <>
      <AdminPageHeader
        title="Cấu hình sự kiện"
        description="Tên, thời gian, địa điểm, nội dung trang chủ và thông tin liên hệ hiển thị trên toàn bộ trang."
        action={
          <Button type="submit" form="settings-form" disabled={saving || !settings}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        }
      />

      <AsyncState
        loading={loading}
        error={error}
        empty={!settings}
        emptyIcon={SettingsIcon}
        emptyTitle="Chưa có cấu hình"
        onRetry={load}
      >
        {settings && (
          <form id="settings-form" onSubmit={save}>
            <div className="mb-6 flex flex-wrap gap-1.5 border-b border-ocean-100 pb-px">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={cn(
                    "relative -mb-px rounded-t-lg px-4 py-2.5 text-sm font-medium transition duration-300",
                    tab === t.id
                      ? "border-b-2 border-ocean-600 text-ocean-800"
                      : "border-b-2 border-transparent text-ocean-950/50 hover:text-ocean-800",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ---------- General ---------- */}
            {tab === "general" && (
              <div className="space-y-5">
                <AdminCard className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      id="s-name"
                      label="Tên sự kiện"
                      required
                      value={settings.event_name}
                      error={fieldErrors.event_name}
                      onChange={(e) => set("event_name", e.target.value)}
                    />
                    <TextField
                      id="s-tagline"
                      label="Khẩu hiệu"
                      value={settings.event_tagline}
                      onChange={(e) => set("event_tagline", e.target.value)}
                      placeholder="Vietnam Hospitality & Digital Forum"
                    />
                  </div>
                  <TextAreaField
                    id="s-desc"
                    label="Mô tả ngắn"
                    rows={2}
                    value={settings.event_description}
                    onChange={(e) => set("event_description", e.target.value)}
                    hint="Hiển thị ở chân trang và thẻ chia sẻ mạng xã hội."
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      id="s-start"
                      type="datetime-local"
                      label="Thời gian bắt đầu"
                      value={toDateTimeInput(settings.start_date)}
                      onChange={(e) => set("start_date", e.target.value)}
                    />
                    <TextField
                      id="s-end"
                      type="datetime-local"
                      label="Thời gian kết thúc"
                      value={toDateTimeInput(settings.end_date)}
                      onChange={(e) => set("end_date", e.target.value)}
                    />
                  </div>
                </AdminCard>

                <AdminCard className="space-y-5">
                  <h2 className="text-base font-bold tracking-tight text-ocean-950">Địa điểm</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      id="s-venue"
                      label="Tên địa điểm"
                      value={settings.venue_name}
                      onChange={(e) => set("venue_name", e.target.value)}
                    />
                    <TextField
                      id="s-venue-addr"
                      label="Địa chỉ"
                      value={settings.venue_address}
                      onChange={(e) => set("venue_address", e.target.value)}
                    />
                  </div>
                  <TextField
                    id="s-map"
                    type="url"
                    label="Đường dẫn nhúng bản đồ"
                    value={settings.venue_map_url}
                    onChange={(e) => set("venue_map_url", e.target.value)}
                    hint="Lấy từ Google Maps → Chia sẻ → Nhúng bản đồ (thuộc tính src)."
                  />
                </AdminCard>

                <AdminCard>
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <span>
                      <span className="block font-semibold text-ocean-950">Mở cổng đăng ký</span>
                      <span className="mt-0.5 block text-sm text-ocean-950/50">
                        Tắt để đóng biểu mẫu đăng ký trên trang công khai.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.registration_open}
                      onChange={(e) => set("registration_open", e.target.checked)}
                      className="h-5 w-5 shrink-0 rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                    />
                  </label>
                </AdminCard>
              </div>
            )}

            {/* ---------- Hero ---------- */}
            {tab === "hero" && (
              <div className="space-y-5">
                <AdminCard className="space-y-5">
                  <TextField
                    id="s-hero-title"
                    label="Tiêu đề lớn trang chủ"
                    value={settings.hero_title}
                    onChange={(e) => set("hero_title", e.target.value)}
                  />
                  <TextAreaField
                    id="s-hero-sub"
                    label="Mô tả dưới tiêu đề"
                    rows={2}
                    value={settings.hero_subtitle}
                    onChange={(e) => set("hero_subtitle", e.target.value)}
                  />
                  <ImageInput
                    value={settings.hero_image}
                    onChange={(url) => set("hero_image", url)}
                    label="Ảnh nền mặc định"
                    aspect="aspect-16/9 max-h-72"
                    hint="Dùng khi chưa cấu hình slideshow bên dưới."
                  />
                </AdminCard>

                <AdminCard>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-ocean-950">
                        Slideshow trang chủ
                      </h2>
                      <p className="mt-0.5 text-sm text-ocean-950/50">
                        Các ảnh chuyển tự động sau mỗi 6 giây.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => set("hero_slides", [...settings.hero_slides, { image: "", caption: "" }])}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm ảnh
                    </Button>
                  </div>

                  {settings.hero_slides.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-ocean-200 px-4 py-8 text-center text-sm text-ocean-950/45">
                      Chưa có ảnh nào. Trang chủ sẽ dùng ảnh nền mặc định.
                    </p>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {settings.hero_slides.map((slide, i) => (
                        <div key={i} className="rounded-2xl border border-ocean-100 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-ocean-950/45">
                              Ảnh {i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                set("hero_slides", settings.hero_slides.filter((_, x) => x !== i))
                              }
                              aria-label={`Xoá ảnh ${i + 1}`}
                              className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <ImageInput
                            value={String(slide.image ?? "")}
                            onChange={(url) => updateSlide(i, { image: url })}
                            label=""
                            aspect="aspect-16/9 max-h-40"
                          />
                          <TextField
                            id={`slide-caption-${i}`}
                            label="Chú thích"
                            wrapperClassName="mt-3"
                            value={String(slide.caption ?? "")}
                            onChange={(e) => updateSlide(i, { caption: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>

                <AdminCard>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-ocean-950">
                        Số liệu nổi bật
                      </h2>
                      <p className="mt-0.5 text-sm text-ocean-950/50">
                        Dải số đếm ngay dưới phần đầu trang chủ.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set("stats", [
                          ...settings.stats,
                          { value: 0, suffix: "+", label: "", icon: "users" },
                        ])
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Thêm số liệu
                    </Button>
                  </div>

                  {settings.stats.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-ocean-200 px-4 py-8 text-center text-sm text-ocean-950/45">
                      Chưa có số liệu nào.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {settings.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="grid gap-3 rounded-xl border border-ocean-100 p-3.5 sm:grid-cols-[7rem_5rem_1fr_8rem_auto]"
                        >
                          <TextField
                            id={`stat-value-${i}`}
                            type="number"
                            label="Giá trị"
                            value={String(stat.value ?? 0)}
                            onChange={(e) => updateStat(i, { value: Number(e.target.value) })}
                          />
                          <TextField
                            id={`stat-suffix-${i}`}
                            label="Hậu tố"
                            value={String(stat.suffix ?? "")}
                            onChange={(e) => updateStat(i, { suffix: e.target.value })}
                            placeholder="+"
                          />
                          <TextField
                            id={`stat-label-${i}`}
                            label="Nhãn"
                            value={String(stat.label ?? "")}
                            onChange={(e) => updateStat(i, { label: e.target.value })}
                            placeholder="Khách tham dự"
                          />
                          <TextField
                            id={`stat-icon-${i}`}
                            label="Biểu tượng"
                            value={String(stat.icon ?? "")}
                            onChange={(e) => updateStat(i, { icon: e.target.value })}
                            placeholder="users"
                            hint="users, mic, building, globe"
                          />
                          <button
                            type="button"
                            onClick={() => set("stats", settings.stats.filter((_, x) => x !== i))}
                            aria-label={`Xoá số liệu ${i + 1}`}
                            className="mt-7 grid h-11 w-11 place-items-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>

                <AdminCard>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold tracking-tight text-ocean-950">
                        Điểm nhấn sự kiện
                      </h2>
                      <p className="mt-0.5 text-sm text-ocean-950/50">
                        Bốn thẻ giới thiệu hiển thị ở trang chủ và trang giới thiệu.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set("highlights", [
                          ...settings.highlights,
                          { icon: "sparkles", title: "", description: "" },
                        ])
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Thêm điểm nhấn
                    </Button>
                  </div>

                  {settings.highlights.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-ocean-200 px-4 py-8 text-center text-sm text-ocean-950/45">
                      Chưa có điểm nhấn nào.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {settings.highlights.map((h, i) => (
                        <div key={i} className="rounded-xl border border-ocean-100 p-3.5">
                          <div className="grid gap-3 sm:grid-cols-[9rem_1fr_auto]">
                            <TextField
                              id={`hl-icon-${i}`}
                              label="Biểu tượng"
                              value={String(h.icon ?? "")}
                              onChange={(e) => updateHighlight(i, { icon: e.target.value })}
                              placeholder="presentation"
                              hint="presentation, handshake, sparkles, award"
                            />
                            <TextField
                              id={`hl-title-${i}`}
                              label="Tiêu đề"
                              value={String(h.title ?? "")}
                              onChange={(e) => updateHighlight(i, { title: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                set("highlights", settings.highlights.filter((_, x) => x !== i))
                              }
                              aria-label={`Xoá điểm nhấn ${i + 1}`}
                              className="mt-7 grid h-11 w-11 place-items-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <TextAreaField
                            id={`hl-desc-${i}`}
                            label="Mô tả"
                            rows={2}
                            wrapperClassName="mt-3"
                            value={String(h.description ?? "")}
                            onChange={(e) => updateHighlight(i, { description: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </AdminCard>
              </div>
            )}

            {/* ---------- About ---------- */}
            {tab === "about" && (
              <AdminCard className="space-y-5">
                <TextField
                  id="s-about-title"
                  label="Tiêu đề trang giới thiệu"
                  value={settings.about_title}
                  onChange={(e) => set("about_title", e.target.value)}
                />
                <ImageInput
                  value={settings.about_image}
                  onChange={(url) => set("about_image", url)}
                  label="Ảnh minh hoạ"
                  aspect="aspect-16/9 max-h-72"
                />
                <RichTextEditor
                  label="Nội dung giới thiệu"
                  value={settings.about_content}
                  onChange={(html) => set("about_content", html)}
                  minHeight="22rem"
                />
              </AdminCard>
            )}

            {/* ---------- Contact ---------- */}
            {tab === "contact" && (
              <div className="space-y-5">
                <AdminCard className="space-y-5">
                  <h2 className="text-base font-bold tracking-tight text-ocean-950">
                    Thông tin liên hệ
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      id="s-email"
                      type="email"
                      label="Email"
                      value={settings.contact_email}
                      error={fieldErrors.contact_email}
                      onChange={(e) => set("contact_email", e.target.value)}
                    />
                    <TextField
                      id="s-phone"
                      label="Điện thoại"
                      value={settings.contact_phone}
                      onChange={(e) => set("contact_phone", e.target.value)}
                    />
                  </div>
                  <TextField
                    id="s-address"
                    label="Địa chỉ văn phòng"
                    value={settings.contact_address}
                    onChange={(e) => set("contact_address", e.target.value)}
                  />
                </AdminCard>

                <AdminCard className="space-y-5">
                  <h2 className="text-base font-bold tracking-tight text-ocean-950">
                    Mạng xã hội
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {(["facebook", "linkedin", "youtube", "instagram"] as const).map((key) => (
                      <TextField
                        key={key}
                        id={`s-social-${key}`}
                        type="url"
                        label={key[0].toUpperCase() + key.slice(1)}
                        value={settings.socials?.[key] ?? ""}
                        onChange={(e) =>
                          set("socials", { ...settings.socials, [key]: e.target.value })
                        }
                        placeholder={`https://${key}.com/…`}
                      />
                    ))}
                  </div>
                </AdminCard>
              </div>
            )}

            {/* ---------- SEO ---------- */}
            {tab === "seo" && (
              <AdminCard className="space-y-5">
                <TextField
                  id="s-seo-title"
                  label="Tiêu đề SEO"
                  value={settings.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  hint="Bỏ trống để dùng tên sự kiện. Nên dưới 60 ký tự."
                />
                <TextAreaField
                  id="s-seo-desc"
                  label="Mô tả SEO"
                  rows={3}
                  value={settings.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  hint="Hiển thị trên kết quả tìm kiếm. Nên trong khoảng 150–160 ký tự."
                />

                <div className="rounded-xl border border-ocean-100 bg-ocean-50/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ocean-950/45">
                    Xem trước trên Google
                  </p>
                  <div className="mt-3">
                    <p className="text-[0.8125rem] text-emerald-700">vhdcorp.com</p>
                    <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">
                      {settings.seo_title || settings.event_name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ocean-950/60">
                      {settings.seo_description || settings.event_description}
                    </p>
                  </div>
                </div>
              </AdminCard>
            )}
          </form>
        )}
      </AsyncState>
    </>
  );
}
