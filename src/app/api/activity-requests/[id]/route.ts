// app/api/activity-requests/[id]/route.ts

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

/**
 * คะแนนตามระดับ
 *
 * พื้นฐาน  = 1/1
 * ปานกลาง = 2/2
 * กลาง     = 2/2  // รองรับข้อมูลเดิม
 * สูง      = 3/3
 */
const levelScoreMap: Record<string, number> = {
  พื้นฐาน: 1,
  ปานกลาง: 2,
  กลาง: 2,
  สูง: 3,
};

function normalizeLevel(level: string): string {
  const value = String(level || "").trim();

  if (value === "กลาง") {
    return "ปานกลาง";
  }

  return value;
}

function getLevelScore(level: string): number {
  const normalizedLevel = normalizeLevel(level);
  return levelScoreMap[normalizedLevel] ?? 0;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const connection = await pool.getConnection();

  try {
    const { id } = await context.params;

    const body = await request.json();

    const {
      status,
      reason,
      skills,
    } = body as {
      status?: "approved" | "rejected";
      reason?: string;
      skills?: SkillDecision[];
    };

    if (!status || !["approved", "rejected"].includes(status)) {
      throw httpError(400, "สถานะการพิจารณาไม่ถูกต้อง");
    }

    /**
     * ทำความสะอาดรายการทักษะ
     */
    const cleanedSkills: SkillDecision[] = Array.isArray(skills)
      ? skills
          .filter(
            (item) =>
              item &&
              typeof item.skill === "string" &&
              item.skill.trim() &&
              typeof item.level === "string" &&
              item.level.trim(),
          )
          .map((item) => ({
            skill: item.skill.trim(),
            level: normalizeLevel(item.level),
          }))
      : [];

    if (status === "approved" && cleanedSkills.length === 0) {
      throw httpError(
        400,
        "กรุณากำหนดทักษะอย่างน้อย 1 รายการก่อนอนุมัติ",
      );
    }

    /**
     * ตรวจสอบว่าระดับที่ส่งมามีคะแนนจริง
     */
    if (status === "approved") {
      for (const item of cleanedSkills) {
        const score = getLevelScore(item.level);

        if (score <= 0) {
          throw httpError(
            400,
            `ไม่พบระดับทักษะ "${item.level}" ของทักษะ "${item.skill}"`,
          );
        }
      }
    }

    /**
     * ป้องกันการเลือกทักษะซ้ำ
     */
    const uniqueSkillNames = new Set(
      cleanedSkills.map((item) => item.skill),
    );

    if (uniqueSkillNames.size !== cleanedSkills.length) {
      throw httpError(
        400,
        "ไม่สามารถกำหนดทักษะเดียวกันซ้ำมากกว่า 1 รายการได้",
      );
    }

    await connection.beginTransaction();

    /**
     * =========================================================
     * 1. อ่านคำขอ
     * =========================================================
     */
    const [requestRows] = await connection.query<RowDataPacket[]>(
      `SELECT
         requestId,
         studentId,
         activityName,
         organizer,
         activityDate,
         activityEndDate,
         description,
         status,
         approvedActivityId
       FROM activity_request
       WHERE requestId = ?
       FOR UPDATE`,
      [id],
    );

    if (requestRows.length === 0) {
      throw httpError(404, "ไม่พบคำขอกิจกรรม");
    }

    const activityRequest = requestRows[0];

    if (activityRequest.status !== "pending") {
      throw httpError(
        409,
        "คำขอนี้ถูกพิจารณาแล้ว",
      );
    }

    let approvedActivityId: string | null = null;

    /**
     * =========================================================
     * 2. กรณีอนุมัติ
     * =========================================================
     */
    if (status === "approved") {
      approvedActivityId = nanoid(20);

      /**
       * คะแนนรวมของกิจกรรม
       *
       * ตัวอย่าง:
       * พื้นฐาน 1
       * ปานกลาง 2
       * สูง 3
       *
       * รวม = 6
       */
      const totalScore = cleanedSkills.reduce(
        (sum, item) => sum + getLevelScore(item.level),
        0,
      );

      /**
       * =======================================================
       * สร้าง Activity
       * =======================================================
       */
      await connection.query(
        `INSERT INTO activity
          (
            activityId,
            activityName,
            description,
            date,
            time,
            endDate,
            endTime,
            hours,
            location,
            organizer,
            term,
            status,
            confirmationEnabled,
            hasEvaluation
          )
         VALUES (?, ?, ?, ?, NULL, ?, NULL, 0, ?, ?, ?, 'past', 0, 0)`,
        [
          approvedActivityId,
          activityRequest.activityName,
          activityRequest.description,
          activityRequest.activityDate,
          activityRequest.activityEndDate ||
            activityRequest.activityDate,
          "กิจกรรมภายนอก",
          activityRequest.organizer,
          "ภายนอก",
        ],
      );

      /**
       * =======================================================
       * หา skillId จากชื่อทักษะ
       * =======================================================
       */
      const skillNames = cleanedSkills.map(
        (item) => item.skill,
      );

      const [skillRows] = await connection.query<RowDataPacket[]>(
        `SELECT
           skillId,
           skillname
         FROM skill
         WHERE skillname IN (${skillNames
           .map(() => "?")
           .join(",")})`,
        skillNames,
      );

      const skillIdByName = new Map<string, string>();

      skillRows.forEach((row) => {
        skillIdByName.set(
          String(row.skillname),
          String(row.skillId),
        );
      });

      /**
       * =======================================================
       * 3. บันทึก ActivitySkill
       * =======================================================
       */
      await connection.query(
        `INSERT INTO activityskill
          (
            ActivitySkillId,
            activityId,
            skillId,
            skillname,
            level
          )
         VALUES ?`,
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

      /**
       * =======================================================
       * 4. สร้าง Participation
       * =======================================================
       *
       * score = คะแนนรวมของทุกทักษะ
       *
       * ตัวอย่าง:
       * 1 + 2 + 3 = 6
       */
      const participationId = nanoid(20);

      await connection.query(
        `INSERT INTO participation
          (
            ParticipationId,
            studentId,
            activityId,
            hours,
            joinDate,
            status,
            score
          )
         VALUES (?, ?, ?, 0, ?, 'completed', ?)`,
        [
          participationId,
          activityRequest.studentId,
          approvedActivityId,
          activityRequest.activityDate,
          totalScore,
        ],
      );

      /**
       * =======================================================
       * 5. สำคัญที่สุด
       * สร้าง ParticipationSkill แยกตามทักษะ
       * =======================================================
       *
       * พื้นฐาน  -> earnedScore 1 / maxScore 1
       * ปานกลาง -> earnedScore 2 / maxScore 2
       * สูง      -> earnedScore 3 / maxScore 3
       *
       * ไม่มี Evaluation
       */
      await connection.query(
        `INSERT INTO participation_skill
          (
            participationId,
            skillName,
            earnedScore,
            maxScore
          )
         VALUES ?`,
        [
          cleanedSkills.map((item) => {
            const score = getLevelScore(item.level);

            return [
              participationId,
              item.skill,
              score,
              score,
            ];
          }),
        ],
      );
    }

    /**
     * =========================================================
     * 6. อัปเดตสถานะคำขอ
     * =========================================================
     */
    await connection.query(
      `UPDATE activity_request
       SET
         status = ?,
         reason = ?,
         approvedActivityId = ?,
         reviewedAt = NOW()
       WHERE requestId = ?`,
      [
        status,
        reason?.trim() || null,
        approvedActivityId,
        id,
      ],
    );

    /**
     * =========================================================
     * 7. บันทึกทักษะที่เจ้าหน้าที่กำหนดไว้ในคำขอ
     * =========================================================
     */
    await connection.query(
      `DELETE FROM activity_request_skill
       WHERE requestId = ?`,
      [id],
    );

    if (cleanedSkills.length > 0) {
      await connection.query(
        `INSERT INTO activity_request_skill
          (
            requestSkillId,
            requestId,
            skillname,
            level
          )
         VALUES ?`,
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
      message:
        status === "approved"
          ? "อนุมัติคำขอและบันทึกคะแนนทักษะเรียบร้อยแล้ว"
          : "บันทึกผลไม่อนุมัติเรียบร้อยแล้ว",

      approvedActivityId,

      /**
       * ส่งกลับไปให้ Frontend ใช้แสดงผลได้
       */
      skills:
        status === "approved"
          ? cleanedSkills.map((item) => ({
              skill: item.skill,
              level: item.level,
              earnedScore: getLevelScore(item.level),
              maxScore: getLevelScore(item.level),
            }))
          : [],
    });
  } catch (error) {
    await connection.rollback();
    return jsonError(error);
  } finally {
    connection.release();
  }
}