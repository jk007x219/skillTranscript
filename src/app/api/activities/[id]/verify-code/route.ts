// app/api/activities/[id]/verify-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "กรุณาเข้าสู่ระบบด้วยบัญชีนิสิต");
    }
    const body = await request.json();
    const { code } = body;

    if (!code || code.length !== 6) {
      throw httpError(400, "กรุณากรอกรหัส 6 หลัก");
    }

    const [activities] = await pool.query(
      `SELECT activityId, verification_code, code_expires_at FROM activity WHERE activityId = ?`,
      [id]
    );
    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const activity = (activities as any[])[0];
    const storedCode = activity.verification_code;
    const expiresAt = activity.code_expires_at ? new Date(activity.code_expires_at) : null;

    if (!storedCode) {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีรหัสยืนยัน");
    }

    if (expiresAt && new Date() > expiresAt) {
      throw httpError(400, "รหัสยืนยันหมดอายุแล้ว");
    }

    if (storedCode !== code) {
      throw httpError(400, "รหัสยืนยันไม่ถูกต้อง");
    }

    const [registrations] = await pool.query<any[]>(
      `SELECT ParticipationId FROM participation
       WHERE studentId = ? AND activityId = ? AND status = 'registered'
       LIMIT 1`,
      [session.user.studentId, id],
    );
    if (!registrations[0]) {
      throw httpError(403, "กรุณาลงทะเบียนกิจกรรมก่อนยืนยันการเข้าร่วม");
    }

    return NextResponse.json({
      valid: true,
      message: "รหัสยืนยันถูกต้อง",
    });
  } catch (error) {
    return jsonError(error);
  }
}
