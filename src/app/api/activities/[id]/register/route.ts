import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import { ensureActivityRegistrationColumns, ensureParticipationStatusWorkflow } from "@/lib/activity-registration";
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
      `SELECT activityId, status, applicationEnabled, registrationEnabled
       FROM activity WHERE activityId = ? LIMIT 1`,
      [id],
    );
    const activity = rows[0];

    if (!activity || activity.status !== "active") {
      throw httpError(404, "ไม่พบกิจกรรมที่เปิดรับสมัคร");
    }
    if (!activity.applicationEnabled) {
      throw httpError(400, "ขณะนี้เจ้าหน้าที่ยังไม่เปิดรับสมัครกิจกรรม");
    }
    if (activity.registrationEnabled) {
      throw httpError(400, "กิจกรรมนี้เข้าสู่ขั้นตอนลงทะเบียนแล้ว");
    }

    const [existing] = await pool.query<any[]>(
      `SELECT ParticipationId, status FROM participation
       WHERE studentId = ? AND activityId = ? LIMIT 1`,
      [session.user.studentId, id],
    );

    if (existing[0]) {
      return NextResponse.json({
        message: "คุณสมัครกิจกรรมนี้แล้ว",
        status: existing[0].status,
      });
    }

    await pool.query(
      `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status)
       VALUES (?, ?, ?, 0, NULL, 'applied')`,
      [nanoid(20), session.user.studentId, id],
    );

    return NextResponse.json({ message: "สมัครกิจกรรมสำเร็จ", status: "applied" }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
