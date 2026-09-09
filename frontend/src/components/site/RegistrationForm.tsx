"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import type { Registration, TicketType } from "@/lib/types";
import { TICKET_LABEL, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Honeypot, SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const TICKETS: TicketType[] = ["visitor", "delegate", "exhibitor", "press", "vip"];

const INTERESTS = [
  "Công nghệ vận hành",
  "Trải nghiệm khách hàng",
  "Phát triển bền vững",
  "F&B và chuỗi cung ứng",
  "Đầu tư & M&A",
  "Marketing và phân phối",
  "Kết nối giao thương",
  "Đào tạo nhân sự",
];

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  country: "Vietnam",
  ticket_type: "visitor" as TicketType,
  note: "",
};

export function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [interests, setInterests] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear the field's error as soon as the user starts fixing it.
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const toggleInterest = (topic: string) =>
    setInterests((list) =>
      list.includes(topic) ? list.filter((t) => t !== topic) : [...list, topic],
    );

  /** Mirrors the server rules so obvious mistakes never cost a round trip. */
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) next.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "Email không hợp lệ";
    if (!form.phone.trim()) next.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[\d\s+().-]{8,20}$/.test(form.phone.trim()))
      next.phone = "Số điện thoại không hợp lệ";
    setErrors(next);
    // Focus the first problem so a keyboard or screen-reader user is taken to it.
    const first = Object.keys(next)[0];
    if (first) document.getElementById(first)?.focus();
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const reg = await apiPost<Registration>("/registrations", {
        ...form,
        interests,
        website: honeypot,
      });
      const code = reg?.code ?? "";
      router.push(`/dang-ky/hoan-tat?code=${encodeURIComponent(code)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else {
        setFormError("Không gửi được đăng ký. Vui lòng thử lại.");
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="relative">
      <Honeypot value={honeypot} onChange={setHoneypot} />

      {formError && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <fieldset disabled={submitting} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="full_name"
            label="Họ và tên"
            required
            autoComplete="name"
            placeholder="Nguyễn Văn A…"
            value={form.full_name}
            error={errors.full_name}
            onChange={(e) => set("full_name")(e.target.value)}
          />
          <TextField
            id="email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            placeholder="ban@congty.com…"
            value={form.email}
            error={errors.email}
            onChange={(e) => set("email")(e.target.value)}
          />
          <TextField
            id="phone"
            type="tel"
            label="Số điện thoại"
            required
            autoComplete="tel"
            placeholder="09xx xxx xxx…"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
          <TextField
            id="country"
            label="Quốc gia"
            autoComplete="country-name"
            value={form.country}
            error={errors.country}
            onChange={(e) => set("country")(e.target.value)}
          />
          <TextField
            id="company"
            label="Đơn vị công tác"
            autoComplete="organization"
            placeholder="Tên công ty / tổ chức…"
            value={form.company}
            error={errors.company}
            onChange={(e) => set("company")(e.target.value)}
          />
          <TextField
            id="job_title"
            label="Chức danh"
            autoComplete="organization-title"
            placeholder="Giám đốc điều hành…"
            value={form.job_title}
            error={errors.job_title}
            onChange={(e) => set("job_title")(e.target.value)}
          />
        </div>

        <SelectField
          id="ticket_type"
          label="Bạn tham dự với vai trò"
          required
          value={form.ticket_type}
          error={errors.ticket_type}
          onChange={(e) => set("ticket_type")(e.target.value)}
        >
          {TICKETS.map((t) => (
            <option key={t} value={t}>
              {TICKET_LABEL[t]}
            </option>
          ))}
        </SelectField>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">
            Chủ đề bạn quan tâm
            <span className="ml-2 font-normal text-ink-muted">
              (dùng để xếp lịch kết nối giao thương)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((topic) => {
              const active = interests.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleInterest(topic)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium sm:min-h-10",
                    "transition-[background-color,border-color,color,box-shadow] duration-300",
                    active
                      ? "border-accent-500 bg-accent-500 text-ink shadow-[0_8px_20px_-10px_rgb(217_96_15/0.7)]"
                      : "border-line bg-white text-brand-700 hover:border-accent-400 hover:bg-accent-50",
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        <TextAreaField
          id="note"
          label="Ghi chú thêm"
          rows={4}
          placeholder="Yêu cầu về suất ăn, hỗ trợ di chuyển, câu hỏi cho ban tổ chức…"
          value={form.note}
          error={errors.note}
          onChange={(e) => set("note")(e.target.value)}
        />
      </fieldset>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-muted sm:max-w-sm">
          Bằng việc đăng ký, bạn đồng ý để ban tổ chức liên hệ về nội dung sự kiện. Thông tin không
          được chia sẻ cho bên thứ ba.
        </p>
        <Button type="submit" size="lg" disabled={submitting} className="sm:min-w-52">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang gửi…
            </>
          ) : (
            <>
              Hoàn tất đăng ký
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
