// app/api/staff/dashboard/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

// ✅ รายชื่อทักษะทั้งหมด (11 ทักษะ) - ใช้เป็นค่าตั้งต้น
const ALL_SKILLS = [
  "ทักษะการสร้างนวัตกรรมสังคม",
  "ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ",
  "ทักษะการคิดเชิงออกแบบนวัตกรรม",
  "ทักษะการใช้เครื่องมือวิทยาศาสตร์",
  "ทักษะการใช้ปัญญาประดิษฐ์",
  "ทักษะความปลอดภัยไซเบอร์",
  "ทักษะการสื่อสาร",
  "ทักษะการเป็นผู้ประกอบการ",
  "ทักษะการทำงานเป็นทีม",
  "ทักษะการคิดและการแก้ปัญหา",
  "ทักษะดิจิทัล",
];

// ✅ รายชื่อทักษะที่นิสิตคณะวิทย์ต้องมี (Faculty Skills) - 6 ทักษะ
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

    // 3. คะแนนเฉลี่ยทักษะรวม (จาก participation ที่ completed)
    const [avgScoreResult] = await pool.query(
      "SELECT COALESCE(AVG(score), 0) AS avg FROM participation WHERE status = 'completed'"
    );
    const avgScore = (avgScoreResult as any[])[0]?.avg || 0;
    const averageOverallScore = Math.round(avgScore * 100) / 100;

    // ✅ 4. คำนวณคะแนนเฉลี่ยทักษะแบบใหม่:
    //    - คำนวณคะแนนเฉลี่ยของแต่ละนิสิตก่อน (จาก participation_skill)
    //    - แล้วนำค่าเฉลี่ยของนิสิตมาหาค่าเฉลี่ยรวมอีกที
    //    เพื่อป้องกัน bias จากนิสิตที่ทำแบบประเมินเยอะกว่า
    
    // 4.1 ดึงคะแนน normalized ของแต่ละทักษะของแต่ละนิสิต
    const [studentSkillScores] = await pool.query(
      `SELECT 
         ps.skillName,
         p.studentId,
         AVG(ps.normalizedScore) AS normalizedScore
       FROM participation_skill ps
       INNER JOIN participation p ON p.ParticipationId = ps.participationId
       WHERE p.status = 'completed'
       GROUP BY p.studentId, ps.skillName`
    );

    // 4.2 สร้าง Map: skillName -> array ของ normalizedScore ของแต่ละนิสิต
    const skillScoresMap: Record<string, number[]> = {};
    const studentScoreMap: Record<string, { skillName: string; normalizedScore: number }[]> = {};

    (studentSkillScores as any[]).forEach((row) => {
      const skillName = row.skillName;
      const score = parseFloat(row.normalizedScore) || 0;
      const studentId = row.studentId;

      // เก็บตามทักษะ
      if (!skillScoresMap[skillName]) {
        skillScoresMap[skillName] = [];
      }
      skillScoresMap[skillName].push(score);

      // เก็บตามนิสิต (สำหรับคำนวณค่าเฉลี่ยรายบุคคล)
      if (!studentScoreMap[studentId]) {
        studentScoreMap[studentId] = [];
      }
      studentScoreMap[studentId].push({ skillName, normalizedScore: score });
    });

    // 4.3 คำนวณค่าเฉลี่ยของแต่ละทักษะ: 
    //    - หาค่าเฉลี่ยของแต่ละนิสิตก่อน (normalizedScore ของนิสิตในแต่ละทักษะ)
    //    - แล้วนำค่าเฉลี่ยของนิสิตมาหาค่าเฉลี่ยรวม
    const skillAverageMap: Record<string, number> = {};
    
    // คำนวณค่าเฉลี่ยของแต่ละนิสิตต่อทักษะ แล้วหาค่าเฉลี่ยรวม
    Object.keys(skillScoresMap).forEach((skillName) => {
      const scores = skillScoresMap[skillName] || [];
      if (scores.length === 0) {
        skillAverageMap[skillName] = 0;
        return;
      }
      // ค่าเฉลี่ยของทักษะนี้ = (ผลรวม normalizedScore ของนิสิตทั้งหมด) / (จำนวนนิสิต)
      const sum = scores.reduce((a, b) => a + b, 0);
      skillAverageMap[skillName] = Math.round((sum / scores.length) * 100) / 100;
    });

    // 4.4 สร้าง allSkillAverages จาก ALL_SKILLS (เพื่อให้ครบ 11 ทักษะ)
    const allSkillAverages = ALL_SKILLS.map((skillName) => ({
      skillName,
      average: Math.round((skillAverageMap[skillName] || 0) * 100) / 100,
    }));

    // 5. แยกทักษะตามหมวดหมู่
    const facultySkills = allSkillAverages.filter((skill) =>
      FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );
    const essentialSkills = allSkillAverages.filter(
      (skill) =>
        !FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );

    // 6. Radar Chart Data (ทุกทักษะ) ✅ ใช้ค่าจาก allSkillAverages
    const radarData = allSkillAverages.map((skill) => ({
      skill: skill.skillName,
      score: skill.average,
    }));

    return NextResponse.json({
      totalStudents,
      activeActivities,
      pastActivities,
      averageOverallScore,
      facultySkills,
      essentialSkills,
      radarData,
    });
  } catch (error) {
    return jsonError(error);
  }
}