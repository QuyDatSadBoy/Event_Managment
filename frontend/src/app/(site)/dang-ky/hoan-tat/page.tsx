import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, Mail, MapPin, Newspaper, Users,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatDateRange } from "@/lib/utils";
import { Block } from "@/components/ui/Block";
import { ButtonLink } from "@/components/ui/Button";
import { TicketCode } from "@/components/site/TicketCode";

export const metadata: Metadata = {
  title: "Đăng ký thành công",
  description: "Cảm ơn bạn đã đăng ký tham dự diễn đàn.",
  robots: { index: false, follow: false },
};

const NEXT_STEPS = [
  {
    icon: Mail,
    title: "Kiểm tra hộp thư",
    text: "Ban tổ chức sẽ gửi email xác nhận kèm mã tham dự trong vòng 24 giờ làm việc.",
  },
  {
    icon: CalendarDays,
    title: "Lưu lịch vào máy",
    text: "Thêm ngày diễn ra sự kiện vào lịch để không bỏ lỡ thông báo nhắc lịch.",
  },
  {
    icon: Users,
    title: "Chuẩn bị kết nối",
    text: "Lịch hẹn giao thương 1-1 được gửi trước sự kiện một tuần, dựa trên chủ đề bạn đã chọn.",
  },
];

export default async function ThankYouPage() {
  const settings = await getSettings();

  return (
    <section className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div className="bg-brand-800 absolute inset-0 -z-10" aria-hidden />
      <div
        className="absolute -right-32 top-10 -z-10 h-96 w-96 rounded-full bg-accent-500/12 blur-3xl"
        aria-hidden
      />

      <div className="container-page relative section-y">
        <div className="mx-auto max-w-2xl text-center">
          <Block>
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent-500/12 ring-1 ring-accent-500/30">
              <CheckCircle2 className="h-10 w-10 text-accent-500" />
            </span>
          </Block>

          <Block>
            <h1 className="mt-8 text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              Đăng ký thành công!
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-brand-200 lg:text-lg">
              Cảm ơn bạn đã đăng ký tham dự {settings.event_name}. Ban tổ chức đã ghi nhận thông
              tin của bạn.
            </p>
          </Block>

          <Suspense fallback={null}>
            <TicketCode />
          </Suspense>

          {(settings.start_date || settings.venue_name) && (
            <Block>
              <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-white/12 bg-white/6 px-7 py-5 text-sm backdrop-blur-md">
                {settings.start_date && (
                  <span className="inline-flex items-center gap-2 font-medium text-white">
                    <CalendarDays className="h-4 w-4 text-accent-500" />
                    {formatDateRange(settings.start_date, settings.end_date)}
                  </span>
                )}
                {settings.venue_name && (
                  <span className="inline-flex items-center gap-2 text-brand-200">
                    <MapPin className="h-4 w-4 text-accent-500" />
                    {settings.venue_name}
                  </span>
                )}
              </div>
            </Block>
          )}
        </div>

        {/* Next steps */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-5 sm:grid-cols-3">
          {NEXT_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Block key={step.title}>
                <div className="h-full rounded-2xl border border-white/12 bg-white/6 p-6 backdrop-blur-md">
                  <Icon className="h-6 w-6 text-accent-500" />
                  <h2 className="mt-4 text-base font-bold text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-200">{step.text}</p>
                </div>
              </Block>
            );
          })}
        </div>

        <Block className="mt-14 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/chuong-trinh" variant="cream">
            Xem chương trình
          </ButtonLink>
          <ButtonLink
            href="/tin-tuc"
            variant="ghost"
            className="border border-white/20 bg-white/8 text-white backdrop-blur-md hover:bg-white/15"
          >
            <Newspaper className="h-4 w-4" />
            Đọc tin tức mới nhất
          </ButtonLink>
        </Block>

        <Block className="mt-10 text-center">
          <p className="text-sm text-brand-200">
            Chưa nhận được email?{" "}
            <Link href="/lien-he" className="font-medium text-cream underline-offset-4 hover:underline">
              Liên hệ ban tổ chức
            </Link>
          </p>
        </Block>
      </div>
    </section>
  );
}
