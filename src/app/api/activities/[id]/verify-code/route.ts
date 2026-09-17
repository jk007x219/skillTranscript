import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "กรุณาเข้าสู่ระบบด้วยบัญชีนิสิต");
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!/^\d{6}$/.test(code)) {
      throw httpError(400, "กรุณากรอกรหัส 6 หลัก");
    }

    // ต้องสมัครกิจกรรมก่อน จึงจะยืนยันการเข้าร่วมได้
    const [registrations] = await pool.query<any[]>(
      `
        SELECT ParticipationId, status
        FROM participation
        WHERE studentId = ? AND activityId = ?
        LIMIT 1
      `,
      [session.user.studentId, id],
    );

    if (registrations.length === 0) {
      throw httpError(403, "กรุณาสมัครกิจกรรมก่อนยืนยันการเข้าร่วม");
    }

    const registration = registrations[0];

    if (registration.status === "completed") {
      throw httpError(400, "กิจกรรมนี้เสร็จสิ้นแล้ว");
    }

    if (registration.status !== "registered") {
      throw httpError(403, "สถานะการสมัครไม่สามารถยืนยันการเข้าร่วมได้");
    }

    const [activities] = await pool.query<any[]>(
      `
        SELECT activityId, verification_code, code_expires_at, status
        FROM activity
        WHERE activityId = ?
        LIMIT 1
      `,
      [id],
    );

    if (activities.length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const activity = activities[0];

    if (activity.status !== "active") {
      throw httpError(400, "กิจกรรมนี้ไม่อยู่ในสถานะที่สามารถยืนยันการเข้าร่วมได้");
    }

    if (!activity.verification_code) {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีรหัสยืนยัน");
    }

    const expiresAt = activity.code_expires_at ? new Date(activity.code_expires_at) : null;

    if (expiresAt && !Number.isNaN(expiresAt.getTime()) && new Date() > expiresAt) {
      throw httpError(400, "รหัสยืนยันหมดอายุแล้ว");
    }

    if (String(activity.verification_code) !== code) {
      throw httpError(400, "รหัสยืนยันไม่ถูกต้อง");
    }

    // เปลี่ยนสถานะจากสมัครแล้ว -> ยืนยันการเข้าร่วมแล้ว
    await pool.query(
      `
        UPDATE participation
        SET status = 'confirmed', joinDate = CURDATE()
        WHERE ParticipationId = ?
          AND studentId = ?
          AND activityId = ?
          AND status = 'registered'
      `,
      [registration.ParticipationId, session.user.studentId, id],
    );

    return NextResponse.json({
      valid: true,
      confirmed: true,
      message: "ยืนยันการเข้าร่วมสำเร็จ",
    });
  } catch (error) {
    return jsonError(error);
  }
}
