"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context"; // ✅ เพิ่ม import useAuth

type EvaluationQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skillNames: string[];
};

type ActivitySkill = {
  name: string;
  level: string;
};

type Activity = {
  id: string;
  title: string;
  description?: string;
  evaluation?: EvaluationQuestion[];
  skills?: ActivitySkill[];
};

type SkillResult = {
  skillName: string;
  level?: string;
  questions?: number;
  earnedScore: number;
  maxScore: number;
  normalizedScore: number;
};

type EvaluationResult = {
  score: number;
  totalScore?: number;
  skillScores: SkillResult[];
};

type Answer = {
  questionId: string;
  selectedOption: number;
};

export default function StudentEvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(); // ✅ ดึง user จาก Auth Context

  const activityId = params?.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // =========================================================
  // โหลดกิจกรรม
  // =========================================================
  useEffect(() => {
    if (!activityId) return;

    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiPath(`/api/activities/${activityId}`), {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "ไม่สามารถโหลดกิจกรรมได้");
        }

        setActivity(data.activity || data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "ไม่สามารถโหลดกิจกรรมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  // =========================================================
  // เลือกคำตอบ
  // =========================================================
  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // ส่งแบบประเมิน
  // =========================================================
  const handleSubmit = async () => {
    if (!activity?.evaluation || activity.evaluation.length === 0) {
      setError("กิจกรรมนี้ไม่มีแบบประเมิน");
      return;
    }

    // ตรวจสอบว่าตอบครบทุกข้อ
    const unanswered = activity.evaluation.filter(
      (question) => answers[question.id] === undefined
    );

    if (unanswered.length > 0) {
      setError(`กรุณาตอบคำถามให้ครบทุกข้อ (ยังไม่ได้ตอบ ${unanswered.length} ข้อ)`);
      return;
    }

    // ✅ ตรวจสอบว่า user มี studentId
    if (!user?.studentId) {
      setError("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const answerArray: Answer[] = activity.evaluation.map((question) => ({
        questionId: question.id,
        selectedOption: answers[question.id],
      }));

      const response = await fetch(apiPath(`/api/activities/${activityId}/submit-evaluation`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.studentId, // ✅ ส่ง studentId ไปด้วย
          answers: answerArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "ไม่สามารถส่งแบบประเมินได้");
      }

      setResult({
        score: data.score ?? data.totalScore ?? 0,
        totalScore: data.totalScore ?? data.score ?? 0,
        skillScores: data.skillScores ?? [],
      });

      setAlreadySubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "เกิดข้อผิดพลาดในการส่งแบบประเมิน");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // กลับหน้ากิจกรรม
  // =========================================================
  const handleBack = () => {
    router.push("/student/activities");
  };

  // =========================================================
  // Loading
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">กำลังโหลดแบบประเมิน...</div>
      </div>
    );
  }

  // =========================================================
  // Error ตอนโหลด Activity
  // =========================================================
  if (error && !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow">
          <h1 className="text-xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-white hover:bg-gray-800"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // ไม่พบ Activity
  // =========================================================
  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">ไม่พบกิจกรรม</div>
    );
  }

  // =========================================================
  // หน้าผลลัพธ์
  // =========================================================
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">✓</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ส่งแบบประเมินเรียบร้อยแล้ว</h1>
              <p className="mt-2 text-gray-500">{activity.title}</p>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-gray-900">ผลคะแนนแต่ละทักษะ</h2>
              <div className="space-y-4">
                {result.skillScores.map((skill) => {
                  const percent =
                    skill.maxScore > 0 ? (skill.earnedScore / skill.maxScore) * 100 : 0;

                  return (
                    <div key={skill.skillName} className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{skill.skillName}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {skill.level && (
                              <>
                                ระดับ: {skill.level} {" • "}
                              </>
                            )}
                            {skill.earnedScore} / {skill.maxScore} คะแนน
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {percent.toFixed(2)}%
                        </div>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(Math.max(percent, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleBack}
                className="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                กลับหน้ากิจกรรม
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // แบบประเมิน
  // =========================================================
  const evaluation = activity.evaluation || [];

  if (evaluation.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
          <p className="mt-4 text-gray-600">กิจกรรมนี้ยังไม่มีแบบประเมิน</p>
          <button onClick={handleBack} className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-white">
            กลับ
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // Render แบบประเมิน
  // =========================================================
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
            {activity.description && <p className="mt-2 text-gray-600">{activity.description}</p>}
            <p className="mt-4 text-sm text-gray-500">กรุณาตอบคำถามให้ครบทุกข้อ</p>
            <p className="mt-1 text-sm text-gray-400">จำนวน {evaluation.length} ข้อ</p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-8">
            {evaluation.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4">
                  <div className="font-semibold text-gray-900">
                    {index + 1}. {question.question}
                  </div>
                  {question.skillNames?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      ทักษะ: {question.skillNames.join(", ")}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const checked = answers[question.id] === optionIndex;

                    return (
                      <label
                        key={optionIndex}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          checked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={checked}
                          onChange={() => handleAnswerChange(question.id, optionIndex)}
                          className="h-4 w-4"
                        />
                        <span className="text-gray-800">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={handleBack}
              disabled={submitting}
              className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || alreadySubmitted}
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}