"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Heading2, Heading3,
  Undo2, Redo2, Eraser, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toolbar entries are plain data defined outside the component: building them
 * during render would mean creating closures that read the editor ref, which
 * React forbids in a render body.
 */
type ToolbarItem = {
  icon: typeof Bold;
  label: string;
  command: string;
  arg?: string;
  /** Prompts for a URL before running the command. */
  prompt?: string;
};

const TOOLBAR: ToolbarItem[][] = [
  [
    { icon: Bold, label: "Đậm", command: "bold" },
    { icon: Italic, label: "Nghiêng", command: "italic" },
    { icon: Underline, label: "Gạch chân", command: "underline" },
  ],
  [
    { icon: Heading2, label: "Tiêu đề lớn", command: "formatBlock", arg: "<h2>" },
    { icon: Heading3, label: "Tiêu đề nhỏ", command: "formatBlock", arg: "<h3>" },
    { icon: Quote, label: "Trích dẫn", command: "formatBlock", arg: "<blockquote>" },
  ],
  [
    { icon: List, label: "Danh sách", command: "insertUnorderedList" },
    { icon: ListOrdered, label: "Danh sách đánh số", command: "insertOrderedList" },
  ],
  [
    { icon: Link2, label: "Chèn liên kết", command: "createLink", prompt: "Nhập đường dẫn:" },
    { icon: Eraser, label: "Xoá định dạng", command: "removeFormat" },
  ],
  [
    { icon: Undo2, label: "Hoàn tác", command: "undo" },
    { icon: Redo2, label: "Làm lại", command: "redo" },
  ],
];

/**
 * Small contentEditable editor over document.execCommand. It is deprecated but
 * still universally implemented, and it keeps the admin bundle free of a
 * 100 kB editor dependency for what is essentially formatted prose.
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = "Nhập nội dung…",
  minHeight = "22rem",
}: {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [focused, setFocused] = useState(false);

  // Only push external values in when they differ, or the caret jumps on every keystroke.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      if (ref.current) onChange(ref.current.innerHTML);
    },
    [onChange],
  );

  const runItem = useCallback(
    (item: ToolbarItem) => {
      if (item.prompt) {
        const url = window.prompt(item.prompt, "https://");
        if (!url) return;
        exec(item.command, url);
        return;
      }
      exec(item.command, item.arg);
    },
    [exec],
  );

  return (
    <div>
      {label && <label className="mb-2 block text-sm font-semibold text-brand-950">{label}</label>}

      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-white transition-[background-color,border-color,color,box-shadow] duration-300",
          focused ? "border-brand-400 ring-4 ring-brand-500/10" : "border-brand-200",
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-brand-100 bg-brand-50/50 px-2 py-1.5">
          {TOOLBAR.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5">
              {gi > 0 && <span className="mx-1 h-5 w-px bg-brand-200" aria-hidden />}
              {group.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runItem(item)}
                    disabled={showHtml}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-700 transition hover:bg-white hover:text-brand-900 disabled:opacity-40"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowHtml((v) => !v)}
            title="Chỉnh sửa HTML"
            aria-pressed={showHtml}
            className={cn(
              "ml-auto grid h-8 w-8 place-items-center rounded-lg transition",
              showHtml ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-white",
            )}
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>

        {showHtml ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            style={{ minHeight }}
            className="w-full resize-y bg-white p-5 font-mono text-[0.8125rem] leading-relaxed text-brand-900 outline-hidden"
          />
        ) : (
          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={label ?? "Nội dung"}
            data-placeholder={placeholder}
            onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPaste={(e) => {
              // Paste as plain text so Word/Docs styling never leaks into the site.
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            }}
            style={{ minHeight }}
            className="prose-event max-w-none p-5 outline-hidden empty:before:text-brand-950/30 empty:before:content-[attr(data-placeholder)]"
          />
        )}
      </div>

      <p className="mt-1.5 text-xs text-brand-950/45">
        Dán nội dung sẽ tự động bỏ định dạng gốc. Dùng nút{" "}
        <Code2 className="inline h-3 w-3" /> để chỉnh HTML trực tiếp.
      </p>
    </div>
  );
}
