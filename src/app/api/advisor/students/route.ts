// app/api/advisor/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type AdvisorStudentRow = RowDataPacket & {
  studentId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  faculty: string | null;
  major: string | null;
  year: number | null;
};

export async function GET(request: NextRequest) {
  try {
    // ดึง advisorUserId จาก query parameter (จะส่งมาจากหน้า client)
    // ในอนาคตควรใช้ session/jWT แทน
    const advisorUserId = request.nextUrl.searchParams.get("advisorUserId");

    if (!advisorUserId) {
      return NextResponse.json(
        { message: "กรุณาระบุรหัสอาจารย์ที่ปรึกษา (advisorUserId)" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<AdvisorStudentRow[]>(
      `SELECT 
         s.studentId,
         s.firstname,
         s.lastname,
         u.email,
         s.phone,
         s.faculty,
         s.major,
         s.year
       FROM students s
       INNER JOIN advisor a ON a.studentId = s.studentId
       INNER JOIN users u ON u.userId = s.userId
       WHERE a.advisorUserId = ?
       ORDER BY s.firstname`,
      [advisorUserId]
    );

    const students = rows.map((row) => ({
      studentId: row.studentId,
      firstName: row.firstname || "",
      lastName: row.lastname || "",
      name: `${row.firstname || ""} ${row.lastname || ""}`.trim(),
      email: row.email,
      phone: row.phone,
      faculty: row.faculty,
      major: row.major,
      year: row.year,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    return jsonError(error);
  }
}