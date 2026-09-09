import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Eye, Tag, User } from "lucide-react";
import { apiGet, safeGet } from "@/lib/api";
import type { Post } from "@/lib/types";
import { POST_CATEGORY_LABEL, cn, formatDate, initials, readingMinutes } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { Block } from "@/components/ui/Block";
import { PostCard } from "@/components/site/PostCard";
import { ShareBar } from "@/components/site/ShareBar";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

const CATEGORY_STYLE: Record<Post["category"], string> = {
  news: "bg-brand-600 text-white",
  speech: "bg-brand-400 text-brand-950",
  press: "bg-white/15 text-white ring-1 ring-white/25",
  announcement: "bg-cream text-[#3d2900]",
};

async function loadPost(slug: string): Promise<Post | null> {
  try {
    return await apiGet<Post>(`/posts/${encodeURIComponent(slug)}`, { revalidate: 60 });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at,
      authors: post.author_name ? [post.author_name] : undefined,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const related = await safeGet<Post[]>(`/posts/${encodeURIComponent(slug)}/related`, [], 60);
  const minutes = readingMinutes(post.content);

  return (
    <>
      {/* ---------- Article header ---------- */}
      <header className="bg-white">
        <div className="band band-br relative isolate overflow-hidden bg-brand-800 pt-[var(--header-h)]">
        <div className="absolute inset-0 -z-20">
          {post.cover ? (
            <SafeImage src={post.cover} alt="" sizes="768px" quality={40} priority fetchPriority="high" />
          ) : (
            <div className="bg-brand-800 absolute inset-0" />
          )}
        </div>
        <div
          className="absolute inset-0 -z-10 bg-linear-to-b from-brand-950/92 via-brand-950/88 to-brand-950/95"
          aria-hidden
        />

        <div className="container-page relative py-14 lg:py-20">
          <Link
            href="/tin-tuc"
            className="-mx-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-brand-200 transition-colors duration-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Tất cả tin tức
          </Link>

          <div className="mt-8 max-w-3xl">
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider",
                CATEGORY_STYLE[post.category],
              )}
            >
              {POST_CATEGORY_LABEL[post.category]}
            </span>

            <h1 className="mt-5 text-balance text-3xl font-extrabold leading-[1.12] tracking-[-0.035em] text-white sm:text-4xl lg:text-[3rem]">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-5 text-pretty text-base leading-relaxed text-brand-200 lg:text-lg">
                {post.excerpt}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-200">
              {post.author_name && (
                <span className="inline-flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-400" />
                  {post.author_name}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-400" />
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-400" />
                {minutes} phút đọc
              </span>
              {post.views > 0 && (
                <span className="inline-flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-400" />
                  {post.views} lượt xem
                </span>
              )}
            </div>
          </div>
        </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
          <article>
            {post.cover && (
              <Block className="relative mb-10 aspect-16/9 overflow-hidden rounded-[1.5rem] shadow-[0_24px_60px_-30px_rgb(12_43_41/0.5)]">
                <SafeImage
                  src={post.cover}
                  alt={post.title}
                  sizes="(max-width: 1024px) 92vw, 720px"
                  quality={72}
                  priority
                />
              </Block>
            )}

            <div
              className="prose-event"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags?.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-brand-100 pt-8">
                <Tag className="h-4 w-4 text-brand-400" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tin-tuc?q=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-3.5 text-xs font-medium text-brand-700 transition-colors duration-300 hover:bg-brand-100 sm:min-h-8"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <ShareBar title={post.title} />
          </article>

          <aside className="lg:pt-2">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-6">
              {post.speaker && (
                <Block>
                  <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-950/45">
                      Diễn giả
                    </p>
                    <Link
                      href={`/dien-gia/${post.speaker.slug}`}
                      className="group mt-4 flex items-center gap-4"
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                        <SafeImage
                          src={post.speaker.photo}
                          alt={post.speaker.name}
                          fallbackLabel={initials(post.speaker.name)}
                          sizes="64px"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold leading-tight text-brand-950 transition group-hover:text-brand-700">
                          {post.speaker.name}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-brand-950/55">
                          {[post.speaker.title, post.speaker.company].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                    {post.speaker.short_bio && (
                      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-brand-950/60">
                        {post.speaker.short_bio}
                      </p>
                    )}
                    <Link
                      href={`/dien-gia/${post.speaker.slug}`}
                      className="-mx-2 mt-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                    >
                      Xem hồ sơ diễn giả
                    </Link>
                  </div>
                </Block>
              )}

              <Block>
                <div className="bg-brand-800 relative overflow-hidden rounded-3xl p-6 text-white">
                  <div className="relative">
                    <p className="text-base font-bold leading-snug">
                      Tham dự diễn đàn cùng hơn 3.500 khách chuyên ngành
                    </p>
                    <p className="mt-2 text-sm text-brand-200">
                      Đăng ký miễn phí, hoàn tất trong hai phút.
                    </p>
                    <Link
                      href="/dang-ky"
                      className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-brand-900 transition-colors duration-300 hover:bg-brand-50"
                    >
                      Đăng ký ngay
                    </Link>
                  </div>
                </div>
              </Block>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <section className="bg-brand-50/60 section-y">
          <div className="container-page">
            <h2 className="text-2xl font-bold tracking-tight text-brand-950">Đọc thêm</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Block key={p.id}>
                  <PostCard post={p} />
                </Block>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
