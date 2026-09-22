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
    // 2. คำนวณคะแนนทักษะแบบใหม่
    //
    // แต่ละระดับมีน้ำหนักเท่ากันต่อกิจกรรม:
    // พื้นฐาน = 1, กลาง = 1, สูง = 1
    //
    // คะแนนของแต่ละระดับ
    //   = SUM(คะแนนที่ได้) / SUM(คะแนนเต็ม) * 100
    //
    // สัดส่วนกิจกรรมของแต่ละระดับ
    //   = จำนวนกิจกรรมระดับนั้น / จำนวนกิจกรรมทั้งหมดของทักษะ * 100
    //
    // คะแนนทักษะรวม
    //   = SUM(คะแนนระดับนั้น * สัดส่วนกิจกรรมระดับนั้น / 100)
    //
    // เช่น 100% * 1/9 + 52.94% * 3/9 + 58.62% * 5/9
    //      = 61.32%
    // =========================================================
    const [skillScores] = await pool.query<RowDataPacket[]>(
      `SELECT
         s.skillId,
         s.skillname AS skillName,
         COALESCE(acs.level, 'พื้นฐาน') AS skillLevel,
         COUNT(DISTINCT p.activityId) AS activityCount,
         SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
         SUM(COALESCE(ps.maxScore, 0)) AS totalMax
       FROM skill s
       LEFT JOIN activityskill acs
         ON acs.skillId = s.skillId
       LEFT JOIN participation p
         ON p.activityId = acs.activityId
        AND p.studentId = ?
        AND p.status = 'completed'
       LEFT JOIN participation_skill ps
         ON ps.participationId = p.ParticipationId
        AND ps.skillName = acs.skillname
       GROUP BY s.skillId, s.skillname, acs.level`,
      [studentId]
    );

    type LevelScore = {
      activityCount: number;
      earned: number;
      max: number;
    };

    const scoreMap: Record<string, Record<string, LevelScore>> = {};

    for (const row of skillScores) {
      const skillName = String(row.skillName);
      const level = String(row.skillLevel || 'พื้นฐาน');

      if (!scoreMap[skillName]) scoreMap[skillName] = {};

      scoreMap[skillName][level] = {
        activityCount: Number(row.activityCount) || 0,
        earned: Number(row.totalEarned) || 0,
        max: Number(row.totalMax) || 0,
      };
    }

    function normalizeLevel(level: string) {
      const value = level.trim().toLowerCase();

      if (value.includes('สูง') || value.includes('advanced') || value.includes('high') || value === '3') {
        return 'สูง';
      }

      if (value.includes('กลาง') || value.includes('intermediate') || value.includes('medium') || value.includes('mid') || value === '2') {
        return 'กลาง';
      }

      return 'พื้นฐาน';
    }

    // รวมข้อมูลกรณีฐานข้อมูลใช้ชื่อระดับหลายรูปแบบ
    const normalizedScoreMap: Record<string, Record<string, LevelScore>> = {};

    for (const [skillName, levels] of Object.entries(scoreMap)) {
      normalizedScoreMap[skillName] = {};

      for (const [rawLevel, value] of Object.entries(levels)) {
        const level = normalizeLevel(rawLevel);
        const current = normalizedScoreMap[skillName][level] || {
          activityCount: 0,
          earned: 0,
          max: 0,
        };

        current.activityCount += value.activityCount;
        current.earned += value.earned;
        current.max += value.max;
        normalizedScoreMap[skillName][level] = current;
      }
    }

    const skills = allSkills.map((skill) => {
      const skillName = String(skill.skillname);
      const levels = normalizedScoreMap[skillName] || {};

      const basic = levels['พื้นฐาน'] || { activityCount: 0, earned: 0, max: 0 };
      const intermediate = levels['กลาง'] || { activityCount: 0, earned: 0, max: 0 };
      const advanced = levels['สูง'] || { activityCount: 0, earned: 0, max: 0 };

      const totalActivities =
        basic.activityCount +
        intermediate.activityCount +
        advanced.activityCount;

      const levelPercent = (item: LevelScore) =>
        item.max > 0
          ? Math.min(100, Math.max(0, Math.round((item.earned / item.max) * 10000) / 100))
          : 0;

      const basicPercent = levelPercent(basic);
      const intermediatePercent = levelPercent(intermediate);
      const advancedPercent = levelPercent(advanced);

      const percent =
        totalActivities > 0
          ? Math.round(
              (
                (basicPercent * basic.activityCount +
                  intermediatePercent * intermediate.activityCount +
                  advancedPercent * advanced.activityCount) /
                totalActivities
              ) * 100
            ) / 100
          : 0;

      return {
        skillId: skill.skillId,
        title: skillName,
        level:
          advanced.activityCount > 0
            ? 'สูง'
            : intermediate.activityCount > 0
              ? 'กลาง'
              : 'พื้นฐาน',
        hours: 0,
        activityCount: totalActivities,
        percent,
        basicPercent,
        intermediatePercent,
        advancedPercent,
        basicActivityCount: basic.activityCount,
        intermediateActivityCount: intermediate.activityCount,
        advancedActivityCount: advanced.activityCount,
        earnedScore: basic.earned + intermediate.earned + advanced.earned,
        maxScore: basic.max + intermediate.max + advanced.max,
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