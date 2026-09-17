import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { ensureActivityRegistrationColumns } from "@/lib/activity-registration";

const OFFSET = "+07:00";

function parseDateTime(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim().replace(" ", "T");
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? `${raw}:00${OFFSET}`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)
      ? `${raw}${OFFSET}`
      : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activityStart(date: unknown, time: unknown): Date | null {
  const d = String(date ?? "").slice(0, 10);
  const t = String(time ?? "00:00:00").slice(0, 8);
  const value = new Date(`${d}T${t}${OFFSET}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function registrationOpen(a: any) {
  const now = new Date();
  const start = parseDateTime(a.registrationStart);
  const end = parseDateTime(a.registrationEnd);
  const activityAt = activityStart(a.date, a.time);
  const beforeActivity = !activityAt || now < activityAt;
  const normal = Boolean(start && end && now >= start && now < end && beforeActivity);
  const emergency = Boolean(a.registrationEnabled && activityAt && now < activityAt);
  return !activityAt || now < activityAt ? normal || emergency : false;
}

export async function GET(_request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const session = await auth();
    const { studentId } = await params;
    if (!session?.user?.studentId || session.user.role !== "student" || session.user.studentId !== studentId) {
      throw httpError(403, "ไม่มีสิทธิ์ดูข้อมูลกิจกรรมของนิสิตคนนี้");
    }

    await ensureActivityRegistrationColumns();

    const [rows] = await pool.query<any[]>(
      `
        SELECT a.activityId, a.activityName, a.description, a.date, a.time,
               a.endDate, a.endTime, a.hours, a.location, a.organizer, a.term,
               a.status, a.confirmationEnabled, a.hasEvaluation,
               a.templateId, a.registrationStart, a.registrationEnd,
               a.registrationEnabled,
               p.ParticipationId, p.status AS participationStatus, p.score AS participationScore
        FROM activity a
        LEFT JOIN participation p
          ON p.activityId = a.activityId AND p.studentId = ?
        WHERE a.status = 'active'
          AND (p.status IS NULL OR p.status IN ('registered', 'confirmed'))
        ORDER BY a.date DESC, a.time DESC
      `,
      [studentId],
    );

    const [skills] = await pool.query<any[]>(
      `SELECT activityId, skillname, level FROM activityskill`,
    );

    const skillMap: Record<string, Skill[]> = {};
    type Skill = { name: string; level: string };
    for (const skill of skills) {
      if (!skillMap[skill.activityId]) skillMap[skill.activityId] = [];
      skillMap[skill.activityId].push({ name: skill.skillname, level: skill.level || "กลาง" });
    }

    const activities = rows.map((a) => ({
      id: a.activityId,
      title: a.activityName,
      description: a.description,
      date: a.date,
      time: a.time,
      endDate: a.endDate,
      endTime: a.endTime,
      hours: a.hours == null ? null : Number(a.hours),
      location: a.location,
      organizer: a.organizer,
      term: a.term,
      status: a.status,
      attendeeCount: 0,
      confirmationEnabled: Boolean(a.confirmationEnabled),
      hasEvaluation: Boolean(a.hasEvaluation),
      registrationStart: a.registrationStart,
      registrationEnd: a.registrationEnd,
      registrationEnabled: Boolean(a.registrationEnabled),
      registrationOpen: registrationOpen(a),
      participationStatus: a.participationStatus || null,
      participationScore: a.participationScore == null ? null : Number(a.participationScore),
      skills: skillMap[a.activityId] || [],
      templateId: a.templateId || null,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    return jsonError(error);
  }
}
