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
};

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatThaiDate(value: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeSkillName(name: string) {
  return name.replace(/^ทักษะ/, "").trim();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { studentId } = await context.params;

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
       INNER JOIN users u ON u.userId = s.userId
       WHERE s.studentId = ?`,
      [studentId],
    );

    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    const [skillRows] = await pool.query<SkillScoreRow[]>(
      `SELECT
         s.skillId,
         s.skillname AS skillName,
         MAX(s.level) AS level,
         COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.score ELSE 0 END), 0) AS earnedScore,
         COALESCE(SUM(CASE
           WHEN acs.ActivitySkillId IS NULL THEN 0
           WHEN acs.level = 'พื้นฐาน' THEN 1
           WHEN acs.level = 'สูง' THEN 3
           ELSE 2
         END), 0) AS maxPossibleScore
       FROM skill s
       LEFT JOIN activityskill acs ON acs.skillId = s.skillId
       LEFT JOIN activity a ON a.activityId = acs.activityId
       LEFT JOIN participation p
         ON p.activityId = a.activityId
         AND p.studentId = ?
       GROUP BY s.skillId, s.skillname
       ORDER BY s.skillId`,
      [studentId],
    );

    const [activityRows] = await pool.query<ActivityRow[]>(
      `SELECT
         a.activityId,
         a.activityName,
         a.date,
         p.joinDate,
         GROUP_CONCAT(CONCAT(acs.skillname, ': ', COALESCE(acs.level, 'กลาง')) ORDER BY acs.skillname SEPARATOR '||') AS skills
       FROM participation p
       INNER JOIN activity a ON a.activityId = p.activityId
       LEFT JOIN activityskill acs ON acs.activityId = a.activityId
       WHERE p.studentId = ? AND p.status = 'completed'
       GROUP BY a.activityId, a.activityName, a.date, p.joinDate
       ORDER BY COALESCE(p.joinDate, a.date) DESC, a.activityName ASC
       LIMIT 9`,
      [studentId],
    );

    const skills = skillRows.map((row) => {
      const maxPossibleScore = toNumber(row.maxPossibleScore);
      const earnedScore = Math.min(toNumber(row.earnedScore), maxPossibleScore || toNumber(row.earnedScore));
      const percent = maxPossibleScore > 0 ? Math.round((earnedScore / maxPossibleScore) * 100) : 0;

      return {
        skillId: row.skillId,
        name: normalizeSkillName(row.skillName || row.skillId),
        level: row.level || "กลาง",
        earnedScore,
        maxPossibleScore,
        percent: Math.min(100, Math.max(0, percent)),
      };
    });

    const student = studentRows[0];

    return NextResponse.json({
      profile: {
        name: `${student.firstname || ""} ${student.lastname || ""}`.trim() || student.studentId,
        nameEn: "",
        studentId: student.studentId,
        faculty: cleanThaiText(student.faculty) || "-",
        major: cleanThaiText(student.major) || "-",
        email: student.email || "-",
        phone: student.phone || "-",
        profileImageUrl: student.profileImageUrl || null,
      },
      skills,
      activities: activityRows.map((row) => {
        const skills = row.skills ? String(row.skills).split("||") : [];
        return {
          id: row.activityId,
          name: row.activityName || "-",
          detail: skills[0] || "",
          detail2: skills[1] || "",
          date: formatThaiDate(row.joinDate || row.date),
        };
      }),
      dateIssued: formatThaiDate(new Date()),
    });
  } catch (error) {
    return jsonError(error);
  }
}
