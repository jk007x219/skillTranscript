// app/api/activities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";

// helper: แยกวันที่และเวลาจาก datetime-local string
function splitDateTime(value: string) {
  const [date, time] = value.split("T");
  return {
    date,
    time: time ? `${time}:00` : null,
  };
}

// helper: คำนวณชั่วโมง
function calculateActivityHours(start: string, end: string) {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return 0;
  return Math.round(((endTime - startTime) / 3_600_000) * 100) / 100;
}

// ========== GET ==========
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const [activities] = await pool.query(
      `SELECT 
         a.*, a.verification_code, a.code_expires_at,
         t.templateId AS certificateTemplateId,
         t.name AS certificateTemplateName,
         t.imageUrl AS certificateTemplateImageUrl,
         t.fileType AS certificateTemplateFileType
       FROM activity a
       LEFT JOIN template t ON t.templateId = a.templateId
       WHERE a.activityId = ?`,
      [id]
    );
    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }
    const act = (activities as any[])[0];
    const [skills] = await pool.query(
      `SELECT skillId, skillname, level FROM activityskill WHERE activityId = ?`,
      [id]
    );

    let alreadySubmitted = false;
    let participationStatus = null;
    let participationScore = null;
    if (studentId) {
      const [existing] = await pool.query(
        `SELECT status, score FROM participation 
         WHERE studentId = ? AND activityId = ?
         LIMIT 1`,
        [studentId, id]
      );
      const participation = (existing as any[])[0];
      alreadySubmitted =
        participation?.status === "completed" &&
        participation.score !== null &&
        participation.score !== undefined;
      participationStatus = participation?.status || null;
      participationScore =
        participation?.score === null || participation?.score === undefined
          ? null
          : Number(participation.score);
    }

    return NextResponse.json({
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
      status: act.status,
      attendeeCount: act.attendeeCount || 0,
      confirmationEnabled: Boolean(act.confirmationEnabled),
      hasEvaluation: Boolean(act.hasEvaluation),
      evaluation: act.evaluation ? JSON.parse(act.evaluation) : null,
      skills: (skills as any[]).map((s) => ({
        name: s.skillname,
        level: s.level || "กลาง",
      })),
      verificationCode: act.verification_code,
      codeExpiresAt: act.code_expires_at,
      createdBy: act.createdBy,
      templateId: act.templateId,
      template: act.certificateTemplateId
        ? {
            id: act.certificateTemplateId,
            templateId: act.certificateTemplateId,
            name: act.certificateTemplateName,
            imageUrl: act.certificateTemplateImageUrl,
            fileType: act.certificateTemplateFileType,
          }
        : null,
      participationStatus,
      participationScore,
      alreadySubmitted,
    });
  } catch (error) {
    return jsonError(error);
  }
}

// ========== PUT ==========
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      dateTime,
      endDateTime,
      term,
      location,
      organizer,
      status,
      selectedSkills,
      confirmationEnabled,
      hasEvaluation,
      evaluation,
      verificationCode,
      codeExpiresAt,
    } = body;

    const updates: string[] = [];
    const values: any[] = [];

    const addUpdate = (field: string, value: any, transform?: (v: any) => any) => {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        values.push(transform ? transform(value) : value);
      }
    };

    addUpdate("activityName", title);
    addUpdate("description", description);
    addUpdate("term", term);
    addUpdate("location", location);
    addUpdate("organizer", organizer);
    addUpdate("status", status);

    if (dateTime !== undefined) {
      const start = splitDateTime(dateTime);
      addUpdate("date", start.date);
      addUpdate("time", start.time);
    }
    if (endDateTime !== undefined) {
      const finish = splitDateTime(endDateTime);
      addUpdate("endDate", finish.date);
      addUpdate("endTime", finish.time);
    }

    if (dateTime !== undefined && endDateTime !== undefined) {
      const startDate = new Date(dateTime);
      const endDate = new Date(endDateTime);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate > startDate) {
        const hours = calculateActivityHours(dateTime, endDateTime);
        addUpdate("hours", hours);
      }
    }

    if (confirmationEnabled !== undefined) {
      addUpdate("confirmationEnabled", confirmationEnabled, (v: boolean) => (v ? 1 : 0));
    }
    if (hasEvaluation !== undefined) {
      addUpdate("hasEvaluation", hasEvaluation, (v: boolean) => (v ? 1 : 0));
    }
    if (evaluation !== undefined) {
      addUpdate("evaluation", JSON.stringify(evaluation));
    }
    if (verificationCode !== undefined) {
      addUpdate("verification_code", verificationCode);
    }
    if (codeExpiresAt !== undefined) {
      addUpdate("code_expires_at", codeExpiresAt);
    }

    if (updates.length === 0) {
      throw httpError(400, "ไม่มีข้อมูลที่จะอัปเดต");
    }

    await connection.beginTransaction();

    values.push(id);
    const query = `UPDATE activity SET ${updates.join(", ")} WHERE activityId = ?`;
    await connection.query(query, values);

    if (selectedSkills !== undefined && Array.isArray(selectedSkills)) {
      await connection.query("DELETE FROM activityskill WHERE activityId = ?", [id]);

      if (selectedSkills.length > 0) {
        const skillValues = selectedSkills.map((skill: any) => [
          nanoid(20),
          id,
          skill.skillId || null,
          skill.name,
          skill.level || "กลาง",
        ]);
        await connection.query(
          `INSERT INTO activityskill (ActivitySkillId, activityId, skillId, skillname, level) VALUES ?`,
          [skillValues]
        );
      }
    }

    await connection.commit();

    const [updated] = await pool.query(
      `SELECT * FROM activity WHERE activityId = ?`,
      [id]
    );
    const act = (updated as any[])[0];

    return NextResponse.json({
      message: "อัปเดตกิจกรรมสำเร็จ",
      activity: {
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
        status: act.status,
        confirmationEnabled: Boolean(act.confirmationEnabled),
        hasEvaluation: Boolean(act.hasEvaluation),
      },
    });
  } catch (error) {
    await connection.rollback();
    return jsonError(error);
  } finally {
    connection.release();
  }
}

// ========== DELETE ==========
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;

    // ตรวจสอบว่ามีกิจกรรมนี้อยู่
    const [rows] = await pool.query(
      "SELECT activityId FROM activity WHERE activityId = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    await connection.beginTransaction();

    // 1. ลบ activityskill (FK อ้างอิง activityId)
    await connection.query("DELETE FROM activityskill WHERE activityId = ?", [id]);

    // 2. ลบ participation (FK อ้างอิง activityId)
    await connection.query("DELETE FROM participation WHERE activityId = ?", [id]);

    // 3. ลบ activity (ตอนนี้ไม่มี child แล้ว)
    await connection.query("DELETE FROM activity WHERE activityId = ?", [id]);

    await connection.commit();

    return NextResponse.json({ message: "ลบกิจกรรมสำเร็จ" });
  } catch (error) {
    await connection.rollback();
    return jsonError(error);
  } finally {
    connection.release();
  }
}