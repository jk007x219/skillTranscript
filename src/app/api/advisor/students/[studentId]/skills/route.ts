// app/api/advisor/students/[studentId]/skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError, httpError } from "@/lib/api-error";
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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { studentId } = await context.params;

    // ตรวจสอบว่านิสิตมีอยู่จริง และดึงข้อมูลพื้นฐานรวม program
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
      [studentId]
    );
    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบนิสิต");
    }
    const student = studentRows[0];

    // ===== คำนวณคะแนนจาก participation =====
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
      const levelScoreMap: Record<string, number> = {
        "พื้นฐาน": 1,
        "กลาง": 2,
        "สูง": 3,
      };
      const level = row.level || "กลาง";
      const maxScorePerActivity = levelScoreMap[level] || 2;
      const totalPossibleScore = row.totalEvaluations * maxScorePerActivity;

      const percent = totalPossibleScore > 0
        ? Math.round((row.earnedScore / totalPossibleScore) * 100)
        : 0;

      return {
        skillId: row.skillId,
        skillName: row.skillName || row.skillId,
        level: row.level || "กลาง",
        activities: row.totalEvaluations,
        completed: row.completedEvaluations,
        score: row.earnedScore,
        maxScore: totalPossibleScore,
        percent: Math.min(100, percent),
      };
    });

    // คำนวณคะแนนเฉลี่ย
    const avgScore = skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + (s.percent || 0), 0) / skills.length)
      : 0;

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        firstName: student.firstname || "",
        lastName: student.lastname || "",
        name: `${student.firstname || ""} ${student.lastname || ""}`.trim(),
        email: student.email,
        phone: student.phone,
        faculty: student.faculty,
        major: student.major,
        program: student.program || null,   // ✅ เพิ่มหลักสูตร
        year: student.year,
      },
      summary: {
        totalSkills: skills.length,
        completedSkills: skills.filter((s) => s.percent >= 80).length,
        avgScore,
      },
      skills,
    });
  } catch (error) {
    return jsonError(error);
  }
}