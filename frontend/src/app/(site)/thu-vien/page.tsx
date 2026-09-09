import type { Metadata } from "next";
import { safeList } from "@/lib/api";
import type { GalleryItem } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/PageHero";
import { GalleryBrowser } from "@/components/site/GalleryBrowser";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Thư viện",
  description:
    "Ảnh, video và tài liệu báo chí của diễn đàn VHD Summit qua các kỳ tổ chức.",
};

export default async function GalleryPage() {
  const [{ data: items }, settings] = await Promise.all([
    safeList<GalleryItem>("/gallery?per_page=120", 60),
    getSettings(),
  ]);

  return (
    <>
      <PageHero
        title="Ảnh, video và tài liệu báo chí"
        description="Toàn bộ tư liệu truyền thông của diễn đàn, sẵn sàng để cơ quan báo chí và đối tác sử dụng."
        image={settings.hero_image}
        crumbs={[{ href: "/thu-vien", label: "Thư viện" }]}
      />

      <section className="container-page section-y">
        <GalleryBrowser items={items} />
      </section>
    </>
  );
}
