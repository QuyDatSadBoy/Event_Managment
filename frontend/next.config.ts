import type { NextConfig } from "next";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8090";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Standalone output ships a self-contained server folder — the deploy script
  // copies it to the VPS instead of installing node_modules there.
  output: "standalone",
  // Next 16 generates agent instruction files on boot; this repo tracks its own.
  agentRules: false,
  images: {
    // See src/lib/image-loader.ts — only self-hosted media goes through the
    // server-side optimizer; CDN-backed images are passed straight through.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    qualities: [35, 40, 55, 65, 68, 72, 75, 82, 90],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.vhdcorp.com" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    // Uploaded media lives on the Go service; proxy it so the browser only ever
    // talks to one origin.
    return [{ source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
