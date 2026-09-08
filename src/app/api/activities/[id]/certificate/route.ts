import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { getDeanSettings } from "@/lib/certificate-settings";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      throw httpError(400, "กรุณาระบุรหัสนิสิต");
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         a.activityId,
         a.activityName,
         a.date,
         a.time,
         a.endDate,
         a.endTime,
         a.hours,
         a.organizer,
         a.templateId,
         t.name AS templateName,
         t.imageUrl,
         t.status AS templateStatus,
         p.status AS participationStatus,
         p.score,
         s.firstname,
         s.lastname
       FROM activity a
       LEFT JOIN template t ON t.templateId = a.templateId
       LEFT JOIN participation p
         ON p.activityId = a.activityId
        AND p.studentId = ?
       LEFT JOIN students s ON s.studentId = p.studentId
       WHERE a.activityId = ?
       LIMIT 1`,
      [studentId, id],
    );

    if (rows.length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const row = rows[0];
    if (row.participationStatus !== "completed") {
      throw httpError(403, "คุณยังไม่ได้เข้าร่วมกิจกรรมนี้");
    }

    if (!row.templateId || !row.imageUrl || row.templateStatus !== "active") {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีแม่แบบเกียรติบัตรที่พร้อมใช้งาน");
    }

    const deanSettings = await getDeanSettings();
    const [skillRows] = await pool.query<RowDataPacket[]>(
      `SELECT skillname AS name, level
       FROM activityskill
       WHERE activityId = ?
       ORDER BY ActivitySkillId`,
      [row.activityId],
    );

    return NextResponse.json({
      activityId: row.activityId,
      activityName: row.activityName,
      studentName: `${row.firstname || ""} ${row.lastname || ""}`.trim(),
      date: row.date,
      time: row.time,
      endDate: row.endDate,
      endTime: row.endTime,
      hours: row.hours === null ? null : Number(row.hours),
      organizer: row.organizer,
      templateId: row.templateId,
      templateName: row.templateName,
      imageUrl: row.imageUrl,
      score: row.score === null ? null : Number(row.score),
      skills: skillRows.map((skill) => ({
        name: skill.name || "ไม่ระบุทักษะ",
        level: skill.level || "ไม่ระบุระดับ",
      })),
      deanName: deanSettings.deanName,
      deanSignatureUrl: deanSettings.deanSignatureUrl,
    });
  } catch (error) {
    return jsonError(error);
  }
}
