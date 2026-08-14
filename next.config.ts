import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      // ── Navigation requests (page refreshes / deep links) ─────────────────
      // NetworkFirst so fresh HTML is always preferred; StaleWhileRevalidate
      // is intentionally avoided here to prevent stale Next.js RSC payloads.
      {
        urlPattern: ({ request }: { request: Request }) =>
          request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // ── API & auth — never cache ───────────────────────────────────────────
      {
        urlPattern: /\/(api|auth)\/.*/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "api-auth-cache",
        },
      },
      // ── Next.js static chunks (JS/CSS) ────────────────────────────────────
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-cache",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year (immutable hashes)
          },
        },
      },
      // ── Static image/font assets ──────────────────────────────────────────
      {
        urlPattern:
          /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},

  allowedDevOrigins: ["192.168.124.216"],
};

export default withPWA(nextConfig);