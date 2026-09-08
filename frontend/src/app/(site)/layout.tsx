import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ScrollTop } from "@/components/site/ScrollTop";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header settings={settings} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <ScrollTop />
    </div>
  );
}
