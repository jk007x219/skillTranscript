import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

// รายชื่อทักษะที่นิสิตคณะวิทย์ต้องมี (Faculty Skills)
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

    // 2. จำนวนกิจกรรมทั้งหมด (แยกตามสถานะ)
    const [activeActivitiesResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM activity WHERE status = 'active'"
    );
    const [pastActivitiesResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM activity WHERE status = 'past'"
    );
    const activeActivities = (activeActivitiesResult as any[])[0]?.total || 0;
    const pastActivities = (pastActivitiesResult as any[])[0]?.total || 0;

    // 3. คะแนนเฉลี่ยทักษะรวม
    const [avgScoreResult] = await pool.query(
      "SELECT AVG(score) AS avg FROM participation WHERE status = 'completed'"
    );
    const avgScore = (avgScoreResult as any[])[0]?.avg || 0;
    const averageOverallScore = Math.round(avgScore * 100) / 100;

    // 4. ค่าเฉลี่ยทักษะแต่ละด้าน (ทั้งหมด)
    const [allSkillAveragesResult] = await pool.query(
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
    const allSkillAverages = (allSkillAveragesResult as any[]).map((row) => ({
      skillName: row.skillName,
      average: Math.round(row.avgScore * 100) / 100,
    }));

    // 5. แยกทักษะตามหมวดหมู่
    const facultySkills = allSkillAverages.filter((skill) =>
      FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );
    const essentialSkills = allSkillAverages.filter(
      (skill) =>
        !FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );

    // 6. Radar Chart Data (ทุกทักษะ)
    const [radarDataResult] = await pool.query(
      `SELECT 
         sk.skillname AS skill,
         COALESCE(AVG(p.score), 0) AS score
       FROM skill sk
       LEFT JOIN activityskill acs ON acs.skillId = sk.skillId
       LEFT JOIN participation p ON p.activityId = acs.activityId AND p.status = 'completed'
       GROUP BY sk.skillId, sk.skillname
       ORDER BY sk.skillId`
    );
    const radarData = (radarDataResult as any[]).map((row) => ({
      skill: row.skill,
      score: Math.round((row.score || 0) * 100) / 100,
    }));

    return NextResponse.json({
      totalStudents,
      activeActivities,
      pastActivities,
      averageOverallScore,
      facultySkills, // ✅ ทักษะที่นิสิตคณะวิทย์ต้องมี
      essentialSkills, // ✅ ทักษะที่นิสิตจำเป็นต้องมี
      radarData,
    });
  } catch (error) {
    return jsonError(error);
  }
}