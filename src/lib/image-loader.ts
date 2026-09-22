// lib/image-loader.ts
// next/image's built-in optimizer resolves local images via an internal
// self-request that doesn't go through basePath-aware routing, so under a
// non-root basePath it 404s on every local image and next/image reports
// "isn't a valid image". All images here are static local assets that don't
// need on-the-fly resizing, so this loader skips the optimizer and just
// serves the file directly at its basePath-prefixed path.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function localImageLoader({ src }: { src: string; width: number; quality?: number }): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${BASE_PATH}${src}`;
}
