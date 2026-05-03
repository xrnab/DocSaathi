import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Next 15 writes both `next dev` and `next build` output into `.next`.
    // Keeping the dev server in its own directory prevents chunk-manifest
    // corruption when we verify changes with builds while the app is running.
    distDir: isDevServer ? ".next-dev" : ".next",
    experimental: {
      serverComponentsHmrCache: false,
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "img.clerk.com",
        },
      ],
    },
    env: {
      VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
  };
}
