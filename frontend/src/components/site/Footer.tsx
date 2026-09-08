import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { BRAND_ICONS } from "@/components/ui/BrandIcons";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

const COLUMNS = [
  {
    title: "Sự kiện",
    links: [
      { href: "/gioi-thieu", label: "Giới thiệu" },
      { href: "/chuong-trinh", label: "Chương trình" },
      { href: "/dien-gia", label: "Diễn giả" },
      { href: "/doi-tac", label: "Đối tác & Nhà tài trợ" },
    ],
  },
  {
    title: "Nội dung",
    links: [
      { href: "/tin-tuc", label: "Tin tức" },
      { href: "/tin-tuc?category=speech", label: "Bài phát biểu" },
      { href: "/tin-tuc?category=press", label: "Thông cáo báo chí" },
      { href: "/thu-vien", label: "Thư viện ảnh & video" },
    ],
  },
  {
    title: "Tham dự",
    links: [
      { href: "/dang-ky", label: "Đăng ký tham dự" },
      { href: "/lien-he", label: "Liên hệ ban tổ chức" },
      { href: "/thu-vien?type=document", label: "Tài liệu báo chí" },
      { href: "/admin", label: "Trang quản trị" },
    ],
  },
];

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const socials = Object.entries(settings.socials ?? {}).filter(
    ([key, url]) => url && key in BRAND_ICONS,
  );

  return (
    <footer className="surface-deep relative overflow-hidden text-ocean-100">
      <div className="grid-overlay absolute inset-0 opacity-60" aria-hidden />

      <div className="container-page relative pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-linear-135 from-ocean-500 to-cyan-glow text-base font-extrabold tracking-tighter text-white">
                VHD
              </span>
              <span>
                <span className="block text-base font-bold leading-tight text-white">
                  {settings.event_name}
                </span>
                <span className="block text-xs text-ocean-200/70">{settings.event_tagline}</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-pretty text-sm leading-relaxed text-ocean-100/65">
              {settings.event_description}
            </p>

            <ul className="mt-7 space-y-3 text-sm">
              {settings.contact_address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                  <span className="text-ocean-100/75">{settings.contact_address}</span>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="text-ocean-100/75 transition hover:text-white"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                    className="text-ocean-100/75 transition hover:text-white"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <div className="mt-7 flex gap-2.5">
                {socials.map(([key, url]) => {
                  const Icon = BRAND_ICONS[key as keyof typeof BRAND_ICONS];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={key}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-ocean-100 ring-1 ring-white/12 transition duration-300 hover:bg-cyan-glow hover:text-abyss hover:ring-cyan-glow"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  {col.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-sm text-ocean-100/65 transition hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {(settings.start_date || settings.venue_name) && (
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm backdrop-blur-sm">
            <span className="font-semibold text-white">
              {formatDateRange(settings.start_date, settings.end_date)}
            </span>
            {settings.venue_name && (
              <span className="text-ocean-100/70">
                {settings.venue_name}
                {settings.venue_address && ` · ${settings.venue_address}`}
              </span>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-ocean-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.event_name}. Bảo lưu mọi quyền.
          </p>
          <p>
            Phát triển bởi{" "}
            <a
              href="https://vhdcorp.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-ocean-100/70 transition hover:text-white"
            >
              VHD Corp
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
