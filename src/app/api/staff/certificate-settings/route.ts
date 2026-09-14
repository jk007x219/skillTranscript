import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import {
  ensureCertificateSettingsTable,
  getDeanSettings,
} from "@/lib/certificate-settings";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-ก-๙]/g, "_");
}

async function requireOfficer() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "officer") {
    throw httpError(403, "ไม่มีสิทธิ์จัดการข้อมูลคณบดี");
  }

  return session.user;
}

// GET: ผู้ที่ login แล้วสามารถอ่านข้อมูลได้
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw httpError(401, "กรุณาเข้าสู่ระบบ");
    }

    const settings = await getDeanSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

// PUT: ต้องเป็น officer เท่านั้น
export async function PUT(request: NextRequest) {
  try {
    const user = await requireOfficer();

    const formData = await request.formData();

    const deanName = String(
      formData.get("deanName") || "",
    ).trim();

    const signature = formData.get("signature");

    const removeSignature =
      formData.get("removeSignature") === "true";

    if (!deanName) {
      throw httpError(400, "กรุณาระบุชื่อคณบดี");
    }

    let deanSignatureUrl =
      (await getDeanSettings()).deanSignatureUrl;

    if (signature instanceof File && signature.size > 0) {
      if (!signature.type.startsWith("image/")) {
        throw httpError(
          400,
          "รองรับเฉพาะไฟล์รูปภาพลายเซ็น",
        );
      }

      if (signature.size > MAX_SIGNATURE_SIZE) {
        throw httpError(
          400,
          "ไฟล์ลายเซ็นต้องมีขนาดไม่เกิน 2 MB",
        );
      }

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "certificate-settings",
      );

      await mkdir(uploadDir, {
        recursive: true,
      });

      const fileName = `${nanoid(8)}-${sanitizeFileName(
        signature.name,
      )}`;

      const filePath = path.join(
        uploadDir,
        fileName,
      );

      await writeFile(
        filePath,
        Buffer.from(await signature.arrayBuffer()),
      );

      // ใช้ API สำหรับเสิร์ฟไฟล์
      deanSignatureUrl =
        `/api/certificate-settings/signature/${encodeURIComponent(
          fileName,
        )}`;
    } else if (removeSignature) {
      deanSignatureUrl = null;
    }

    await ensureCertificateSettingsTable();

    await pool.query(
      `INSERT INTO certificate_settings
        (settingId, deanName, deanSignatureUrl, updatedBy)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         deanName = VALUES(deanName),
         deanSignatureUrl = VALUES(deanSignatureUrl),
         updatedBy = VALUES(updatedBy)`,
      [
        deanName,
        deanSignatureUrl,
        user.id,
      ],
    );

    return NextResponse.json({
      message: "บันทึกข้อมูลคณบดีเรียบร้อยแล้ว",
      settings: {
        deanName,
        deanSignatureUrl,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}