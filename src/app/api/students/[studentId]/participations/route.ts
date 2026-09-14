// app/api/students/[studentId]/participations/route.ts

import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

type SkillScoreRow = RowDataPacket & {
  participationId: string;
  skillName: string;
  earnedScore: number | string | null;
  maxScore: number | string | null;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { studentId } = await context.params;

    // ---------------------------------------------------------
    // 1. ตรวจสอบว่านิสิตมีอยู่จริง
    // ---------------------------------------------------------
    const [studentRows] = await pool.query<RowDataPacket[]>(
      "SELECT studentId FROM students WHERE studentId = ?",
      [studentId]
    );

    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    // ---------------------------------------------------------
    // 2. ดึงกิจกรรมที่นิสิตเข้าร่วมแล้ว
    // ---------------------------------------------------------
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
       INNER JOIN activity a
         ON p.activityId = a.activityId
       WHERE p.studentId = ?
         AND p.status = 'completed'
       ORDER BY p.joinDate DESC`,
      [studentId]
    );

    // ถ้าไม่มีประวัติกิจกรรม
    if (rows.length === 0) {
      return NextResponse.json({
        participations: [],
      });
    }

    // ---------------------------------------------------------
    // 3. ดึงคะแนนแยกตามทักษะของทุก participation
    //
    // participation_skill:
    //   participationId
    //   skillName
    //   earnedScore
    //   maxScore
    // ---------------------------------------------------------
    const participationIds = rows.map(
      (row) => row.ParticipationId
    );

    const placeholders = participationIds.map(() => "?").join(", ");

    const [skillRows] = await pool.query<SkillScoreRow[]>(
      `SELECT
         participationId,
         skillName,
         SUM(COALESCE(earnedScore, 0)) AS earnedScore,
         SUM(COALESCE(maxScore, 0)) AS maxScore
       FROM participation_skill
       WHERE participationId IN (${placeholders})
       GROUP BY participationId, skillName
       ORDER BY participationId, skillName`,
      participationIds
    );

    // ---------------------------------------------------------
    // 4. จัดกลุ่มคะแนนตาม participationId
    // ---------------------------------------------------------
    const skillScoresMap = new Map<
      string,
      Array<{
        name: string;
        earnedScore: number;
        maxScore: number;
      }>
    >();

    for (const row of skillRows) {
      const participationId = String(row.participationId);

      if (!skillScoresMap.has(participationId)) {
        skillScoresMap.set(participationId, []);
      }

      skillScoresMap.get(participationId)!.push({
        name: String(row.skillName),
        earnedScore: Number(row.earnedScore ?? 0),
        maxScore: Number(row.maxScore ?? 0),
      });
    }

    // ---------------------------------------------------------
    // 5. ส่งข้อมูลกลับไปยังหน้า StudentActivitiesPage
    // ---------------------------------------------------------
    const participations = rows.map((row) => {
      const participationId = String(row.ParticipationId);

      return {
        participationId,
        activityId: row.activityId,
        activityName: row.activityName,
        description: row.description,
        date: row.date,
        time: row.time,
        endDate: row.endDate,
        endTime: row.endTime,
        hours:
          row.hours === null || row.hours === undefined
            ? null
            : Number(row.hours),
        location: row.location,
        organizer: row.organizer,
        term: row.term,
        joinDate: row.joinDate,
        score:
          row.score === null || row.score === undefined
            ? null
            : Number(row.score),
        status: row.status,

        // คะแนนแยกตามทักษะของนิสิต
        skillScores: skillScoresMap.get(participationId) ?? [],
      };
    });

    return NextResponse.json({
      participations,
    });
  } catch (error) {
    return jsonError(error);
  }
}

