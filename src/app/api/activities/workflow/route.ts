import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";
import {
  buildRegistrationQrPayload,
  ensureActivityRegistrationColumns,
  ensureParticipationStatusWorkflow,
} from "@/lib/activity-registration";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function canManage(session: any) {
  const role = session?.user?.role;
  return Boolean(session?.user?.id && (["teacher", "officer", "executive"].includes(role) || session?.user?.isExecutive));
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw httpError(401, "กรุณาเข้าสู่ระบบ");
    await ensureActivityRegistrationColumns();
    await ensureParticipationStatusWorkflow();
    const isStudent = session.user.role === "student";
    const [rows] = await pool.query<any[]>(
      `SELECT a.activityId, a.activityName, a.description, a.date, a.time, a.endDate, a.endTime,
              a.location, a.organizer, a.term, a.status, a.hasEvaluation,
              a.applicationEnabled, a.registrationEnabled, a.confirmationEnabled,
              a.registrationStart, a.registrationEnd,
              COALESCE(p.status, NULL) AS participationStatus,
              p.registrationQrToken
       FROM activity a
       LEFT JOIN participation p ON p.activityId = a.activityId AND p.studentId = ?
       ${isStudent ? "WHERE a.status = 'active' AND (a.applicationEnabled = 1 OR p.ParticipationId IS NOT NULL)" : ""}
       ORDER BY a.date DESC, a.time DESC`,
      [session.user.studentId || ""],
    );
    return NextResponse.json(rows.map((r) => ({
      activityId: r.activityId,
      title: r.activityName,
      description: r.description,
      date: r.date,
      time: r.time,
      endDate: r.endDate,
      endTime: r.endTime,
      location: r.location,
      organizer: r.organizer,
      term: r.term,
      status: r.status,
      hasEvaluation: Boolean(r.hasEvaluation),
      applicationEnabled: Boolean(r.applicationEnabled),
      registrationEnabled: Boolean(r.registrationEnabled),
      confirmationEnabled: Boolean(r.confirmationEnabled),
      registrationStart: r.registrationStart || null,
      registrationEnd: r.registrationEnd || null,
      registrationOpen: (() => {
        const now = new Date();
        const start = r.registrationStart ? new Date(String(r.registrationStart).replace(" ", "T") + "+07:00") : null;
        const end = r.registrationEnd ? new Date(String(r.registrationEnd).replace(" ", "T") + "+07:00") : null;
        const activityEnd = new Date(
          `${String(r.endDate || r.date).slice(0, 10)}T${String(r.endTime || r.time).slice(0, 8)}+07:00`,
        );
        return Boolean(start && end && now >= start && now < end && now < activityEnd);
      })(),
      participationStatus: r.participationStatus || null,
      registrationQrToken: r.registrationQrToken || null,
      qrPayload: r.registrationQrToken ? buildRegistrationQrPayload(r.activityId, r.registrationQrToken) : null,
    })));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!canManage(session)) throw httpError(403, "ไม่มีสิทธิ์จัดการ workflow กิจกรรม");
    if (!session?.user?.id) throw httpError(401, "กรุณาเข้าสู่ระบบ");
    await ensureActivityRegistrationColumns();
    await ensureParticipationStatusWorkflow();
    const body = await request.json();
    const activityId = String(body.activityId || "");
    const field = String(body.field || "");
    const value = Boolean(body.value);
    if (!activityId || !["applicationEnabled", "registrationEnabled", "confirmationEnabled"].includes(field)) throw httpError(400, "ข้อมูล workflow ไม่ถูกต้อง");
    const [activities] = await pool.query<any[]>(`SELECT activityId, createdBy, status, applicationEnabled, registrationEnabled, confirmationEnabled, hasEvaluation FROM activity WHERE activityId = ? LIMIT 1`, [activityId]);
    const activity = activities[0];
    if (!activity) throw httpError(404, "ไม่พบกิจกรรม");
    if (session.user.role === "teacher" && !session.user.isExecutive && activity.createdBy !== session.user.id) throw httpError(403, "คุณจัดการได้เฉพาะกิจกรรมที่สร้างเอง");
    if (field === "registrationEnabled" && value && !activity.applicationEnabled) throw httpError(400, "ต้องเปิดรับสมัครก่อน จึงจะเปิดรับลงทะเบียนได้");
    if (field === "confirmationEnabled" && value && !activity.hasEvaluation) throw httpError(400, "ต้องสร้างแบบประเมินก่อน จึงจะเปิดแบบประเมินกิจกรรมได้");
    await pool.query(`UPDATE activity SET ${field} = ? WHERE activityId = ?`, [value ? 1 : 0, activityId]);
    const [updated] = await pool.query<any[]>(`SELECT activityId, applicationEnabled, registrationEnabled, confirmationEnabled FROM activity WHERE activityId = ? LIMIT 1`, [activityId]);
    return NextResponse.json({ activityId, applicationEnabled: Boolean(updated[0].applicationEnabled), registrationEnabled: Boolean(updated[0].registrationEnabled), confirmationEnabled: Boolean(updated[0].confirmationEnabled) });
  } catch (error) {
    return jsonError(error);
  }
}
