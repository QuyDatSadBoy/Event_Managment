import type { Metadata } from "next";
import { Users } from "lucide-react";
import { safeList } from "@/lib/api";
import type { Speaker } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/PageHero";
import { SpeakerCard } from "@/components/site/SpeakerCard";
import { SpeakerSearch } from "@/components/site/SpeakerSearch";
import { Block } from "@/components/ui/Block";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Diễn giả",
  description:
    "Danh sách diễn giả của diễn đàn: lãnh đạo vận hành, chuyên gia công nghệ và nhà đầu tư trong ngành khách sạn – du lịch.",
};

type SearchParams = Promise<{ page?: string; q?: string }>;

export default async function SpeakersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";

  const query = new URLSearchParams({ page: String(page), per_page: "12" });
  if (q) query.set("q", q);

  const [{ data: speakers, meta }, settings] = await Promise.all([
    safeList<Speaker>(`/speakers?${query}`, 60),
    getSettings(),
  ]);

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/dien-gia?${qs}` : "/dien-gia";
  };

  return (
    <>
      <PageHero
        title="Những người trực tiếp làm nghề"
        description="Hơn 60 diễn giả trong nước và quốc tế chia sẻ điều họ đã thử, đã sai và đã học được."
        image={settings.hero_image}
        crumbs={[{ href: "/dien-gia", label: "Diễn giả" }]}
      />

      <section className="container-page section-y">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-brand-950/55">
            {meta.total > 0 ? (
              <>
                <span className="font-bold text-brand-950">{meta.total}</span> diễn giả
                {q && (
                  <>
                    {" "}
                    khớp với “<span className="font-medium text-brand-800">{q}</span>”
                  </>
                )}
              </>
            ) : (
              "Chưa có diễn giả nào"
            )}
          </p>
          <SpeakerSearch defaultValue={q} />
        </div>

        {speakers.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Users}
              title={q ? "Không tìm thấy diễn giả phù hợp" : "Danh sách diễn giả đang được cập nhật"}
              description={
                q
                  ? "Thử tìm bằng tên, chức danh hoặc tên đơn vị khác."
                  : "Ban tổ chức sẽ công bố danh sách diễn giả theo từng đợt."
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {speakers.map((speaker) => (
                <Block key={speaker.id}>
                  <SpeakerCard speaker={speaker} headingLevel="h2" />
                </Block>
              ))}
            </div>
            <Pagination page={meta.page} totalPages={meta.total_pages} hrefFor={hrefFor} />
          </>
        )}
      </section>
    </>
  );
}
