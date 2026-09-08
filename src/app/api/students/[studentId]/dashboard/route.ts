import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

    // =========================================================
    // 1. ดึงข้อมูลทักษะทั้งหมด
    // =========================================================
    const [allSkills] = await pool.query<RowDataPacket[]>(
      "SELECT skillId, skillname FROM skill ORDER BY skillId"
    );

    // =========================================================
    // 2. รวมคะแนนของแต่ละทักษะจากทุกกิจกรรม
    //
    // สูตรที่ถูกต้อง:
    //
    //     SUM(earnedScore)
    //     ---------------- × 100
    //      SUM(maxScore)
    //
    // ห้ามใช้ AVG(normalizedScore)
    // เพราะจะกลายเป็นการเฉลี่ยเปอร์เซ็นต์ของแต่ละกิจกรรม
    // =========================================================
    const [skillScores] = await pool.query<RowDataPacket[]>(
      `SELECT
         ps.skillName,
         SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
         SUM(COALESCE(ps.maxScore, 0)) AS totalMax
       FROM participation_skill ps
       INNER JOIN participation p
         ON p.ParticipationId = ps.participationId
       WHERE p.studentId = ?
         AND p.status = 'completed'
       GROUP BY ps.skillName`,
      [studentId]
    );

    // =========================================================
    // 3. สร้าง Map สำหรับคะแนนแต่ละทักษะ
    // =========================================================
    const scoreMap: Record<
      string,
      {
        earned: number;
        max: number;
      }
    > = {};

    (skillScores as RowDataPacket[]).forEach((row) => {
      const earned = Number(row.totalEarned) || 0;
      const max = Number(row.totalMax) || 0;

      scoreMap[String(row.skillName)] = {
        earned,
        max,
      };
    });

    // =========================================================
    // 4. สร้างข้อมูลทักษะสำหรับ Dashboard
    // =========================================================
    const skills = allSkills.map((skill) => {
      const skillName = String(skill.skillname);

      const score = scoreMap[skillName] || {
        earned: 0,
        max: 0,
      };

      // สูตรสะสมที่ถูกต้อง
      const percent =
        score.max > 0
          ? Math.round((score.earned / score.max) * 10000) / 100
          : 0;

      return {
        skillId: skill.skillId,
        title: skillName,
        level: "กลาง",
        hours: 0,
        activityCount: 0,
        percent,
        earnedScore: score.earned,
        maxScore: score.max,
      };
    });

    // =========================================================
    // 5. จำนวนทักษะที่มีคะแนน
    // =========================================================
    const earnedSkillCount = skills.filter(
      (skill) => skill.percent > 0
    ).length;

    // =========================================================
    // 6. จำนวนกิจกรรมที่เข้าร่วม
    // =========================================================
    const [activityCountResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count
       FROM participation
       WHERE studentId = ?
         AND status = 'completed'`,
      [studentId]
    );

    const participatedActivities = Number(
      activityCountResult[0]?.count || 0
    );

    // =========================================================
    // 7. ชั่วโมงรวม
    // =========================================================
    const [hoursResult] = await pool.query<RowDataPacket[]>(
      `SELECT SUM(hours) AS totalHours
       FROM participation
       WHERE studentId = ?
         AND status = 'completed'`,
      [studentId]
    );

    const totalHours = Number(
      hoursResult[0]?.totalHours || 0
    );

    // =========================================================
    // 8. จำนวนใบรับรอง
    // =========================================================
    const [certCountResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count
       FROM participation p
       INNER JOIN activity a
         ON p.activityId = a.activityId
       WHERE p.studentId = ?
         AND p.status = 'completed'
         AND a.templateId IS NOT NULL`,
      [studentId]
    );

    const certificates = Number(
      certCountResult[0]?.count || 0
    );

    // =========================================================
    // 9. Overall Percent
    //
    // ใช้ค่าเฉลี่ยของเปอร์เซ็นต์ "แต่ละทักษะ"
    // เพื่อคงพฤติกรรมของ summary เดิม
    //
    // ส่วน percent ของแต่ละ skill ด้านบน
    // เป็น SUM(earned) / SUM(max) โดยตรง
    // =========================================================
    const overallPercent =
      skills.length > 0
        ? Math.round(
            (skills.reduce(
              (sum, skill) => sum + skill.percent,
              0
            ) /
              skills.length) *
              100
          ) / 100
        : 0;

    // =========================================================
    // 10. ส่งข้อมูลกลับ Dashboard
    // =========================================================
    return NextResponse.json({
      summary: {
        earnedSkillCount,
        totalSkillCount: skills.length,
        participatedActivities,
        totalHours,
        certificates,
        overallPercent,
      },
      skills,
    });
  } catch (error) {
    return jsonError(error);
  }
}