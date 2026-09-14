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

          COALESCE(
            GROUP_CONCAT(
              DISTINCT COALESCE(
                acs.level,
                'กลาง'
              )
              ORDER BY acs.level
              SEPARATOR ','
            ),
            'กลาง'
          ) AS level,

          COALESCE(
            SUM(
              student_scores.earnedScore
            ),
            0
          ) AS earnedScore,

          COALESCE(
            SUM(
              student_scores.maxScore
            ),
            0
          ) AS maxPossibleScore

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
            ON ps.participationId =
               p.ParticipationId

          WHERE
            p.studentId = ?
            AND p.status = 'completed'
        ) AS student_scores
          ON student_scores.skillName =
             s.skillname

        LEFT JOIN activityskill acs
          ON acs.skillname =
             s.skillname

          AND acs.activityId =
              student_scores.activityId

        GROUP BY
          s.skillId,
          s.skillname

        ORDER BY
          s.skillId
        `,
        [studentId]
      );

    // ========================================================
    // 4. สร้างข้อมูลทักษะ
    // ========================================================

    const skills =
      skillRows.map((row) => {
        const earnedScore =
          toNumber(
            row.earnedScore
          );

        const maxPossibleScore =
          toNumber(
            row.maxPossibleScore
          );

        const percent =
          maxPossibleScore > 0
            ? Math.round(
                (earnedScore /
                  maxPossibleScore) *
                  10000
              ) / 100
            : 0;

        return {
          skillId:
            row.skillId,

          name:
            normalizeSkillName(
              row.skillName ||
                row.skillId
            ),

          level:
            row.level ||
            "กลาง",

          earnedScore,

          maxPossibleScore,

          percent:
            Math.min(
              100,
              Math.max(
                0,
                percent
              )
            ),
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
