import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { Block } from "@/components/ui/Block";
import { BRAND_ICONS } from "@/components/ui/BrandIcons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ ban tổ chức diễn đàn về đăng ký, tài trợ, gian hàng và báo chí.",
};

type SearchParams = Promise<{ subject?: string }>;

const SUBJECT_MAP: Record<string, string> = {
  "tai-tro": "Tài trợ & đối tác",
  "gian-hang": "Gian hàng triển lãm",
  "bao-chi": "Báo chí & truyền thông",
  "dien-gia": "Đề xuất diễn giả",
};

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const [settings, params] = await Promise.all([getSettings(), searchParams]);
  const defaultSubject = SUBJECT_MAP[params.subject ?? ""] ?? "";

  const socials = Object.entries(settings.socials ?? {}).filter(
    ([key, url]) => url && key in BRAND_ICONS,
  );

  const CARDS = [
    settings.contact_email && {
      icon: Mail,
      label: "Email",
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    settings.contact_phone && {
      icon: Phone,
      label: "Điện thoại",
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/\s/g, "")}`,
    },
    settings.contact_address && {
      icon: MapPin,
      label: "Văn phòng",
      value: settings.contact_address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contact_address)}`,
    },
  ].filter(Boolean) as Array<{
    icon: typeof Mail;
    label: string;
    value: string;
    href: string;
  }>;

  return (
    <>
      <PageHero
        title="Ban tổ chức luôn sẵn sàng hỗ trợ"
        description="Gửi câu hỏi về đăng ký, tài trợ, gian hàng triển lãm hoặc yêu cầu tác nghiệp báo chí."
        image={settings.hero_image}
        crumbs={[{ href: "/lien-he", label: "Liên hệ" }]}
      />

      <section className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <Block>
            <div className="rounded-[1.5rem] border border-brand-100 bg-white p-6 shadow-[0_20px_50px_-32px_rgb(13_20_40/0.35)] sm:p-9">
              <h2 className="text-xl font-bold tracking-tight text-ink">Gửi tin nhắn</h2>
              <p className="mt-1.5 text-sm text-ink-muted">
                Chúng tôi phản hồi trong vòng 1–2 ngày làm việc.
              </p>
              <div className="mt-8">
                <ContactForm defaultSubject={defaultSubject} />
              </div>
            </div>
          </Block>

          <aside>
            <Block className="space-y-4">
              {CARDS.map((card) => {
                const Icon = card.icon;
                const external = card.href.startsWith("http");
                return (
                  <a
                    key={card.label}
                    href={card.href}
                    {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    className="group flex min-h-11 gap-4 rounded-2xl border border-brand-100 bg-white p-5 transition-[border-color,box-shadow] duration-300 hover:border-brand-300 hover:shadow-[0_16px_36px_-22px_rgb(13_20_40/0.35)]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-135 from-brand-600 to-brand-400 text-white transition-transform duration-400 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        {card.label}
                      </span>
                      <span className="mt-1 block text-sm font-medium leading-snug text-ink">
                        {card.value}
                      </span>
                    </span>
                  </a>
                );
              })}

              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <Clock className="h-3.5 w-3.5" />
                  Giờ làm việc
                </span>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                  Thứ hai – Thứ sáu: 08:30 – 17:30
                  <br />
                  Thứ bảy: 08:30 – 12:00
                </p>
              </div>

              {socials.length > 0 && (
                <div className="rounded-2xl border border-brand-100 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Theo dõi sự kiện
                  </p>
                  <div className="mt-3.5 flex gap-2.5">
                    {socials.map(([key, url]) => {
                      const Icon = BRAND_ICONS[key as keyof typeof BRAND_ICONS];
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={key}
                          className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700 transition-[background-color,color] duration-300 hover:bg-brand-600 hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </Block>
          </aside>
        </div>
      </section>

      {settings.venue_map_url && (
        <section className="container-page pb-20">
          <Block className="overflow-hidden rounded-[1.5rem] border border-brand-100 shadow-[0_24px_60px_-30px_rgb(13_20_40/0.35)]">
            <iframe
              src={settings.venue_map_url}
              title={`Bản đồ ${settings.venue_name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[24rem] w-full border-0"
            />
          </Block>
        </section>
      )}
    </>
  );
}
