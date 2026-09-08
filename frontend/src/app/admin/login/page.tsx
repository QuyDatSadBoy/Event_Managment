"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Loader2, Lock, LogIn } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/admin-auth";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Vui lòng nhập email";
    if (!password) next.password = "Vui lòng nhập mật khẩu";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else {
        setFormError("Không đăng nhập được. Vui lòng thử lại.");
      }
      setSubmitting(false);
    }
  };

  return (
    <main className="surface-deep relative isolate grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden />
      <div
        className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-cyan-glow/15 blur-3xl animate-float"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-ocean-500/20 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm text-ocean-100/55 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="rounded-[1.75rem] border border-white/12 bg-white/95 p-8 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.6)] backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-linear-135 from-ocean-600 to-cyan-glow text-white">
              <Lock className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ocean-950">Đăng nhập quản trị</h1>
              <p className="text-sm text-ocean-950/50">VHD Summit — Trang quản trị nội dung</p>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-7 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-7 space-y-5">
            <TextField
              id="login-email"
              type="email"
              label="Email"
              required
              autoComplete="username"
              placeholder="admin@vhdcorp.com"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((x) => ({ ...x, email: "" }));
              }}
            />
            <TextField
              id="login-password"
              type="password"
              label="Mật khẩu"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((x) => ({ ...x, password: "" }));
              }}
            />

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ocean-100/40">
          Chỉ dành cho ban tổ chức. Mọi truy cập đều được ghi nhận.
        </p>
      </div>
    </main>
  );
}
