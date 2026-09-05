// app/api/students/[studentId]/participations/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { studentId } = await context.params;

    // ตรวจสอบว่านิสิตมีอยู่จริง
    const [studentRows] = await pool.query<RowDataPacket[]>(
      "SELECT studentId FROM students WHERE studentId = ?",
      [studentId]
    );
    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    // ดึงกิจกรรมที่นิสิตเข้าร่วมแล้ว (status = 'completed')
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         p.ParticipationId,
         p.joinDate,
         p.status,
         p.score,
         a.activityId,
         a.activityName,
         a.description,
         a.date,
         a.time,
         a.endDate,
         a.endTime,
         a.hours,
         a.location,
         a.organizer,
         a.term
       FROM participation p
       INNER JOIN activity a ON p.activityId = a.activityId
       WHERE p.studentId = ? AND p.status = 'completed'
       ORDER BY p.joinDate DESC`,
      [studentId]
    );

    const participations = rows.map((row) => ({
      participationId: row.ParticipationId,
      activityId: row.activityId,
      activityName: row.activityName,
      description: row.description,
      date: row.date,
      time: row.time,
      endDate: row.endDate,
      endTime: row.endTime,
      hours: row.hours === null ? null : Number(row.hours),
      location: row.location,
      organizer: row.organizer,
      term: row.term,
      joinDate: row.joinDate,
      score: row.score,
      status: row.status,
    }));

    return NextResponse.json({ participations });
  } catch (error) {
    return jsonError(error);
  }
}
