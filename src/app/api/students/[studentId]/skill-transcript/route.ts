    const groupedSkills = new Map<
      string,
      {
        skillId: string;
        levels: Record<string, {
          activityCount: number;
          earnedScore: number;
          maxPossibleScore: number;
        }>;
      }
    >();

    for (const row of skillRows) {
      const skillName = row.skillName || row.skillId;
      const existing = groupedSkills.get(skillName) || {
        skillId: row.skillId,
        levels: {},
      };
      const level = normalizeLevel(row.level);

      existing.levels[level] = {
        activityCount: toNumber(row.activityCount),
        earnedScore: toNumber(row.earnedScore),
        maxPossibleScore: toNumber(row.maxPossibleScore),
      };

      groupedSkills.set(skillName, existing);
    }

    // คะแนนรวมของ Skill Transcript ใช้สูตรเดียวกับ Dashboard:
    // คะแนนระดับ = คะแนนที่ได้ / คะแนนเต็ม × 100
    // สัดส่วนกิจกรรม = จำนวนกิจกรรมระดับนั้น / กิจกรรมทั้งหมด × 100
    // คะแนนทักษะรวม = ผลรวม(คะแนนระดับ × สัดส่วนกิจกรรม / 100)
    const skills = Array.from(groupedSkills.entries()).map(
      ([skillName, group]) => {
        const basic = group.levels['พื้นฐาน'] || {
          activityCount: 0,
          earnedScore: 0,
          maxPossibleScore: 0,
        };
        const intermediate = group.levels['กลาง'] || {
          activityCount: 0,
          earnedScore: 0,
          maxPossibleScore: 0,
        };
        const advanced = group.levels['สูง'] || {
          activityCount: 0,
          earnedScore: 0,
          maxPossibleScore: 0,
        };

        const totalActivities =
          basic.activityCount +
          intermediate.activityCount +
          advanced.activityCount;

        const levelPercent = (level: typeof basic) =>
          level.maxPossibleScore > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  (level.earnedScore / level.maxPossibleScore) * 100
                )
              )
            : 0;

        const basicPercent = levelPercent(basic);
        const intermediatePercent = levelPercent(intermediate);
        const advancedPercent = levelPercent(advanced);

        const percent =
          totalActivities > 0
            ? Math.round(
                (
                  (basicPercent * basic.activityCount +
                    intermediatePercent * intermediate.activityCount +
                    advancedPercent * advanced.activityCount) /
                  totalActivities
                ) * 100
              ) / 100
            : 0;

        const earnedScore =
          basic.earnedScore +
          intermediate.earnedScore +
          advanced.earnedScore;
        const maxPossibleScore =
          basic.maxPossibleScore +
          intermediate.maxPossibleScore +
          advanced.maxPossibleScore;

        return {
          skillId: group.skillId,
          name: normalizeSkillName(skillName),
          level:
            advanced.activityCount > 0
              ? 'สูง'
              : intermediate.activityCount > 0
                ? 'กลาง'
                : 'พื้นฐาน',
          earnedScore,
          maxPossibleScore,
          percent: Math.min(100, Math.max(0, percent)),
        };
      }
    );
// app/api/students/[studentId]/skill-transcript/route.ts

import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";
import { cleanThaiText } from "@/lib/thai-text";
import { getDeanSettings } from "@/lib/certificate-settings";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

// ============================================================
// Student
// ============================================================

type StudentRow = RowDataPacket & {
  studentId: string;
  firstname: string | null;
  lastname: string | null;
  faculty: string | null;
  major: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  email: string | null;
};

// ============================================================
// Skill score
// ============================================================

type SkillScoreRow = RowDataPacket & {
  skillId: string;
  skillName: string | null;
  level: string | null;
  activityCount: number | string | null;
  earnedScore: number | string | null;
  maxPossibleScore: number | string | null;
};

// ============================================================
// Activity
// ============================================================

type ActivityRow = RowDataPacket & {
  activityId: string;
  activityName: string | null;
  description: string | null;
  date: Date | string | null;
  joinDate: Date | string | null;
  organizer: string | null;
  location: string | null;
  score: number | string | null;

  /**
   * รูปแบบ:
   *
   * ทักษะดิจิทัล|2|4||
   * ทักษะการใช้ปัญญาประดิษฐ์|3|3
   */
  skillScores: string | null;

  /**
   * รายชื่อทักษะของกิจกรรม
   */
  skills: string | null;
};

// ============================================================
// Helper
// ============================================================

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

// ============================================================
// Thai date
// ============================================================

