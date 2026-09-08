// app/api/students/[studentId]/skill-transcript/route.ts
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";
import { cleanThaiText } from "@/lib/thai-text";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ studentId: string }>;
};

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

type SkillScoreRow = RowDataPacket & {
  skillId: string;
  skillName: string | null;
  level: string | null;
  earnedScore: number | string | null;
  maxPossibleScore: number | string | null;
};

type ActivityRow = RowDataPacket & {
  activityId: string;
  activityName: string | null;
  date: Date | string | null;
  joinDate: Date | string | null;
  skills: string | null;
  score: number | string | null;  // ✅ เพิ่มคะแนน
};

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatThaiDate(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeSkillName(name: string) {
  return name.replace(/^ทักษะ/, "").trim();
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { studentId } = await context.params;

    if (!studentId) {
      throw httpError(400, "ไม่พบรหัสนิสิต");
    }

    // =========================================================
    // 1. ตรวจสอบว่านิสิตมีอยู่จริง
    // =========================================================
    const [studentRows] = await pool.query<StudentRow[]>(
      `SELECT
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
       WHERE s.studentId = ?`,
      [studentId]
    );

    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    const student = studentRows[0];

    // =========================================================
    // 2. ดึงคะแนนทักษะ "เฉพาะนิสิตคนนี้"
    // =========================================================
    const [skillRows] = await pool.query<SkillScoreRow[]>(
      `SELECT
         s.skillId,
         s.skillname AS skillName,

         COALESCE(
           GROUP_CONCAT(
             DISTINCT COALESCE(acs.level, 'กลาง')
             ORDER BY acs.level
             SEPARATOR ','
           ),
           'กลาง'
         ) AS level,

         COALESCE(
           SUM(ps.earnedScore),
           0
         ) AS earnedScore,

         COALESCE(
           SUM(ps.maxScore),
           0
         ) AS maxPossibleScore

       FROM skill s

       LEFT JOIN participation_skill ps
         ON ps.skillName = s.skillname

       LEFT JOIN participation p
         ON p.ParticipationId = ps.participationId
         AND p.studentId = ?
         AND p.status = 'completed'

       LEFT JOIN activityskill acs
         ON acs.skillname = s.skillname
         AND acs.activityId = p.activityId

       WHERE
         ps.participationId IS NULL
         OR p.ParticipationId IS NOT NULL

       GROUP BY
         s.skillId,
         s.skillname

       ORDER BY
         s.skillId`,
      [studentId]
    );

    // =========================================================
    // 3. สร้างข้อมูลทักษะ
    // =========================================================
    const skills = skillRows.map((row) => {
      const earnedScore = toNumber(row.earnedScore);
      const maxPossibleScore = toNumber(row.maxPossibleScore);

      const percent =
        maxPossibleScore > 0
          ? Math.round(
              (earnedScore / maxPossibleScore) * 10000
            ) / 100
          : 0;

      return {
        skillId: row.skillId,

        name: normalizeSkillName(
          row.skillName || row.skillId
        ),

        level: row.level || "กลาง",

        earnedScore,

        maxPossibleScore,

        percent: Math.min(
          100,
          Math.max(0, percent)
        ),
      };
    });

    // =========================================================
    // 4. ดึงกิจกรรมของ "นิสิตคนนี้เท่านั้น" พร้อมคะแนน
    // =========================================================
    const [activityRows] = await pool.query<ActivityRow[]>(
      `SELECT
         a.activityId,
         a.activityName,
         a.date,
         p.joinDate,
         p.score,  -- ✅ เพิ่มคะแนน

         GROUP_CONCAT(
           CONCAT(
             acs.skillname,
             ': ',
             COALESCE(acs.level, 'กลาง')
           )
           ORDER BY acs.skillname
           SEPARATOR '||'
         ) AS skills

       FROM participation p

       INNER JOIN activity a
         ON a.activityId = p.activityId

       LEFT JOIN activityskill acs
         ON acs.activityId = a.activityId

       WHERE
         p.studentId = ?
         AND p.status = 'completed'

       GROUP BY
         a.activityId,
         a.activityName,
         a.date,
         p.joinDate,
         p.score

       ORDER BY
         COALESCE(p.joinDate, a.date) DESC,
         a.activityName ASC

       LIMIT 9`,
      [studentId]
    );

    // =========================================================
    // 5. ส่งข้อมูลกลับ
    // =========================================================
    return NextResponse.json({
      profile: {
        name:
          `${student.firstname || ""} ${
            student.lastname || ""
          }`.trim() || student.studentId,

        nameEn: "",

        studentId: student.studentId,

        faculty:
          cleanThaiText(student.faculty) || "-",

        major:
          cleanThaiText(student.major) || "-",

        email:
          student.email || "-",

        phone:
          student.phone || "-",

        profileImageUrl:
          student.profileImageUrl || null,
      },

      skills,

      activities: activityRows.map((row) => {
        const activitySkills = row.skills
          ? String(row.skills).split("||")
          : [];

        return {
          id: row.activityId,

          name:
            row.activityName || "-",

          detail:
            activitySkills[0] || "",

          detail2:
            activitySkills[1] || "",

          date:
            formatThaiDate(
              row.joinDate || row.date
            ),

          score: row.score !== null && row.score !== undefined
            ? toNumber(row.score)
            : null,  // ✅ ส่งคะแนนกลับไป
        };
      }),

      dateIssued: formatThaiDate(new Date()),
    });
  } catch (error) {
    return jsonError(error);
  }
}