// app/api/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";
import { auth } from "@/auth";

function splitDateTime(value: string) {
  const [date, time] = value.split("T");
  return {
    date,
    time: time ? `${time}:00` : null,
  };
}

function calculateHours(start: Date, end: Date) {
  return Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visible = searchParams.get("visible") === "true";
    const studentId = searchParams.get("studentId");
    const session = await auth();
    const role = session?.user?.role;
    const isExecutive = Boolean(session?.user?.isExecutive);

    let query = `
      SELECT 
        a.activityId, a.activityName, a.description, a.date, a.time,
        a.endDate, a.endTime, a.hours,
        a.location, a.organizer, a.term, a.status, 
        a.confirmationEnabled, a.hasEvaluation, a.evaluation,
        a.verification_code, a.code_expires_at, a.createdBy, a.templateId,
        COUNT(p.ParticipationId) as attendeeCount,
        MAX(sp.status) as participationStatus,
        MAX(sp.score) as participationScore
      FROM activity a
      LEFT JOIN participation p ON a.activityId = p.activityId
      ${
        studentId
          ? `LEFT JOIN participation sp
             ON a.activityId = sp.activityId
            AND sp.studentId = ?`
          : "LEFT JOIN participation sp ON 1 = 0"
      }
    `;

    const values: any[] = [];
    if (studentId) values.push(studentId);

    const conditions: string[] = [];

    if (role === "teacher" && !isExecutive && session?.user?.id) {
      conditions.push(`a.createdBy = ?`);
      values.push(session.user.id);
    }

    if (visible) {
      if (studentId) {
        conditions.push(`a.hasEvaluation = 1`);
        conditions.push(`a.confirmationEnabled = 1`);
        conditions.push(`a.status = 'active'`);
        conditions.push(`(sp.ParticipationId IS NULL OR sp.status <> 'completed' OR sp.score IS NULL)`);
      } else {
        conditions.push(`a.confirmationEnabled = 1`);
        conditions.push(`a.hasEvaluation = 1`);
        conditions.push(`a.status = 'active'`);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      GROUP BY a.activityId
      ORDER BY a.date DESC
    `;

    const [activities] = await pool.query(query, values);

    // ดึง skills
    const [skills] = await pool.query(`
      SELECT activityId, skillId, skillname, level
      FROM activityskill
    `);

    const skillMap: Record<string, any[]> = {};
    (skills as any[]).forEach((skill) => {
      if (!skillMap[skill.activityId]) skillMap[skill.activityId] = [];
      skillMap[skill.activityId].push({
        skillId: skill.skillId,
        name: skill.skillname,
        level: skill.level || "กลาง",
      });
    });

    const result = (activities as any[]).map((act) => ({
      id: act.activityId,
      title: act.activityName,
      description: act.description,
      date: act.date,
      time: act.time,
      endDate: act.endDate,
      endTime: act.endTime,
      hours: act.hours === null ? null : Number(act.hours),
      location: act.location,
      organizer: act.organizer,
      term: act.term,
      status: act.status || "active",
      attendeeCount: act.attendeeCount || 0,
      confirmationEnabled: Boolean(act.confirmationEnabled),
      hasEvaluation: Boolean(act.hasEvaluation),
      participationStatus: act.participationStatus || null,
      participationScore: act.participationScore === null ? null : Number(act.participationScore),
      evaluation: act.evaluation ? JSON.parse(act.evaluation) : undefined,
      skills: skillMap[act.activityId] || [],
      verificationCode: act.verification_code,
      codeExpiresAt: act.code_expires_at,
      createdBy: act.createdBy,
      templateId: act.templateId,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const isExecutive = Boolean(session?.user?.isExecutive);
    if (!session?.user?.id || !["teacher", "officer", "executive"].includes(role || "") && !isExecutive) {
      throw httpError(403, "ไม่มีสิทธิ์สร้างกิจกรรม");
    }

    const body = await request.json();

    const {
      title,
      description,
      dateTime,
      endDateTime,
      term,
      location,
      selectedSkills,
      organizer,
      templateId,
    } = body;

    if (!title || !dateTime || !endDateTime) {
      throw httpError(400, "กรุณากรอกชื่อกิจกรรม วันที่เวลาเริ่มต้น และวันที่เวลาสิ้นสุด");
    }

    const requestedTemplate = typeof templateId === "string" ? templateId.trim() : "";
    let finalTemplateId: string | null = null;

    if (requestedTemplate) {
      const [templateRows] = await pool.query(
        `SELECT templateId, status FROM template WHERE (templateId = ? OR name = ?) AND status = 'active' LIMIT 1`,
        [requestedTemplate, requestedTemplate]
      );
      if ((templateRows as any[]).length === 0) {
        throw httpError(400, "แม่แบบที่เลือกไม่ถูกต้องหรือไม่พร้อมใช้งาน");
      }
      finalTemplateId = (templateRows as any[])[0].templateId;
    }

    const startDateTime = new Date(dateTime);
    const finishDateTime = new Date(endDateTime);
    if (!Number.isFinite(startDateTime.getTime()) || !Number.isFinite(finishDateTime.getTime())) {
      throw httpError(400, "รูปแบบวันที่เวลาไม่ถูกต้อง");
    }
    if (startDateTime.getTime() < Date.now() - 60_000) {
      throw httpError(400, "ไม่สามารถเลือกวันที่หรือเวลาย้อนหลังได้");
    }
    if (finishDateTime <= startDateTime) {
      throw httpError(400, "วันที่เวลาสิ้นสุดต้องมากกว่าวันที่เวลาเริ่มต้น");
    }

    const activityId = nanoid(20);
    const start = splitDateTime(dateTime);
    const finish = splitDateTime(endDateTime);
    const hours = calculateHours(startDateTime, finishDateTime);

    await pool.query(
      `INSERT INTO activity 
        (activityId, activityName, description, date, time, endDate, endTime, hours, location, organizer, term, status, confirmationEnabled, hasEvaluation, createdBy, templateId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0, ?, ?)`,
      [
        activityId,
        title,
        description || "",
        start.date,
        start.time,
        finish.date,
        finish.time,
        hours,
        location || "",
        organizer || "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
        term || "1",
        session.user.id,
        finalTemplateId,
      ]
    );

    if (selectedSkills && selectedSkills.length > 0) {
      const skillValues = selectedSkills.map((skill: any) => [
        nanoid(20),
        activityId,
        skill.skillId || null,
        skill.name,
        skill.level || "กลาง",
      ]);
      await pool.query(
        `INSERT INTO activityskill (ActivitySkillId, activityId, skillId, skillname, level) VALUES ?`,
        [skillValues]
      );
    }

    return NextResponse.json(
      { message: "เพิ่มกิจกรรมสำเร็จ", activityId },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
