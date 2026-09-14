"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  CalendarDays,
  FileBarChart2,
  Lightbulb,
  Cpu,
  Puzzle,
  FlaskConical,
  Monitor,
  ShieldAlert,
  Briefcase,
  UsersRound,
  ShieldCheck,
  MessageCircle,
  Loader2,
  Filter,
  RefreshCw,
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

type SkillAverage = {
  skillName: string;
  average: number;
};

type RadarItem = {
  skill: string;
  score: number;
};

type DashboardData = {
  academicYear: number | null;
  academicYears: number[];
  totalStudents: number;
  activeActivities: number;
  pastActivities: number;
  averageOverallScore: number;
  facultySkills: SkillAverage[];
  essentialSkills: SkillAverage[];
  radarData: RadarItem[];
};

function getSkillIcon(title: string) {
  if (title.includes("สื่อสาร")) return MessageCircle;
  if (title.includes("ผู้ประกอบการ")) return Briefcase;
  if (title.includes("ทีม")) return UsersRound;
  if (title.includes("ดิจิทัล") || title.includes("เครื่องมือ")) {
    return Monitor;
  }
  if (title.includes("คิด") || title.includes("แก้ปัญหา")) {
    return Puzzle;
  }
  if (title.includes("ปัญญาประดิษฐ์") || title.includes("AI")) {
    return Cpu;
  }
  if (title.includes("ปลอดภัย") || title.includes("ไซเบอร์")) {
    return ShieldCheck;
  }
  if (title.includes("ห้องปฏิบัติการ")) {
    return ShieldAlert;
  }
  if (title.includes("นวัตกรรม")) {
    return Lightbulb;
  }
  if (title.includes("วิทยาศาสตร์")) {
    return FlaskConical;
  }

  return Star;
}

function getAcademicYearLabel(year: number | null) {
  if (year === null) {
    return "ทุกปีการศึกษา";
  }

  return `ปีการศึกษา ${year}`;
}

function formatScore(value: number) {
  return Number(value || 0).toFixed(2);
}

