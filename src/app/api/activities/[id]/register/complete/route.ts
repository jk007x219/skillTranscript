import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import { ensureParticipationStatusWorkflow } from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "เฉพาะนิสิตเท่านั้นที่ลงทะเบียนกิจกรรมได้");
    }

    const { id } = await params;
    await ensureParticipationStatusWorkflow();

    const [rows] = await pool.query<any[]>(
      `SELECT a.activityId, a.status AS activityStatus, a.registrationEnabled,
              p.ParticipationId, p.status AS participationStatus
       FROM activity a
       LEFT JOIN participation p
         ON p.activityId = a.activityId AND p.studentId = ?
       WHERE a.activityId = ?
       LIMIT 1`,
      [session.user.studentId, id],
    );
    const row = rows[0];

    if (!row || row.activityStatus !== "active") {
      throw httpError(404, "ไม่พบกิจกรรม");
    }
    if (!row.registrationEnabled) {
      throw httpError(400, "ขณะนี้เจ้าหน้าที่ยังไม่เปิดการลงทะเบียน");
    }
    if (!row.ParticipationId || row.participationStatus !== "applied") {
      throw httpError(400, "ต้องสมัครกิจกรรมก่อนจึงจะลงทะเบียนได้");
    }

    await pool.query(
      `UPDATE participation SET status = 'registered' WHERE ParticipationId = ?`,
      [row.ParticipationId],
    );

    return NextResponse.json({ message: "ลงทะเบียนกิจกรรมสำเร็จ", status: "registered" });
  } catch (error) {
    return jsonError(error);
  }
}
