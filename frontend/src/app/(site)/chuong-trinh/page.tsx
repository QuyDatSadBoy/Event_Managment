import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { safeGet } from "@/lib/api";
import type { AgendaDay } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { formatDateRange } from "@/lib/utils";
import { PageHero } from "@/components/site/PageHero";
import { AgendaBoard } from "@/components/site/AgendaBoard";
import { EmptyState } from "@/components/ui/EmptyState";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Chương trình",
  description:
    "Toàn bộ lịch trình hai ngày của diễn đàn: phiên toàn thể, toạ đàm chuyên đề, workshop và hoạt động kết nối giao thương.",
};

export default async function AgendaPage() {
  const [days, settings] = await Promise.all([
    safeGet<AgendaDay[]>("/agenda", [], 60),
    getSettings(),
  ]);

  return (
    <>
      <PageHero
        title="Lịch trình chi tiết hai ngày diễn đàn"
        description="Chọn ngày và lọc theo loại phiên để tìm nhanh nội dung bạn quan tâm."
        image={settings.hero_image}
        crumbs={[{ href: "/chuong-trinh", label: "Chương trình" }]}
      >
        {settings.start_date && (
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-abyss/55 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md">
            <CalendarDays className="h-4 w-4 text-cyan-glow" />
            {formatDateRange(settings.start_date, settings.end_date)}
            {settings.venue_name && ` · ${settings.venue_name}`}
          </p>
        )}
      </PageHero>

      <section className="container-page section-y">
        {days.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Chương trình đang được hoàn thiện"
            description="Ban tổ chức sẽ công bố lịch trình chi tiết trong thời gian tới. Vui lòng quay lại sau."
          />
        ) : (
          <AgendaBoard days={days} />
        )}
      </section>
    </>
  );
}
