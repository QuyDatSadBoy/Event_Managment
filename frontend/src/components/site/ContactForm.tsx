"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Honeypot, SelectField, TextAreaField, TextField } from "@/components/ui/Field";

const SUBJECTS = [
  { value: "", label: "Chọn chủ đề liên hệ" },
  { value: "Đăng ký tham dự", label: "Đăng ký tham dự" },
  { value: "Tài trợ & đối tác", label: "Tài trợ & đối tác" },
  { value: "Gian hàng triển lãm", label: "Gian hàng triển lãm" },
  { value: "Báo chí & truyền thông", label: "Báo chí & truyền thông" },
  { value: "Đề xuất diễn giả", label: "Đề xuất diễn giả" },
  { value: "Khác", label: "Khác" },
];

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [form, setForm] = useState({ ...EMPTY, subject: defaultSubject });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) next.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "Email không hợp lệ";
    if (!form.message.trim()) next.message = "Vui lòng nhập nội dung";
    else if (form.message.trim().length < 10) next.message = "Nội dung quá ngắn (tối thiểu 10 ký tự)";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiPost("/contacts", { ...form, website: honeypot });
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else {
        setFormError("Không gửi được liên hệ. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-7 py-10 text-center">
        <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
        <h3 className="mt-5 text-lg font-bold text-emerald-900">Đã gửi liên hệ</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-emerald-800/75">
          Cảm ơn bạn. Ban tổ chức sẽ phản hồi qua email trong vòng 1–2 ngày làm việc.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
        >
          Gửi liên hệ khác
        </button>
      </div>
    );
  }

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

      <fieldset disabled={submitting} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="contact-name"
            label="Họ và tên"
            required
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={form.name}
            error={errors.name}
            onChange={(e) => set("name")(e.target.value)}
          />
          <TextField
            id="contact-email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            placeholder="ban@congty.com"
            value={form.email}
            error={errors.email}
            onChange={(e) => set("email")(e.target.value)}
          />
          <TextField
            id="contact-phone"
            type="tel"
            label="Số điện thoại"
            autoComplete="tel"
            placeholder="09xx xxx xxx"
            value={form.phone}
            error={errors.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
          <SelectField
            id="contact-subject"
            label="Chủ đề"
            value={form.subject}
            error={errors.subject}
            onChange={(e) => set("subject")(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          id="contact-message"
          label="Nội dung"
          required
          rows={6}
          placeholder="Bạn cần ban tổ chức hỗ trợ điều gì?"
          value={form.message}
          error={errors.message}
          onChange={(e) => set("message")(e.target.value)}
        />
      </fieldset>

      <Button type="submit" size="lg" disabled={submitting} className="mt-7 w-full sm:w-auto sm:min-w-48">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang gửi…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Gửi liên hệ
          </>
        )}
      </Button>
    </form>
  );
}
