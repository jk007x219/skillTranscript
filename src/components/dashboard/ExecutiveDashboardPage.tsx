// components/dashboard/ExecutiveDashboardPage.tsx
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
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ExecutiveShell from "@/components/executive/ExecutiveShell";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

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

export default function ExecutiveDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    // ✅ ตรวจสอบว่าเป็นผู้บริหาร
    const isExecutive = user?.role === 'executive' || (user?.role === 'teacher' && user?.isExecutive === true);

    console.log("🔍 ExecutiveDashboardPage - user:", user);
    console.log("🔍 isExecutive:", isExecutive);

    if (!user || !isExecutive) {
      // ถ้าไม่ใช่ผู้บริหาร ให้ redirect ไปหน้า teacher
      router.push('/teacher/students');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/executive/dashboard');
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูล');
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <ExecutiveShell activePath="/executive/dashboard">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-slate-500">กำลังโหลดข้อมูล...</div>
        </div>
      </ExecutiveShell>
    );
  }

  const {
    totalStudents = 0,
    totalActivities = 0,
    averageOverallScore = 0,
    levelDistribution = [],
    skillAverages = [],
    trendData = [],
  } = dashboardData || {};

  const COLORS = ['#22C55E', '#FFC107', '#EF4444'];

  return (
    <ExecutiveShell activePath="/executive/dashboard">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">แดชบอร์ดภาพรวมทักษะของนิสิต</h1>
              <div className="mt-2 h-1 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-1 text-sm text-slate-500">ภาคเรียน 1 ปีการศึกษา 2566</p>
            </div>
            <button className="mt-4 rounded-xl bg-[#1565C0] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#0D47A1] sm:mt-0">
              ส่งออกข้อมูล (PDF)
            </button>
          </div>

          {/* Overview cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">นิสิตทั้งหมด</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{totalStudents.toLocaleString()}</p>
                <p className="text-xs text-slate-400">คน</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">กิจกรรมทั้งหมด</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{totalActivities}</p>
                <p className="text-xs text-slate-400">กิจกรรม</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <FileBarChart2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">คะแนนเฉลี่ยทักษะรวม</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{averageOverallScore}%</p>
                <p className="text-xs text-slate-400">ระดับดี</p>
              </div>
            </div>
          </div>

          {/* Pie chart */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">ภาพรวมระดับทักษะทั้งหมด</h2>
              <div className="mt-4 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="80%"
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {levelDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">สัดส่วน</h2>
              <ul className="mt-4 space-y-3">
                {levelDistribution.map((item: any, index: number) => (
                  <li key={item.level} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.level}</p>
                      <p className="text-xs text-slate-500">
                        {item.count.toLocaleString()} คน ({item.percent}%)
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skill averages */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">ค่าเฉลี่ยทักษะแต่ละด้าน (ร้อยละจากมากไปน้อย)</h2>
            <ul className="mt-4 space-y-4">
              {skillAverages.map((item: any) => {
                const Icon = getSkillIcon(item.skillName);
                return (
                  <li key={item.skillName}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="truncate text-sm text-slate-700">{item.skillName}</span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-800">{item.average}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1565C0]"
                        style={{ width: `${item.average}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Trend line */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">แนวโน้มคะแนนเฉลี่ยทักษะรวม</h2>
            <p className="mt-1 text-xs text-slate-500">คะแนน (%)</p>
            <div className="mt-4 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="term" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1565C0"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#1565C0" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </ExecutiveShell>
  );
}