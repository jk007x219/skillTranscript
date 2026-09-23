// app/api/staff/dashboard/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

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

const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

type StudentRow = RowDataPacket & { studentId: string };
type AcademicYearRow = RowDataPacket & { admissionYear: number };

type LevelScore = {
  activityCount: number;
  earned: number;
  max: number;
};

type StudentSkillLevels = Record<string, Record<string, LevelScore>>;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeLevel(level: string) {
  const value = level.trim().toLowerCase();

  if (
    value.includes("สูง") ||
    value.includes("advanced") ||
    value.includes("high") ||
    value === "3"
  ) {
    return "สูง";
  }

  if (
    value.includes("กลาง") ||
    value.includes("intermediate") ||
    value.includes("medium") ||
    value.includes("mid") ||
    value === "2"
  ) {
    return "กลาง";
  }

  return "พื้นฐาน";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearParam = searchParams.get("academicYear");

    const isAllAcademicYears =
      !academicYearParam ||
      academicYearParam === "all" ||
      academicYearParam === "ทุกปีการศึกษา";

    let academicYear: number | null = null;

    if (!isAllAcademicYears) {
      const parsedYear = Number(academicYearParam);
      if (!Number.isInteger(parsedYear)) {
        return NextResponse.json(
          { message: "ปีการศึกษาไม่ถูกต้อง" },
          { status: 400 }
        );
      }
      academicYear = parsedYear;
    }

    // 1. ปีการศึกษาที่มีอยู่
    const [academicYearRows] = await pool.query<AcademicYearRow[]>(`
      SELECT DISTINCT admissionYear
      FROM students
      WHERE admissionYear IS NOT NULL
      ORDER BY admissionYear DESC
    `);

    const academicYears = academicYearRows
      .map((row) => Number(row.admissionYear))
      .filter((year) => Number.isInteger(year));

    // 2. นิสิตในกลุ่มที่เลือก
    let studentQuery = `SELECT studentId FROM students`;
    const studentParams: number[] = [];

    if (academicYear !== null) {
      studentQuery += ` WHERE admissionYear = ?`;
      studentParams.push(academicYear);
    }

    const [studentRows] = await pool.query<StudentRow[]>(
      studentQuery,
      studentParams
    );

    const studentIds = studentRows.map((row) => String(row.studentId));
    const totalStudents = studentIds.length;

    // จำนวนกิจกรรมเป็นข้อมูลของระบบ ไม่กรองตามปีการศึกษา
    const [activeActivitiesResult] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total
      FROM activity
      WHERE status = 'active'
    `);

    const [pastActivitiesResult] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total
      FROM activity
      WHERE status = 'past'
    `);

    const activeActivities = Number(activeActivitiesResult[0]?.total || 0);
    const pastActivities = Number(pastActivitiesResult[0]?.total || 0);

    if (studentIds.length === 0) {
      const emptySkills = ALL_SKILLS.map((skillName) => ({
        skillName,
        average: 0,
      }));

      return NextResponse.json({
        academicYear,
        academicYears,
        totalStudents: 0,
        activeActivities,
        pastActivities,
        averageOverallScore: 0,
        facultySkills: emptySkills.filter((skill) =>
          FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
        ),
        essentialSkills: emptySkills.filter(
          (skill) =>
            !FACULTY_SKILL_NAMES.some((name) =>
              skill.skillName.includes(name)
            )
        ),
        radarData: emptySkills.map((skill) => ({
          skill: skill.skillName,
          score: 0,
        })),
      });
    }

    const placeholders = studentIds.map(() => "?").join(",");

    // 3. ดึงเฉพาะผลการประเมินของนิสิตที่เข้าร่วมกิจกรรมแล้ว
    // participation_skill จะมีข้อมูลเมื่อมีการประเมิน/บันทึกทักษะแล้ว
    const [skillScoreRows] = await pool.query<
      (RowDataPacket & {
        studentId: string;
        skillName: string;
        skillLevel: string;
        activityCount: number | string;
        totalEarned: number | string;
        totalMax: number | string;
      })[]
    >(
      `
      SELECT
        p.studentId,
        ps.skillName,
        COALESCE(acs.level, 'พื้นฐาน') AS skillLevel,
        COUNT(DISTINCT p.activityId) AS activityCount,
        SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
        SUM(COALESCE(ps.maxScore, 0)) AS totalMax
      FROM participation p
      INNER JOIN participation_skill ps
        ON ps.participationId = p.ParticipationId
      LEFT JOIN activityskill acs
        ON acs.activityId = p.activityId
       AND acs.skillname = ps.skillName
      WHERE p.status = 'completed'
        AND p.studentId IN (${placeholders})
      GROUP BY
        p.studentId,
        ps.skillName,
        COALESCE(acs.level, 'พื้นฐาน')
      `,
      studentIds
    );

    const studentSkillLevelMap: Record<string, StudentSkillLevels> = {};
    studentIds.forEach((studentId) => {
      studentSkillLevelMap[studentId] = {};
    });

    for (const row of skillScoreRows) {
      const studentId = String(row.studentId);
      const skillName = String(row.skillName);
      const level = normalizeLevel(String(row.skillLevel || "พื้นฐาน"));

      if (!studentSkillLevelMap[studentId]) {
        studentSkillLevelMap[studentId] = {};
      }
      if (!studentSkillLevelMap[studentId][skillName]) {
        studentSkillLevelMap[studentId][skillName] = {};
      }

      const current =
        studentSkillLevelMap[studentId][skillName][level] || {
          activityCount: 0,
          earned: 0,
          max: 0,
        };

      current.activityCount += Number(row.activityCount) || 0;
      current.earned += Number(row.totalEarned) || 0;
      current.max += Number(row.totalMax) || 0;
      studentSkillLevelMap[studentId][skillName][level] = current;
    }

    // 4. คะแนนทักษะรายนิสิต
    // สำคัญ: ถ้านิสิตยังไม่เคยเข้าร่วม/ประเมินทักษะนั้น
    // จะไม่มีคะแนนและจะไม่ถูกนำไปหารค่าเฉลี่ยของทักษะนั้น
    const studentSkillPercentMap: Record<string, Record<string, number>> = {};
    const studentSkillActivityMap: Record<string, Record<string, number>> = {};

    studentIds.forEach((studentId) => {
      studentSkillPercentMap[studentId] = {};
      studentSkillActivityMap[studentId] = {};

      ALL_SKILLS.forEach((skillName) => {
        const levels = studentSkillLevelMap[studentId]?.[skillName] || {};
        const basic = levels["พื้นฐาน"] || { activityCount: 0, earned: 0, max: 0 };
        const intermediate = levels["กลาง"] || { activityCount: 0, earned: 0, max: 0 };
        const advanced = levels["สูง"] || { activityCount: 0, earned: 0, max: 0 };

        const totalActivities =
          basic.activityCount +
          intermediate.activityCount +
          advanced.activityCount;

        studentSkillActivityMap[studentId][skillName] = totalActivities;

        const levelPercent = (item: LevelScore) =>
          item.max > 0
            ? Math.min(
                100,
                Math.max(0, round2((item.earned / item.max) * 100))
              )
            : 0;

        const basicPercent = levelPercent(basic);
        const intermediatePercent = levelPercent(intermediate);
        const advancedPercent = levelPercent(advanced);

        const percent =
          totalActivities > 0
            ? round2(
                (basicPercent * basic.activityCount +
                  intermediatePercent * intermediate.activityCount +
                  advancedPercent * advanced.activityCount) /
                  totalActivities
              )
            : 0;

        studentSkillPercentMap[studentId][skillName] = percent;
      });
    });

    // 5. ค่าเฉลี่ยรายทักษะ
    // ไม่เอานิสิตที่ยังไม่ได้เข้าร่วม/ยังไม่มีผลประเมินทักษะนั้นมาคำนวณ
    const allSkillAverages = ALL_SKILLS.map((skillName) => {
      const participatingStudents = studentIds.filter(
        (studentId) =>
          (studentSkillActivityMap[studentId]?.[skillName] || 0) > 0
      );

      const average =
        participatingStudents.length > 0
          ? round2(
              participatingStudents.reduce(
                (sum, studentId) =>
                  sum + studentSkillPercentMap[studentId][skillName],
                0
              ) / participatingStudents.length
            )
          : 0;

      return {
        skillName,
        average,
      };
    });

    // 6. Overall ของนิสิตแต่ละคน
    // เฉพาะทักษะที่นิสิตมีผลการประเมินแล้วเท่านั้น
    // ทักษะที่ยังไม่เคยเข้าร่วมจะไม่ถูกนับเป็น 0
    const studentOverallScores: number[] = [];

    for (const studentId of studentIds) {
      const assessedSkills = ALL_SKILLS.filter(
        (skillName) =>
          (studentSkillActivityMap[studentId]?.[skillName] || 0) > 0
      );

      if (assessedSkills.length === 0) continue;

      const studentOverall = round2(
        assessedSkills.reduce(
          (sum, skillName) =>
            sum + studentSkillPercentMap[studentId][skillName],
          0
        ) / assessedSkills.length
      );

      studentOverallScores.push(studentOverall);
    }

    // Overall ของ Staff = เฉลี่ยเฉพาะนิสิตที่มีผลการประเมินแล้ว
    const averageOverallScore =
      studentOverallScores.length > 0
        ? round2(
            studentOverallScores.reduce((sum, score) => sum + score, 0) /
              studentOverallScores.length
          )
        : 0;

    // 7. แยกประเภททักษะ
    const facultySkills = allSkillAverages.filter((skill) =>
      FACULTY_SKILL_NAMES.some((name) => skill.skillName.includes(name))
    );

    const essentialSkills = allSkillAverages.filter(
      (skill) =>
        !FACULTY_SKILL_NAMES.some((name) =>
          skill.skillName.includes(name)
        )
    );

    // 8. Radar Chart
    const radarData = allSkillAverages.map((skill) => ({
      skill: skill.skillName,
      score: skill.average,
    }));

    return NextResponse.json({
      academicYear,
      academicYears,
      totalStudents,
      activeActivities,
      pastActivities,
      averageOverallScore,
      facultySkills,
      essentialSkills,
      radarData,
    });
  } catch (error) {
    console.error("GET /api/staff/dashboard error:", error);
    return jsonError(error);
  }
}
