import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import { ensureActivityRegistrationColumns } from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const BANGKOK_OFFSET = "+07:00";

function parseMySqlBangkokDateTime(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim().replace(" ", "T");
  if (!raw) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? `${raw}:00${BANGKOK_OFFSET}`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)
      ? `${raw}${BANGKOK_OFFSET}`
      : raw;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activityStart(dateValue: unknown, timeValue: unknown): Date | null {
  const date = String(dateValue ?? "").slice(0, 10);
  const time = String(timeValue ?? "00:00:00").slice(0, 8);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const result = new Date(`${date}T${time}${BANGKOK_OFFSET}`);
  return Number.isNaN(result.getTime()) ? null : result;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "เฉพาะนิสิตเท่านั้นที่สมัครกิจกรรมได้");
    }

    const { id } = await params;
    await ensureActivityRegistrationColumns();

    const [rows] = await pool.query<any[]>(
      `
        SELECT activityId, status, date, time, registrationStart, registrationEnd,
               registrationEnabled
        FROM activity
        WHERE activityId = ?
        LIMIT 1
      `,
      [id],
    );

    const activity = rows[0];
    if (!activity || activity.status !== "active") {
      throw httpError(404, "ไม่พบกิจกรรมที่เปิดรับสมัคร");
    }

    const now = new Date();
    const start = parseMySqlBangkokDateTime(activity.registrationStart);
    const end = parseMySqlBangkokDateTime(activity.registrationEnd);
    const startsAt = activityStart(activity.date, activity.time);

    const normalOpen = Boolean(
      start && end &&
        now >= start && now < end &&
        (!startsAt || now < startsAt),
    );

    const emergencyOpen = Boolean(
      activity.registrationEnabled &&
      startsAt &&
      now < startsAt,
    );

    if (!normalOpen && !emergencyOpen) {
      throw httpError(400, "ขณะนี้ไม่อยู่ในช่วงเวลาที่เปิดรับสมัครกิจกรรม");
    }

    const [existing] = await pool.query<any[]>(
      `SELECT ParticipationId, status FROM participation
       WHERE studentId = ? AND activityId = ? LIMIT 1`,
      [session.user.studentId, id],
    );

    if (existing[0]) {
      if (existing[0].status === "completed") {
        return NextResponse.json({ message: "กิจกรรมนี้เสร็จสิ้นแล้ว", status: "completed" });
      }
      return NextResponse.json({ message: "คุณสมัครกิจกรรมนี้แล้ว", status: existing[0].status });
    }

    await pool.query(
      `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status)
       VALUES (?, ?, ?, 0, NULL, 'registered')`,
      [nanoid(20), session.user.studentId, id],
    );

    return NextResponse.json({ message: "สมัครกิจกรรมสำเร็จ", status: "registered" }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
