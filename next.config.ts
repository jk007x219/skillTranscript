import type { NextConfig } from "next";

const BASE_PATH = "/662021086";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: BASE_PATH,
  // Next.js only prefixes framework-aware navigation (Link, router.push, redirects)
  // with basePath. Plain fetch()/img calls to "/api/..." need it too, so expose it
  // here for src/lib/api-path.ts to read on both server and client bundles.
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  // The built-in image optimizer (/_next/image) resolves local images via an
  // internal self-request that doesn't go through basePath-aware routing, so
  // under a non-root basePath it 404s on every local <Image> and returns
  // 400 "isn't a valid image". `unoptimized: true` isn't a fix either — it
  // skips the loader entirely and renders the raw (unprefixed) src as-is.
  // A custom loader (src/lib/image-loader.ts) serves the file directly at
  // its basePath-prefixed path instead.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default nextConfig;