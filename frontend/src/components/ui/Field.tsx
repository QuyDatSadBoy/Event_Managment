"use client";

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-ocean-950 outline-hidden transition duration-300 " +
  "placeholder:text-ocean-950/32 focus:ring-4 disabled:cursor-not-allowed disabled:bg-ocean-50/60";

const OK = "border-ocean-200 focus:border-ocean-400 focus:ring-ocean-500/10";
const BAD = "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10";

function Wrapper({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-ocean-950">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ocean-950/45">{hint}</p>
      )}
    </div>
  );
}

type Common = { label?: string; error?: string; hint?: string; wrapperClassName?: string };

export function TextField({
  label, error, hint, wrapperClassName, className, id, required, name, type, ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label} htmlFor={id} required={required} error={error} hint={hint} className={wrapperClassName}>
      <input
        id={id}
        // Password managers and autofill key off name, not id.
        name={name ?? id}
        type={type}
        // Autocorrect on an address or a code is never helpful.
        spellCheck={type === "email" || type === "tel" || type === "url" ? false : undefined}
        autoCapitalize={type === "email" ? "none" : undefined}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(CONTROL, "h-12", error ? BAD : OK, className)}
        {...props}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label, error, hint, wrapperClassName, className, id, required, name, rows = 5, ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper label={label} htmlFor={id} required={required} error={error} hint={hint} className={wrapperClassName}>
      <textarea
        id={id}
        name={name ?? id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(CONTROL, "resize-y py-3 leading-relaxed", error ? BAD : OK, className)}
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({
  label, error, hint, wrapperClassName, className, id, required, name, children, ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper label={label} htmlFor={id} required={required} error={error} hint={hint} className={wrapperClassName}>
      <select
        id={id}
        name={name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL,
          "h-12 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2308508e%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1.15rem] bg-[right_1rem_center] bg-no-repeat pr-11",
          error ? BAD : OK,
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
}

/** Hidden field bots fill in. Kept out of the a11y tree and off-screen. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        // Screen readers and audit tools should treat this as absent.
        inert={true}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
