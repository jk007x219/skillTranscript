// app/api/advisor/students/[studentId]/skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError, httpError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

type LevelScore = {
  activityCount: number;
  earned: number;
  max: number;
};

type SkillScoreRow = RowDataPacket & {
  skillId: string;
  skillName: string | null;
  skillLevel: string | null;
  activityCount: number;
  totalEarned: number;
  totalMax: number;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { studentId } = await context.params;

    const [studentRows] = await pool.query<RowDataPacket[]>(
      `SELECT
         s.studentId,
         s.firstname,
         s.lastname,
         u.email,
         s.phone,
         s.faculty,
         s.major,
         s.program,
         s.year
       FROM students s
       INNER JOIN users u ON u.userId = s.userId
       WHERE s.studentId = ?`,
      [studentId],
    );

    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบนิสิต");
    }

    const student = studentRows[0];

    // ดึงทุกทักษะจากตาราง skill โดยตรง
    // เพื่อให้ทักษะที่ยังไม่มีการเข้าร่วมยังคงแสดงบน Radar เป็น 0%
    const [allSkills] = await pool.query<RowDataPacket[]>(
      "SELECT skillId, skillname FROM skill ORDER BY skillId",
    );

    const [skillScores] = await pool.query<SkillScoreRow[]>(
      `SELECT
         s.skillId,
         s.skillname AS skillName,
         COALESCE(acs.level, 'พื้นฐาน') AS skillLevel,
         COUNT(DISTINCT p.activityId) AS activityCount,
         COALESCE(SUM(ps.earnedScore), 0) AS totalEarned,
         COALESCE(SUM(ps.maxScore), 0) AS totalMax
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
       GROUP BY
         s.skillId,
         s.skillname,
         acs.level
       ORDER BY s.skillId`,
      [studentId],
    );

    const normalizeLevel = (value: string) => {
      const level = value.trim().toLowerCase();

      if (
        level.includes("สูง") ||
        level.includes("advanced") ||
        level.includes("high") ||
        level === "3"
      ) {
        return "สูง";
      }

      if (
        level.includes("กลาง") ||
        level.includes("intermediate") ||
        level.includes("medium") ||
        level.includes("mid") ||
        level === "2"
      ) {
        return "กลาง";
      }

      return "พื้นฐาน";
    };

    // ใช้ skillId เป็น key หลัก ป้องกันชื่อทักษะซ้ำ/ต่างรูปแบบแล้วทำให้ข้อมูลหาย
    const scoreMap = new Map<string, Record<string, LevelScore>>();

    for (const row of skillScores) {
      const skillId = String(row.skillId);
      const level = normalizeLevel(String(row.skillLevel || "พื้นฐาน"));

      if (!scoreMap.has(skillId)) {
        scoreMap.set(skillId, {});
      }

      const levels = scoreMap.get(skillId)!;
      const current = levels[level] || {
        activityCount: 0,
        earned: 0,
        max: 0,
      };

      current.activityCount += Number(row.activityCount) || 0;
      current.earned += Number(row.totalEarned) || 0;
      current.max += Number(row.totalMax) || 0;
      levels[level] = current;
    }

    const skills = allSkills.map((skill) => {
      const skillId = String(skill.skillId);
      const skillName = String(skill.skillname);
      const levels = scoreMap.get(skillId) || {};

      const basic = levels["พื้นฐาน"] || {
        activityCount: 0,
        earned: 0,
        max: 0,
      };
      const intermediate = levels["กลาง"] || {
        activityCount: 0,
        earned: 0,
        max: 0,
      };
      const advanced = levels["สูง"] || {
        activityCount: 0,
        earned: 0,
        max: 0,
      };

      const totalActivities =
        basic.activityCount +
        intermediate.activityCount +
        advanced.activityCount;

      const levelPercent = (item: LevelScore) =>
        item.max > 0
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round((item.earned / item.max) * 10000) / 100,
              ),
            )
          : 0;

      const basicPercent = levelPercent(basic);
      const intermediatePercent = levelPercent(intermediate);
      const advancedPercent = levelPercent(advanced);

      // สูตรเดียวกับ Student Dashboard:
      // เฉลี่ยคะแนนของแต่ละระดับตามจำนวนกิจกรรมที่นิสิตเข้าร่วม
      const percent =
        totalActivities > 0
          ? Math.round(
              (
                (basicPercent * basic.activityCount +
                  intermediatePercent * intermediate.activityCount +
                  advancedPercent * advanced.activityCount) /
                totalActivities
              ) * 100,
            ) / 100
          : 0;

      return {
        skillId,
        skillName,
        level:
          advanced.activityCount > 0
            ? "สูง"
            : intermediate.activityCount > 0
              ? "กลาง"
              : "พื้นฐาน",
        activities: totalActivities,
        completed: totalActivities,
        score:
          basic.earned +
          intermediate.earned +
          advanced.earned,
        maxScore:
          basic.max +
          intermediate.max +
          advanced.max,
        percent,
        basicPercent,
        intermediatePercent,
        advancedPercent,
        basicActivityCount: basic.activityCount,
        intermediateActivityCount: intermediate.activityCount,
        advancedActivityCount: advanced.activityCount,
      };
    });

    // ค่าเฉลี่ยภาพรวมไม่นับทักษะที่ยังไม่เคยเข้าร่วม
    const assessed = skills.filter((skill) => skill.activities > 0);

    const avgScore =
      assessed.length > 0
        ? Math.round(
            (assessed.reduce((sum, skill) => sum + skill.percent, 0) /
              assessed.length) *
              100,
          ) / 100
        : 0;

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        firstName: student.firstname || "",
        lastName: student.lastname || "",
        name: [student.firstname || "", student.lastname || ""]
          .filter(Boolean)
          .join(" "),
        email: student.email,
        phone: student.phone,
        faculty: student.faculty,
        major: student.major,
        program: student.program || null,
        year: student.year,
      },
      summary: {
        totalSkills: skills.length,
        completedSkills: assessed.filter(
          (skill) => skill.percent >= 80,
        ).length,
        avgScore,
      },
      skills,
    });
  } catch (error) {
    return jsonError(error);
  }
}
