import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string; skillId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { studentId, skillId } = await context.params;

    // ตรวจสอบว่านิสิตมีอยู่จริง
    const [studentRows] = await pool.query<RowDataPacket[]>(
      "SELECT studentId FROM students WHERE studentId = ?",
      [studentId]
    );
    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบนิสิต");
    }

    // ดึงกิจกรรมที่นิสิตเข้าร่วมแล้ว (status = 'completed') และมีทักษะนี้
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
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
         a.term,
         p.joinDate,
         p.score,
         acs.level AS skillLevel,
         acs.skillname AS skillName
       FROM participation p
       INNER JOIN activity a ON p.activityId = a.activityId
       INNER JOIN activityskill acs ON acs.activityId = a.activityId
       WHERE p.studentId = ?
         AND p.status = 'completed'
         AND acs.skillId = ?
       ORDER BY p.joinDate DESC, a.date DESC`,
      [studentId, skillId]
    );

    const activities = rows.map((row) => ({
      id: row.activityId,
      name: row.activityName,
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
      score: row.score === null ? null : Number(row.score),
      skillLevel: row.skillLevel,
      skillName: row.skillName,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    return jsonError(error);
  }
}