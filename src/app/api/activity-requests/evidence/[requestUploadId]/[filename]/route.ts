import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    requestUploadId: string;
    filename: string;
  }>;
};

function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".png":
      return "image/png";

    case ".gif":
      return "image/gif";

    case ".webp":
      return "image/webp";

    case ".pdf":
      return "application/pdf";

    case ".txt":
      return "text/plain; charset=utf-8";

    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      requestUploadId,
      filename,
    } = await context.params;

    // ป้องกัน path traversal
    if (
      !requestUploadId ||
      !filename ||
      requestUploadId.includes("..") ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return new NextResponse(
        "Invalid file path",
        {
          status: 400,
        },
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "activity-requests",
      requestUploadId,
    );

    const filePath = path.join(
      uploadDir,
      filename,
    );

    const fileBuffer = await readFile(
      filePath,
    );

    return new NextResponse(
      fileBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            getContentType(filename),

          "Content-Length":
            String(fileBuffer.length),

          "Cache-Control":
            "public, max-age=31536000, immutable",

          "Content-Disposition":
            `inline; filename*=UTF-8''${encodeURIComponent(
              filename,
            )}`,
        },
      },
    );
  } catch (error) {
    console.error(
      "[activity evidence] GET error:",
      error,
    );

    return new NextResponse(
      "ไม่พบไฟล์หลักฐาน",
      {
        status: 404,
      },
    );
  }
}