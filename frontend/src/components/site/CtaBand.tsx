import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The registration CTA is a contained panel, not a full-bleed band.
 *
 * Full-bleed navy here butted straight into the navy footer, and with no seam
 * between two identical grounds the pair read as one very tall dark block with
 * a stray heading floating in it. Insetting the panel puts a margin of page on
 * all four sides, so the CTA is an object the eye can find and the footer is
 * clearly something else.
 */
export function CtaBand({ settings }: { settings: Settings }) {
  return (
    <section className="bg-white section-y">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-panel bg-brand-900 px-6 py-14 text-center shadow-panel lg:px-12 lg:py-20">
          <div className="hex-field-dark absolute inset-0 -z-10" aria-hidden />
          <div
            className="absolute -bottom-32 -left-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent-500/12 blur-3xl"
            aria-hidden
          />

          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-[clamp(1.625rem,1.15rem+1.9vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-white">
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
                <ButtonLink href="/dang-ky" size="lg">
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
                    <CalendarDays className="h-4 w-4 text-accent-500" aria-hidden />
                    {formatDateRange(settings.start_date, settings.end_date)}
                  </span>
                )}
                {settings.venue_name && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent-500" aria-hidden />
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
