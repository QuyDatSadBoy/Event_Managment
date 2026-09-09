import type { Metadata } from "next";
import { Handshake, Mail } from "lucide-react";
import { safeGet } from "@/lib/api";
import type { Partner } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { PARTNER_TIER_LABEL } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { PartnerWall } from "@/components/site/PartnerWall";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Block } from "@/components/ui/Block";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Đối tác & Nhà tài trợ",
  description:
    "Các đơn vị đồng hành cùng diễn đàn VHD Summit và thông tin đăng ký tài trợ.",
};

const TIER_BENEFITS = [
  {
    tier: "diamond" as const,
    highlights: [
      "Logo trên toàn bộ ấn phẩm và backdrop sân khấu chính",
      "Một phiên keynote 20 phút trong chương trình toàn thể",
      "Gian hàng 36m² tại vị trí trung tâm khu triển lãm",
      "20 vé đại biểu và 10 suất Gala Dinner",
    ],
  },
  {
    tier: "platinum" as const,
    highlights: [
      "Logo trên ấn phẩm chính và khu vực đón khách",
      "Một phiên chuyên đề 45 phút",
      "Gian hàng 18m² tại khu triển lãm",
      "12 vé đại biểu và 6 suất Gala Dinner",
    ],
  },
  {
    tier: "gold" as const,
    highlights: [
      "Logo trên website và ấn phẩm điện tử",
      "Tham gia một toạ đàm chuyên đề",
      "Gian hàng 9m² tại khu triển lãm",
      "6 vé đại biểu",
    ],
  },
];

export default async function PartnersPage() {
  const [partners, settings] = await Promise.all([
    safeGet<Partner[]>("/partners", [], 60),
    getSettings(),
  ]);

  return (
    <>
      <PageHero
        title="Đồng hành cùng diễn đàn"
        description="Cảm ơn các tổ chức, doanh nghiệp và cơ quan báo chí đã đồng hành để diễn đàn diễn ra."
        image={settings.hero_image}
        crumbs={[{ href: "/doi-tac", label: "Đối tác" }]}
      />

      <section className="container-page section-y">
        {partners.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="Danh sách đối tác đang được cập nhật"
            description="Ban tổ chức sẽ công bố các đơn vị đồng hành trong thời gian tới."
          />
        ) : (
          <PartnerWall partners={partners} />
        )}
      </section>

      {/* ---------- Sponsorship tiers ---------- */}
      <section className="bg-brand-50/60 section-y">
        <div className="container-page">
          <SectionHeading
            eyebrow="Tài trợ"
            title="Quyền lợi theo từng hạng tài trợ"
            description="Ba hạng tài trợ chính, mỗi hạng gắn với một mức hiện diện khác nhau trong chương trình."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TIER_BENEFITS.map((pkg, i) => (
              <Block key={pkg.tier}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-100 bg-white p-8 card-hover">
                  {i === 0 && (
                    <span
                      className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent-500 to-accent-400"
                      aria-hidden
                    />
                  )}
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-500">
                    Hạng
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                    {PARTNER_TIER_LABEL[pkg.tier]}
                  </h3>

                  <ul className="mt-7 flex-1 space-y-3.5">
                    {pkg.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                          aria-hidden
                        />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href="/lien-he?subject=tai-tro"
                    variant={i === 0 ? "primary" : "outline"}
                    className="mt-8 w-full"
                  >
                    Nhận hồ sơ tài trợ
                  </ButtonLink>
                </div>
              </Block>
            ))}
          </div>

          <Block className="mt-14">
            <div className="bg-brand-800 relative overflow-hidden rounded-3xl px-7 py-12 text-center sm:px-12">
              <div className="relative mx-auto max-w-2xl">
                <h3 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Cần một gói tài trợ riêng?
                </h3>
                <p className="mt-4 text-pretty text-brand-200">
                  Ban tổ chức có thể thiết kế gói đồng hành theo mục tiêu cụ thể của đơn vị bạn.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ButtonLink href="/lien-he?subject=tai-tro">
                    <Mail className="h-4 w-4" />
                    Liên hệ ban tổ chức
                  </ButtonLink>
                  {settings.contact_email && (
                    <ButtonLink
                      href={`mailto:${settings.contact_email}`}
                      variant="ghost"
                      className="border border-white/20 bg-white/8 text-white backdrop-blur-md hover:bg-white/15"
                    >
                      {settings.contact_email}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          </Block>
        </div>
      </section>
    </>
  );
}
