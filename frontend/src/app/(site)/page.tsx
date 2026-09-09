import type { Metadata } from "next";
import { safeGet } from "@/lib/api";
import type { HomePayload } from "@/lib/types";
import { FALLBACK_SETTINGS } from "@/lib/settings";
import { leadParagraphs } from "@/lib/utils";
import { Hero } from "@/components/site/Hero";
import { CountdownStrip } from "@/components/site/CountdownStrip";
import { StatsBand } from "@/components/site/StatsBand";
import { HighlightGrid } from "@/components/site/HighlightGrid";
import { AgendaPreview } from "@/components/site/AgendaPreview";
import { SpeakerCard } from "@/components/site/SpeakerCard";
import { PostCard } from "@/components/site/PostCard";
import { PartnerWall } from "@/components/site/PartnerWall";
import { GalleryStrip } from "@/components/site/GalleryStrip";
import { CtaBand } from "@/components/site/CtaBand";
import { MobileStickyCta } from "@/components/site/MobileStickyCta";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { ArrowRight } from "lucide-react";

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

/**
 * Section order follows design.pen D1/M1:
 * hero → countdown strip → about + stats → agenda → speakers → gallery →
 * news → partners → CTA band → footer.
 */
export default async function HomePage() {
  const home = await safeGet<HomePayload>("/home", EMPTY, 60);
  const { settings, speakers, posts, partners, gallery, agenda } = home;

  const [featuredPost, ...restPosts] = posts;
  // The opening of the about copy, kept whole — a clamped blob cuts mid-word.
  const lead = leadParagraphs(settings.about_content, 2);

  return (
    <>
      <Hero settings={settings} />
      <CountdownStrip settings={settings} />

      {/* ---------------- About + stats ---------------- */}
      <section className="container-page section-y">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-card bg-ph-bg">
            <SafeImage
              src={settings.about_image || settings.hero_image}
              alt={settings.about_title || settings.event_name}
              sizes="(max-width: 1024px) 92vw, 560px"
              quality={72}
            />
          </div>

          <div>
            <SectionHeading
              eyebrow="Về sự kiện"
              title={settings.about_title || `Về ${settings.event_name}`}
            />
            {lead && (
              <div className="prose-event mt-5" dangerouslySetInnerHTML={{ __html: lead }} />
            )}
            <ButtonLink href="/gioi-thieu" variant="outline" className="mt-7">
              Tìm hiểu thêm
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        {settings.stats?.length > 0 && (
          <div className="mt-10 lg:mt-14">
            <StatsBand stats={settings.stats} />
          </div>
        )}

        {settings.highlights?.length > 0 && (
          <div className="mt-6 lg:mt-8">
            <HighlightGrid highlights={settings.highlights} />
          </div>
        )}
      </section>

      {/* ---------------- Agenda ---------------- */}
      {agenda.length > 0 && (
        <section className="bg-brand-100">
          <div className="container-page section-y">
            <SectionHeading
              eyebrow="Chương trình"
              title="Hai ngày nội dung liền mạch"
              description="Từ phiên toàn thể buổi sáng tới các toạ đàm chuyên đề và hoạt động kết nối giao thương."
              action={{ href: "/chuong-trinh", label: "Xem tất cả" }}
            />
            <AgendaPreview days={agenda} />
          </div>
        </section>
      )}

      {/* ---------------- Speakers ---------------- */}
      {speakers.length > 0 && (
        <section className="container-page section-y">
          <SectionHeading
            eyebrow="Diễn giả"
            title="Những người trực tiếp làm nghề"
            description="Lãnh đạo vận hành, chuyên gia công nghệ và nhà đầu tư chia sẻ điều họ đã thử và đã học được."
            action={{ href: "/dien-gia", label: "Xem tất cả" }}
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {speakers.slice(0, 8).map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Gallery ---------------- */}
      {gallery.length > 0 && (
        <section className="bg-brand-100">
          <div className="container-page section-y">
            <SectionHeading
              eyebrow="Thư viện"
              title="Khoảnh khắc từ các kỳ trước"
              action={{ href: "/thu-vien", label: "Xem thư viện" }}
            />
            <GalleryStrip items={gallery} />
          </div>
        </section>
      )}

      {/* ---------------- News ---------------- */}
      {posts.length > 0 && (
        <section className="container-page section-y">
          <SectionHeading
            eyebrow="Tin tức"
            title="Cập nhật mới nhất"
            action={{ href: "/tin-tuc", label: "Tất cả bài viết" }}
          />
          <div className="mt-9 space-y-6">
            {featuredPost && <PostCard post={featuredPost} featured />}
            {restPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {restPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- Partners ---------------- */}
      {partners.length > 0 && (
        <section className="bg-brand-100">
          <div className="container-page section-y">
            <SectionHeading
              eyebrow="Đối tác"
              title="Đồng hành cùng sự kiện"
              align="center"
              className="mx-auto max-w-2xl text-center"
            />
            <div className="mt-10">
              <PartnerWall partners={partners} />
            </div>
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
      <MobileStickyCta settings={settings} />
    </>
  );
}
