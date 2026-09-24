import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { path: segments } = await context.params;

    if (!segments?.length || segments.some((segment) => segment === ".." || segment === ".")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const relativePath = segments.join("/");
    if (!relativePath.startsWith("uploads/")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const baseDir = path.resolve(process.cwd(), "public");
    const filePath = path.resolve(baseDir, relativePath);

    if (!filePath.startsWith(baseDir + path.sep)) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()];
    if (!contentType) {
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    const file = await readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.length),
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Profile image error:", error);
    return new NextResponse("Profile image not found", { status: 404 });
  }
}
