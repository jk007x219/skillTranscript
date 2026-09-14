import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

/**
 * คะแนนต่อข้อ ตามระดับทักษะ
 *
 * พื้นฐาน = 1 คะแนน/ข้อ
 * กลาง    = 2 คะแนน/ข้อ
 * สูง     = 3 คะแนน/ข้อ
 */
const LEVEL_SCORE_MAP: Record<string, number> = {
  พื้นฐาน: 1,
  กลาง: 2,
  สูง: 3,
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { studentId, answers } = body;

    // =========================================================
    // 1. ตรวจสอบข้อมูลที่ส่งเข้ามา
    // =========================================================
    if (!studentId || !answers || !Array.isArray(answers)) {
      throw httpError(400, "ข้อมูลไม่ครบถ้วน (ต้องมี studentId และ answers)");
    }

    // =========================================================
    // 2. ดึงข้อมูลกิจกรรมและแบบประเมิน
    // =========================================================
    const [activities] = await pool.query(
      `
      SELECT
        activityId,
        activityName,
        evaluation,
        hours
      FROM activity
      WHERE activityId = ?
      `,
      [id]
    );

    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const activity = (activities as any[])[0];

    let evaluation: any[] = [];
    try {
      evaluation = activity.evaluation
        ? typeof activity.evaluation === "string"
          ? JSON.parse(activity.evaluation)
          : activity.evaluation
        : null;
    } catch (error) {
      console.error("Parse evaluation error:", error);
      throw httpError(500, "ข้อมูลแบบประเมินไม่ถูกต้อง");
    }

    const activityHours =
      activity.hours === null || activity.hours === undefined
        ? 0
        : Number(activity.hours);

    if (!evaluation || !Array.isArray(evaluation) || evaluation.length === 0) {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีแบบประเมิน");
    }

    // =========================================================
    // 3. ตรวจสอบว่าทำแบบประเมินไปแล้วหรือยัง
    // =========================================================
    const [existing] = await pool.query(
      `
      SELECT
        ParticipationId,
        status,
        score
      FROM participation
      WHERE studentId = ?
        AND activityId = ?
      LIMIT 1
      `,
      [studentId, id]
    );

    const existingParticipation = (existing as any[])[0];

    if (existingParticipation && existingParticipation.status === "completed") {
      throw httpError(409, "คุณเคยทำแบบประเมินนี้แล้ว ไม่สามารถทำซ้ำได้");
    }
    if (!existingParticipation || existingParticipation.status !== "registered") {
      throw httpError(403, "กรุณาลงทะเบียนและยืนยันการเข้าร่วมกิจกรรมก่อนทำแบบประเมิน");
    }

    // =========================================================
    // 4. ตรวจสอบว่าตอบครบทุกข้อ
    // =========================================================
    const allQuestionsAnswered = evaluation.every((q: any) =>
      answers.some((a: any) => a.questionId === q.id)
    );

    if (!allQuestionsAnswered) {
      throw httpError(400, "กรุณาตอบคำถามให้ครบทุกข้อ");
    }

    // =========================================================
    // 5. ดึงข้อมูลทักษะของกิจกรรม
    // =========================================================
    const [skillRows] = await pool.query(
      `
      SELECT
        skillname,
        level
      FROM activityskill
      WHERE activityId = ?
      `,
      [id]
    );

    const skillLevelMap: Record<string, string> = {};
    (skillRows as any[]).forEach((row) => {
      skillLevelMap[row.skillname] = row.level || "กลาง";
    });

    // =========================================================
    // 6. นับจำนวนข้อของแต่ละทักษะ
    // =========================================================
    const skillQuestionCount: Record<string, number> = {};

    evaluation.forEach((q: any) => {
      const skillNames = Array.isArray(q.skillNames) ? q.skillNames : [];
      skillNames.forEach((skillName: string) => {
        if (!skillName) return;
        if (!skillQuestionCount[skillName]) {
          skillQuestionCount[skillName] = 0;
        }
        skillQuestionCount[skillName]++;
      });
    });

    // =========================================================
    // 7. คำนวณคะแนนเต็มของแต่ละทักษะ
    // =========================================================
    const skillMaxScore: Record<string, number> = {};

    Object.keys(skillQuestionCount).forEach((skillName) => {
      const level = skillLevelMap[skillName] || "กลาง";
      const levelScore = LEVEL_SCORE_MAP[level] || 2;
      const questionCount = skillQuestionCount[skillName] || 0;
      skillMaxScore[skillName] = levelScore * questionCount;
    });

    // =========================================================
    // 8. คำนวณคะแนนที่ได้ของแต่ละทักษะ
    // =========================================================
    const skillEarnedScore: Record<string, number> = {};
    const details: any[] = [];

    answers.forEach((answer: any) => {
      const question = evaluation.find((q: any) => q.id === answer.questionId);
      if (!question) {
        throw httpError(400, `ไม่พบคำถาม ID: ${answer.questionId}`);
      }

      const isCorrect = Number(answer.selectedOption) === Number(question.correctAnswer);
      const skillNames = Array.isArray(question.skillNames) ? question.skillNames : [];

      if (isCorrect) {
        skillNames.forEach((skillName: string) => {
          if (!skillName) return;
          if (!skillEarnedScore[skillName]) {
            skillEarnedScore[skillName] = 0;
          }

          const level = skillLevelMap[skillName] || "กลาง";
          const scorePerQuestion = LEVEL_SCORE_MAP[level] || 2;
          skillEarnedScore[skillName] += scorePerQuestion;
        });
      }

      details.push({
        questionId: question.id,
        skillNames,
        isCorrect,
      });
    });

    // =========================================================
    // 9. คำนวณ normalized score ของแต่ละทักษะ
    // =========================================================
    const normalizedScores: Record<string, number> = {};

    Object.keys(skillMaxScore).forEach((skillName) => {
      const earned = skillEarnedScore[skillName] || 0;
      const maxScore = skillMaxScore[skillName] || 0;
      normalizedScores[skillName] = maxScore > 0 ? Math.min(1, earned / maxScore) : 0;
    });

    // =========================================================
    // 10. คำนวณคะแนนรวมของ Activity
    // =========================================================
    let totalNormalizedScore = 0;
    Object.values(normalizedScores).forEach((value) => {
      totalNormalizedScore += value;
    });

    // =========================================================
    // 11. เตรียมข้อมูล skillScores
    // =========================================================
    const skillScores = Object.keys(skillMaxScore).map((skillName) => {
      const earned = skillEarnedScore[skillName] || 0;
      const maxScore = skillMaxScore[skillName] || 0;
      const normalizedScore = normalizedScores[skillName] || 0;

      return {
        skillName,
        level: skillLevelMap[skillName] || "กลาง",
        questions: skillQuestionCount[skillName] || 0,
        earnedScore: earned,
        maxScore,
        normalizedScore,
      };
    });

    // =========================================================
    // 12. บันทึกข้อมูลลงฐานข้อมูล
    // =========================================================
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let participationId: string;

      if (existingParticipation) {
        participationId = existingParticipation.ParticipationId;

        await connection.query(
          `
          UPDATE participation
          SET
            status = 'completed',
            score = ?,
            hours = ?
          WHERE ParticipationId = ?
          `,
          [totalNormalizedScore, activityHours, participationId]
        );
      } else {
        participationId = nanoid(20);

        await connection.query(
          `
          INSERT INTO participation (
            ParticipationId,
            studentId,
            activityId,
            hours,
            joinDate,
            status,
            score
          )
          VALUES (?, ?, ?, ?, CURDATE(), 'completed', ?)
          `,
          [participationId, studentId, id, activityHours, totalNormalizedScore]
        );
      }

      // ลบคะแนน Skill เดิม
      await connection.query(
        `
        DELETE FROM participation_skill
        WHERE participationId = ?
        `,
        [participationId]
      );

      // บันทึกคะแนนแยกตาม Skill
      if (skillScores.length > 0) {
        const values = skillScores.map((skill) => [
          participationId,
          skill.skillName,
          skill.earnedScore,
          skill.maxScore,
          skill.normalizedScore,
        ]);

        await connection.query(
          `
          INSERT INTO participation_skill (
            participationId,
            skillName,
            earnedScore,
            maxScore,
            normalizedScore
          )
          VALUES ?
          `,
          [values]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // =========================================================
    // 13. ส่งผลลัพธ์กลับไปให้ Frontend
    // =========================================================
    return NextResponse.json({
      message: "ประเมินสำเร็จ",
      passed: true,
      totalScore: totalNormalizedScore,
      skillScores,
      details,
    });
  } catch (error) {
    console.error("Submit evaluation error:", error);
    return jsonError(error);
  }
}
