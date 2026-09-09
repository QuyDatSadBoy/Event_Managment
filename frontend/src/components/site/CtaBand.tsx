import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CtaBand({ settings }: { settings: Settings }) {
  return (
    <section className="container-page section-y">
      <Reveal>
        <div className="surface-deep relative overflow-hidden rounded-[2rem] px-7 py-14 text-center sm:px-14 lg:py-20">
          <div className="grid-overlay absolute inset-0 opacity-50" aria-hidden />
          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-glow/20 blur-3xl animate-float"
            aria-hidden
          />
          <div
            className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-ocean-500/25 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl lg:text-[2.75rem]">
              {settings.registration_open
                ? "Giữ chỗ tham dự VHD Summit 2026"
                : "Hẹn gặp lại tại kỳ diễn đàn tiếp theo"}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-ocean-100/75 sm:text-lg">
              {settings.registration_open
                ? "Đăng ký miễn phí cho khách chuyên ngành. Hoàn tất trong hai phút và nhận mã tham dự ngay."
                : "Theo dõi kênh thông tin của ban tổ chức để cập nhật lịch mở đăng ký kỳ tiếp theo."}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {settings.registration_open && (
                <ButtonLink href="/dang-ky" size="lg" variant="white">
                  Đăng ký ngay
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
              <ButtonLink
                href="/lien-he"
                size="lg"
                variant="ghost"
                className="border border-white/20 bg-white/8 text-white backdrop-blur-md hover:bg-white/15"
              >
                Liên hệ ban tổ chức
              </ButtonLink>
            </div>

            {(settings.start_date || settings.venue_name) && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-ocean-100/60">
                {settings.start_date && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cyan-glow" />
                    {formatDateRange(settings.start_date, settings.end_date)}
                  </span>
                )}
                {settings.venue_name && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-glow" />
                    {settings.venue_name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
