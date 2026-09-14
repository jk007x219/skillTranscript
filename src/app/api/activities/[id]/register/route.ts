import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import { ensureActivityRegistrationColumns } from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "เฉพาะนิสิตเท่านั้นที่ลงทะเบียนกิจกรรมได้");
    }
    const { id } = await params;
    await ensureActivityRegistrationColumns();
    const [activities] = await pool.query<any[]>(
      `SELECT activityId FROM activity
       WHERE activityId = ? AND status = 'active' AND registrationEnabled = 1 LIMIT 1`,
      [id],
    );
    const activity = activities[0];
    if (!activity) throw httpError(404, "ไม่พบกิจกรรมที่เปิดลงทะเบียน");

    const [existing] = await pool.query<any[]>(
      "SELECT ParticipationId, status FROM participation WHERE studentId = ? AND activityId = ? LIMIT 1",
      [session.user.studentId, id],
    );
    if (existing[0]) return NextResponse.json({ message: "คุณลงทะเบียนกิจกรรมนี้แล้ว", status: existing[0].status });

    await pool.query(
      `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status)
       VALUES (?, ?, ?, 0, CURDATE(), 'registered')`,
      [nanoid(20), session.user.studentId, id],
    );
    return NextResponse.json({ message: "ลงทะเบียนกิจกรรมสำเร็จ", status: "registered" }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
