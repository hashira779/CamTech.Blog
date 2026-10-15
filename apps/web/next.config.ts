import type { NextConfig } from "next";

/**
 * `/_next/image?url=…` is an unauthenticated proxy: whatever host is listed here can be
 * fetched by the web server and returned to the caller. `localhost` belongs in that list only
 * while the API is actually on localhost, otherwise a visitor can ask the production box to
 * probe its own internal ports (8000, 5432, 6379, 9000) and read the differences back.
 */
const isProduction = process.env.NODE_ENV === "production";

const developmentPatterns = isProduction
  ? []
  : [
      { protocol: "http" as const, hostname: "localhost" },
      { protocol: "http" as const, hostname: "127.0.0.1" },
    ];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "images.camtech.cam" },
      { protocol: "https", hostname: "camtech.cam" },
      { protocol: "https", hostname: "blog.camtech.cam" },
      { protocol: "https", hostname: "cms.camtech.cam" },
      { protocol: "https", hostname: "dailydiscovery.com" },
      { protocol: "https", hostname: "assets.example.com" },
      { protocol: "https", hostname: "s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // `placehold.co` and `assets.example.com` were listed here and are gone: this site
      // stores only photographs it can attribute, so a placeholder host in the allow-list was
      // an invitation to break that rule, and nothing referenced either one.
      ...developmentPatterns,
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
