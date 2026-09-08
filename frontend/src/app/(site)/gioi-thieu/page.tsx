import type { Metadata } from "next";
import { CalendarDays, MapPin, Navigation } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { formatDateRange } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { HighlightGrid } from "@/components/site/HighlightGrid";
import { StatsBand } from "@/components/site/StatsBand";
import { CtaBand } from "@/components/site/CtaBand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SafeImage } from "@/components/ui/SafeImage";
import { ButtonLink } from "@/components/ui/Button";
import { safeList } from "@/lib/api";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Giới thiệu",
    description: settings.event_description,
  };
}

export default async function AboutPage() {
  const [settings, { data: gallery }] = await Promise.all([
    getSettings(),
    safeList<GalleryItem>("/gallery?type=image&per_page=6", 60),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Về sự kiện"
        title={settings.about_title || `Về ${settings.event_name}`}
        description={settings.event_description}
        image={settings.about_image || settings.hero_image}
        crumbs={[{ href: "/gioi-thieu", label: "Giới thiệu" }]}
      />

      <div className="pb-2">
        <StatsBand stats={settings.stats} />
      </div>

      {/* ---------- Narrative ---------- */}
      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal>
            {settings.about_content ? (
              <div
                className="prose-event"
                dangerouslySetInnerHTML={{ __html: settings.about_content }}
              />
            ) : (
              <p className="text-lg leading-relaxed text-ocean-950/70">
                {settings.event_description}
              </p>
            )}
          </Reveal>

          <Reveal delay={120}>
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-5">
              <div className="relative aspect-4/3 overflow-hidden rounded-[1.5rem] shadow-[0_24px_60px_-30px_rgb(8_42_77/0.45)]">
                <SafeImage
                  src={settings.about_image || settings.hero_image}
                  alt={settings.event_name}
                  sizes="(max-width: 1024px) 92vw, 40vw"
                />
              </div>

              <div className="rounded-3xl border border-ocean-100 bg-ocean-50/50 p-6">
                <h2 className="text-base font-bold tracking-tight text-ocean-950">
                  Thông tin nhanh
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
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

                <ButtonLink href="/chuong-trinh" variant="outline" size="sm" className="mt-6 w-full">
                  Xem chương trình chi tiết
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>

        <HighlightGrid highlights={settings.highlights} />
      </section>

      {/* ---------- Venue ---------- */}
      {(settings.venue_map_url || settings.venue_name) && (
        <section className="bg-ocean-50/60 py-16 lg:py-24">
          <div className="container-page">
            <SectionHeading
              eyebrow="Địa điểm"
              title={settings.venue_name || "Địa điểm tổ chức"}
              description={settings.venue_address}
            />

            {settings.venue_map_url && (
              <Reveal className="mt-12 overflow-hidden rounded-[1.5rem] border border-ocean-100 shadow-[0_24px_60px_-30px_rgb(8_42_77/0.35)]">
                <iframe
                  src={settings.venue_map_url}
                  title={`Bản đồ ${settings.venue_name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[26rem] w-full border-0"
                />
              </Reveal>
            )}

            {settings.venue_address && (
              <Reveal className="mt-6 text-center">
                <ButtonLink
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${settings.venue_name} ${settings.venue_address}`,
                  )}`}
                  variant="outline"
                >
                  <Navigation className="h-4 w-4" />
                  Chỉ đường tới địa điểm
                </ButtonLink>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ---------- Past editions ---------- */}
      {gallery.length > 0 && (
        <section className="container-page py-16 lg:py-24">
          <SectionHeading
            eyebrow="Các kỳ trước"
            title="Diễn đàn qua từng năm"
            description="Một vài khoảnh khắc từ những kỳ tổ chức trước."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {gallery.slice(0, 6).map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 80}>
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-ocean-100">
                  <SafeImage
                    src={item.thumbnail || item.url}
                    alt={item.title || "Ảnh sự kiện"}
                    sizes="(max-width: 640px) 46vw, 30vw"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
    </>
  );
}
