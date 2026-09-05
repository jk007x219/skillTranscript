import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-ก-๙]/g, "_");
}

// GET: ดึงข้อมูลโปรไฟล์อาจารย์
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw httpError(401, "กรุณาเข้าสู่ระบบ");
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         u.userId, u.email, u.role, u.status,
         t.firstname, t.lastname, t.position, t.faculty, t.program, t.isExecutive,
         t.profileImageUrl
       FROM users u
       INNER JOIN teacher t ON t.userId = u.userId
       WHERE u.userId = ?`,
      [session.user.id]
    );

    if (rows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลอาจารย์");
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.userId,
      firstName: row.firstname || "",
      lastName: row.lastname || "",
      email: row.email,
      role: row.role,
      position: row.position || "",
      faculty: row.faculty || "",
      program: row.program || "",
      isExecutive: Boolean(row.isExecutive),
      profileImageUrl: row.profileImageUrl || null,
    });
  } catch (error) {
    return jsonError(error);
  }
}

// PUT: อัปเดตข้อมูลอาจารย์ (ชื่อ, นามสกุล, รูปโปรไฟล์)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw httpError(401, "กรุณาเข้าสู่ระบบ");
    }

    const contentType = request.headers.get("content-type") || "";
    let firstName: string | undefined;
    let lastName: string | undefined;
    let profileImageUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      firstName = String(formData.get("firstName") || "");
      lastName = String(formData.get("lastName") || "");
      const image = formData.get("profileImage");

      if (image instanceof File && image.size > 0) {
        if (!image.type.startsWith("image/")) {
          throw httpError(400, "รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
        }
        const uploadDir = path.join(process.cwd(), "public", "uploads", "teachers", session.user.id);
        await mkdir(uploadDir, { recursive: true });
        const fileName = `${nanoid(8)}-${sanitizeFileName(image.name)}`;
        await writeFile(path.join(uploadDir, fileName), Buffer.from(await image.arrayBuffer()));
        profileImageUrl = `/uploads/teachers/${session.user.id}/${fileName}`;
      }
    } else {
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (firstName !== undefined) {
      updates.push("firstname = ?");
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push("lastname = ?");
      values.push(lastName);
    }
    if (profileImageUrl !== undefined) {
      updates.push("profileImageUrl = ?");
      values.push(profileImageUrl);
    }

    if (updates.length === 0) {
      throw httpError(400, "ไม่มีข้อมูลที่จะอัปเดต");
    }

    values.push(session.user.id);
    await pool.query(
      `UPDATE teacher SET ${updates.join(", ")} WHERE userId = ?`,
      values
    );

    // ดึงข้อมูลที่อัปเดตแล้วกลับไป
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         u.userId, u.email, u.role, u.status,
         t.firstname, t.lastname, t.position, t.faculty, t.program, t.isExecutive,
         t.profileImageUrl
       FROM users u
       INNER JOIN teacher t ON t.userId = u.userId
       WHERE u.userId = ?`,
      [session.user.id]
    );

    const row = rows[0];
    return NextResponse.json({
      message: "บันทึกข้อมูลเรียบร้อยแล้ว",
      user: {
        id: row.userId,
        firstName: row.firstname || "",
        lastName: row.lastname || "",
        email: row.email,
        role: row.role,
        position: row.position || "",
        faculty: row.faculty || "",
        program: row.program || "",
        isExecutive: Boolean(row.isExecutive),
        profileImageUrl: row.profileImageUrl || null,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}