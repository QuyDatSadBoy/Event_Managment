import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  // Only the weights the design actually uses.
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"),
  title: {
    default: "VHD Summit 2026 — Vietnam Hospitality & Digital Forum",
    template: "%s · VHD Summit 2026",
  },
  description:
    "Diễn đàn công nghệ và giao thương ngành khách sạn – du lịch, 20–21.08.2026 tại Đà Nẵng.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "VHD Summit 2026",
  },
};

export const viewport: Viewport = {
  themeColor: "#041c33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <head>
        {/* Images come from these two hosts on every page; opening the
            connections during HTML parse takes the DNS + TLS round trips off
            the critical path for the LCP image. */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="preconnect" href="https://placehold.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
