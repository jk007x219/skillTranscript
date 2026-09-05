import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { studentId, answers } = body;

    if (!studentId || !answers || !Array.isArray(answers)) {
      throw httpError(400, "ข้อมูลไม่ครบถ้วน");
    }

    const [activities] = await pool.query(
      `SELECT activityId, activityName, evaluation, hours FROM activity WHERE activityId = ?`,
      [id]
    );
    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const activity = (activities as any[])[0];
    const evaluation = activity.evaluation ? JSON.parse(activity.evaluation) : null;
    const activityHours = activity.hours === null || activity.hours === undefined ? 0 : Number(activity.hours);

    if (!evaluation || evaluation.length === 0) {
      throw httpError(400, "กิจกรรมนี้ยังไม่มีแบบประเมิน");
    }

    const [existing] = await pool.query(
      `SELECT status, score FROM participation WHERE studentId = ? AND activityId = ? LIMIT 1`,
      [studentId, id]
    );

    const existingParticipation = (existing as any[])[0];
    if (
      existingParticipation?.status === "completed" &&
      existingParticipation.score !== null &&
      existingParticipation.score !== undefined
    ) {
      throw httpError(409, "คุณเคยทำแบบประเมินนี้แล้ว ไม่สามารถทำซ้ำได้");
    }

    const allQuestionsAnswered = evaluation.every((q: any) =>
      answers.some((a: any) => a.questionId === q.id)
    );
    if (!allQuestionsAnswered) {
      throw httpError(400, "กรุณาตอบคำถามให้ครบทุกข้อ");
    }

    const [skillRows] = await pool.query(
      `SELECT skillId, skillname, level FROM activityskill WHERE activityId = ?`,
      [id]
    );

    const skillLevelMap: Record<string, string> = {};
    (skillRows as any[]).forEach((row) => {
      skillLevelMap[row.skillname] = row.level || "กลาง";
    });

    const levelScoreMap: Record<string, number> = {
      "พื้นฐาน": 1,
      "กลาง": 2,
      "สูง": 3,
    };

    const skillQuestionCount: Record<string, number> = {};
    evaluation.forEach((q: any) => {
      if (!skillQuestionCount[q.skillName]) {
        skillQuestionCount[q.skillName] = 0;
      }
      skillQuestionCount[q.skillName]++;
    });

    const scorePerQuestion: Record<string, number> = {};
    Object.keys(skillQuestionCount).forEach((skillName) => {
      const level = skillLevelMap[skillName] || "กลาง";
      const maxScore = levelScoreMap[level] || 2;
      const count = skillQuestionCount[skillName];
      scorePerQuestion[skillName] = maxScore / count;
    });

    let totalScore = 0;
    const results: any[] = [];

    answers.forEach((answer: any) => {
      const question = evaluation.find((q: any) => q.id === answer.questionId);
      if (!question) {
        throw httpError(400, `ไม่พบคำถาม ID: ${answer.questionId}`);
      }

      const isCorrect = answer.selectedOption === question.correctAnswer;
      const skillName = question.skillName;
      const points = isCorrect ? scorePerQuestion[skillName] || 0 : 0;

      if (isCorrect) {
        totalScore += points;
      }

      results.push({
        questionId: question.id,
        skillName,
        isCorrect,
        points,
        maxPoints: scorePerQuestion[skillName] || 0,
      });
    });

    const passed = true;

    if (existingParticipation) {
      await pool.query(
        `UPDATE participation SET status = 'completed', score = ?, hours = ? WHERE studentId = ? AND activityId = ?`,
        [totalScore, activityHours, studentId, id]
      );
    } else {
      await pool.query(
        `INSERT INTO participation (ParticipationId, studentId, activityId, hours, joinDate, status, score)
         VALUES (?, ?, ?, ?, CURDATE(), 'completed', ?)`,
        [Date.now().toString(), studentId, id, activityHours, totalScore]
      );
    }

    return NextResponse.json({
      message: "ประเมินสำเร็จ",
      passed,
      totalScore,
      details: results,
    });
  } catch (error) {
    return jsonError(error);
  }
}
