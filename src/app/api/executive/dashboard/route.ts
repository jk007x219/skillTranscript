import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

// รายชื่อทักษะที่นิสิตคณะวิทย์ต้องมี (Faculty Skills) - 6 ทักษะ
const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

export async function GET() {
  try {
    // 1. จำนวนนิสิตทั้งหมด
    const [totalStudentsResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM students"
    );
    const totalStudents = (totalStudentsResult as any[])[0]?.total || 0;

    // 2. จำนวนกิจกรรมทั้งหมด
    const [totalActivitiesResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM activity"
    );
    const totalActivities = (totalActivitiesResult as any[])[0]?.total || 0;

    // 3. คะแนนเฉลี่ยทักษะรวม
    const [avgScoreResult] = await pool.query(
      "SELECT AVG(score) AS avg FROM participation WHERE status = 'completed'"
    );
    const avgScore = (avgScoreResult as any[])[0]?.avg || 0;
    const averageOverallScore = Math.round(avgScore * 100) / 100;

    // 4. ระดับทักษะ: คำนวณจากคะแนนเฉลี่ยของแต่ละนิสิต
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
        {
          level: "ดีมาก",
          count: excellent,
          percent: Math.round((excellent / total) * 100),
        },
        {
          level: "ปานกลาง",
          count: medium,
          percent: Math.round((medium / total) * 100),
        },
        {
          level: "ต้องปรับปรุง",
          count: poor,
          percent: Math.round((poor / total) * 100),
        },
      ];
    }

    // 5. ดึงทักษะทั้งหมด (11 ทักษะ) พร้อมค่าเฉลี่ย (ถ้าไม่มีข้อมูลให้เป็น 0)
    const [allSkillAveragesResult] = await pool.query(
      `SELECT 
         sk.skillname AS skillName,
         COALESCE(AVG(p.score), 0) AS avgScore
       FROM skill sk
       LEFT JOIN activityskill acs ON acs.skillId = sk.skillId
       LEFT JOIN participation p ON p.activityId = acs.activityId AND p.status = 'completed'
       GROUP BY sk.skillId, sk.skillname
       ORDER BY sk.skillId`
    );
    const allSkillAverages = (allSkillAveragesResult as any[]).map((row) => ({
      skillName: row.skillName,
      average: Math.round(row.avgScore * 100) / 100,
    }));

    // 6. ✅ ข้อมูลสำหรับ Radar Chart (ทุกทักษะ)
    const radarData = allSkillAverages.map((skill) => ({
      skill: skill.skillName,
      score: skill.average,
    }));

    // 7. แยกทักษะตามหมวดหมู่ (Faculty Skills 6 ทักษะ, Essential Skills 5 ทักษะ)
    const facultySkills = allSkillAverages.filter((skill) =>
      FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );
    const essentialSkills = allSkillAverages.filter(
      (skill) =>
        !FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );

    // 8. ✅ ข้อมูลสถิติตามภาคการศึกษาและปีการศึกษา (แสดง term + ปี)
    const [termStatsResult] = await pool.query(
      `SELECT 
         a.term,
         YEAR(a.date) AS year,
         AVG(p.score) AS avgScore,
         COUNT(DISTINCT p.studentId) AS studentCount,
         COUNT(DISTINCT p.activityId) AS activityCount
       FROM activity a
       INNER JOIN participation p ON p.activityId = a.activityId
       WHERE p.status = 'completed' AND a.term IS NOT NULL AND a.date IS NOT NULL
       GROUP BY a.term, YEAR(a.date)
       ORDER BY YEAR(a.date) DESC, a.term DESC`
    );
    const termSummary = (termStatsResult as any[]).map((row) => {
      const termLabel = `ภาค ${row.term}/${row.year}`;
      const avgScore = Math.round(row.avgScore * 100) / 100;
      return {
        term: termLabel,
        avgScore,
        studentCount: row.studentCount || 0,
        activityCount: row.activityCount || 0,
        level: avgScore >= 80 ? "ดีมาก" : avgScore >= 50 ? "ปานกลาง" : "ต้องปรับปรุง",
      };
    });

    return NextResponse.json({
      totalStudents,
      totalActivities,
      averageOverallScore,
      levelDistribution,
      radarData,          // ✅ เพิ่ม
      facultySkills,
      essentialSkills,
      termSummary,
    });
  } catch (error) {
    return jsonError(error);
  }
}