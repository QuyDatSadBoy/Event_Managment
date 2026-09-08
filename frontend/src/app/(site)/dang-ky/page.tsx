import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Lock, MapPin, Ticket } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatDateRange } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { RegistrationForm } from "@/components/site/RegistrationForm";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Đăng ký tham dự",
  description:
    "Đăng ký tham dự diễn đàn VHD Summit. Miễn phí cho khách chuyên ngành, hoàn tất trong hai phút.",
};

const PERKS = [
  "Vào cửa cả hai ngày diễn đàn và khu triển lãm",
  "Tài liệu chương trình và bộ slide được chia sẻ sau sự kiện",
  "Ưu tiên xếp lịch kết nối giao thương 1-1",
  "Tiệc trưa và cà phê giữa phiên trong cả hai ngày",
];

export default async function RegisterPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Đăng ký"
        title="Giữ chỗ tham dự diễn đàn"
        description="Miễn phí cho khách chuyên ngành. Điền thông tin dưới đây để nhận mã tham dự ngay."
        image={settings.hero_image}
        crumbs={[{ href: "/dang-ky", label: "Đăng ký" }]}
      />

      <section className="container-page py-16 lg:py-20">
        {!settings.registration_open ? (
          <EmptyState
            icon={Lock}
            title="Cổng đăng ký hiện đã đóng"
            description="Ban tổ chức sẽ thông báo khi mở lại đăng ký. Bạn có thể liên hệ trực tiếp nếu cần hỗ trợ."
            action={
              <Link
                href="/lien-he"
                className="inline-flex h-11 items-center rounded-full bg-ocean-600 px-6 text-sm font-semibold text-white transition hover:bg-ocean-500"
              >
                Liên hệ ban tổ chức
              </Link>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            <Reveal className="order-2 lg:order-1">
              <div className="rounded-[1.5rem] border border-ocean-100 bg-white p-6 shadow-[0_20px_50px_-32px_rgb(8_42_77/0.35)] sm:p-9">
                <h2 className="text-xl font-bold tracking-tight text-ocean-950">
                  Thông tin đăng ký
                </h2>
                <p className="mt-1.5 text-sm text-ocean-950/50">
                  Các trường có dấu <span className="text-rose-500">*</span> là bắt buộc.
                </p>
                <div className="mt-8">
                  <RegistrationForm />
                </div>
              </div>
            </Reveal>

            <aside className="order-1 lg:order-2">
              <Reveal delay={80} className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-5">
                <div className="surface-deep relative overflow-hidden rounded-3xl p-6 text-white">
                  <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden />
                  <div className="relative">
                    <Ticket className="h-7 w-7 text-cyan-glow" />
                    <h2 className="mt-4 text-lg font-bold leading-snug">
                      Vé tham dự miễn phí
                    </h2>
                    <p className="mt-2 text-sm text-ocean-100/70">
                      Dành cho khách chuyên ngành đã đăng ký trước.
                    </p>

                    <ul className="mt-6 space-y-3">
                      {PERKS.map((perk) => (
                        <li key={perk} className="flex gap-2.5 text-sm text-ocean-100/80">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {(settings.start_date || settings.venue_name) && (
                  <div className="rounded-3xl border border-ocean-100 bg-ocean-50/50 p-6">
                    <dl className="space-y-4 text-sm">
                      {settings.start_date && (
                        <div className="flex gap-3">
                          <CalendarDays className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ocean-500" />
                          <div>
                            <dt className="font-semibold text-ocean-950">Thời gian</dt>
                            <dd className="mt-0.5 text-ocean-950/60">
                              {formatDateRange(settings.start_date, settings.end_date)}
                            </dd>
                          </div>
                        </div>
                      )}
                      {settings.venue_name && (
                        <div className="flex gap-3">
                          <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ocean-500" />
                          <div>
                            <dt className="font-semibold text-ocean-950">Địa điểm</dt>
                            <dd className="mt-0.5 text-ocean-950/60">
                              {settings.venue_name}
                              {settings.venue_address && (
                                <>
                                  <br />
                                  {settings.venue_address}
                                </>
                              )}
                            </dd>
                          </div>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </Reveal>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
