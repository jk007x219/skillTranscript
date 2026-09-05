// components/student/StudentEvaluatePage.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type EvaluationQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skillName: string;
};

type ActivityData = {
  id: string;
  title: string;
  description: string;
  evaluation: EvaluationQuestion[];
  alreadySubmitted?: boolean;
};

type SkillScore = {
  skillName: string;
  level: string;
  maxScore: number;
  questions: number;
  scorePerQuestion: number;
  earnedScore: number;
};

export default function StudentEvaluatePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    totalScore: number;
    details: any[];
    skillScores: SkillScore[];
  } | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (authLoading) return;

      if (!user?.studentId) {
        setLoading(false);
        setError("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      try {
        setLoading(true);
        setAlreadySubmitted(false);
        setError("");
        // ส่ง studentId ไปด้วยเพื่อตรวจสอบสถานะ
        const url = `/api/activities/${activityId}?studentId=${encodeURIComponent(user.studentId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลกิจกรรม");
        const data = await res.json();
        if (!data.hasEvaluation || !data.evaluation) {
          throw new Error("กิจกรรมนี้ยังไม่มีแบบประเมิน");
        }

        // ตรวจสอบว่าเคยส่งแล้วหรือยัง
        if (data.alreadySubmitted) {
          setAlreadySubmitted(true);
          setActivity(data);
          setLoading(false);
          return;
        }

        setActivity(data);
        setError("");
        const initialAnswers: Record<string, number> = {};
        data.evaluation.forEach((q: EvaluationQuestion) => {
          initialAnswers[q.id] = -1;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    if (activityId) {
      fetchActivity();
    }
  }, [activityId, authLoading, user?.studentId]);

  const handleAnswer = (questionId: string, optionIndex: number) => {
    if (alreadySubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (alreadySubmitted) {
      alert("คุณเคยทำแบบประเมินนี้แล้ว");
      return;
    }
    if (!activity) return;

    const allAnswered = activity.evaluation.every((q) => answers[q.id] !== undefined && answers[q.id] >= 0);
    if (!allAnswered) {
      alert("กรุณาตอบคำถามทุกข้อ");
      return;
    }

    if (!user?.studentId) {
      alert("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/activities/${activityId}/submit-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.studentId,
          answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
            questionId,
            selectedOption,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ส่งคำตอบไม่สำเร็จ");

      setResult(data);
      setAlreadySubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/student/activities");
  };

  if (loading) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6 text-center">กำลังโหลดแบบประเมิน...</div>
      </StudentShell>
    );
  }

  if (error || !activity) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error || "ไม่พบข้อมูลกิจกรรม"}
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 rounded-xl bg-[#1565C0] px-6 py-2 text-white hover:bg-[#0D47A1]"
          >
            กลับหน้ากิจกรรม
          </button>
        </div>
      </StudentShell>
    );
  }

  if (alreadySubmitted) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1565C0]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">บันทึกเสร็จสิ้น</h2>
            <p className="mt-2 text-sm text-slate-500">ไม่สามารถทำแบบประเมินซ้ำได้</p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-6 rounded-xl bg-[#1565C0] px-6 py-2.5 text-white shadow-md transition hover:bg-[#0D47A1]"
            >
              กลับหน้ากิจกรรม
            </button>
          </div>
        </div>
      </StudentShell>
    );
  }

  if (result) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-slate-950">ผลการประเมิน</h2>
            <div className="mt-4 space-y-4">
              {result.skillScores && result.skillScores.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">คะแนนที่ได้รับในแต่ละทักษะ:</p>
                  {result.skillScores.map((skill, idx) => (
                    <div key={idx} className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{skill.skillName}</p>
                          <p className="text-xs text-slate-500">
                            ระดับ: {skill.level} • {skill.questions} ข้อ
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[#1565C0]">
                            {skill.earnedScore.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-400">
                            จาก {skill.maxScore.toFixed(2)} คะแนน
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-[#1565C0] transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (skill.earnedScore / skill.maxScore) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">ไม่พบข้อมูลคะแนนแยกตามทักษะ</p>
              )}

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-sm text-slate-600">คะแนนรวมที่ได้</p>
                <p className="text-2xl font-bold text-[#1565C0]">
                  {result.totalScore.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="mt-4 w-full rounded-xl bg-[#1565C0] px-6 py-2.5 text-white shadow-md transition hover:bg-[#0D47A1]"
              >
                กลับไปหน้ากิจกรรม
              </button>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell activePath="/student/activities">
      <div className="p-6">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-md">
          <h1 className="text-2xl font-semibold text-slate-950">{activity.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{activity.description}</p>
          <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />

          <div className="mt-6 space-y-6">
            {activity.evaluation.map((q, qIndex) => (
              <div key={q.id} className="rounded-xl border border-blue-100 p-4">
                <p className="font-medium text-slate-800">
                  {qIndex + 1}. {q.question}
                </p>
                <p className="text-xs text-slate-400">ทักษะ: {q.skillName}</p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={q.id}
                        value={optIndex}
                        checked={answers[q.id] === optIndex}
                        onChange={() => handleAnswer(q.id, optIndex)}
                        className="h-4 w-4 text-[#1565C0]"
                      />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-[#4598D0] px-8 py-3 text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50"
          >
            {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
          </button>
        </div>
      </div>
    </StudentShell>
  );
}
