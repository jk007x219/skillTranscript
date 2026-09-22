// lib/api-path.ts
// Next.js's `basePath` config only prefixes framework-aware navigation
// (Link, router.push, redirects). Plain fetch()/img calls to an absolute
// "/api/..." path bypass it and hit the wrong URL in production. Wrap any
// such absolute path with apiPath() before using it.
export const API_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiPath(path: string): string {
  return `${API_BASE_PATH}${path}`;
}

/**
 * Same prefixing, but safe to use directly on values that aren't always a
 * bare "/..." app path — e.g. img src bound to state that's sometimes a
 * server-stored path ("/uploads/...") and sometimes a local blob:/data: URL
 * preview, or a value that's already been prefixed. Anything that isn't a
 * bare "/" path (external URL, blob:, data:, or already-prefixed) passes
 * through unchanged.
 */
export function withBasePath<T extends string | null | undefined>(path: T): T {
  if (!path) return path;
  if (!path.startsWith("/")) return path;
  if (API_BASE_PATH && path.startsWith(`${API_BASE_PATH}/`)) return path;
  return `${API_BASE_PATH}${path}` as T;
}
