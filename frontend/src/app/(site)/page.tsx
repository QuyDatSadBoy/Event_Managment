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
import { PartnerStrip } from "@/components/site/PartnerStrip";
import { ButtonLink, Eyebrow } from "@/components/ui/Button";
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
 * Section order:
 * hero → countdown → partner strip (social proof) → about → scale +
 * highlights → agenda → speakers + CTA → gallery → news → partners →
 * CTA band → footer.
 *
 * The partner strip goes above the about copy on purpose: it is the only
 * credibility on the page that does not come from the site talking about
 * itself. Partners appear twice — once as that quiet strip, once as the
 * tiered wall lower down — because the two do different jobs.
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

      {/* Social proof before the site makes any claim about itself. */}
      <PartnerStrip partners={partners} />

      {/* ---------------- About: text left, photograph right ----------------
          The photograph sits on the right here and on the left in the scale
          section below, so the two read as one alternating rhythm rather than
          two stacked slabs. */}
      <section id="gioi-thieu" className="container-page section-y">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
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

          <div className="relative aspect-4/3 overflow-hidden rounded-panel bg-ph-bg shadow-panel lg:aspect-3/2">
            <SafeImage
              src={settings.about_image || settings.hero_image}
              alt={settings.about_title || settings.event_name}
              sizes="(max-width: 1024px) 92vw, 600px"
              quality={72}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Scale + highlights ----------------
          Its own band on the soft ground, so the figures are a stop on the
          page rather than a footnote to the about copy. */}
      {(settings.stats?.length > 0 || settings.highlights?.length > 0) && (
        <section className="bg-offwhite section-y">
          <div className="container-page">
            {settings.stats?.length > 0 && (
              <>
                <Eyebrow className="mb-8">Quy mô diễn đàn</Eyebrow>
                <StatsBand
                  stats={settings.stats}
                  image={settings.hero_image || settings.about_image}
                  imageAlt=""
                />
              </>
            )}

            {settings.highlights?.length > 0 && (
              <div className={settings.stats?.length > 0 ? "mt-14 lg:mt-20" : ""}>
                <HighlightGrid highlights={settings.highlights} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- Agenda ---------------- */}
      {agenda.length > 0 && (
        <section id="chuong-trinh" className="bg-brand-100">
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
        <section id="dien-gia" className="container-page section-y">
          <SectionHeading
            eyebrow="Diễn giả"
            title="Những người trực tiếp làm nghề"
            description="Lãnh đạo vận hành, chuyên gia công nghệ và nhà đầu tư chia sẻ điều họ đã thử và đã học được."
            action={{ href: "/dien-gia", label: "Xem tất cả" }}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {speakers.slice(0, 8).map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </div>

          {/* The speaker line-up is the strongest proof on the page, so intent
              peaks right after it. Without this the next register control is
              three sections away, past the gallery, the news and the partners.

              It is a light strip rather than another navy panel: the CTA band
              at the foot of the page is the navy one, and two identical dark
              blocks would read as the same thing said twice. */}
          {settings.registration_open && (
            <div className="relative isolate mt-10 overflow-hidden rounded-panel bg-surface px-6 py-6 lg:px-9 lg:py-7">
              <div className="hex-field absolute inset-0 -z-10 opacity-70" aria-hidden />
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <p className="text-pretty text-base font-semibold leading-snug text-ink lg:text-lg">
                  Gặp trực tiếp các diễn giả tại diễn đàn — đăng ký miễn phí cho khách chuyên
                  ngành.
                </p>
                <ButtonLink href="/dang-ky" className="shrink-0">
                  Đăng ký tham dự
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------------- Gallery ---------------- */}
      {gallery.length > 0 && (
        <section id="thu-vien" className="bg-brand-100">
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
        <section id="tin-tuc" className="container-page section-y">
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

      {/* ---------------- Partners ----------------
          The homepage shows the wall without tier labels and capped at twelve
          logos. The full tiered hierarchy is what `/doi-tac` is for, and on a
          phone the labelled version ran to two screens of logos immediately
          after the strip at the top of the page had already made the point. */}
      {partners.length > 0 && (
        <section id="doi-tac" className="bg-brand-100">
          <div className="container-page section-y">
            <SectionHeading
              eyebrow="Đối tác"
              title="Đồng hành cùng sự kiện"
              action={{ href: "/doi-tac", label: "Tất cả đối tác" }}
            />
            <div className="mt-10">
              <PartnerWall partners={partners.slice(0, 12)} showTierLabels={false} />
            </div>
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
      <MobileStickyCta settings={settings} />
    </>
  );
}
