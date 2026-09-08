// components/executive/ExecutiveDashboardPage.tsx
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ExecutiveShell from "@/components/executive/ExecutiveShell";
import { useAuth } from "@/context/auth-context";

type DashboardData = {
  totalStudents: number;
  totalActivities: number;
  averageOverallScore: number;
  levelDistribution: { level: string; count: number; percent: number }[];
  radarData: { skill: string; score: number }[];
  facultySkills: { skillName: string; average: number }[];
  essentialSkills: { skillName: string; average: number }[];
  termSummary: {
    term: string;
    avgScore: number;
    studentCount: number;
    activityCount: number;
    level: string;
  }[];
};

const COLORS = ["#22C55E", "#FFC107", "#EF4444"];

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/executive/dashboard");
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูล");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <ExecutiveShell activePath="/executive/dashboard">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-2 text-slate-500">กำลังโหลดข้อมูล...</span>
        </div>
      </ExecutiveShell>
    );
  }

  if (!data) {
    return (
      <ExecutiveShell activePath="/executive/dashboard">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
          ไม่พบข้อมูล
        </div>
      </ExecutiveShell>
    );
  }

  const {
    totalStudents,
    totalActivities,
    averageOverallScore,
    levelDistribution,
    radarData,
    facultySkills,
    essentialSkills,
    termSummary,
  } = data;

  return (
    <ExecutiveShell activePath="/executive/dashboard">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          main:has(.executive-dashboard-print) > header,
          main:has(.executive-dashboard-print) > div > aside,
          .executive-dashboard-print .no-print {
            display: none !important;
          }

          main:has(.executive-dashboard-print) > div {
            display: block !important;
          }

          .executive-dashboard-print {
            width: 100% !important;
            padding: 0 !important;
            color: #0f172a !important;
          }

          .executive-dashboard-print .print-report-header {
            display: flex !important;
          }

          .executive-dashboard-print .rounded-2xl {
            break-inside: avoid;
            box-shadow: none !important;
          }

          .executive-dashboard-print .print-hide {
            display: none !important;
          }

          .executive-dashboard-print .print-overview {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin-top: 12px !important;
          }

          .executive-dashboard-print .print-overview > div {
            gap: 10px !important;
            padding: 12px !important;
          }

          .executive-dashboard-print .print-overview > div > div:first-child {
            width: 38px !important;
            height: 38px !important;
          }

          .executive-dashboard-print .print-level-layout {
            display: block !important;
            margin-top: 12px !important;
          }

          .executive-dashboard-print .print-level-chart {
            width: min(100%, 390px) !important;
            margin: 0 auto !important;
          }

          .executive-dashboard-print .print-terms {
            margin-top: 12px !important;
          }

          .executive-dashboard-print .print-terms table {
            min-width: 0 !important;
            table-layout: fixed;
            font-size: 9px !important;
          }

          .executive-dashboard-print .print-terms th,
          .executive-dashboard-print .print-terms td {
            padding: 6px 4px !important;
            overflow-wrap: anywhere;
          }

          .executive-dashboard-print .recharts-responsive-container {
            min-width: 0 !important;
          }
        }
      `}</style>
      <section className="executive-dashboard-print p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                แดชบอร์ดภาพรวมทักษะของนิสิต
              </h1>
              <div className="mt-2 h-1 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-1 text-sm text-slate-500">
                ข้อมูลล่าสุดจากฐานข้อมูล {new Date().toLocaleDateString("th-TH")}
              </p>
            </div>
            {/* ปุ่มส่งออก PDF ถูกลบออกแล้ว */}
          </div>

          <div className="print-report-header hidden items-center justify-between border-b border-slate-300 pb-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล มหาวิทยาลัยทักษิณ</p>
              <p>รายงานภาพรวมทักษะของนิสิต</p>
            </div>
            <p>พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}</p>
          </div>

          {/* Overview cards */}
          <div className="print-overview mt-6 grid gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">นิสิตทั้งหมด</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalStudents.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">คน</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">กิจกรรมทั้งหมด</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalActivities}
                </p>
                <p className="text-xs text-slate-400">กิจกรรม</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <Star className="h-6 w-6" />
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
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4598D0] text-white shadow-sm">
                <FileBarChart2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">ภาคเรียนล่าสุด</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {termSummary.length > 0 ? termSummary[0]?.term : "-"}
                </p>
                <p className="text-xs text-slate-400">
                  {termSummary.length > 0
                    ? `${termSummary[0]?.studentCount || 0} คนเข้าร่วม`
                    : "ยังไม่มีข้อมูล"}
                </p>
              </div>
            </div>
          </div>

          {/* Radar Chart - ภาพรวมทักษะทั้งหมด */}
          <div className="print-level-layout mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="print-hide rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ภาพรวมทักษะทั้งหมด
              </h2>
              <p className="text-xs text-slate-400">
                คะแนนเฉลี่ยของทักษะทั้ง 11 ด้าน
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

            {/* Pie Chart - ระดับทักษะ */}
            <div className="print-level-chart rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                สัดส่วนนิสิตตามระดับทักษะ
              </h2>
              <div className="relative mt-2 h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="count"
                      nameKey="level"
                      innerRadius="65%"
                      outerRadius="95%"
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell
                          key={entry.level}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-500">รวมทั้งหมด</p>
                  <p className="text-2xl font-semibold text-slate-950">
                    {totalStudents.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">คน</p>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {levelDistribution.map((item, index) => (
                  <li key={item.level} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.level}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.count.toLocaleString()} คน ({item.percent}%)
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* เปรียบเทียบคะแนนเฉลี่ยทักษะในแต่ละหมวด (Bar Chart) */}
          <div className="print-hide mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">
              เปรียบเทียบคะแนนเฉลี่ยทักษะในแต่ละหมวด
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              แสดงคะแนนเฉลี่ยของทักษะทั้งหมด 11 ทักษะ แบ่งตามหมวดหมู่
            </p>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {/* ฝั่งซ้าย: ทักษะคณะวิทย์ */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#FFC107]">
                  🏛️ ทักษะที่นิสิตคณะวิทย์ต้องมี
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={facultySkills}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid stroke="#EEF2F7" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="skillName"
                        tick={{ fill: "#475569", fontSize: 11 }}
                        width={120}
                        tickFormatter={(value) => {
                          return value.length > 15 ? value.slice(0, 15) + "..." : value;
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]}
                        labelFormatter={(label) => `ทักษะ: ${label}`}
                      />
                      <Bar
                        dataKey="average"
                        fill="#FFC107"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">
                  จำนวน {facultySkills.length} ทักษะ
                </p>
              </div>

              {/* ฝั่งขวา: ทักษะจำเป็น */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#1565C0]">
                  ⭐ ทักษะที่นิสิตจำเป็นต้องมี
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={essentialSkills}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid stroke="#EEF2F7" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="skillName"
                        tick={{ fill: "#475569", fontSize: 11 }}
                        width={120}
                        tickFormatter={(value) => {
                          return value.length > 15 ? value.slice(0, 15) + "..." : value;
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "คะแนนเฉลี่ย"]}
                        labelFormatter={(label) => `ทักษะ: ${label}`}
                      />
                      <Bar
                        dataKey="average"
                        fill="#1565C0"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">
                  จำนวน {essentialSkills.length} ทักษะ
                </p>
              </div>
            </div>
          </div>

          {/* สถิติตามภาคการศึกษา (ปรับให้ดูง่ายขึ้น) */}
          <div className="print-terms mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">
              สถิติตามภาคการศึกษา
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              แสดงคะแนนเฉลี่ย จำนวนนิสิต และจำนวนกิจกรรมในแต่ละภาคการศึกษา
            </p>

            {termSummary.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-blue-100 bg-blue-50/50">
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        ภาคการศึกษา
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        คะแนนเฉลี่ย
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        ระดับ
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        นิสิตที่เข้าร่วม
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        กิจกรรม
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        แนวโน้ม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {termSummary.map((item, index) => {
                      let trend = null;
                      if (index < termSummary.length - 1) {
                        const prev = termSummary[index + 1];
                        if (prev && prev.avgScore !== undefined) {
                          const diff = item.avgScore - prev.avgScore;
                          trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";
                        }
                      }
                      const levelColor =
                        item.level === "ดีมาก"
                          ? "text-emerald-600 bg-emerald-50"
                          : item.level === "ปานกลาง"
                          ? "text-amber-600 bg-amber-50"
                          : "text-red-600 bg-red-50";

                      return (
                        <tr
                          key={index}
                          className="border-b border-blue-50/50 transition hover:bg-blue-50/30"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {item.term}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#1565C0]">
                            {item.avgScore}%
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${levelColor}`}
                            >
                              {item.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.studentCount.toLocaleString()} คน
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.activityCount} กิจกรรม
                          </td>
                          <td className="px-4 py-3">
                            {trend === "up" && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs">ดีขึ้น</span>
                              </span>
                            )}
                            {trend === "down" && (
                              <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="h-4 w-4" />
                                <span className="text-xs">ลดลง</span>
                              </span>
                            )}
                            {trend === "same" && (
                              <span className="text-xs text-slate-400">คงที่</span>
                            )}
                            {trend === null && (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                ยังไม่มีข้อมูลภาคการศึกษา
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-slate-400">
            * ข้อมูลอัปเดตล่าสุดเมื่อ {new Date().toLocaleString("th-TH")}
          </div>
        </div>
      </section>
    </ExecutiveShell>
  );
}