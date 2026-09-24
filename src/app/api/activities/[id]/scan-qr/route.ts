import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import {
  ensureActivityRegistrationColumns,
  ensureParticipationStatusWorkflow,
  parseRegistrationQrPayload,
} from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function canManage(session: any) {
  const role = session?.user?.role;
  return Boolean(
    session?.user?.id &&
      (["teacher", "officer", "executive"].includes(role || "") || session?.user?.isExecutive),
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const user = session?.user;
    const { id } = await params;
    const body = await request.json();
    const activityCode = typeof body.activityCode === "string" ? body.activityCode.trim() : id;
    const payload = parseRegistrationQrPayload(body.qrPayload);

    if (!activityCode || activityCode !== id) {
      throw httpError(400, "รหัสกิจกรรมไม่ตรงกับกิจกรรมที่เลือก");
    }
    if (!payload?.token) {
      throw httpError(400, "ข้อมูล QR ไม่ถูกต้อง");
    }
    if (payload.activityId && payload.activityId !== id) {
      throw httpError(400, "QR นี้ไม่ใช่ของกิจกรรมนี้");
    }

    await ensureActivityRegistrationColumns();
    await ensureParticipationStatusWorkflow();

    const [activities] = await pool.query<any[]>(
      `SELECT activityId, activityName, createdBy, status
       FROM activity
       WHERE activityId = ?
       LIMIT 1`,
      [id],
    );
    const activity = activities[0];
    if (!activity) throw httpError(404, "ไม่พบกิจกรรม");
    if (user?.role === "teacher" && !user.isExecutive && activity.createdBy !== user.id) {
      throw httpError(403, "คุณจัดการได้เฉพาะกิจกรรมที่สร้างเอง");
    }
    if (activity.status !== "active") {
      throw httpError(400, "กิจกรรมนี้ไม่ได้เปิดใช้งาน");
    }

    const [registrations] = await pool.query<any[]>(
      `SELECT p.ParticipationId, p.studentId, p.activityId, p.status,
              s.firstname, s.lastname, s.program, s.major
       FROM participation p
       JOIN students s ON s.studentId = p.studentId
       WHERE p.activityId = ?
         AND (p.registrationQrToken = ? OR p.studentId = ?)
       LIMIT 1`,
      [id, payload.token, payload.token],
    );
    const registration = registrations[0];
    if (!registration) {
      throw httpError(404, "ไม่พบข้อมูลการสมัครจาก QR นี้ หรือ QR หมดอายุ/ไม่ตรงกับกิจกรรม");
    }
    if (registration.activityId !== id) {
      throw httpError(400, "นิสิตสมัครกิจกรรมอื่น ไม่สามารถใช้ QR นี้กับกิจกรรมนี้ได้");
    }
    if (registration.status === "completed") {
      throw httpError(400, "นิสิตคนนี้ทำแบบประเมินเสร็จแล้ว");
    }
    if (!["applied", "registered", "confirmed"].includes(registration.status)) {
      throw httpError(400, "สถานะการสมัครไม่สามารถลงทะเบียนได้");
    }

    if (registration.status !== "confirmed") {
      await pool.query(
        `UPDATE participation
         SET status = 'confirmed',
             joinDate = CURDATE(),
             registeredAt = COALESCE(registeredAt, NOW()),
             confirmedAt = NOW()
         WHERE ParticipationId = ?
           AND activityId = ?
           AND status IN ('applied', 'registered')`,
        [registration.ParticipationId, id],
      );
    }

    return NextResponse.json({
      message: "สแกน QR และลงทะเบียนสำเร็จ",
      activityId: id,
      activityName: activity.activityName,
      participationStatus: "confirmed",
      student: {
        studentId: registration.studentId,
        firstname: registration.firstname,
        lastname: registration.lastname,
        program: registration.program,
        major: registration.major,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
