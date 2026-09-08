import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { Post } from "@/lib/types";
import { POST_CATEGORY_LABEL, cn, formatDate } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

const CATEGORY_STYLE: Record<Post["category"], string> = {
  news: "bg-ocean-600 text-white",
  speech: "bg-cyan-glow text-abyss",
  press: "bg-ocean-950 text-white",
  announcement: "bg-gold text-[#3d2900]",
};

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-ocean-100 bg-white card-hover",
        featured && "lg:flex-row",
      )}
    >
      <Link
        href={`/tin-tuc/${post.slug}`}
        className={cn(
          "relative overflow-hidden bg-ocean-50",
          featured ? "aspect-16/10 lg:aspect-auto lg:w-[52%]" : "aspect-16/10",
        )}
      >
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107">
          <SafeImage
            src={post.cover}
            alt={post.title}
            sizes={featured ? "(max-width: 1024px) 92vw, 52vw" : "(max-width: 768px) 92vw, 33vw"}
          />
        </div>
        <span
          className={cn(
            "absolute left-4 top-4 rounded-full px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider shadow-sm",
            CATEGORY_STYLE[post.category],
          )}
        >
          {POST_CATEGORY_LABEL[post.category]}
        </span>
      </Link>

      <div className={cn("flex flex-1 flex-col p-6", featured && "lg:justify-center lg:p-9")}>
        <div className="flex items-center gap-2 text-xs font-medium text-ocean-950/45">
          <CalendarDays className="h-3.5 w-3.5" />
          <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          {post.author_name && (
            <>
              <span className="text-ocean-200">•</span>
              <span className="line-clamp-1">{post.author_name}</span>
            </>
          )}
        </div>

        <h3
          className={cn(
            "mt-3 text-balance font-bold leading-snug tracking-tight text-ocean-950 transition-colors duration-300 group-hover:text-ocean-700",
            featured ? "line-clamp-3 text-2xl lg:text-3xl" : "line-clamp-2 text-lg",
          )}
        >
          <Link href={`/tin-tuc/${post.slug}`} className="before:absolute before:inset-0">
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p
            className={cn(
              "mt-3 text-pretty text-sm leading-relaxed text-ocean-950/60",
              featured ? "line-clamp-3 lg:text-base" : "line-clamp-2",
            )}
          >
            {post.excerpt}
          </p>
        )}

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-700">
          Đọc tiếp
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}