export default function StaffDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const [academicYear, setAcademicYear] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // โหลด Dashboard
  // =========================================================
  const fetchDashboard = async (
    selectedAcademicYear: string,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);
      setError("");

      const query =
        selectedAcademicYear === "all"
          ? ""
          : `?academicYear=${encodeURIComponent(
              selectedAcademicYear
            )}`;

      const response = await fetch(
        `/api/staff/dashboard${query}`,
        {
          signal,
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "ไม่สามารถโหลดข้อมูลได้"
        );
      }

      setData(result);
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );

      setData(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // โหลดครั้งแรก
  // =========================================================
  useEffect(() => {
    const controller = new AbortController();

    fetchDashboard("all", controller.signal);

    return () => controller.abort();
  }, []);

  // =========================================================
  // เมื่อเปลี่ยนปีการศึกษา
  // =========================================================
  useEffect(() => {
    if (academicYear === "all") {
      return;
    }

    const controller = new AbortController();

    fetchDashboard(academicYear, controller.signal);

    return () => controller.abort();
  }, [academicYear]);

  // =========================================================
  // รายการปีการศึกษา
  // =========================================================
  const academicYears = useMemo(() => {
    if (!data?.academicYears) {
      return [];
    }

    return [...data.academicYears].sort((a, b) => b - a);
  }, [data]);

  // =========================================================
  // Loading
  // =========================================================
  if (loading && !data) {
    return (
      <StaffShell activePath="/staff/dashboard">
        <div className="flex min-h-[500px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-2 text-slate-500">
            กำลังโหลดข้อมูลแดชบอร์ด...
          </span>
        </div>
      </StaffShell>
    );
  }

  // =========================================================
  // Error
  // =========================================================
  if (error && !data) {
    return (
      <StaffShell activePath="/staff/dashboard">
        <section className="p-4 sm:p-6 lg:p-7">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
            <p className="font-medium">
              {error || "ไม่พบข้อมูล"}
            </p>

            <button
              type="button"
              onClick={() => {
                fetchDashboard(academicYear);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1565C0] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0D47A1]"
            >
              <RefreshCw className="h-4 w-4" />
              ลองใหม่
            </button>
          </div>
        </section>
      </StaffShell>
    );
  }

  if (!data) {
    return null;
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
          {/* =================================================
              Header
          ================================================= */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                แดชบอร์ดภาพรวมทักษะของนิสิตทั้งหมด
              </h1>

              <div className="mt-2 h-1 w-24 rounded-full bg-[#FFC107]" />

              <p className="mt-2 text-sm text-slate-500">
                แสดงข้อมูลและคะแนนทักษะของนิสิต
                {academicYear === "all"
                  ? "ทั้งคณะ"
                  : `ที่เข้าเรียนในปีการศึกษา ${academicYear}`}
              </p>
            </div>

            {/* =================================================
                Academic Year Filter
            ================================================= */}
            <div className="w-full lg:w-auto">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
                <div className="mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#1565C0]" />
                  <label
                    htmlFor="academic-year"
                    className="text-sm font-semibold text-slate-800"
                  >
                    กรองตามปีการศึกษา
                  </label>
                </div>

                <select
                  id="academic-year"
                  value={academicYear}
                  onChange={(event) =>
                    setAcademicYear(event.target.value)
                  }
                  disabled={loading}
                  className="min-w-[220px] rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="all">
                    ทุกปีการศึกษา
                  </option>

                  {academicYears.map((year) => (
                    <option
                      key={year}
                      value={String(year)}
                    >
                      ปีการศึกษา {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* =================================================
              Loading indicator when changing year
          ================================================= */}
          {loading && data && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1565C0]">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังคำนวณข้อมูลของ
              {getAcademicYearLabel(
                academicYear === "all"
                  ? null
                  : Number(academicYear)
              )}
              ...
            </div>
          )}

          {/* =================================================
              Error while old data still exists
          ================================================= */}
          {error && data && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =================================================
              Selected Academic Year
          ================================================= */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white px-4 py-3">
            <p className="text-xs text-slate-500">
              กำลังแสดงข้อมูล
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1565C0]">
              {getAcademicYearLabel(
                academicYear === "all"
                  ? null
                  : Number(academicYear)
              )}
            </p>
          </div>

          {/* =================================================
              Summary Cards
          ================================================= */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Students */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <UsersRound
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  นิสิตทั้งหมด
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalStudents.toLocaleString()}
                </p>

                <p className="text-xs text-slate-400">
                  คน
                </p>
              </div>
            </article>

            {/* Active Activities */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
                <CalendarDays
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  กิจกรรมกำลังดำเนิน
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {activeActivities.toLocaleString()}
                </p>

                <p className="text-xs text-slate-400">
                  กิจกรรม
                </p>
              </div>
            </article>

            {/* Past Activities */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4598D0] text-white shadow-sm">
                <FileBarChart2
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  กิจกรรมผ่านมาแล้ว
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {pastActivities.toLocaleString()}
                </p>

                <p className="text-xs text-slate-400">
                  กิจกรรม
                </p>
              </div>
            </article>

            {/* Average Score */}
            <article className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <Star
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  คะแนนเฉลี่ยทักษะรวม
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {formatScore(averageOverallScore)}%
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

          {/* =================================================
              Radar Chart
          ================================================= */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                ภาพรวมทักษะทุกด้านของนิสิต
              </h2>

              <p className="text-xs text-slate-400">
                ค่าเฉลี่ยของนิสิตใน
                {academicYear === "all"
                  ? "ทุกปีการศึกษา"
                  : `ปีการศึกษา ${academicYear}`}
              </p>
            </div>

            <div className="mt-4 h-[380px] w-full">
              {radarData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <RadarChart
                    data={radarData}
                    outerRadius="75%"
                  >
                    <PolarGrid stroke="#DCE7F5" />

                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{
                        fill: "#475569",
                        fontSize: 10,
                      }}
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
                      formatter={(value) => [
                        `${formatScore(
                          Number(value)
                        )}%`,
                        "คะแนนเฉลี่ย",
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  ยังไม่มีข้อมูลสำหรับแสดงกราฟ
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFC107]" />
              คะแนนเฉลี่ยของนิสิตในกลุ่มที่เลือก
            </div>
          </div>

          {/* =================================================
              Skill Average Lists
          ================================================= */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Essential Skills */}
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ทักษะที่นิสิตจำเป็นต้องมี
              </h2>

              <p className="text-xs text-slate-400">
                ค่าเฉลี่ยทักษะที่จำเป็นสำหรับนิสิต
                ในกลุ่มที่เลือก
              </p>

              <ul className="mt-4 space-y-4">
                {essentialSkills.length > 0 ? (
                  essentialSkills.map((item) => {
                    const Icon = getSkillIcon(
                      item.skillName
                    );

                    const percentage = Math.min(
                      Math.max(item.average, 0),
                      100
                    );

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
                            {formatScore(item.average)}%
                          </span>
                        </div>

                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#1565C0] transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
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

            {/* Faculty Skills */}
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ทักษะที่นิสิตคณะวิทย์ต้องมี
              </h2>

              <p className="text-xs text-slate-400">
                ค่าเฉลี่ยทักษะเฉพาะของคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
                ในกลุ่มที่เลือก
              </p>

              <ul className="mt-4 space-y-4">
                {facultySkills.length > 0 ? (
                  facultySkills.map((item) => {
                    const Icon = getSkillIcon(
                      item.skillName
                    );

                    const percentage = Math.min(
                      Math.max(item.average, 0),
                      100
                    );

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
                            {formatScore(item.average)}%
                          </span>
                        </div>

                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
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

          {/* =================================================
              Footer
          ================================================= */}
          <div className="mt-4 text-xs text-slate-400">
            * ข้อมูลอัปเดตล่าสุดเมื่อ{" "}
            {new Date().toLocaleString("th-TH")}
          </div>
        </div>
      </section>
    </StaffShell>
  );
}