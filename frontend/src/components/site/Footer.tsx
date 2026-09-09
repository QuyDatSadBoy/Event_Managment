import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { BRAND_ICONS } from "@/components/ui/BrandIcons";
import { DecoDotGrid } from "@/components/ui/Deco";

const QUICK_LINKS = [
  { href: "/gioi-thieu", label: "Giới thiệu sự kiện" },
  { href: "/chuong-trinh", label: "Chương trình" },
  { href: "/dien-gia", label: "Diễn giả" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/thu-vien", label: "Thư viện ảnh" },
];

const ATTENDEE_LINKS = [
  { href: "/dang-ky", label: "Đăng ký tham dự" },
  { href: "/gioi-thieu#dia-diem", label: "Đường đi & địa điểm" },
  { href: "/doi-tac", label: "Đối tác & tài trợ" },
  { href: "/lien-he", label: "Liên hệ ban tổ chức" },
  { href: "/thu-vien?type=document", label: "Tài liệu báo chí" },
];

/**
 * design.pen "Footer Desktop": brand-primary-dark ground, four columns (about,
 * quick links, for attendees, organiser) over a bottom bar divided by a #0A6A62
 * rule. Body copy sits in brand-tint, icons in brand-secondary, the bottom bar
 * in brand-secondary. Footers stay square — no band corner.
 */
export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const socials = Object.entries(settings.socials ?? {}).filter(
    ([key, url]) => url && key in BRAND_ICONS,
  );

  return (
    <footer className="relative overflow-hidden bg-brand-900 text-white">
      <DecoDotGrid tone="dark" className="-right-10 top-8 w-[397px] opacity-70" />

      <div className="container-page relative grid gap-10 pb-11 pt-14 lg:grid-cols-[380px_220px_220px_1fr] lg:gap-16">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-3" translate="no">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-accent-500 text-[0.8125rem] font-extrabold text-ink">
              VHD
            </span>
            <span className="text-base font-bold text-white">{settings.event_name}</span>
          </Link>

          <p className="mt-3.5 max-w-sm text-pretty text-sm leading-relaxed text-brand-200">
            {settings.event_description}
          </p>

          {socials.length > 0 && (
            <div className="mt-5 flex gap-2.5">
              {socials.map(([key, url]) => {
                const Icon = BRAND_ICONS[key as keyof typeof BRAND_ICONS];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="grid h-11 w-11 place-items-center rounded-control bg-white/10 text-white transition-colors duration-300 hover:bg-accent-500 hover:text-ink"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <FooterColumn title="Liên kết nhanh" links={QUICK_LINKS} />
        <FooterColumn title="Dành cho khách tham dự" links={ATTENDEE_LINKS} />

        <div>
          <h2 className="text-sm font-bold text-white">Ban tổ chức</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {settings.contact_address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" aria-hidden />
                <span className="text-brand-200">{settings.contact_address}</span>
              </li>
            )}
            {settings.contact_phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" aria-hidden />
                <a
                  href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                  className="inline-flex min-h-11 items-center text-brand-200 transition-colors duration-300 hover:text-white sm:min-h-6"
                >
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" aria-hidden />
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="inline-flex min-h-11 items-center text-brand-200 transition-colors duration-300 hover:text-white sm:min-h-6"
                >
                  {settings.contact_email}
                </a>
              </li>
            )}
          </ul>

          {(settings.start_date || settings.venue_name) && (
            <p className="mt-5 text-caption text-brand-200">
              {formatDateRange(settings.start_date, settings.end_date)}
              {settings.venue_name && ` · ${settings.venue_name}`}
            </p>
          )}
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-[18px] text-caption text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.event_name}. Bảo lưu mọi quyền.</p>
          <p>
            Phát triển bởi{" "}
            <a
              href="https://vhdcorp.com"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors duration-300 hover:text-white"
            >
              VHD Corp
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-brand-200 transition-colors duration-300 hover:text-white sm:min-h-8"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
