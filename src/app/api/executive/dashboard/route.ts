import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. จำนวนนิสิตทั้งหมด
    const [totalStudentsResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM students"
    );
    const totalStudents = (totalStudentsResult as any[])[0]?.total || 0;

    // 2. จำนวนกิจกรรมทั้งหมด (เฉพาะที่ผ่านมาแล้ว)
    const [totalActivitiesResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM activity WHERE status = 'past'"
    );
    const totalActivities = (totalActivitiesResult as any[])[0]?.total || 0;

    // 3. คะแนนเฉลี่ยทักษะรวม (จาก participation.score เฉลี่ยของนิสิตที่ completed)
    const [avgScoreResult] = await pool.query(
      "SELECT AVG(score) AS avg FROM participation WHERE status = 'completed'"
    );
    const avgScore = (avgScoreResult as any[])[0]?.avg || 0;
    const averageOverallScore = Math.round(avgScore * 100) / 100;

    // 4. ระดับทักษะ: คำนวณจากคะแนนเฉลี่ยของแต่ละนิสิต (จาก participation ที่ completed)
    const [studentScores] = await pool.query(
      `SELECT studentId, AVG(score) AS avgScore
       FROM participation
       WHERE status = 'completed'
       GROUP BY studentId`
    );
    const scores = (studentScores as any[]).map((row) => row.avgScore);
    let levelDistribution = [
      { level: "ดีมาก", count: 0, percent: 0 },
      { level: "ปานกลาง", count: 0, percent: 0 },
      { level: "ต้องปรับปรุง", count: 0, percent: 0 },
    ];
    if (scores.length > 0) {
      let excellent = 0,
        medium = 0,
        poor = 0;
      scores.forEach((s: number) => {
        if (s >= 80) excellent++;
        else if (s >= 50) medium++;
        else poor++;
      });
      const total = scores.length;
      levelDistribution = [
        { level: "ดีมาก", count: excellent, percent: Math.round((excellent / total) * 100) },
        { level: "ปานกลาง", count: medium, percent: Math.round((medium / total) * 100) },
        { level: "ต้องปรับปรุง", count: poor, percent: Math.round((poor / total) * 100) },
      ];
    }

    // 5. ค่าเฉลี่ยทักษะแต่ละด้าน (จาก participation score ที่เชื่อมโยงกับ skill ผ่าน activityskill)
    const [skillAveragesResult] = await pool.query(
      `SELECT 
         sk.skillname AS skillName,
         AVG(p.score) AS avgScore
       FROM skill sk
       INNER JOIN activityskill acs ON acs.skillId = sk.skillId
       INNER JOIN participation p ON p.activityId = acs.activityId
       WHERE p.status = 'completed'
       GROUP BY sk.skillId, sk.skillname
       ORDER BY avgScore DESC`
    );
    const skillAverages = (skillAveragesResult as any[]).map((row) => ({
      skillName: row.skillName,
      average: Math.round(row.avgScore * 100) / 100,
    }));

    // 6. แนวโน้มคะแนนเฉลี่ยทักษะรวมตามภาคเรียน
    const [trendResult] = await pool.query(
      `SELECT 
         a.term,
         AVG(p.score) AS avgScore
       FROM activity a
       INNER JOIN participation p ON p.activityId = a.activityId
       WHERE p.status = 'completed' AND a.term IS NOT NULL
       GROUP BY a.term
       ORDER BY a.term`
    );
    const trendData = (trendResult as any[]).map((row) => ({
      term: row.term || "ไม่ระบุ",
      score: Math.round(row.avgScore * 100) / 100,
    }));

    return NextResponse.json({
      totalStudents,
      totalActivities,
      averageOverallScore,
      levelDistribution,
      skillAverages,
      trendData,
    });
  } catch (error) {
    return jsonError(error);
  }
}