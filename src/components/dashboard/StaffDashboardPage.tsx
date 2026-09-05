// components/dashboard/StaffDashboardPage.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Star,
  CalendarDays,
  FileBarChart2,
  Lightbulb,
  Cpu,
  Puzzle,
  FlaskConical,
  Sparkles,
  Monitor,
  ShieldAlert,
  Briefcase,
  UsersRound,
  ShieldCheck,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StaffShell from "@/components/staff/StaffShell";

type DashboardData = {
  totalStudents: number;
  activeActivities: number;
  pastActivities: number;
  averageOverallScore: number;
  facultySkills: { skillName: string; average: number }[];
  essentialSkills: { skillName: string; average: number }[];
  radarData: { skill: string; score: number }[];
};

// Map icon ตามชื่อทักษะ
function getSkillIcon(title: string) {
  if (title.includes("สื่อสาร")) return MessageCircle;
  if (title.includes("ผู้ประกอบการ")) return Briefcase;
  if (title.includes("ทีม")) return UsersRound;
  if (title.includes("ดิจิทัล") || title.includes("เครื่องมือ")) return Monitor;
  if (title.includes("คิด") || title.includes("แก้ปัญหา")) return Puzzle;
  if (title.includes("ปัญญาประดิษฐ์") || title.includes("AI")) return Cpu;
  if (title.includes("ปลอดภัย") || title.includes("ไซเบอร์")) return ShieldCheck;
  if (title.includes("ห้องปฏิบัติการ")) return ShieldAlert;
  if (title.includes("นวัตกรรม")) return Lightbulb;
  if (title.includes("วิทยาศาสตร์")) return FlaskConical;
  return Star;
}

export default function StaffDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/staff/dashboard");
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
        const result = await res.json();
        setData(result);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <StaffShell activePath="/staff/dashboard">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-2 text-slate-500">กำลังโหลดข้อมูล...</span>
        </div>
      </StaffShell>
    );
  }

  if (error || !data) {
    return (
      <StaffShell activePath="/staff/dashboard">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
          {error || "ไม่พบข้อมูล"}
        </div>
      </StaffShell>
    );
  }

  const {
    totalStudents,
    activeActivities,
    pastActivities,
    averageOverallScore,
    facultySkills,
    essentialSkills,
    radarData,
  } = data;

  return (
    <StaffShell activePath="/staff/dashboard">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)]">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              แดชบอร์ดภาพรวมทักษะของนิสิตทั้งหมด
            </h1>
            <div className="mt-2 h-1 w-24 rounded-full bg-[#FFC107]" />
            <p className="mt-1 text-sm text-slate-500">
              ข้อมูลล่าสุดจากฐานข้อมูล {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>

          {/* Overview stat cards - 4 การ์ด */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* นิสิตทั้งหมด */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <UsersRound className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-slate-500">นิสิตทั้งหมด</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalStudents.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">คน</p>
              </div>
            </article>

            {/* กิจกรรมกำลังดำเนิน */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-slate-500">กิจกรรมกำลังดำเนิน</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {activeActivities}
                </p>
                <p className="text-xs text-slate-400">กิจกรรม</p>
              </div>
            </article>

            {/* กิจกรรมผ่านมาแล้ว */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4598D0] text-white shadow-sm">
                <FileBarChart2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-slate-500">กิจกรรมผ่านมาแล้ว</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {pastActivities}
                </p>
                <p className="text-xs text-slate-400">กิจกรรม</p>
              </div>
            </article>

            {/* คะแนนเฉลี่ยทักษะรวม */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <Star className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-slate-500">คะแนนเฉลี่ยทักษะรวม</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {averageOverallScore}%
                </p>
                <p className="text-xs text-slate-400">
                  {averageOverallScore >= 80
                    ? "ระดับดีมาก"
                    : averageOverallScore >= 50
                    ? "ระดับปานกลาง"
                    : "ต้องปรับปรุง"}
                </p>
              </div>
            </article>
          </div>

          {/* Radar Chart - แสดงทุกทักษะ */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">
              ภาพรวมทักษะทุกด้านของนิสิต
            </h2>
            <p className="text-xs text-slate-400">
              คะแนนเฉลี่ยของทักษะทั้งหมดในระบบ
            </p>
            <div className="mt-4 h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#DCE7F5" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#475569", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="คะแนนเฉลี่ย"
                    dataKey="score"
                    stroke="#FFC107"
                    fill="#FFC107"
                    fillOpacity={0.55}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, "คะแนนเฉลี่ย"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFC107]" />
              คะแนนเฉลี่ยของนิสิตทั้งหมด
            </div>
          </div>

          {/* Skill Averages - แบ่งเป็น 2 หมวด */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* ทักษะที่นิสิตจำเป็นต้องมี */}
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ทักษะที่นิสิตจำเป็นต้องมี
              </h2>
              <p className="text-xs text-slate-400">
                ค่าเฉลี่ยทักษะที่จำเป็นสำหรับนิสิตทุกคน
              </p>
              <ul className="mt-4 space-y-4">
                {essentialSkills.length > 0 ? (
                  essentialSkills.map((item) => {
                    const Icon = getSkillIcon(item.skillName);
                    return (
                      <li key={item.skillName}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon
                              className="h-4 w-4 shrink-0 text-slate-500"
                              aria-hidden="true"
                            />
                            <span className="truncate text-sm text-slate-700">
                              {item.skillName}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">
                            {item.average}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#1565C0]"
                            style={{ width: `${item.average}%` }}
                          />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-sm text-slate-400">
                    ยังไม่มีข้อมูลทักษะในหมวดนี้
                  </li>
                )}
              </ul>
            </div>

            {/* ทักษะที่นิสิตคณะวิทย์ต้องมี */}
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ทักษะที่นิสิตคณะวิทย์ต้องมี
              </h2>
              <p className="text-xs text-slate-400">
                ค่าเฉลี่ยทักษะเฉพาะของคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
              </p>
              <ul className="mt-4 space-y-4">
                {facultySkills.length > 0 ? (
                  facultySkills.map((item) => {
                    const Icon = getSkillIcon(item.skillName);
                    return (
                      <li key={item.skillName}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon
                              className="h-4 w-4 shrink-0 text-slate-500"
                              aria-hidden="true"
                            />
                            <span className="truncate text-sm text-slate-700">
                              {item.skillName}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">
                            {item.average}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#FFC107]"
                            style={{ width: `${item.average}%` }}
                          />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-sm text-slate-400">
                    ยังไม่มีข้อมูลทักษะในหมวดนี้
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            * ข้อมูลอัปเดตล่าสุดเมื่อ {new Date().toLocaleString("th-TH")}
          </div>
        </div>
      </section>
    </StaffShell>
  );
}