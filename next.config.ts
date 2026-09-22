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
};

export default nextConfig;