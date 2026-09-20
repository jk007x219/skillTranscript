import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import {
  buildRegistrationQrPayload,
  ensureActivityRegistrationColumns,
  ensureParticipationStatusWorkflow,
} from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "เฉพาะนิสิตเท่านั้นที่สมัครกิจกรรมได้");
    }

    const { id } = await params;
    await ensureActivityRegistrationColumns();
    await ensureParticipationStatusWorkflow();

    const [rows] = await pool.query<any[]>(
      `SELECT activityId, status, applicationEnabled, registrationEnabled, confirmationEnabled,
              date, time, endDate, endTime, registrationStart, registrationEnd
       FROM activity WHERE activityId = ? LIMIT 1`,
      [id],
    );
    const activity = rows[0];

    if (!activity || activity.status !== "active") {
      throw httpError(404, "ไม่พบกิจกรรมที่เปิดรับสมัคร");
    }
    const activityStart = new Date(
      `${String(activity.date).slice(0, 10)}T${String(activity.time).slice(0, 8)}+07:00`,
    );
    const activityEnd = new Date(
      `${String(activity.endDate || activity.date).slice(0, 10)}T${String(activity.endTime || activity.time).slice(0, 8)}+07:00`,
    );
    const registrationStart = activity.registrationStart
      ? new Date(String(activity.registrationStart).replace(" ", "T") + "+07:00")
      : null;
    const registrationEnd = activity.registrationEnd
      ? new Date(String(activity.registrationEnd).replace(" ", "T") + "+07:00")
      : null;
    const now = new Date();

    if (!registrationStart || !registrationEnd) {
      throw httpError(400, "กิจกรรมนี้ยังไม่ได้กำหนดช่วงเวลาลงทะเบียน");
    }
    if (now < registrationStart) {
      throw httpError(400, "ยังไม่ถึงเวลาเปิดลงทะเบียน");
    }
    if (now >= registrationEnd || now >= activityEnd) {
      throw httpError(400, "หมดเวลาลงทะเบียนสำหรับกิจกรรมนี้แล้ว");
    }
    if (activityEnd <= activityStart) {
      throw httpError(400, "ช่วงเวลากิจกรรมไม่ถูกต้อง");
    }

    const [existing] = await pool.query<any[]>(
      `SELECT ParticipationId, status, registrationQrToken FROM participation
       WHERE studentId = ? AND activityId = ? LIMIT 1`,
      [session.user.studentId, id],
    );

    if (existing[0]) {
      const token = existing[0].registrationQrToken || nanoid(40);
      if (!existing[0].registrationQrToken) {
        await pool.query(
          `UPDATE participation SET registrationQrToken = ? WHERE ParticipationId = ?`,
          [token, existing[0].ParticipationId],
        );
      }
      return NextResponse.json({
        message: "คุณสมัครกิจกรรมนี้แล้ว",
        status: existing[0].status,
        qrPayload: buildRegistrationQrPayload(id, token),
        registrationQrToken: token,
      });
    }

    const participationId = nanoid(20);
    const registrationQrToken = nanoid(40);

    await pool.query(
      `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status, registrationQrToken)
       VALUES (?, ?, ?, 0, NULL, 'applied', ?)`,
      [participationId, session.user.studentId, id, registrationQrToken],
    );

    return NextResponse.json(
      {
        message: "สมัครกิจกรรมสำเร็จ",
        status: "applied",
        qrPayload: buildRegistrationQrPayload(id, registrationQrToken),
        registrationQrToken,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
