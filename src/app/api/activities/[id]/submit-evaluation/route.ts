import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

const LEVEL_SCORE_MAP: Record<string, number> = {
  พื้นฐาน: 1,
  กลาง: 2,
  สูง: 3,
};

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { studentId, answers } = body;

    if (!studentId || !answers || !Array.isArray(answers)) {
      throw httpError(400, "ข้อมูลไม่ครบถ้วน (ต้องมี studentId และ answers)");
    }

    // ยืนยันสถานะจากฐานข้อมูลทุกครั้ง ไม่รับสิทธิ์จาก frontend
    const [participations] = await pool.query<any[]>(
      `
        SELECT ParticipationId, status, score
        FROM participation
        WHERE studentId = ? AND activityId = ?
        LIMIT 1
      `,
      [studentId, id],
    );

    const participation = participations[0];

    if (!participation) {
      throw httpError(403, "กรุณาสมัครกิจกรรมก่อน");
    }

    if (participation.status === "completed") {
      throw httpError(409, "คุณทำแบบประเมินกิจกรรมนี้แล้ว");
    }

    if (participation.status !== "confirmed") {
      throw httpError(403, "กรุณายืนยันการเข้าร่วมกิจกรรมก่อนทำแบบประเมิน");
    }

    const [activities] = await pool.query<any[]>(
      `SELECT activityId, activityName, evaluation, hours, hasEvaluation, confirmationEnabled FROM activity WHERE activityId = ?`,
      [id],
    );

    if (activities.length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const activity = activities[0];
    if (!activity.hasEvaluation || !activity.confirmationEnabled) {
      throw httpError(403, "ขณะนี้เจ้าหน้าที่ยังไม่เปิดแบบประเมินกิจกรรม");
    }

    let evaluation: any[] = [];
    try {
      evaluation = activity.evaluation
        ? typeof activity.evaluation === "string"
          ? JSON.parse(activity.evaluation)
          : activity.evaluation
        : [];
    } catch (error) {
      console.error("Parse evaluation error:", error);
      throw httpError(500, "ข้อมูลแบบประเมินไม่ถูกต้อง");
    }

    if (!Array.isArray(evaluation) || evaluation.length === 0) {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีแบบประเมิน");
    }

    const allQuestionsAnswered = evaluation.every((q: any) =>
      answers.some((a: any) => a.questionId === q.id),
    );

    if (!allQuestionsAnswered) {
      throw httpError(400, "กรุณาตอบคำถามให้ครบทุกข้อ");
    }

    const [skillRows] = await pool.query<any[]>(
      `SELECT skillname, level FROM activityskill WHERE activityId = ?`,
      [id],
    );

    const skillLevelMap: Record<string, string> = {};
    skillRows.forEach((row: any) => {
      skillLevelMap[row.skillname] = row.level || "กลาง";
    });

    const skillQuestionCount: Record<string, number> = {};
    evaluation.forEach((q: any) => {
      const skillNames = Array.isArray(q.skillNames) ? q.skillNames : [];
      skillNames.forEach((skillName: string) => {
        if (skillName) skillQuestionCount[skillName] = (skillQuestionCount[skillName] || 0) + 1;
      });
    });

    const skillMaxScore: Record<string, number> = {};
    Object.keys(skillQuestionCount).forEach((skillName) => {
      const level = skillLevelMap[skillName] || "กลาง";
      skillMaxScore[skillName] = (LEVEL_SCORE_MAP[level] || 2) * skillQuestionCount[skillName];
    });

    const skillEarnedScore: Record<string, number> = {};
    const details: any[] = [];

    answers.forEach((answer: any) => {
      const question = evaluation.find((q: any) => q.id === answer.questionId);
      if (!question) throw httpError(400, `ไม่พบคำถาม ID: ${answer.questionId}`);

      const isCorrect = Number(answer.selectedOption) === Number(question.correctAnswer);
      const skillNames = Array.isArray(question.skillNames) ? question.skillNames : [];

      if (isCorrect) {
        skillNames.forEach((skillName: string) => {
          if (!skillName) return;
          const level = skillLevelMap[skillName] || "กลาง";
          skillEarnedScore[skillName] = (skillEarnedScore[skillName] || 0) + (LEVEL_SCORE_MAP[level] || 2);
        });
      }

      details.push({ questionId: question.id, skillNames, isCorrect });
    });

    const normalizedScores: Record<string, number> = {};
    Object.keys(skillMaxScore).forEach((skillName) => {
      const earned = skillEarnedScore[skillName] || 0;
      const maxScore = skillMaxScore[skillName] || 0;
      normalizedScores[skillName] = maxScore > 0 ? Math.min(1, earned / maxScore) : 0;
    });

    const totalNormalizedScore = Object.values(normalizedScores).reduce((sum, value) => sum + value, 0);

    const skillScores = Object.keys(skillMaxScore).map((skillName) => ({
      skillName,
      level: skillLevelMap[skillName] || "กลาง",
      questions: skillQuestionCount[skillName] || 0,
      earnedScore: skillEarnedScore[skillName] || 0,
      maxScore: skillMaxScore[skillName] || 0,
      normalizedScore: normalizedScores[skillName] || 0,
    }));

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE participation SET status = 'completed', score = ?, hours = ? WHERE ParticipationId = ? AND studentId = ? AND activityId = ? AND status = 'confirmed'`,
        [
          totalNormalizedScore,
          activity.hours == null ? 0 : Number(activity.hours),
          participation.ParticipationId,
          studentId,
          id,
        ],
      );

      await connection.query(`DELETE FROM participation_skill WHERE participationId = ?`, [participation.ParticipationId]);

      if (skillScores.length > 0) {
        const values = skillScores.map((skill) => [
          participation.ParticipationId,
          skill.skillName,
          skill.earnedScore,
          skill.maxScore,
          skill.normalizedScore,
        ]);

        await connection.query(
          `INSERT INTO participation_skill (participationId, skillName, earnedScore, maxScore, normalizedScore) VALUES ?`,
          [values],
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

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
