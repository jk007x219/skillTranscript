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
    // 4. ดึงคะแนนแต่ละทักษะของแต่ละนิสิต
    //
    // ใช้สูตรเดียวกับ Student Dashboard:
    //
    // SUM(earnedScore)
    // ---------------- × 100
    // SUM(maxScore)
    //
    // สำคัญ:
    // ต้องรวม earnedScore และ maxScore ก่อน
    // แล้วจึงคำนวณเปอร์เซ็นต์
    // =========================================================
    const [skillScoreRows] = await pool.query<SkillScoreRow[]>(
      `
      SELECT
        ps.skillName,
        p.studentId,
        SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
        SUM(COALESCE(ps.maxScore, 0)) AS totalMax
      FROM participation_skill ps
      INNER JOIN participation p
        ON p.ParticipationId = ps.participationId
      WHERE p.status = 'completed'
        AND p.studentId IN (${placeholders})
      GROUP BY
        p.studentId,
        ps.skillName
      `,
      studentIds
    );

    // =========================================================
    // 5. Map คะแนน
    //
    // studentSkillPercentMap[studentId][skillName] = percent
    // =========================================================
    const studentSkillPercentMap: Record<
      string,
      Record<string, number>
    > = {};

    // เตรียมข้อมูลนิสิตทุกคน
    studentIds.forEach((studentId) => {
      studentSkillPercentMap[studentId] = {};
    });

    skillScoreRows.forEach((row) => {
      const studentId = String(row.studentId);
      const skillName = String(row.skillName);

      const earned = Number(row.totalEarned) || 0;
      const max = Number(row.totalMax) || 0;

      const percent =
        max > 0
          ? round2((earned / max) * 100)
          : 0;

      if (!studentSkillPercentMap[studentId]) {
        studentSkillPercentMap[studentId] = {};
      }

      studentSkillPercentMap[studentId][skillName] = percent;
    });

    // =========================================================
    // 6. ค่าเฉลี่ยของแต่ละทักษะ
    //
    // สำคัญ:
    // ต้องเฉลี่ย "นิสิตทั้งหมดในกลุ่ม"
    //
    // ถ้านิสิตไม่มีคะแนนทักษะนั้น -> 0
    //
    // เช่น:
    // นิสิต A = 100%
    // นิสิต B = 50%
    // นิสิต C = ไม่มีคะแนน = 0%
    //
    // ค่าเฉลี่ย = (100 + 50 + 0) / 3 = 50%
    // =========================================================
    const allSkillAverages = ALL_SKILLS.map((skillName) => {
      let totalPercent = 0;

      studentIds.forEach((studentId) => {
        const percent =
          studentSkillPercentMap[studentId]?.[skillName] ?? 0;

        totalPercent += percent;
      });

      const average =
        studentIds.length > 0
          ? round2(totalPercent / studentIds.length)
          : 0;

      return {
        skillName,
        average,
      };
    });

    // =========================================================
    // 7. ค่าเฉลี่ย Overall ของนิสิต
    //
    // Student Dashboard:
    //
    // overallPercent =
    // average ของ percent ทั้ง 11 ทักษะ
    //
    // สำหรับ Staff:
    // คำนวณ Overall ของนิสิตแต่ละคนก่อน
    // แล้วนำ Overall ของนิสิตทั้งหมดมาเฉลี่ย
    //
    // เพื่อให้นิสิตทุกคนมีน้ำหนักเท่ากัน
    // =========================================================
    let overallScoreSum = 0;

    studentIds.forEach((studentId) => {
      let studentSkillTotal = 0;

      ALL_SKILLS.forEach((skillName) => {
        studentSkillTotal +=
          studentSkillPercentMap[studentId]?.[skillName] ?? 0;
      });

      const studentOverall =
        ALL_SKILLS.length > 0
          ? studentSkillTotal / ALL_SKILLS.length
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