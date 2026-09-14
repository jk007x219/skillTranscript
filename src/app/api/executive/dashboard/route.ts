import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

// ======================================================
// ทักษะที่นิสิตคณะวิทยาศาสตร์และนวัตกรรมดิจิทัลต้องมี
// ======================================================
const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

// ======================================================
// ทักษะทั้งหมด 11 ทักษะ
// ======================================================
const ALL_SKILL_NAMES = [
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

type StudentRow = RowDataPacket & {
  studentId: string;
  firstname: string | null;
  lastname: string | null;
  admissionYear: number | null;
  program: string | null;
  major: string | null;
};

type SkillRow = RowDataPacket & {
  skillId: string;
  skillname: string;
};

type ParticipationSkillRow = RowDataPacket & {
  studentId: string;
  skillName: string;
  earned: number | string | null;
  maxScore: number | string | null;
};

type ParticipationRow = RowDataPacket & {
  studentId: string;
  participationId: string;
  activityId: string;
  hours: number | string | null;
  term: string | null;
  activityYear: number | null;
};

type TermParticipationRow = RowDataPacket & {
  studentId: string;
  participationId: string;
  activityId: string;
  term: string | null;
  activityYear: number | null;
  skillName: string;
  earned: number | string | null;
  maxScore: number | string | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function getLevel(score: number) {
  if (score >= 80) return "ดีมาก";
  if (score >= 50) return "ปานกลาง";
  return "ต้องปรับปรุง";
}

function isFacultySkill(skillName: string) {
  return FACULTY_SKILL_NAMES.some((name) => skillName.includes(name));
}

function normalizeSkillName(skillName: string) {
  return skillName
    .replace(/^ทักษะ/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSkillPercent(
  earned: number,
  maxScore: number
): number {
  if (maxScore <= 0) return 0;

  return round2((earned / maxScore) * 100);
}

function createEmptySkillMap(skillNames: string[]) {
  const map = new Map<
    string,
    {
      earned: number;
      max: number;
    }
  >();

  for (const skill of skillNames) {
    map.set(normalizeSkillName(skill), {
      earned: 0,
      max: 0,
    });
  }

  return map;
}

// ======================================================
// GET /api/executive/dashboard
//
// Query:
// ?academicYear=2569
// ?term=1
// ?program=วิทยาการคอมพิวเตอร์
// ?major=...
// ======================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const academicYear = searchParams.get("academicYear") || "all";
    const term = searchParams.get("term") || "all";
    const program = searchParams.get("program") || "all";
    const major = searchParams.get("major") || "all";

    // ======================================================
    // 1. ดึงรายชื่อนิสิตตามตัวกรอง
    // ======================================================

    const studentConditions: string[] = [];
    const studentParams: any[] = [];

    if (academicYear !== "all") {
      studentConditions.push("s.admissionYear = ?");
      studentParams.push(Number(academicYear));
    }

    if (program !== "all") {
      studentConditions.push("s.program = ?");
      studentParams.push(program);
    }

    if (major !== "all") {
      studentConditions.push("s.major = ?");
      studentParams.push(major);
    }

    const studentWhere =
      studentConditions.length > 0
        ? `WHERE ${studentConditions.join(" AND ")}`
        : "";

    const [studentsResult] = await pool.query<StudentRow[]>(
      `
      SELECT
        s.studentId,
        s.firstname,
        s.lastname,
        s.admissionYear,
        s.program,
        s.major
      FROM students s
      ${studentWhere}
      ORDER BY s.studentId
      `,
      studentParams
    );

    const students = studentsResult;

    const studentIds = students.map((student) => student.studentId);

    // ======================================================
    // 2. ดึงรายการทักษะทั้งหมด
    // ======================================================

    const [skillsResult] = await pool.query<SkillRow[]>(
      `
      SELECT
        skillId,
        skillname
      FROM skill
      ORDER BY skillId
      `
    );

    const dbSkills =
      skillsResult.length > 0
        ? skillsResult.map((row) => row.skillname)
        : ALL_SKILL_NAMES;

    // ป้องกันกรณีฐานข้อมูลไม่มีข้อมูล skill
    const skillNames =
      dbSkills.length > 0 ? dbSkills : ALL_SKILL_NAMES;

    // ======================================================
    // 3. ถ้าไม่มีนิสิต
    // ======================================================

    if (studentIds.length === 0) {
      const [academicYearsResult] = await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT admissionYear
        FROM students
        WHERE admissionYear IS NOT NULL
        ORDER BY admissionYear DESC
        `
      );

      const [programsResult] = await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT program
        FROM students
        WHERE program IS NOT NULL
          AND TRIM(program) <> ''
        ORDER BY program
        `
      );

      const [majorsResult] = await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT major
        FROM students
        WHERE major IS NOT NULL
          AND TRIM(major) <> ''
        ORDER BY major
        `
      );

      return NextResponse.json({
        academicYear,
        term,
        program,
        major,

        academicYears: academicYearsResult
          .map((row) => Number(row.admissionYear))
          .filter((year) => Number.isFinite(year)),

        terms: ["1", "2", "3"],

        programs: programsResult
          .map((row) => String(row.program))
          .filter(Boolean),

        majors: majorsResult
          .map((row) => String(row.major))
          .filter(Boolean),

        totalStudents: 0,
        totalActivities: 0,
        averageOverallScore: 0,

        levelDistribution: [
          { level: "ดีมาก", count: 0, percent: 0 },
          { level: "ปานกลาง", count: 0, percent: 0 },
          { level: "ต้องปรับปรุง", count: 0, percent: 0 },
        ],

        radarData: skillNames.map((skillName) => ({
          skill: skillName,
          score: 0,
        })),

        facultySkills: [],
        essentialSkills: [],
        termSummary: [],
      });
    }

    // ======================================================
    // 4. สร้าง IN (?, ?, ?)
    // ======================================================

    const placeholders = studentIds.map(() => "?").join(",");

    // ======================================================
    // 5. ดึง participation + activity
    //
    // ใช้ completed เท่านั้น
    // ======================================================

    const participationConditions = [
      `p.status = 'completed'`,
      `p.studentId IN (${placeholders})`,
    ];

    const participationParams: any[] = [...studentIds];

    if (term !== "all") {
      participationConditions.push("a.term = ?");
      participationParams.push(term);
    }

    const [participationsResult] = await pool.query<
      ParticipationRow[]
    >(
      `
      SELECT
        p.studentId,
        p.ParticipationId AS participationId,
        p.activityId,
        p.hours,
        a.term,
        YEAR(a.date) + 543 AS activityYear
      FROM participation p
      INNER JOIN activity a
        ON a.activityId = p.activityId
      WHERE ${participationConditions.join(" AND ")}
      `,
      participationParams
    );

    // ======================================================
    // 6. ดึงคะแนน participation_skill
    //
    // คะแนนจริงมาจาก:
    //
    // SUM(earnedScore) / SUM(maxScore) × 100
    //
    // ไม่ใช้ participation.score
    // ======================================================

    const [skillScoresResult] = await pool.query<
      ParticipationSkillRow[]
    >(
      `
      SELECT
        p.studentId,
        ps.skillName,
        SUM(COALESCE(ps.earnedScore, 0)) AS earned,
        SUM(COALESCE(ps.maxScore, 0)) AS maxScore
      FROM participation p
      INNER JOIN participation_skill ps
        ON ps.participationId = p.ParticipationId
      WHERE
        p.status = 'completed'
        AND p.studentId IN (${placeholders})
      GROUP BY
        p.studentId,
        ps.skillName
      `,
      studentIds
    );

    // ======================================================
    // 7. สร้างคะแนนต่อทักษะของนิสิต
    //
    // ถ้ามี filter ภาคการศึกษา
    // ต้องคำนวณเฉพาะ participation ของภาคนั้น
    // ======================================================

    let filteredSkillScores = skillScoresResult;

    if (term !== "all") {
      const filteredParticipationIds = new Set(
        participationsResult.map(
          (row) => row.participationId
        )
      );

      if (filteredParticipationIds.size === 0) {
        filteredSkillScores = [];
      } else {
        const filteredPlaceholders = Array.from(
          filteredParticipationIds
        )
          .map(() => "?")
          .join(",");

        const [termSkillResult] = await pool.query<
          ParticipationSkillRow[]
        >(
          `
          SELECT
            p.studentId,
            ps.skillName,
            SUM(COALESCE(ps.earnedScore, 0)) AS earned,
            SUM(COALESCE(ps.maxScore, 0)) AS maxScore
          FROM participation p
          INNER JOIN participation_skill ps
            ON ps.participationId = p.ParticipationId
          WHERE
            p.status = 'completed'
            AND p.ParticipationId IN (${filteredPlaceholders})
          GROUP BY
            p.studentId,
            ps.skillName
          `,
          Array.from(filteredParticipationIds)
        );

        filteredSkillScores = termSkillResult;
      }
    }

    // ======================================================
    // 8. สร้าง Map:
    //
    // studentId
    //   -> skillName
    //      -> earned/max
    // ======================================================

    const studentSkillMap = new Map<
      string,
      Map<string, { earned: number; max: number }>
    >();

    for (const studentId of studentIds) {
      studentSkillMap.set(
        studentId,
        createEmptySkillMap(skillNames)
      );
    }

    for (const row of filteredSkillScores) {
      const studentMap = studentSkillMap.get(row.studentId);

      if (!studentMap) continue;

      const normalizedName = normalizeSkillName(
        row.skillName
      );

      const current = studentMap.get(normalizedName);

      if (current) {
        current.earned += Number(row.earned || 0);
        current.max += Number(row.maxScore || 0);
      } else {
        studentMap.set(normalizedName, {
          earned: Number(row.earned || 0),
          max: Number(row.maxScore || 0),
        });
      }
    }

    // ======================================================
    // 9. คำนวณคะแนน 11 ทักษะของนิสิตแต่ละคน
    //
    // ตัวอย่าง:
    // 75,75,75,0,0,0,0,0,0,0,0
    //
    // = 20.45%
    // ======================================================

    const studentOverallScores = new Map<
      string,
      number
    >();

    for (const studentId of studentIds) {
      const studentMap =
        studentSkillMap.get(studentId) ??
        createEmptySkillMap(skillNames);

      const skillPercentages = skillNames.map(
        (skillName) => {
          const normalizedName =
            normalizeSkillName(skillName);

          const score =
            studentMap.get(normalizedName);

          if (!score || score.max <= 0) {
            return 0;
          }

          return calculateSkillPercent(
            score.earned,
            score.max
          );
        }
      );

      const overall =
        skillPercentages.length > 0
          ? skillPercentages.reduce(
              (sum, value) => sum + value,
              0
            ) / skillPercentages.length
          : 0;

      studentOverallScores.set(
        studentId,
        round2(overall)
      );
    }

    // ======================================================
    // 10. คะแนนเฉลี่ยระดับคณะ
    //
    // ค่าเฉลี่ยคะแนนรวมของนิสิตทุกคน
    // ======================================================

    const overallValues = Array.from(
      studentOverallScores.values()
    );

    const averageOverallScore =
      overallValues.length > 0
        ? round2(
            overallValues.reduce(
              (sum, value) => sum + value,
              0
            ) / overallValues.length
          )
        : 0;

    // ======================================================
    // 11. ค่าเฉลี่ยแต่ละทักษะ
    //
    // นิสิตที่ไม่มีคะแนน = 0
    // ======================================================

    const allSkillAverages = skillNames.map(
      (skillName) => {
        const normalizedName =
          normalizeSkillName(skillName);

        let total = 0;

        for (const studentId of studentIds) {
          const studentMap =
            studentSkillMap.get(studentId);

          const score =
            studentMap?.get(normalizedName);

          if (!score || score.max <= 0) {
            total += 0;
          } else {
            total += calculateSkillPercent(
              score.earned,
              score.max
            );
          }
        }

        const average =
          studentIds.length > 0
            ? total / studentIds.length
            : 0;

        return {
          skillName,
          average: round2(average),
        };
      }
    );

    // ======================================================
    // 12. Radar
    // ======================================================

    const radarData = allSkillAverages.map(
      (skill) => ({
        skill: skill.skillName,
        score: skill.average,
      })
    );

    // ======================================================
    // 13. แยก Faculty Skills / Essential Skills
    // ======================================================

    const facultySkills =
      allSkillAverages.filter((skill) =>
        isFacultySkill(skill.skillName)
      );

    const essentialSkills =
      allSkillAverages.filter(
        (skill) =>
          !isFacultySkill(skill.skillName)
      );

    // ======================================================
    // 14. ระดับทักษะของนิสิต
    // ======================================================

    let excellent = 0;
    let medium = 0;
    let poor = 0;

    for (const score of overallValues) {
      if (score >= 80) {
        excellent++;
      } else if (score >= 50) {
        medium++;
      } else {
        poor++;
      }
    }

    const totalForLevel = studentIds.length;

    const levelDistribution = [
      {
        level: "ดีมาก",
        count: excellent,
        percent:
          totalForLevel > 0
            ? Math.round(
                (excellent / totalForLevel) * 100
              )
            : 0,
      },
      {
        level: "ปานกลาง",
        count: medium,
        percent:
          totalForLevel > 0
            ? Math.round(
                (medium / totalForLevel) * 100
              )
            : 0,
      },
      {
        level: "ต้องปรับปรุง",
        count: poor,
        percent:
          totalForLevel > 0
            ? Math.round(
                (poor / totalForLevel) * 100
              )
            : 0,
      },
    ];

    // ======================================================
    // 15. จำนวนกิจกรรม
    //
    // นับกิจกรรมที่นิสิตกลุ่มที่เลือกเข้าร่วมจริง
    // ======================================================

    const totalActivities =
      new Set(
        participationsResult.map(
          (row) => row.activityId
        )
      ).size;

    // ======================================================
    // 16. รายการปีการศึกษา
    // ======================================================

    const [academicYearsResult] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT admissionYear
        FROM students
        WHERE admissionYear IS NOT NULL
        ORDER BY admissionYear DESC
        `
      );

    const academicYears =
      academicYearsResult
        .map((row) => Number(row.admissionYear))
        .filter((year) => Number.isFinite(year));

    // ======================================================
    // 17. รายการหลักสูตร
    // ======================================================

    const [programsResult] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT program
        FROM students
        WHERE program IS NOT NULL
          AND TRIM(program) <> ''
        ORDER BY program
        `
      );

    const programs =
      programsResult
        .map((row) => String(row.program))
        .filter(Boolean);

    // ======================================================
    // 18. รายการวิชาเอก
    // ======================================================

    const [majorsResult] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT major
        FROM students
        WHERE major IS NOT NULL
          AND TRIM(major) <> ''
        ORDER BY major
        `
      );

    const majors =
      majorsResult
        .map((row) => String(row.major))
        .filter(Boolean);

    // ======================================================
    // 19. รายการภาคการศึกษา
    // ======================================================

    const [termsResult] =
      await pool.query<RowDataPacket[]>(
        `
        SELECT DISTINCT term
        FROM activity
        WHERE term IS NOT NULL
          AND TRIM(term) <> ''
        ORDER BY term
        `
      );

    const terms =
      termsResult
        .map((row) => String(row.term))
        .filter(Boolean);

    // ======================================================
    // 20. สถิติตามภาคการศึกษา / ปีการศึกษา
    //
    // ใช้สูตรคะแนนเดียวกัน
    // ======================================================

    const [termRows] =
      await pool.query<TermParticipationRow[]>(
        `
        SELECT
          p.studentId,
          p.ParticipationId AS participationId,
          p.activityId,
          a.term,
          YEAR(a.date) + 543 AS activityYear,
          ps.skillName,
          SUM(COALESCE(ps.earnedScore, 0)) AS earned,
          SUM(COALESCE(ps.maxScore, 0)) AS maxScore
        FROM participation p
        INNER JOIN activity a
          ON a.activityId = p.activityId
        INNER JOIN participation_skill ps
          ON ps.participationId = p.ParticipationId
        WHERE
          p.status = 'completed'
          AND p.studentId IN (${placeholders})
          AND a.term IS NOT NULL
          AND a.date IS NOT NULL
        GROUP BY
          p.studentId,
          p.ParticipationId,
          p.activityId,
          a.term,
          YEAR(a.date),
          ps.skillName
        ORDER BY
          YEAR(a.date) DESC,
          a.term DESC
        `,
        studentIds
      );

    // ======================================================
    // สร้างกลุ่ม term/year
    // ======================================================

    const termGroups = new Map<
      string,
      {
        term: string;
        year: number;
        studentSkills: Map<
          string,
          Map<string, { earned: number; max: number }>
        >;
        students: Set<string>;
        activities: Set<string>;
      }
    >();

    for (const row of termRows) {
      const rowTerm = String(row.term);
      const rowYear = Number(row.activityYear);

      const key = `${rowTerm}/${rowYear}`;

      if (!termGroups.has(key)) {
        termGroups.set(key, {
          term: rowTerm,
          year: rowYear,
          studentSkills: new Map(),
          students: new Set(),
          activities: new Set(),
        });
      }

      const group = termGroups.get(key)!;

      group.students.add(row.studentId);
      group.activities.add(row.activityId);

      if (!group.studentSkills.has(row.studentId)) {
        group.studentSkills.set(
          row.studentId,
          createEmptySkillMap(skillNames)
        );
      }

      const studentMap =
        group.studentSkills.get(row.studentId)!;

      const normalizedName =
        normalizeSkillName(row.skillName);

      if (!studentMap.has(normalizedName)) {
        studentMap.set(normalizedName, {
          earned: 0,
          max: 0,
        });
      }

      const score =
        studentMap.get(normalizedName)!;

      score.earned += Number(row.earned || 0);
      score.max += Number(row.maxScore || 0);
    }

    // ======================================================
    // สร้าง termSummary
    // ======================================================

    const termSummary = Array.from(
      termGroups.values()
    )
      .sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }

        return b.term.localeCompare(a.term, "th");
      })
      .map((group) => {
        const groupStudentScores: number[] = [];

        for (const studentId of group.students) {
          const studentMap =
            group.studentSkills.get(studentId) ??
            createEmptySkillMap(skillNames);

          const percentages =
            skillNames.map((skillName) => {
              const normalizedName =
                normalizeSkillName(skillName);

              const score =
                studentMap.get(normalizedName);

              if (!score || score.max <= 0) {
                return 0;
              }

              return calculateSkillPercent(
                score.earned,
                score.max
              );
            });

          const overall =
            percentages.length > 0
              ? percentages.reduce(
                  (sum, value) => sum + value,
                  0
                ) / percentages.length
              : 0;

          groupStudentScores.push(
            round2(overall)
          );
        }

        const avgScore =
          groupStudentScores.length > 0
            ? round2(
                groupStudentScores.reduce(
                  (sum, value) => sum + value,
                  0
                ) /
                  groupStudentScores.length
              )
            : 0;

        return {
          term: `ภาค ${group.term}/${group.year}`,
          avgScore,
          studentCount: group.students.size,
          activityCount: group.activities.size,
          level: getLevel(avgScore),
        };
      });

    // ======================================================
    // 21. ส่งผลลัพธ์
    // ======================================================

    return NextResponse.json({
      academicYear,
      term,
      program,
      major,

      academicYears,
      terms,
      programs,
      majors,

      totalStudents: studentIds.length,
      totalActivities,

      averageOverallScore,

      levelDistribution,

      radarData,

      facultySkills,

      essentialSkills,

      termSummary,
    });
  } catch (error) {
    console.error(
      "Executive dashboard error:",
      error
    );

    return jsonError(error);
  }
}