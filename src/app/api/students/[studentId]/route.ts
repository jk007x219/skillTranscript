// app/api/students/[studentId]/route.ts (แก้ไขให้ดึง program และ major แยกกัน)
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";
import { cleanThaiText } from "@/lib/thai-text";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-ก-๙]/g, "_");
}

async function getStudentWithAdvisors(studentId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       u.userId, u.email, u.role, u.status,
       s.studentId, s.firstname, s.lastname, s.faculty, 
       s.program, s.major, s.year, s.admissionYear, s.phone, s.profileImageUrl,
       GROUP_CONCAT(CONCAT(t.firstname, ' ', t.lastname) ORDER BY t.firstname SEPARATOR '||') AS advisorNames
     FROM users u
     LEFT JOIN students s ON u.userId = s.userId
     LEFT JOIN advisor a ON a.studentId = s.studentId
     LEFT JOIN teacher t ON t.userId = a.advisorUserId
     WHERE s.studentId = ?
     GROUP BY u.userId, u.email, u.role, u.status, 
              s.studentId, s.firstname, s.lastname, s.faculty, 
              s.program, s.major, s.year, s.admissionYear, s.phone, s.profileImageUrl`,
    [studentId],
  );

  return rows;
}

function mapStudent(row: RowDataPacket) {
  return {
    id: row.userId,
    firstName: row.firstname || "",
    lastName: row.lastname || "",
    studentId: row.studentId,
    email: row.email,
    role: row.role,
    faculty: cleanThaiText(row.faculty),
    program: cleanThaiText(row.program),   // ✅ หลักสูตร
    major: cleanThaiText(row.major),       // ✅ วิชาเอก
    year: row.year,
    admissionYear: row.admissionYear ?? null,
    phone: row.phone,
    profileImageUrl: row.profileImageUrl || null,
    advisorNames: row.advisorNames ? String(row.advisorNames).split("||") : [],
    status: row.status,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { studentId } = await context.params;

    const rows = await getStudentWithAdvisors(studentId);

    if (rows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    return NextResponse.json({
      user: mapStudent(rows[0]),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { studentId } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    let firstName: string | undefined;
    let lastName: string | undefined;
    let phone: string | undefined;
    let profileImageUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      firstName = String(formData.get("firstName") || "");
      lastName = String(formData.get("lastName") || "");
      phone = String(formData.get("phone") || "");
      const image = formData.get("profileImage");

      if (image instanceof File && image.size > 0) {
        if (!image.type.startsWith("image/")) {
          throw httpError(400, "รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
        }
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles", studentId);
        await mkdir(uploadDir, { recursive: true });
        const fileName = `${nanoid(8)}-${sanitizeFileName(image.name)}`;
        await writeFile(path.join(uploadDir, fileName), Buffer.from(await image.arrayBuffer()));
        profileImageUrl = `/uploads/profiles/${studentId}/${fileName}`;
      }
    } else {
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
      phone = body.phone;
    }

    // อัปเดต students (ไม่ต้องอัปเดต program/major/year เพราะเป็นข้อมูลจากระบบ)
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
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (profileImageUrl !== undefined) {
      updates.push("profileImageUrl = ?");
      values.push(profileImageUrl);
    }

    if (updates.length > 0) {
      values.push(studentId);
      await pool.query(
        `UPDATE students SET ${updates.join(", ")} WHERE studentId = ?`,
        values
      );
    }

    // ดึงข้อมูลที่อัปเดตแล้ว
    const rows = await getStudentWithAdvisors(studentId);

    return NextResponse.json({
      message: "บันทึกข้อมูลเรียบร้อยแล้ว",
      user: mapStudent(rows[0]),
    });
  } catch (error) {
    return jsonError(error);
  }
}