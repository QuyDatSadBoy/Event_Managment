import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { safeGet } from "@/lib/api";
import type { HomePayload } from "@/lib/types";
import { FALLBACK_SETTINGS } from "@/lib/settings";
import { Hero } from "@/components/site/Hero";
import { StatsBand } from "@/components/site/StatsBand";
import { HighlightGrid } from "@/components/site/HighlightGrid";
import { AgendaPreview } from "@/components/site/AgendaPreview";
import { SpeakerCard } from "@/components/site/SpeakerCard";
import { PostCard } from "@/components/site/PostCard";
import { PartnerWall } from "@/components/site/PartnerWall";
import { GalleryStrip } from "@/components/site/GalleryStrip";
import { CtaBand } from "@/components/site/CtaBand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { leadParagraphs } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";

export const revalidate = 60;

const EMPTY: HomePayload = {
  settings: FALLBACK_SETTINGS,
  speakers: [],
  posts: [],
  partners: [],
  gallery: [],
  agenda: [],
};

export async function generateMetadata(): Promise<Metadata> {
  const home = await safeGet<HomePayload>("/home", EMPTY, 60);
  const s = home.settings;
  return {
    title: s.seo_title || `${s.event_name} — ${s.event_tagline}`,
    description: s.seo_description || s.event_description,
    openGraph: {
      title: s.seo_title || s.event_name,
      description: s.seo_description || s.event_description,
      images: s.hero_image ? [{ url: s.hero_image }] : undefined,
    },
  };
}

export default async function HomePage() {
  const home = await safeGet<HomePayload>("/home", EMPTY, 60);
  const { settings, speakers, posts, partners, gallery, agenda } = home;

  const [featuredPost, ...restPosts] = posts;

  // The home page shows the opening of the about copy, not a clamped excerpt of
  // the whole thing — a mid-word ellipsis reads as a bug.
  const lead = leadParagraphs(settings.about_content, 2);

  return (
    <>
      <Hero settings={settings} />
      <StatsBand stats={settings.stats} />

      {/* ---------------- Giới thiệu ---------------- */}
      <section className="container-page section-y">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-[1.75rem] shadow-[0_30px_70px_-30px_rgb(8_42_77/0.5)]">
              <SafeImage
                src={settings.about_image || settings.hero_image}
                alt={settings.about_title || settings.event_name}
                sizes="(max-width: 1024px) 92vw, 46vw"
              />
            </div>
          </Reveal>

          <div>
            <SectionHeading
              title={settings.about_title || `Về ${settings.event_name}`}
              align="left"
            />
            {lead && (
              <div
                className="prose-event mt-6"
                dangerouslySetInnerHTML={{ __html: lead }}
              />
            )}
            <div className="mt-8">
              <ButtonLink href="/gioi-thieu" variant="outline">
                Tìm hiểu thêm
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>

        <HighlightGrid highlights={settings.highlights} />
      </section>

      {/* ---------------- Chương trình ---------------- */}
      {agenda.length > 0 && (
        <section className="relative overflow-hidden bg-ocean-50/60 section-y">
          <div className="container-page">
            <SectionHeading
              title="Hai ngày nội dung liền mạch"
              description="Từ phiên toàn thể buổi sáng tới các toạ đàm chuyên đề và hoạt động kết nối giao thương."
            />
            <AgendaPreview days={agenda} />
          </div>
        </section>
      )}

      {/* ---------------- Diễn giả ---------------- */}
      {speakers.length > 0 && (
        <section className="container-page section-y">
          <SectionHeading
            title="Những người trực tiếp làm nghề"
            description="Lãnh đạo vận hành, chuyên gia công nghệ và nhà đầu tư chia sẻ điều họ đã thử và đã học được."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {speakers.slice(0, 8).map((speaker, i) => (
              <Reveal key={speaker.id} delay={i * 70}>
                <SpeakerCard speaker={speaker} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <ButtonLink href="/dien-gia" variant="outline">
              Xem tất cả diễn giả
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </Reveal>
        </section>
      )}

      {/* ---------------- Thư viện ---------------- */}
      {gallery.length > 0 && (
        <section className="container-page pb-14 sm:pb-18 lg:pb-22">
          <SectionHeading
            title="Khoảnh khắc từ các kỳ trước"
            description="Ảnh, video và tài liệu báo chí của VHD Summit qua từng năm."
          />
          <GalleryStrip items={gallery} />
        </section>
      )}

      {/* ---------------- Tin tức ---------------- */}
      {posts.length > 0 && (
        <section className="bg-ocean-50/60 section-y">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                title="Cập nhật mới nhất"
                align="left"
                className="max-w-xl"
              />
              <Reveal delay={100}>
                <Link
                  href="/tin-tuc"
                  className="group -mx-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ocean-700"
                >
                  Tất cả bài viết
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>

            <div className="mt-12 space-y-6">
              {featuredPost && (
                <Reveal>
                  <PostCard post={featuredPost} featured />
                </Reveal>
              )}
              {restPosts.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {restPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i + 1) * 90}>
                      <PostCard post={post} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Đối tác ---------------- */}
      {partners.length > 0 && (
        <section className="container-page section-y">
          <SectionHeading
            title="Đồng hành cùng VHD Summit 2026"
            description="Cảm ơn các đơn vị đã đồng hành để diễn đàn diễn ra."
          />
          <div className="mt-14">
            <PartnerWall partners={partners} />
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
    </>
  );
}
