import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

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

type SkillRow = RowDataPacket & { skillname: string };
type ScoreRow = RowDataPacket & {
  studentId: string;
  skillName: string;
  earned: number | string | null;
  maxScore: number | string | null;
  activityCount: number | string | null;
};
type ActivityRow = RowDataPacket & {
  activityId: string;
  term: string | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeSkillName(skillName: string) {
  return skillName.replace(/^ทักษะ/, "").replace(/\s+/g, " ").trim();
}

function isFacultySkill(skillName: string) {
  return FACULTY_SKILL_NAMES.some((name) => skillName.includes(name));
}

function calculateSkillPercent(earned: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.min(100, Math.max(0, round2((earned / maxScore) * 100)));
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const academicYear = params.get("academicYear") || "all";
    const term = params.get("term") || "all";
    const program = params.get("program") || "all";
    const major = params.get("major") || "all";

    // ======================================================
    // 1. นิสิตตามตัวกรองของผู้บริหาร
    // ======================================================
    const studentConditions: string[] = [];
    const studentParams: (string | number)[] = [];

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

    const studentWhere = studentConditions.length
      ? `WHERE ${studentConditions.join(" AND ")}`
      : "";

    const [students] = await pool.query<StudentRow[]>(
      `
      SELECT studentId, firstname, lastname, admissionYear, program, major
      FROM students s
      ${studentWhere}
      ORDER BY studentId
      `,
      studentParams
    );

    const studentIds = students.map((s) => String(s.studentId));

    const [academicYearsResult] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT admissionYear
      FROM students
      WHERE admissionYear IS NOT NULL
      ORDER BY admissionYear DESC
    `);
    const [programsResult] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT program
      FROM students
      WHERE program IS NOT NULL AND TRIM(program) <> ''
      ORDER BY program
    `);
    const [majorsResult] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT major
      FROM students
      WHERE major IS NOT NULL AND TRIM(major) <> ''
      ORDER BY major
    `);
    const [termsResult] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT term
      FROM activity
      WHERE term IS NOT NULL AND TRIM(term) <> ''
      ORDER BY term
    `);

    const academicYears = academicYearsResult
      .map((r) => Number(r.admissionYear))
      .filter(Number.isFinite);
    const programs = programsResult.map((r) => String(r.program)).filter(Boolean);
    const majors = majorsResult.map((r) => String(r.major)).filter(Boolean);
    const terms = termsResult.map((r) => String(r.term)).filter(Boolean);

    if (studentIds.length === 0) {
      return NextResponse.json({
        academicYear,
        term,
        program,
        major,
        academicYears,
        terms,
        programs,
        majors,
        totalStudents: 0,
        totalActivities: 0,
        averageOverallScore: 0,
        levelDistribution: [
          { level: "ดีมาก", count: 0, percent: 0 },
          { level: "ปานกลาง", count: 0, percent: 0 },
          { level: "ต้องปรับปรุง", count: 0, percent: 0 },
        ],
        radarData: ALL_SKILL_NAMES.map((skill) => ({ skill, score: 0 })),
        facultySkills: [],
        essentialSkills: [],
        termSummary: [],
      });
    }

    const placeholders = studentIds.map(() => "?").join(",");

    // ======================================================
    // 2. คะแนนจากกิจกรรมที่นิสิต "เข้าร่วม + ประเมินแล้ว" เท่านั้น
    //    ใช้สูตรเดียวกับ Staff Dashboard
    //    เพิ่มตัวกรองภาคเรียนของ Executive ได้โดยไม่เปลี่ยนสูตร
    // ======================================================
    const activityConditions = [
      `p.status = 'completed'`,
      `p.studentId IN (${placeholders})`,
    ];
    const activityParams: (string | number)[] = [...studentIds];

    if (term !== "all") {
      activityConditions.push("a.term = ?");
      activityParams.push(term);
    }

    type ScoreLevelRow = RowDataPacket & {
      studentId: string;
      skillName: string;
      skillLevel: string;
      activityCount: number | string;
      totalEarned: number | string;
      totalMax: number | string;
    };

    const [scoreRows] = await pool.query<ScoreLevelRow[]>(
      `
      SELECT
        p.studentId,
        ps.skillName,
        COALESCE(acs.level, 'พื้นฐาน') AS skillLevel,
        COUNT(DISTINCT p.activityId) AS activityCount,
        SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
        SUM(COALESCE(ps.maxScore, 0)) AS totalMax
      FROM participation p
      INNER JOIN activity a ON a.activityId = p.activityId
      INNER JOIN participation_skill ps
        ON ps.participationId = p.ParticipationId
      LEFT JOIN activityskill acs
        ON acs.activityId = p.activityId
       AND acs.skillname = ps.skillName
      WHERE ${activityConditions.join(" AND ")}
      GROUP BY
        p.studentId,
        ps.skillName,
        COALESCE(acs.level, 'พื้นฐาน')
      `,
      activityParams
    );

    type LevelScore = {
      activityCount: number;
      earned: number;
      max: number;
    };

    type StudentSkillLevels = Record<
      string,
      Record<string, LevelScore>
    >;

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

    const studentSkillLevelMap: Record<
      string,
      StudentSkillLevels
    > = {};

    studentIds.forEach((studentId) => {
      studentSkillLevelMap[studentId] = {};
    });

    for (const row of scoreRows) {
      const studentId = String(row.studentId);
      const skillName = String(row.skillName);
      const level = normalizeLevel(
        String(row.skillLevel || "พื้นฐาน")
      );

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

      current.activityCount +=
        Number(row.activityCount) || 0;
      current.earned +=
        Number(row.totalEarned) || 0;
      current.max +=
        Number(row.totalMax) || 0;

      studentSkillLevelMap[studentId][skillName][level] =
        current;
    }

    // ======================================================
    // 3. คะแนนทักษะรายนิสิต
    // สูตรเดียวกับ Staff Dashboard:
    // แต่ละระดับคำนวณเปอร์เซ็นต์ก่อน
    // แล้วถ่วงน้ำหนักด้วยจำนวนกิจกรรมของระดับนั้น
    // ======================================================
    const studentSkillPercentMap: Record<
      string,
      Record<string, number>
    > = {};

    const studentSkillActivityMap: Record<
      string,
      Record<string, number>
    > = {};

    studentIds.forEach((studentId) => {
      studentSkillPercentMap[studentId] = {};
      studentSkillActivityMap[studentId] = {};

      ALL_SKILL_NAMES.forEach((skillName) => {
        const levels =
          studentSkillLevelMap[studentId]?.[skillName] || {};

        const basic =
          levels["พื้นฐาน"] || {
            activityCount: 0,
            earned: 0,
            max: 0,
          };

        const intermediate =
          levels["กลาง"] || {
            activityCount: 0,
            earned: 0,
            max: 0,
          };

        const advanced =
          levels["สูง"] || {
            activityCount: 0,
            earned: 0,
            max: 0,
          };

        const totalActivities =
          basic.activityCount +
          intermediate.activityCount +
          advanced.activityCount;

        studentSkillActivityMap[studentId][skillName] =
          totalActivities;

        const levelPercent = (item: LevelScore) =>
          item.max > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  round2(
                    (item.earned / item.max) * 100
                  )
                )
              )
            : 0;

        const basicPercent = levelPercent(basic);
        const intermediatePercent =
          levelPercent(intermediate);
        const advancedPercent =
          levelPercent(advanced);

        const percent =
          totalActivities > 0
            ? round2(
                (
                  basicPercent *
                    basic.activityCount +
                  intermediatePercent *
                    intermediate.activityCount +
                  advancedPercent *
                    advanced.activityCount
                ) / totalActivities
              )
            : 0;

        studentSkillPercentMap[studentId][skillName] =
          percent;
      });
    });

    // ======================================================
    // 4. ค่าเฉลี่ยรายทักษะ
    // ไม่เอานิสิตที่ยังไม่มีผลประเมินทักษะนั้นมานับเป็น 0
    // ======================================================
    const allSkillAverages = ALL_SKILL_NAMES.map(
      (skillName) => {
        const participatingStudents =
          studentIds.filter(
            (studentId) =>
              (
                studentSkillActivityMap[
                  studentId
                ]?.[skillName] || 0
              ) > 0
          );

        const average =
          participatingStudents.length > 0
            ? round2(
                participatingStudents.reduce(
                  (sum, studentId) =>
                    sum +
                    studentSkillPercentMap[
                      studentId
                    ][skillName],
                  0
                ) / participatingStudents.length
              )
            : 0;

        return {
          skillName,
          average,
        };
      }
    );

    // ======================================================
    // 5. Overall ของนิสิตแต่ละคน
    // เฉพาะทักษะที่มีผลประเมินจริงเท่านั้น
    // ======================================================
    const studentOverallScores: number[] = [];

    for (const studentId of studentIds) {
      const assessedSkills =
        ALL_SKILL_NAMES.filter(
          (skillName) =>
            (
              studentSkillActivityMap[
                studentId
              ]?.[skillName] || 0
            ) > 0
        );

      if (assessedSkills.length === 0) {
        continue;
      }

      const studentOverall = round2(
        assessedSkills.reduce(
          (sum, skillName) =>
            sum +
            studentSkillPercentMap[
              studentId
            ][skillName],
          0
        ) / assessedSkills.length
      );

      studentOverallScores.push(studentOverall);
    }

    const averageOverallScore =
      studentOverallScores.length > 0
        ? round2(
            studentOverallScores.reduce(
              (sum, score) => sum + score,
              0
            ) / studentOverallScores.length
          )
        : 0;

    // ======================================================
    // 6. Radar + แยกกลุ่มทักษะ
    // ======================================================
    const radarData = allSkillAverages.map(
      (skill) => ({
        skill: skill.skillName,
        score: skill.average,
      })
    );

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
    // 7. ระดับนิสิตจาก Overall
    // ใช้เฉพาะนิสิตที่มีผลประเมินจริง
    // ======================================================
    let excellent = 0;
    let medium = 0;
    let poor = 0;

    for (const score of studentOverallScores) {
      if (score >= 80) excellent++;
      else if (score >= 50) medium++;
      else poor++;
    }

    const assessedStudentCount =
      studentOverallScores.length;

    const levelDistribution = [
      {
        level: "ดีมาก",
        count: excellent,
        percent:
          assessedStudentCount > 0
            ? Math.round(
                (excellent /
                  assessedStudentCount) *
                  100
              )
            : 0,
      },
      {
        level: "ปานกลาง",
        count: medium,
        percent:
          assessedStudentCount > 0
            ? Math.round(
                (medium /
                  assessedStudentCount) *
                  100
              )
            : 0,
      },
      {
        level: "ต้องปรับปรุง",
        count: poor,
        percent:
          assessedStudentCount > 0
            ? Math.round(
                (poor /
                  assessedStudentCount) *
                  100
              )
            : 0,
      },
    ];

    // ======================================================
    // 8. จำนวนกิจกรรมที่กลุ่มที่เลือกเข้าร่วมจริง
    // ======================================================
    const [activityRows] =
      await pool.query<ActivityRow[]>(
        `
        SELECT DISTINCT
          a.activityId,
          a.term
        FROM participation p
        INNER JOIN activity a
          ON a.activityId = p.activityId
        WHERE p.status = 'completed'
          AND p.studentId IN (${placeholders})
          ${term !== "all" ? "AND a.term = ?" : ""}
        `,
        term !== "all"
          ? [...studentIds, term]
          : studentIds
      );

    const totalActivities =
      activityRows.length;

    // ======================================================
    // 9. สรุปตามภาคการศึกษา
    // ใช้สูตรเดียวกับคะแนนหลักของ Staff/Executive
    // โดยคำนวณแยกนิสิต + ทักษะ + ระดับ ภายในแต่ละภาค
    // ======================================================
    type TermScoreRow = RowDataPacket & {
      studentId: string;
      term: string;
      skillName: string;
      skillLevel: string;
      activityCount: number | string;
      totalEarned: number | string;
      totalMax: number | string;
    };

    const [termScoreRows] =
      await pool.query<TermScoreRow[]>(
        `
        SELECT
          p.studentId,
          a.term,
          ps.skillName,
          COALESCE(acs.level, 'พื้นฐาน') AS skillLevel,
          COUNT(DISTINCT p.activityId) AS activityCount,
          SUM(COALESCE(ps.earnedScore, 0)) AS totalEarned,
          SUM(COALESCE(ps.maxScore, 0)) AS totalMax
        FROM participation p
        INNER JOIN activity a
          ON a.activityId = p.activityId
        INNER JOIN participation_skill ps
          ON ps.participationId = p.ParticipationId
        LEFT JOIN activityskill acs
          ON acs.activityId = p.activityId
         AND acs.skillname = ps.skillName
        WHERE p.status = 'completed'
          AND p.studentId IN (${placeholders})
          AND a.term IS NOT NULL
          AND TRIM(a.term) <> ''
        GROUP BY
          p.studentId,
          a.term,
          ps.skillName,
          COALESCE(acs.level, 'พื้นฐาน')
        `,
        studentIds
      );

    const termLevelMap = new Map<
      string,
      Map<string, Map<string, LevelScore>>
    >();

    for (const row of termScoreRows) {
      const termName = String(row.term);
      const studentId = String(row.studentId);
      const skillName = String(row.skillName);
      const level = normalizeLevel(
        String(row.skillLevel || 'พื้นฐาน')
      );

      if (!termLevelMap.has(termName)) {
        termLevelMap.set(termName, new Map());
      }

      const studentMap = termLevelMap.get(termName)!;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, new Map());
      }

      const skillMap = studentMap.get(studentId)!;

      if (!skillMap.has(skillName)) {
        skillMap.set(skillName, new Map());
      }

      const levelMap = skillMap.get(skillName)!;

      const current = levelMap.get(level) || {
        activityCount: 0,
        earned: 0,
        max: 0,
      };

      current.activityCount += Number(row.activityCount) || 0;
      current.earned += Number(row.totalEarned) || 0;
      current.max += Number(row.totalMax) || 0;

      levelMap.set(level, current);
    }

    const calculateTermStudentOverall = (
      studentMap: Map<string, Map<string, LevelScore>>
    ) => {
      const skillScores: number[] = [];

      for (const skillName of ALL_SKILL_NAMES) {
        const levelMap = studentMap.get(skillName);

        if (!levelMap) continue;

        const basic = levelMap.get('พื้นฐาน') || {
          activityCount: 0,
          earned: 0,
          max: 0,
        };

        const intermediate = levelMap.get('กลาง') || {
          activityCount: 0,
          earned: 0,
          max: 0,
        };

        const advanced = levelMap.get('สูง') || {
          activityCount: 0,
          earned: 0,
          max: 0,
        };

        const totalActivities =
          basic.activityCount +
          intermediate.activityCount +
          advanced.activityCount;

        if (totalActivities <= 0) continue;

        const levelPercent = (item: LevelScore) =>
          item.max > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  round2((item.earned / item.max) * 100)
                )
              )
            : 0;

        const basicPercent = levelPercent(basic);
        const intermediatePercent = levelPercent(intermediate);
        const advancedPercent = levelPercent(advanced);

        skillScores.push(
          round2(
            (
              basicPercent * basic.activityCount +
              intermediatePercent * intermediate.activityCount +
              advancedPercent * advanced.activityCount
            ) / totalActivities
          )
        );
      }

      if (skillScores.length === 0) return null;

      return round2(
        skillScores.reduce((sum, score) => sum + score, 0) /
          skillScores.length
      );
    };

    const termSummary = terms
      .map((termName) => {
        const termStudents =
          termLevelMap.get(termName) ||
          new Map<string, Map<string, Map<string, LevelScore>>>();

        const studentScores: number[] = [];

        for (const studentMap of termStudents.values()) {
          const score = calculateTermStudentOverall(studentMap);

          if (score !== null) {
            studentScores.push(score);
          }
        }

        const termActivities = activityRows.filter(
          (row) => row.term === termName
        ).length;

        const avgScore =
          studentScores.length > 0
            ? round2(
                studentScores.reduce((sum, score) => sum + score, 0) /
                  studentScores.length
              )
            : 0;

        const level =
          studentScores.length === 0
            ? 'ยังไม่มีข้อมูล'
            : avgScore >= 80
              ? 'ดีมาก'
              : avgScore >= 50
                ? 'ปานกลาง'
                : 'ต้องปรับปรุง';

        return {
          term: termName,
          avgScore,
          studentCount: studentScores.length,
          activityCount: termActivities,
          level,
        };
      })
      .filter(
        (item) => item.activityCount > 0 || item.studentCount > 0
      )
      .sort((a, b) => {
        const parseTerm = (value: string) => {
          const match = value.trim().match(/^(\d+)\s*[\/-]\s*(\d{4})$/);

          if (!match) {
            return {
              termNumber: -1,
              academicYear: -1,
              raw: value,
            };
          }

          return {
            termNumber: Number(match[1]),
            academicYear: Number(match[2]),
            raw: value,
          };
        };

        const aParsed = parseTerm(a.term);
        const bParsed = parseTerm(b.term);

        if (aParsed.academicYear !== bParsed.academicYear) {
          return bParsed.academicYear - aParsed.academicYear;
        }

        if (aParsed.termNumber !== bParsed.termNumber) {
          return bParsed.termNumber - aParsed.termNumber;
        }

        return bParsed.raw.localeCompare(aParsed.raw, "th");
      });

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
    console.error("GET /api/executive/dashboard error:", error);
    return jsonError(error);
  }
}