function formatThaiDate(
  value: Date | string | null
) {
  if (!value) return "-";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ============================================================
// Normalize skill name
// ============================================================

function normalizeSkillName(name: string) {
  return name
    .replace(/^ทักษะ/, "")
    .trim();
}

// ============================================================
// Parse activity skill scores
// ============================================================

function parseActivitySkillScores(
  value: string | null
) {
  if (!value) {
    return [];
  }

  return String(value)
    .split("||")
    .map((item) => {
      const parts = item.split("|");

      if (parts.length < 3) {
        return null;
      }

      const skillName =
        parts[0]?.trim() || "";

      const earnedScore =
        toNumber(parts[1]);

      const maxScore =
        toNumber(parts[2]);

      if (!skillName) {
        return null;
      }

      return {
        skillName:
          normalizeSkillName(skillName),

        earnedScore,

        maxScore,
      };
    })
    .filter(
      (
        item
      ): item is {
        skillName: string;
        earnedScore: number;
        maxScore: number;
      } => item !== null
    );
}

// ============================================================
// GET
// ============================================================

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { studentId } =
      await context.params;

    if (!studentId) {
      throw httpError(
        400,
        "ไม่พบรหัสนิสิต"
      );
    }

    // ========================================================
    // 1. ตรวจสอบว่านิสิตมีอยู่จริง
    // ========================================================

    const [studentRows] =
      await pool.query<StudentRow[]>(
        `
        SELECT
          s.studentId,
          s.firstname,
          s.lastname,
          s.faculty,
          s.major,
          s.phone,
          s.profileImageUrl,
          u.email

        FROM students s

        INNER JOIN users u
          ON u.userId = s.userId

        WHERE s.studentId = ?
        `,
        [studentId]
      );

    if (studentRows.length === 0) {
      throw httpError(
        404,
        "ไม่พบข้อมูลนิสิต"
      );
    }

    const student =
      studentRows[0];

    // ========================================================
    // 2. ดึงข้อมูลคณบดี
    //
    // ใช้ข้อมูลเดียวกับหน้าใบรับรอง
    // /student/activities
    // ========================================================

    const deanSettings =
      await getDeanSettings();

    // ========================================================
    // 3. ดึงคะแนนทักษะทั้งหมดของนิสิต
    //
    // เริ่มจากตาราง skill
    // เพื่อให้ทักษะที่ยังไม่เคยเข้ากิจกรรม
    // ยังคงแสดงเป็น 0%
    // ========================================================

    const [skillRows] =
      await pool.query<SkillScoreRow[]>(
        `
        SELECT
          s.skillId,
          s.skillname AS skillName,
          acs.level AS level,
          COUNT(DISTINCT student_scores.ParticipationId) AS activityCount,
          COALESCE(SUM(student_scores.earnedScore), 0) AS earnedScore,
          COALESCE(SUM(student_scores.maxScore), 0) AS maxPossibleScore
        FROM skill s
        LEFT JOIN (
          SELECT
            p.ParticipationId,
            p.activityId,
            ps.skillName,
            ps.earnedScore,
            ps.maxScore
          FROM participation p
          INNER JOIN participation_skill ps
            ON ps.participationId = p.ParticipationId
          WHERE
            p.studentId = ?
            AND p.status = 'completed'
        ) AS student_scores
          ON student_scores.skillName = s.skillname
        LEFT JOIN activityskill acs
          ON acs.skillname = s.skillname
          AND acs.activityId = student_scores.activityId
        GROUP BY
          s.skillId,
          s.skillname,
          acs.level
        ORDER BY
          s.skillId,
          acs.level
        `,
        [studentId]
      );

    function normalizeLevel(level: string | null) {
      const value = String(level || '').trim().toLowerCase();

      if (
        value.includes('สูง') ||
        value.includes('advanced') ||
        value.includes('high') ||
        value === '3'
      ) {
        return 'สูง';
      }

      if (
        value.includes('กลาง') ||
        value.includes('intermediate') ||
        value.includes('medium') ||
        value.includes('mid') ||
        value === '2'
      ) {
        return 'กลาง';
      }

      return 'พื้นฐาน';
    }


    // ========================================================
    // 4. สร้างข้อมูลทักษะ
    // ========================================================

    const groupedSkills = new Map<string, {
      skillId: string;
      name: string;
      levels: Record<string, { activityCount: number; earnedScore: number; maxPossibleScore: number }>;
    }>();

    for (const row of skillRows) {
      const name = normalizeSkillName(row.skillName || row.skillId);
      const level = normalizeLevel(row.level);
      const current = groupedSkills.get(name) || { skillId: row.skillId, name, levels: {} };
      current.levels[level] = {
        activityCount: toNumber(row.activityCount),
        earnedScore: toNumber(row.earnedScore),
        maxPossibleScore: toNumber(row.maxPossibleScore),
      };
      groupedSkills.set(name, current);
    }

    // สูตรรวมใหม่: คะแนนระดับ × (จำนวนกิจกรรมระดับนั้น / จำนวนกิจกรรมทั้งหมด)
    const skills = Array.from(groupedSkills.values()).map((skill) => {
      const basic = skill.levels['พื้นฐาน'] || { activityCount: 0, earnedScore: 0, maxPossibleScore: 0 };
      const intermediate = skill.levels['กลาง'] || { activityCount: 0, earnedScore: 0, maxPossibleScore: 0 };
      const advanced = skill.levels['สูง'] || { activityCount: 0, earnedScore: 0, maxPossibleScore: 0 };
      const totalActivities = basic.activityCount + intermediate.activityCount + advanced.activityCount;
      const levelPercent = (v: typeof basic) => v.maxPossibleScore > 0
        ? Math.min(100, Math.max(0, (v.earnedScore / v.maxPossibleScore) * 100))
        : 0;
      const percent = totalActivities > 0
        ? Math.round(((levelPercent(basic) * basic.activityCount + levelPercent(intermediate) * intermediate.activityCount + levelPercent(advanced) * advanced.activityCount) / totalActivities) * 100) / 100
        : 0;

      return {
        skillId: skill.skillId,
        name: skill.name,
        level: advanced.activityCount > 0 ? 'สูง' : intermediate.activityCount > 0 ? 'กลาง' : 'พื้นฐาน',
        earnedScore: basic.earnedScore + intermediate.earnedScore + advanced.earnedScore,
        maxPossibleScore: basic.maxPossibleScore + intermediate.maxPossibleScore + advanced.maxPossibleScore,
        percent: Math.min(100, Math.max(0, percent)),
      };
    });

    // ========================================================
    // 5. ดึงกิจกรรมที่นิสิตเข้าร่วม
    //
    // พร้อม:
    // - ชื่อกิจกรรม
    // - รายละเอียด
    // - ผู้จัด
    // - สถานที่
    // - วันที่
    // - คะแนนรวมเดิม
    // - คะแนนแยกตามทักษะ
    // ========================================================

    const [activityRows] =
      await pool.query<ActivityRow[]>(
        `
        SELECT

          a.activityId,

          a.activityName,

          a.description,

          a.date,

          a.location,

          a.organizer,

          p.joinDate,

          p.score,

          GROUP_CONCAT(
            DISTINCT CONCAT(
              acs.skillname,
              ': ',
              COALESCE(
                acs.level,
                'กลาง'
              )
            )
            ORDER BY acs.skillname
            SEPARATOR '||'
          ) AS skills,

          GROUP_CONCAT(
            DISTINCT CONCAT(
              ps.skillName,
              '|',
              COALESCE(
                ps.earnedScore,
                0
              ),
              '|',
              COALESCE(
                ps.maxScore,
                0
              )
            )
            ORDER BY ps.skillName
            SEPARATOR '||'
          ) AS skillScores

        FROM participation p

        INNER JOIN activity a
          ON a.activityId =
             p.activityId

        LEFT JOIN activityskill acs
          ON acs.activityId =
             a.activityId

        LEFT JOIN participation_skill ps
          ON ps.participationId =
             p.ParticipationId

          AND ps.skillName =
              acs.skillname

        WHERE
          p.studentId = ?

          AND p.status =
              'completed'

        GROUP BY

          a.activityId,

          a.activityName,

          a.description,

          a.date,

          a.location,

          a.organizer,

          p.joinDate,

          p.score

        ORDER BY

          COALESCE(
            p.joinDate,
            a.date
          ) DESC,

          a.activityName ASC

        LIMIT 9
        `,
        [studentId]
      );

    // ========================================================
    // 6. ส่งข้อมูลกลับ
    // ========================================================

    const response = NextResponse.json({
      // ======================================================
      // Profile
      // ======================================================

      profile: {
        name:
          `${student.firstname || ""} ${
            student.lastname || ""
          }`.trim() ||
          student.studentId,

        nameEn: "",

        studentId:
          student.studentId,

        faculty:
          cleanThaiText(
            student.faculty
          ) || "-",

        major:
          cleanThaiText(
            student.major
          ) || "-",

        email:
          student.email || "-",

        phone:
          student.phone || "-",

        profileImageUrl:
          student.profileImageUrl ||
          null,
      },

      // ======================================================
      // Skills
      // ======================================================

      skills,

      // ======================================================
      // Activities
      // ======================================================

      activities:
        activityRows.map(
          (row) => {
            const activitySkills =
              row.skills
                ? String(
                    row.skills
                  ).split("||")
                : [];

            const skillScores =
              parseActivitySkillScores(
                row.skillScores
              );

            return {
              id:
                row.activityId,

              name:
                row.activityName ||
                "-",

              detail:
                row.description ||
                "",

              detail2:
                activitySkills[0] ||
                "",

              date:
                formatThaiDate(
                  row.joinDate ||
                    row.date
                ),

              score:
                row.score !== null &&
                row.score !== undefined
                  ? toNumber(
                      row.score
                    )
                  : null,

              organizer:
                row.organizer ||
                null,

              location:
                row.location ||
                null,

              skillScores,
            };
          }
        ),

      // ======================================================
      // วันที่ออกเอกสาร
      // ======================================================

      dateIssued:
        formatThaiDate(
          new Date()
        ),

      // ======================================================
      // ข้อมูลคณบดี
      //
      // สำคัญ:
      // ส่งให้ SkillTranscriptPage โดยตรง
      // ======================================================

      deanName:
        deanSettings.deanName ||
        "",

      deanSignatureUrl:
        deanSettings.deanSignatureUrl ||
        null,
    });

    // ป้องกันข้อมูลเก่าจาก cache
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
