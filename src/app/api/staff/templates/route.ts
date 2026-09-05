// app/api/staff/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type TemplateRow = RowDataPacket & {
  templateId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  fileType: string;
  status: string;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-ก-๙]/g, "_");
}

// GET: ดึงรายการแม่แบบ (กรองตาม userId ถ้ามี)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = `
      SELECT 
        templateId, name, description, imageUrl, fileType, status, uploadedBy, createdAt, updatedAt
      FROM template
    `;
    const values: any[] = [];

    if (userId) {
      query += ` WHERE uploadedBy = ?`;
      values.push(userId);
    }

    query += ` ORDER BY createdAt DESC`;

    const [rows] = await pool.query<TemplateRow[]>(query, values);

    const templates = rows.map((row) => ({
      id: row.templateId,
      templateId: row.templateId,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      fileType: row.fileType,
      status: row.status,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    return jsonError(error);
  }
}

// app/api/staff/templates/route.ts (ส่วน POST)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") || "");
    const description = String(formData.get("description") || "");
    const status = String(formData.get("status") || "active");
    const uploadedBy = String(formData.get("uploadedBy") || null);
    const file = formData.get("file") as File | null;

    if (!name.trim()) {
      throw httpError(400, "กรุณากรอกชื่อแม่แบบ");
    }

    if (!file) {
      throw httpError(400, "กรุณาเลือกไฟล์แม่แบบ");
    }

    if (!file.type.startsWith("image/")) {
      throw httpError(400, "รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
    }

    const templateId = nanoid(20);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "templates", templateId);
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${nanoid(8)}-${sanitizeFileName(file.name)}`;
    const filePath = path.join(uploadDir, fileName);
    const imageUrl = `/uploads/templates/${templateId}/${fileName}`;

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    await pool.query(
      `INSERT INTO template (templateId, name, description, imageUrl, fileType, status, uploadedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [templateId, name.trim(), description || null, imageUrl, file.type, status, uploadedBy || null]
    );

    return NextResponse.json(
      {
        message: "อัปโหลดแม่แบบสำเร็จ",
        template: {
          id: templateId,
          name,
          description,
          imageUrl,
          fileType: file.type,
          status,
          uploadedBy,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}

// DELETE: ลบแม่แบบ (ไม่เปลี่ยนแปลง)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      throw httpError(400, "กรุณาระบุ ID แม่แบบ");
    }

    const [rows] = await pool.query<TemplateRow[]>(
      "SELECT imageUrl FROM template WHERE templateId = ?",
      [templateId]
    );

    if (rows.length === 0) {
      throw httpError(404, "ไม่พบแม่แบบ");
    }

    const imageUrl = rows[0].imageUrl;
    const filePath = path.join(process.cwd(), "public", imageUrl);
    try {
      await unlink(filePath);
    } catch {
      // ignore
    }

    const dirPath = path.dirname(filePath);
    try {
      await stat(dirPath);
      const { rmdir } = await import("fs/promises");
      await rmdir(dirPath).catch(() => {});
    } catch {
      // ignore
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM template WHERE templateId = ?",
      [templateId]
    );

    if (result.affectedRows === 0) {
      throw httpError(404, "ไม่พบแม่แบบ");
    }

    return NextResponse.json({ message: "ลบแม่แบบสำเร็จ" });
  } catch (error) {
    return jsonError(error);
  }
}

// PUT: อัปเดตแม่แบบ (ไม่เปลี่ยนแปลง)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      throw httpError(400, "กรุณาระบุ ID แม่แบบ");
    }

    const body = await request.json();
    const { name, description, status } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (status !== undefined && ["active", "inactive"].includes(status)) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      throw httpError(400, "ไม่มีข้อมูลที่จะอัปเดต");
    }

    values.push(templateId);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE template SET ${updates.join(", ")} WHERE templateId = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw httpError(404, "ไม่พบแม่แบบ");
    }

    return NextResponse.json({ message: "อัปเดตแม่แบบสำเร็จ" });
  } catch (error) {
    return jsonError(error);
  }
}