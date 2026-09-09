import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Clock, Globe, MapPin } from "lucide-react";
import { apiGet, safeList } from "@/lib/api";
import type { Speaker } from "@/lib/types";
import {
  SESSION_TYPE_LABEL, SESSION_TYPE_STYLE, cn, formatDate, initials,
} from "@/lib/utils";
import { BRAND_ICONS } from "@/components/ui/BrandIcons";
import { SafeImage } from "@/components/ui/SafeImage";
import { Block } from "@/components/ui/Block";
import { SpeakerCard } from "@/components/site/SpeakerCard";
import { PostCard } from "@/components/site/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

async function loadSpeaker(slug: string): Promise<Speaker | null> {
  try {
    return await apiGet<Speaker>(`/speakers/${encodeURIComponent(slug)}`, { revalidate: 60 });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const speaker = await loadSpeaker(slug);
  if (!speaker) return { title: "Không tìm thấy diễn giả" };

  const subtitle = [speaker.title, speaker.company].filter(Boolean).join(" · ");
  return {
    title: speaker.name,
    description: speaker.short_bio || subtitle,
    openGraph: {
      title: `${speaker.name} — ${subtitle}`,
      description: speaker.short_bio,
      images: speaker.photo ? [{ url: speaker.photo }] : undefined,
      type: "profile",
    },
  };
}

export default async function SpeakerDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const speaker = await loadSpeaker(slug);
  if (!speaker) notFound();

  const { data: others } = await safeList<Speaker>("/speakers?per_page=5", 60);
  const related = others.filter((s) => s.id !== speaker.id).slice(0, 4);

  const socials = Object.entries(speaker.socials ?? {}).filter(
    ([key, url]) => url && key in BRAND_ICONS,
  );

  return (
    <>
      {/* ---------- Profile header ---------- */}
      <section className="bg-white">
        <div className="band band-br relative isolate overflow-hidden bg-brand-900 pt-[var(--header-h)]">
        <div
          className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-accent-500/12 blur-3xl"
          aria-hidden
        />

        <div className="container-page relative py-14 lg:py-20">
          <Link
            href="/dien-gia"
            className="-mx-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-brand-200 transition-colors duration-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Tất cả diễn giả
          </Link>

          <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
            <Block>
              {/* A portrait, not an avatar. It fills its column at 4:5 so the
                  person carries the top of the page as much as the name does. */}
              <div className="relative mx-auto aspect-4/5 w-56 overflow-hidden rounded-panel shadow-panel sm:w-64 lg:mx-0 lg:w-full">
                <SafeImage
                  src={speaker.photo}
                  alt={speaker.name}
                  fallbackLabel={initials(speaker.name)}
                  priority
                  sizes="(max-width: 1024px) 16rem, 20rem"
                  quality={75}
                />
              </div>
            </Block>

            <Block className="text-center lg:text-left">
              {speaker.country && (
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-100 backdrop-blur-md">
                  <Globe className="h-3.5 w-3.5 text-accent-500" />
                  {speaker.country}
                </p>
              )}

              <h1 className="mt-5 text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
                {speaker.name}
              </h1>

              {speaker.title && (
                <p className="mt-4 text-lg font-medium text-brand-200 lg:text-xl">
                  {speaker.title}
                </p>
              )}
              {speaker.company && (
                <p className="mt-1.5 inline-flex items-center gap-2 text-base text-brand-200">
                  <Building2 className="h-4 w-4" />
                  {speaker.company}
                </p>
              )}

              {speaker.topics?.length > 0 && (
                <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {speaker.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-medium text-brand-100 backdrop-blur-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {socials.length > 0 && (
                <div className="mt-7 flex justify-center gap-2.5 lg:justify-start">
                  {socials.map(([key, url]) => {
                    const Icon = BRAND_ICONS[key as keyof typeof BRAND_ICONS];
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${speaker.name} trên ${key}`}
                        className="grid h-11 w-11 place-items-center rounded-full bg-white/8 text-brand-100 ring-1 ring-white/15 transition-[background-color,color,box-shadow] duration-300 hover:bg-accent-500 hover:text-ink hover:ring-accent-500"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </Block>
          </div>
        </div>
        </div>
      </section>

      {/* ---------- Bio + sessions ---------- */}
      <section className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <div>
            {speaker.bio ? (
              <Block>
                <h2 className="text-xl font-bold tracking-tight text-ink">Tiểu sử</h2>
                <div
                  className="prose-event mt-5"
                  dangerouslySetInnerHTML={{ __html: speaker.bio }}
                />
              </Block>
            ) : (
              speaker.short_bio && (
                <Block>
                  <p className="text-lg leading-relaxed text-ink-muted">{speaker.short_bio}</p>
                </Block>
              )
            )}

            {speaker.posts && speaker.posts.length > 0 && (
              <div className="mt-16">
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  Bài viết liên quan
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {speaker.posts.map((post) => (
                    <Block key={post.id}>
                      <PostCard post={post} />
                    </Block>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sessions sidebar */}
          <aside>
            <Block className="sticky top-[calc(var(--header-h)+1.5rem)]">
              <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6">
                <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-ink">
                  <Clock className="h-4.5 w-4.5 text-brand-500" />
                  Phiên tham gia
                </h2>

                {speaker.sessions && speaker.sessions.length > 0 ? (
                  <ul className="mt-5 space-y-3">
                    {speaker.sessions.map((session) => (
                      <li
                        key={session.id}
                        className="rounded-2xl border border-brand-100 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ring-1 ring-inset",
                              SESSION_TYPE_STYLE[session.type],
                            )}
                          >
                            {SESSION_TYPE_LABEL[session.type]}
                          </span>
                          {session.day_label && (
                            <span className="text-[0.6875rem] font-semibold text-brand-700">
                              {session.day_label}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-semibold leading-snug text-ink">
                          {session.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                          <span className="font-mono tabular-nums">
                            {session.start_time}
                            {session.end_time && ` – ${session.end_time}`}
                          </span>
                          {session.room && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.room}
                            </span>
                          )}
                        </div>
                        {session.day_date && (
                          <p className="mt-1 text-xs text-ink-muted">
                            {formatDate(session.day_date)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">
                    Lịch trình cụ thể sẽ được cập nhật khi ban tổ chức công bố chương trình chi
                    tiết.
                  </p>
                )}

                <Link
                  href="/chuong-trinh"
                  className="-mx-2 mt-4 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  Xem toàn bộ chương trình
                </Link>
              </div>
            </Block>
          </aside>
        </div>
      </section>

      {/* ---------- Related speakers ---------- */}
      {related.length > 0 && (
        <section className="bg-brand-50/60 section-y">
          <div className="container-page">
            <SectionHeading eyebrow="Diễn giả" title="Diễn giả khác tại diễn đàn" />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {related.map((s) => (
                <Block key={s.id}>
                  <SpeakerCard speaker={s} />
                </Block>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
