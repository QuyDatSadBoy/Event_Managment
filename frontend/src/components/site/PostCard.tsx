import Link from "next/link";
import type { Post } from "@/lib/types";
import { POST_CATEGORY_LABEL, cn, formatDate } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * design.pen "News Card": white, radius 12, 1px border, a 16:9 image above a
 * body padded 24 — meta row (category pill on brand-tint, then the date), then
 * the title at 17/700, then the excerpt.
 */
export function PostCard({
  post,
  featured = false,
  headingLevel: Heading = "h3",
}: {
  post: Post;
  /** The lead article on the news index runs side by side on desktop. */
  featured?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-line bg-white card-hover",
        featured && "lg:flex-row",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-ph-bg",
          featured ? "aspect-16/9 lg:aspect-auto lg:w-[52%]" : "aspect-16/9",
        )}
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <SafeImage
            src={post.cover}
            alt={post.title}
            sizes={featured ? "(max-width: 1024px) 92vw, 680px" : "(max-width: 768px) 92vw, 400px"}
            quality={65}
          />
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-2.5 p-6", featured && "lg:justify-center lg:p-9")}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-brand-200 px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-brand-800">
            {POST_CATEGORY_LABEL[post.category]}
          </span>
          <time dateTime={post.published_at} className="text-xs text-ink-muted">
            {formatDate(post.published_at)}
          </time>
        </div>

        <Heading
          className={cn(
            "text-balance font-bold leading-[1.35] tracking-tight text-brand-950",
            featured ? "line-clamp-3 text-xl lg:text-2xl" : "line-clamp-2 text-[1.0625rem]",
          )}
        >
          <Link
            href={`/tin-tuc/${post.slug}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {post.title}
          </Link>
        </Heading>

        {post.excerpt && (
          <p
            className={cn(
              "text-pretty text-sm leading-relaxed text-ink-muted",
              featured ? "line-clamp-3 lg:text-base" : "line-clamp-2",
            )}
          >
            {post.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
