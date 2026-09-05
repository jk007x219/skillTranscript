import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

type SkillScoreRow = RowDataPacket & {
  skillId: string;
  skillName: string | null;
  level: string | null;
  totalEvaluations: number;
  completedEvaluations: number;
  earnedScore: number;
  maxPossibleScore: number;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { studentId } = await context.params;

    // ตรวจสอบว่านิสิตมีอยู่ในระบบ
    const [studentRows] = await pool.query<RowDataPacket[]>(
      "SELECT studentId FROM students WHERE studentId = ?",
      [studentId]
    );
    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    // ดึงข้อมูลทักษะทั้งหมด
    const [allSkills] = await pool.query<RowDataPacket[]>(
      "SELECT skillId, skillname FROM skill ORDER BY skillId"
    );

    // คำนวณคะแนนจาก participation
    const [skillScores] = await pool.query<SkillScoreRow[]>(
      `SELECT 
         s.skillId,
         s.skillname AS skillName,
         MAX(s.level) AS level,
         COUNT(DISTINCT a.activityId) AS totalEvaluations,
         SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completedEvaluations,
         COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.score ELSE 0 END), 0) AS earnedScore,
         COUNT(DISTINCT a.activityId) * 3 AS maxPossibleScore
       FROM skill s
       LEFT JOIN activityskill acs ON acs.skillId = s.skillId
       LEFT JOIN activity a ON a.activityId = acs.activityId
       LEFT JOIN participation p 
         ON p.activityId = a.activityId 
         AND p.studentId = ?
       GROUP BY s.skillId, s.skillname
       ORDER BY s.skillId`,
      [studentId]
    );

    const skills = skillScores.map((row) => {
      const maxScorePerActivity = row.level ? (row.level === "พื้นฐาน" ? 1 : row.level === "กลาง" ? 2 : 3) : 2;
      const totalPossibleScore = row.totalEvaluations * maxScorePerActivity;

      const percent = totalPossibleScore > 0
        ? Math.round((row.earnedScore / totalPossibleScore) * 100)
        : 0;

      return {
        skillId: row.skillId,
        title: row.skillName || row.skillId,
        level: row.level || "กลาง",
        totalEvaluations: row.totalEvaluations,
        completedEvaluations: row.completedEvaluations,
        earnedScore: row.earnedScore,
        maxPossibleScore: totalPossibleScore,
        percent: Math.min(100, percent),
      };
    });

    // สรุปข้อมูล
    const [summaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COUNT(DISTINCT activityId) AS participatedActivities,
         (SELECT COUNT(*) FROM activity WHERE status = 'past') AS totalActivities
       FROM participation
       WHERE studentId = ? AND status = 'completed'`,
      [studentId]
    );

    const summary = summaryRows[0] || { participatedActivities: 0, totalActivities: 0 };

    const totalPercent = skills.reduce((sum, s) => sum + s.percent, 0);
    const overallPercent = skills.length > 0 ? Math.round(totalPercent / skills.length) : 0;
    const earnedSkillCount = skills.filter((s) => s.percent > 0).length;

    return NextResponse.json({
      studentId,
      scoring: {
        type: "evaluation-based",
        description: "คะแนนคำนวณจากแบบประเมินกิจกรรม",
      },
      summary: {
        earnedSkillCount,
        totalSkillCount: skills.length,
        participatedActivities: summary.participatedActivities || 0,
        totalActivities: summary.totalActivities || 0,
        certificates: summary.participatedActivities || 0,
        overallPercent,
      },
      skills,
    });
  } catch (error) {
    return jsonError(error);
  }
}