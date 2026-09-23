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

async function ensureActivityCapacityColumn() {
  const [rows] = await pool.query<any[]>(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'activity'
       AND COLUMN_NAME = 'capacity'`,
  );
  if (!Number(rows[0]?.count)) {
    await pool.query(`ALTER TABLE activity ADD COLUMN capacity INT NOT NULL DEFAULT 30`);
  }
}

function canManage(session: any) {
  const role = session?.user?.role;
  return Boolean(session?.user?.id && (["teacher", "officer", "executive"].includes(role) || session?.user?.isExecutive));
}

export async function GET() {
  try {
    const session = await auth();
    await ensureActivityRegistrationColumns();
    await ensureActivityCapacityColumn();
    await ensureParticipationStatusWorkflow();

    const isStudent = session?.user?.role === "student";
    const isPublic = !session?.user?.id;
    const [rows] = await pool.query<any[]>(
      `SELECT a.activityId, a.activityName, a.description, a.date, a.time, a.endDate, a.endTime,
              a.location, a.organizer, a.term, a.status, a.hasEvaluation,
              a.applicationEnabled, a.registrationEnabled, a.confirmationEnabled,
              a.registrationStart, a.registrationEnd, a.capacity,
              (SELECT COUNT(*) FROM participation pc WHERE pc.activityId = a.activityId) AS applicantCount,
              COALESCE(p.status, NULL) AS participationStatus,
              p.registrationQrToken, p.studentId
       FROM activity a
       LEFT JOIN participation p ON p.activityId = a.activityId AND p.studentId = ?
       ${isPublic
         ? "WHERE a.status = 'active'"
         : isStudent
           ? "WHERE (a.status = 'active' OR p.status IN ('applied', 'registered', 'confirmed'))"
           : ""}
       ${isStudent
         ? "AND (a.applicationEnabled = 1 OR p.status IN ('applied', 'registered', 'confirmed'))"
         : ""}
       ORDER BY a.date DESC, a.time DESC, a.activityId ASC`,
      [session?.user?.studentId || ""],
    );

    const activityIds = rows.map((r: any) => r.activityId).filter(Boolean);
    const skillMap: Record<string, Array<{ skillId?: string | null; name: string; level: string }>> = {};
    if (activityIds.length > 0) {
      const placeholders = activityIds.map(() => "?").join(", ");
      const [skillRows] = await pool.query<any[]>(
        `SELECT activityId, skillId, skillname, level
         FROM activityskill
         WHERE activityId IN (${placeholders})
         ORDER BY activityId, skillname`,
        activityIds,
      );
      for (const skill of skillRows) {
        if (!skillMap[skill.activityId]) skillMap[skill.activityId] = [];
        skillMap[skill.activityId].push({
          skillId: skill.skillId || null,
          name: String(skill.skillname || "ทักษะทั่วไป"),
          level: String(skill.level || "กลาง"),
        });
      }
    }

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
      capacity: Number(r.capacity ?? 0),
      applicantCount: Number(r.applicantCount ?? 0),
      isFull: Number(r.capacity ?? 0) > 0 && Number(r.applicantCount ?? 0) >= Number(r.capacity ?? 0),
      registrationOpen: (() => {
        const now = new Date();
        const parseBangkokDateTime = (value: unknown): Date | null => {
          if (!value) return null;
          if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
          const raw = String(value).trim();
          if (!raw) return null;
          let normalized = raw.replace(" ", "T");
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) normalized += ":00";
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) normalized += "+07:00";
          const parsed = new Date(normalized);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };
        const start = parseBangkokDateTime(r.registrationStart);
        const end = parseBangkokDateTime(r.registrationEnd);
        const activityEnd = parseBangkokDateTime(`${String(r.endDate || r.date).slice(0, 10)}T${String(r.endTime || r.time).slice(0, 8)}`);
        return Boolean(start && end && activityEnd && now >= start && now < end && now < activityEnd);
      })(),
      skills: skillMap[r.activityId] || [],
      participationStatus: isPublic ? null : r.participationStatus || null,
      registrationQrToken: isPublic ? null : r.registrationQrToken || null,
      qrPayload: isPublic
        ? null
        : r.registrationQrToken
          ? buildRegistrationQrPayload(r.activityId, r.registrationQrToken)
          : null,
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
    const value = body.value;
    if (!activityId || !["applicationEnabled", "registrationEnabled", "confirmationEnabled", "status"].includes(field)) throw httpError(400, "ข้อมูล workflow ไม่ถูกต้อง");
    const [activities] = await pool.query<any[]>(`SELECT activityId, createdBy, status, applicationEnabled, registrationEnabled, confirmationEnabled, hasEvaluation FROM activity WHERE activityId = ? LIMIT 1`, [activityId]);
    const activity = activities[0];
    if (!activity) throw httpError(404, "ไม่พบกิจกรรม");
    if (session.user.role === "teacher" && !session.user.isExecutive && activity.createdBy !== session.user.id) throw httpError(403, "คุณจัดการได้เฉพาะกิจกรรมที่สร้างเอง");
    if (field === "confirmationEnabled" && Boolean(value) && !activity.hasEvaluation) throw httpError(400, "ต้องสร้างแบบประเมินก่อน จึงจะเปิดแบบประเมินกิจกรรมได้");
    if (field === "status" && value !== "active" && value !== "past") throw httpError(400, "สถานะกิจกรรมไม่ถูกต้อง");
    await pool.query(
      field === "status"
        ? `UPDATE activity SET status = ? WHERE activityId = ?`
        : `UPDATE activity SET ${field} = ? WHERE activityId = ?`,
      field === "status" ? [value, activityId] : [Boolean(value) ? 1 : 0, activityId],
    );
    const [updated] = await pool.query<any[]>(`SELECT activityId, status, applicationEnabled, registrationEnabled, confirmationEnabled FROM activity WHERE activityId = ? LIMIT 1`, [activityId]);
    return NextResponse.json({ activityId, status: updated[0].status, applicationEnabled: Boolean(updated[0].applicationEnabled), registrationEnabled: Boolean(updated[0].registrationEnabled), confirmationEnabled: Boolean(updated[0].confirmationEnabled) });
  } catch (error) {
    return jsonError(error);
  }
}
