import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { safeList } from "@/lib/api";
import type { Post, PostCategory } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { POST_CATEGORY_LABEL, cn } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { PostCard } from "@/components/site/PostCard";
import { SpeakerSearch } from "@/components/site/SpeakerSearch";
import { Reveal } from "@/components/ui/Reveal";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tin tức",
  description:
    "Tin tức, thông cáo báo chí và bài phát biểu từ diễn đàn VHD Summit.",
};

const CATEGORIES: Array<{ value: PostCategory | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "news", label: POST_CATEGORY_LABEL.news },
  { value: "announcement", label: POST_CATEGORY_LABEL.announcement },
  { value: "speech", label: POST_CATEGORY_LABEL.speech },
  { value: "press", label: POST_CATEGORY_LABEL.press },
];

type SearchParams = Promise<{ page?: string; q?: string; category?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const category = params.category ?? "all";

  const query = new URLSearchParams({ page: String(page), per_page: "9" });
  if (q) query.set("q", q);
  if (category !== "all") query.set("category", category);

  const [{ data: posts, meta }, settings] = await Promise.all([
    safeList<Post>(`/posts?${query}`, 60),
    getSettings(),
  ]);

  const buildHref = (next: { page?: number; category?: string }) => {
    const sp = new URLSearchParams();
    const cat = next.category ?? category;
    if (q) sp.set("q", q);
    if (cat && cat !== "all") sp.set("category", cat);
    const p = next.page ?? 1;
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/tin-tuc?${qs}` : "/tin-tuc";
  };

  // Only the first page of the unfiltered list gets the big lead card.
  const showFeatured = page === 1 && !q && category === "all" && posts.length > 0;
  const lead = showFeatured ? posts[0] : undefined;
  const rest = showFeatured ? posts.slice(1) : posts;

  return (
    <>
      <PageHero
        eyebrow="Tin tức & Truyền thông"
        title="Cập nhật từ ban tổ chức"
        description="Thông báo chương trình, thông cáo báo chí và toàn văn các bài phát biểu tại diễn đàn."
        image={settings.hero_image}
        crumbs={[{ href: "/tin-tuc", label: "Tin tức" }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={buildHref({ category: cat.value, page: 1 })}
                aria-current={category === cat.value ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition duration-300",
                  category === cat.value
                    ? "bg-ocean-950 text-white shadow-[0_8px_20px_-10px_rgb(8_42_77/0.8)]"
                    : "bg-ocean-50 text-ocean-800 hover:bg-ocean-100",
                )}
              >
                {cat.label}
              </Link>
            ))}
          </div>
          <SpeakerSearch
            defaultValue={q}
            basePath="/tin-tuc"
            placeholder="Tìm bài viết…"
          />
        </div>

        {posts.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Newspaper}
              title={q ? "Không tìm thấy bài viết phù hợp" : "Chưa có bài viết trong mục này"}
              description={
                q
                  ? "Thử một từ khoá khác hoặc chọn chuyên mục khác."
                  : "Ban tổ chức sẽ cập nhật nội dung mới trong thời gian tới."
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-ocean-950/55">
              <span className="font-bold text-ocean-950">{meta.total}</span> bài viết
              {q && (
                <>
                  {" "}
                  khớp với “<span className="font-medium text-ocean-800">{q}</span>”
                </>
              )}
            </p>

            <div className="mt-6 space-y-6">
              {lead && (
                <Reveal>
                  <PostCard post={lead} featured />
                </Reveal>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 80}>
                    <PostCard post={post} />
                  </Reveal>
                ))}
              </div>
            </div>

            <Pagination
              page={meta.page}
              totalPages={meta.total_pages}
              hrefFor={(p) => buildHref({ page: p })}
            />
          </>
        )}
      </section>
    </>
  );
}
