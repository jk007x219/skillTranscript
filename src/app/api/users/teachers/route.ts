// app/api/users/teachers/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         u.userId, u.email, u.role,
         t.firstname, t.lastname,
         t.position, t.faculty, t.program, t.isExecutive
       FROM users u
       INNER JOIN teacher t ON u.userId = t.userId
       WHERE u.role = 'teacher' AND u.status = 'active'
       ORDER BY t.firstname`
    );
    const teachers = rows.map((row) => ({
      userId: row.userId,
      name: `${row.firstname || ''} ${row.lastname || ''}`.trim(),
      email: row.email,
      role: row.role,
      position: row.position,
      faculty: row.faculty,
      program: row.program || '',
      isExecutive: Boolean(row.isExecutive),
    }));
    return NextResponse.json({ teachers });
  } catch (error) {
    return jsonError(error);
  }
}