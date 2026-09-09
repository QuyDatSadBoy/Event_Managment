import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Lock, MapPin, Ticket } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatDateRange } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { RegistrationForm } from "@/components/site/RegistrationForm";
import { Block } from "@/components/ui/Block";
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
        title="Giữ chỗ tham dự diễn đàn"
        description="Miễn phí cho khách chuyên ngành. Điền thông tin dưới đây để nhận mã tham dự ngay."
        image={settings.hero_image}
        crumbs={[{ href: "/dang-ky", label: "Đăng ký" }]}
      />

      <section className="container-page section-y">
        {!settings.registration_open ? (
          <EmptyState
            icon={Lock}
            title="Cổng đăng ký hiện đã đóng"
            description="Ban tổ chức sẽ thông báo khi mở lại đăng ký. Bạn có thể liên hệ trực tiếp nếu cần hỗ trợ."
            action={
              <Link
                href="/lien-he"
                className="inline-flex h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-ink transition hover:bg-accent-400"
              >
                Liên hệ ban tổ chức
              </Link>
            }
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            <Block className="order-2 lg:order-1">
              <div className="rounded-[1.5rem] border border-brand-100 bg-white p-6 shadow-[0_20px_50px_-32px_rgb(13_20_40/0.35)] sm:p-9">
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  Thông tin đăng ký
                </h2>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Các trường có dấu <span className="text-rose-500">*</span> là bắt buộc.
                </p>
                <div className="mt-8">
                  <RegistrationForm />
                </div>
              </div>
            </Block>

            <aside className="order-1 lg:order-2">
              <Block className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-5">
                <div className="bg-brand-800 relative overflow-hidden rounded-3xl p-6 text-white">
                  <div className="relative">
                    <Ticket className="h-7 w-7 text-accent-500" />
                    <h2 className="mt-4 text-lg font-bold leading-snug">
                      Vé tham dự miễn phí
                    </h2>
                    <p className="mt-2 text-sm text-brand-200">
                      Dành cho khách chuyên ngành đã đăng ký trước.
                    </p>

                    <ul className="mt-6 space-y-3">
                      {PERKS.map((perk) => (
                        <li key={perk} className="flex gap-2.5 text-sm text-brand-200">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {(settings.start_date || settings.venue_name) && (
                  <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6">
                    <dl className="space-y-4 text-sm">
                      {settings.start_date && (
                        <div className="flex gap-3">
                          <CalendarDays className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-500" />
                          <div>
                            <dt className="font-semibold text-ink">Thời gian</dt>
                            <dd className="mt-0.5 text-ink-muted">
                              {formatDateRange(settings.start_date, settings.end_date)}
                            </dd>
                          </div>
                        </div>
                      )}
                      {settings.venue_name && (
                        <div className="flex gap-3">
                          <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-500" />
                          <div>
                            <dt className="font-semibold text-ink">Địa điểm</dt>
                            <dd className="mt-0.5 text-ink-muted">
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
              </Block>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
