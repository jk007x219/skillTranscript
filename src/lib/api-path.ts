// lib/api-path.ts
// Next.js's `basePath` config only prefixes framework-aware navigation
// (Link, router.push, redirects). Plain fetch()/img calls to an absolute
// "/api/..." path bypass it and hit the wrong URL in production. Wrap any
// such absolute path with apiPath() before using it.
export const API_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiPath(path: string): string {
  return `${API_BASE_PATH}${path}`;
}
