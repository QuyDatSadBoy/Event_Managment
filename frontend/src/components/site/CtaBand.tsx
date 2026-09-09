import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { DecoRings } from "@/components/ui/Deco";

/**
 * design.pen D1 "Registration CTA band": the band's corner direction alternates
 * down the page, so where the hero cuts bottom-right this one cuts top-left.
 * Its wrapper is white — the section above it — and the footer that follows
 * stays square.
 */
export function CtaBand({ settings }: { settings: Settings }) {
  return (
    <section className="bg-white">
      <div className="band band-tl relative isolate overflow-hidden bg-brand-800">
        <DecoRings tone="dark" className="-left-32 -bottom-48 hidden h-[560px] w-[560px] lg:block" />

        <div className="container-page relative py-14 text-center lg:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-[clamp(1.5rem,1.1rem+1.6vw,2.125rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white">
              {settings.registration_open
                ? `Giữ chỗ tham dự ${settings.event_name}`
                : "Hẹn gặp lại tại kỳ diễn đàn tiếp theo"}
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-brand-200 lg:text-lg">
              {settings.registration_open
                ? "Đăng ký miễn phí cho khách chuyên ngành. Hoàn tất trong hai phút và nhận mã tham dự ngay."
                : "Theo dõi kênh thông tin của ban tổ chức để cập nhật lịch mở đăng ký kỳ tiếp theo."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {settings.registration_open && (
                <ButtonLink href="/dang-ky" size="lg" variant="cream">
                  Đăng ký ngay
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
              <ButtonLink
                href="/lien-he"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:bg-white/10"
              >
                Liên hệ ban tổ chức
              </ButtonLink>
            </div>

            {(settings.start_date || settings.venue_name) && (
              <p className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-brand-200">
                {settings.start_date && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-400" aria-hidden />
                    {formatDateRange(settings.start_date, settings.end_date)}
                  </span>
                )}
                {settings.venue_name && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-400" aria-hidden />
                    {settings.venue_name}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
