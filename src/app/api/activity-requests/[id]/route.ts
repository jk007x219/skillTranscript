import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { nanoid } from "nanoid";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SkillDecision = {
  skill: string;
  level: string;
};

const levelScoreMap: Record<string, number> = {
  "พื้นฐาน": 1,
  "กลาง": 2,
  "สูง": 3,
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const connection = await pool.getConnection();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, reason, skills } = body as {
      status?: "approved" | "rejected";
      reason?: string;
      skills?: SkillDecision[];
    };

    if (!status || !["approved", "rejected"].includes(status)) {
      throw httpError(400, "สถานะการพิจารณาไม่ถูกต้อง");
    }

    const cleanedSkills = Array.isArray(skills)
      ? skills.filter((item) => item.skill && item.level)
      : [];

    if (status === "approved" && cleanedSkills.length === 0) {
      throw httpError(400, "กรุณากำหนดทักษะอย่างน้อย 1 รายการก่อนอนุมัติ");
    }

    await connection.beginTransaction();

    const [requestRows] = await connection.query<RowDataPacket[]>(
      `SELECT requestId, studentId, activityName, organizer, activityDate, activityEndDate, description, status, approvedActivityId
       FROM activity_request
       WHERE requestId = ?
       FOR UPDATE`,
      [id],
    );

    if (requestRows.length === 0) {
      throw httpError(404, "ไม่พบคำขอ");
    }

    const activityRequest = requestRows[0];
    if (activityRequest.status !== "pending") {
      throw httpError(409, "คำขอนี้ถูกพิจารณาแล้ว");
    }

    let approvedActivityId: string | null = null;

    if (status === "approved") {
      approvedActivityId = nanoid(20);
      const highestScore = Math.max(
        ...cleanedSkills.map((item) => levelScoreMap[item.level] || 2),
      );

      await connection.query(
        `INSERT INTO activity
          (activityId, activityName, description, date, time, endDate, endTime, hours, location, organizer, term, status, confirmationEnabled, hasEvaluation)
         VALUES (?, ?, ?, ?, NULL, ?, NULL, 0, ?, ?, ?, 'past', 0, 0)`,
        [
          approvedActivityId,
          activityRequest.activityName,
          activityRequest.description,
          activityRequest.activityDate,
          activityRequest.activityEndDate || activityRequest.activityDate,
          "กิจกรรมภายนอก",
          activityRequest.organizer,
          "ภายนอก",
        ],
      );

      const skillNames = cleanedSkills.map((item) => item.skill);
      const [skillRows] = await connection.query<RowDataPacket[]>(
        `SELECT skillId, skillname FROM skill WHERE skillname IN (${skillNames.map(() => "?").join(",")})`,
        skillNames,
      );
      const skillIdByName = new Map(
        skillRows.map((row) => [String(row.skillname), String(row.skillId)]),
      );

      await connection.query(
        `INSERT INTO activityskill (ActivitySkillId, activityId, skillId, skillname, level) VALUES ?`,
        [
          cleanedSkills.map((item) => [
            nanoid(20),
            approvedActivityId,
            skillIdByName.get(item.skill) || null,
            item.skill,
            item.level,
          ]),
        ],
      );

      await connection.query(
        `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status, score)
         VALUES (?, ?, ?, 0, CURDATE(), 'completed', ?)`,
        [nanoid(20), activityRequest.studentId, approvedActivityId, highestScore],
      );
    }

    await connection.query(
      `UPDATE activity_request
       SET status = ?, reason = ?, approvedActivityId = ?, reviewedAt = NOW()
       WHERE requestId = ?`,
      [status, reason || null, approvedActivityId, id],
    );

    await connection.query(
      `DELETE FROM activity_request_skill WHERE requestId = ?`,
      [id],
    );

    if (cleanedSkills.length > 0) {
      await connection.query(
        `INSERT INTO activity_request_skill (requestSkillId, requestId, skillname, level) VALUES ?`,
        [
          cleanedSkills.map((item) => [
            nanoid(20),
            id,
            item.skill,
            item.level,
          ]),
        ],
      );
    }

    await connection.commit();

    return NextResponse.json({
      message: status === "approved" ? "อนุมัติคำขอเรียบร้อยแล้ว" : "บันทึกผลไม่อนุมัติเรียบร้อยแล้ว",
      approvedActivityId,
    });
  } catch (error) {
    await connection.rollback();
    return jsonError(error);
  } finally {
    connection.release();
  }
}
