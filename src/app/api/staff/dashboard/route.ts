// app/api/staff/dashboard/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

// =========================================================
// รายชื่อทักษะทั้งหมด 11 ทักษะ
// ต้องเรียงให้เหมือน Student Dashboard
// =========================================================
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

// =========================================================
// ทักษะเฉพาะของคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
// =========================================================
const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

type StudentRow = RowDataPacket & {
  studentId: string;
};

type AcademicYearRow = RowDataPacket & {
  admissionYear: number;
};

type SkillScoreRow = RowDataPacket & {
  skillName: string;
  studentId: string;
  totalEarned: number | string;
  totalMax: number | string;
};

type StudentOverallRow = RowDataPacket & {
  studentId: string;
  totalEarned: number | string;
  totalMax: number | string;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // =========================================================
    // รับปีการศึกษาจาก query
    //
    // /api/staff/dashboard
    // /api/staff/dashboard?academicYear=all
    // /api/staff/dashboard?academicYear=2567
    // =========================================================
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
          {
            message: "ปีการศึกษาไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      academicYear = parsedYear;
    }

    // =========================================================
    // 1. ดึงรายการปีการศึกษาที่มีอยู่จริง
    // =========================================================
    const [academicYearRows] = await pool.query<AcademicYearRow[]>(
      `
      SELECT DISTINCT admissionYear
      FROM students
      WHERE admissionYear IS NOT NULL
      ORDER BY admissionYear DESC
      `
    );

    const academicYears = academicYearRows
      .map((row) => Number(row.admissionYear))
      .filter((year) => Number.isInteger(year));

    // =========================================================
    // 2. ดึงนิสิตตามปีการศึกษา
    //
    // ถ้าเลือก all -> นิสิตทั้งหมด
    // ถ้าเลือกปี -> admissionYear ตรงกับปีที่เลือก
    // =========================================================
    let studentQuery = `
      SELECT studentId
      FROM students
    `;

    const studentParams: number[] = [];

    if (academicYear !== null) {
      studentQuery += `
        WHERE admissionYear = ?
      `;
      studentParams.push(academicYear);
    }

    const [studentRows] = await pool.query<StudentRow[]>(
      studentQuery,
      studentParams
    );

    const studentIds = studentRows.map((row) => String(row.studentId));

    const totalStudents = studentIds.length;

    // =========================================================
    // ถ้าไม่มีนิสิตในปีที่เลือก
    // ยังต้องส่งโครงสร้างข้อมูลกลับไปให้หน้าเว็บ
    // =========================================================
    if (studentIds.length === 0) {
      const emptySkills = ALL_SKILLS.map((skillName) => ({
        skillName,
        average: 0,
      }));

      const facultySkills = emptySkills.filter((skill) =>
        FACULTY_SKILL_NAMES.some((name) =>
          skill.skillName.includes(name)
        )
      );

      const essentialSkills = emptySkills.filter(
        (skill) =>
          !FACULTY_SKILL_NAMES.some((name) =>
            skill.skillName.includes(name)
          )
      );

      const radarData = emptySkills.map((skill) => ({
        skill: skill.skillName,
        score: skill.average,
      }));

      // จำนวนกิจกรรมยังเป็นของระบบทั้งหมด
      const [activeActivitiesResult] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS total
        FROM activity
        WHERE status = 'active'
        `
      );

      const [pastActivitiesResult] = await pool.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS total
        FROM activity
        WHERE status = 'past'
        `
      );

      return NextResponse.json({
        academicYear,
        academicYears,
        totalStudents: 0,
        activeActivities: Number(
          activeActivitiesResult[0]?.total || 0
        ),
        pastActivities: Number(
          pastActivitiesResult[0]?.total || 0
        ),
        averageOverallScore: 0,
        facultySkills,
        essentialSkills,
        radarData,
      });
    }

    // =========================================================
    // สร้าง placeholders สำหรับ IN (?, ?, ?, ...)
    // =========================================================
    const placeholders = studentIds.map(() => "?").join(",");

    // =========================================================
    // 3. จำนวนกิจกรรม
    //
    // กิจกรรมเป็นข้อมูลของระบบ ไม่ได้ขึ้นกับ admissionYear
    // =========================================================
    const [activeActivitiesResult] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM activity
      WHERE status = 'active'
      `
    );

    const [pastActivitiesResult] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM activity
      WHERE status = 'past'
      `
    );

    const activeActivities = Number(
      activeActivitiesResult[0]?.total || 0
    );

    const pastActivities = Number(
      pastActivitiesResult[0]?.total || 0
    );

    // =========================================================
    // 4-7. คำนวณคะแนนให้ตรงกับ Student Dashboard
    //
    // คำนวณรายนิสิต -> รายทักษะ -> รายระดับ ก่อน
    // แล้วจึงเฉลี่ยคะแนนของนิสิตในปีการศึกษาที่เลือก
    // =========================================================
    type LevelScore = {
      activityCount: number;
      earned: number;
      max: number;
    };

    type StudentSkillLevels = Record<string, Record<string, LevelScore>>;
    const studentSkillLevelMap: Record<string, StudentSkillLevels> = {};

    studentIds.forEach((studentId) => {
      studentSkillLevelMap[studentId] = {};
    });

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

    function normalizeLevel(level: string) {
      const value = level.trim().toLowerCase();

      if (
        value.includes('สูง') ||
        value.includes('advanced') ||
        value.includes('high') ||
        value === '3'
      ) return 'สูง';

      if (
        value.includes('กลาง') ||
        value.includes('intermediate') ||
        value.includes('medium') ||
        value.includes('mid') ||
        value === '2'
      ) return 'กลาง';

      return 'พื้นฐาน';
    }

    skillScoreRows.forEach((row) => {
      const studentId = String(row.studentId);
      const skillName = String(row.skillName);
      const level = normalizeLevel(String(row.skillLevel || 'พื้นฐาน'));

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
    });

    // คะแนนทักษะของนิสิตแต่ละคน ใช้สูตรเดียวกับ Student Dashboard
    const studentSkillPercentMap: Record<string, Record<string, number>> = {};

    studentIds.forEach((studentId) => {
      studentSkillPercentMap[studentId] = {};

      ALL_SKILLS.forEach((skillName) => {
        const levels = studentSkillLevelMap[studentId]?.[skillName] || {};
        const basic = levels['พื้นฐาน'] || { activityCount: 0, earned: 0, max: 0 };
        const intermediate = levels['กลาง'] || { activityCount: 0, earned: 0, max: 0 };
        const advanced = levels['สูง'] || { activityCount: 0, earned: 0, max: 0 };

        const totalActivities =
          basic.activityCount +
          intermediate.activityCount +
          advanced.activityCount;

        const levelPercent = (item: LevelScore) =>
          item.max > 0
            ? Math.min(100, Math.max(0, round2((item.earned / item.max) * 100)))
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

    // ค่าเฉลี่ยแต่ละทักษะ = ค่าเฉลี่ยคะแนนของนิสิตทุกคนในปีที่เลือก
    const allSkillAverages = ALL_SKILLS.map((skillName) => {
      const totalPercent = studentIds.reduce(
        (sum, studentId) =>
          sum + (studentSkillPercentMap[studentId]?.[skillName] ?? 0),
        0
      );

      return {
        skillName,
        average:
          studentIds.length > 0
            ? round2(totalPercent / studentIds.length)
            : 0,
      };
    });

    // Overall = ค่าเฉลี่ย 11 ทักษะของนิสิตแต่ละคน
    // แล้วจึงเฉลี่ย Overall ของนิสิตในกลุ่มที่เลือก
    let overallScoreSum = 0;

    studentIds.forEach((studentId) => {
      const studentOverall =
        ALL_SKILLS.length > 0
          ? round2(
              ALL_SKILLS.reduce(
                (sum, skillName) =>
                  sum + (studentSkillPercentMap[studentId]?.[skillName] ?? 0),
                0
              ) / ALL_SKILLS.length
            )
          : 0;

      overallScoreSum += studentOverall;
    });

    const averageOverallScore =
      studentIds.length > 0
        ? round2(overallScoreSum / studentIds.length)
        : 0;

    // =========================================================
    // 8. แยก Faculty Skills / Essential Skills
    // =========================================================
    const facultySkills = allSkillAverages.filter((skill) =>
      FACULTY_SKILL_NAMES.some((name) =>
        skill.skillName.includes(name)
      )
    );

    const essentialSkills = allSkillAverages.filter(
      (skill) =>
        !FACULTY_SKILL_NAMES.some((name) =>
          skill.skillName.includes(name)
        )
    );

    // =========================================================
    // 9. Radar Chart
    // =========================================================
    const radarData = allSkillAverages.map((skill) => ({
      skill: skill.skillName,
      score: skill.average,
    }));

    // =========================================================
    // 10. ส่งข้อมูลกลับ
    // =========================================================
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