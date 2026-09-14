import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { filename } = await context.params;

    const decodedFilename = decodeURIComponent(filename);

    // ป้องกัน path traversal
    const safeFilename = path.basename(decodedFilename);

    if (!safeFilename || safeFilename !== decodedFilename) {
      return new NextResponse("Invalid filename", {
        status: 400,
      });
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "certificate-settings",
      safeFilename,
    );

    const extension = path
      .extname(safeFilename)
      .toLowerCase();

    const contentType =
      MIME_TYPES[extension];

    if (!contentType) {
      return new NextResponse(
        "Unsupported file type",
        {
          status: 400,
        },
      );
    }

    const file = await readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.length),
        "Cache-Control":
          "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(
      "Certificate signature file error:",
      error,
    );

    return new NextResponse(
      "Signature file not found",
      {
        status: 404,
      },
    );
  }
}