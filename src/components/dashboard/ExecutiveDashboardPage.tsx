"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useState } from "react";
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
  TrendingUp,
  TrendingDown,
  Download,
  RotateCcw,
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
  ResponsiveContainer,
} from "recharts";

import ExecutiveShell from "@/components/executive/ExecutiveShell";
import { useAuth } from "@/context/auth-context";

// ======================================================
// Types
// ======================================================

type SkillAverage = {
  skillName: string;
  average: number;
};

type RadarItem = {
  skill: string;
  score: number;
};

type LevelDistribution = {
  level: string;
  count: number;
  percent: number;
};

type TermSummary = {
  term: string;
  avgScore: number;
  studentCount?: number;
  activityCount: number;
  level: string;
};

type DashboardData = {
  academicYear: string;
  term: string;
  program: string;
  major: string;

  academicYears: number[];
  terms: string[];
  programs: string[];
  majors: string[];

  totalStudents: number;
  totalActivities: number;
  averageOverallScore: number;

  levelDistribution: LevelDistribution[];

  radarData: RadarItem[];

  facultySkills: SkillAverage[];
  essentialSkills: SkillAverage[];

  termSummary: TermSummary[];
};

// ======================================================
// สีกราฟ
// ======================================================

const COLORS = [
  "#22C55E",
  "#FFC107",
  "#EF4444",
];

// ======================================================
// Icon ของแต่ละทักษะ
// ======================================================

function getSkillIcon(title: string) {
  if (title.includes("สื่อสาร")) return MessageCircle;
  if (title.includes("ผู้ประกอบการ")) return Briefcase;
  if (title.includes("ทีม")) return UsersRound;

  if (
    title.includes("ดิจิทัล") ||
    title.includes("เครื่องมือ")
  ) {
    return Monitor;
  }

  if (
    title.includes("คิด") ||
    title.includes("แก้ปัญหา")
  ) {
    return Puzzle;
  }

  if (
    title.includes("ปัญญาประดิษฐ์") ||
    title.includes("AI")
  ) {
    return Cpu;
  }

  if (
    title.includes("ปลอดภัย") ||
    title.includes("ไซเบอร์")
  ) {
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

// ======================================================
// ชื่อปีการศึกษา
// ======================================================

function getAcademicYearLabel(year: number) {
  return String(year);
}

// ======================================================
// Component
// ======================================================

export default function ExecutiveDashboardPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // ====================================================
  // Filters
  // ====================================================

  const [academicYear, setAcademicYear] =
    useState("all");

  const [term, setTerm] =
    useState("all");

  const [program, setProgram] =
    useState("all");

  const [major, setMajor] =
    useState("all");

  // ====================================================
  // โหลดข้อมูล
  // ====================================================

  useEffect(() => {
    if (authLoading) return;

    const controller =
      new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params =
          new URLSearchParams();

        params.set(
          "academicYear",
          academicYear
        );

        params.set("term", term);
        params.set("program", program);
        params.set("major", major);

        const res = await fetch(
          apiPath(`/api/executive/dashboard?${params.toString()}`),
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(
            "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"
          );
        }

        const result =
          (await res.json()) as DashboardData;

        setData(result);
      } catch (err: any) {
        if (
          err?.name === "AbortError"
        ) {
          return;
        }

        console.error(err);

        setData(null);

        setError(
          "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [
    authLoading,
    academicYear,
    term,
    program,
    major,
  ]);

  // ====================================================
  // Reset filter
  // ====================================================

  const resetFilters = () => {
    setAcademicYear("all");
    setTerm("all");
    setProgram("all");
    setMajor("all");
  };

  // ====================================================
  // Export PDF
  //
  // Browser Print -> Save as PDF
  //
  // PDF จะแสดงเฉพาะส่วนรายงานข้อความ
  // ไม่แสดงกราฟ
  // ====================================================

  const handleExportPDF = () => {
    window.print();
  };

  // ====================================================
  // Loading
  // ====================================================

  if (authLoading || loading) {
    return (
      <ExecutiveShell activePath="/executive/dashboard">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />

          <span className="ml-2 text-slate-500">
            กำลังโหลดข้อมูล...
          </span>
        </div>
      </ExecutiveShell>
    );
  }

  // ====================================================
  // Error
  // ====================================================

  if (!data) {
    return (
      <ExecutiveShell activePath="/executive/dashboard">
        <div className="p-6">
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
            {error || "ไม่พบข้อมูล"}
          </div>
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
    academicYears,
    terms,
    programs,
    majors,
  } = data;

  // ====================================================
  // คะแนนเฉลี่ยแต่ละหมวด
  // ====================================================

  // ค่าเฉลี่ยหมวด: นับเฉพาะทักษะที่มีนิสิตเข้าร่วมจริง
  // แต่ข้อมูล facultySkills / essentialSkills ยังคงครบทุกทักษะสำหรับกราฟ
  const assessedFacultySkills = facultySkills.filter(
    (item) => (item.participantCount ?? 0) > 0
  );

  const assessedEssentialSkills = essentialSkills.filter(
    (item) => (item.participantCount ?? 0) > 0
  );

  const facultyAverage =
    assessedFacultySkills.length > 0
      ? Math.round(
          (assessedFacultySkills.reduce(
            (sum, item) => sum + item.average,
            0
          ) /
            assessedFacultySkills.length) *
            100
        ) / 100
      : 0;

  const essentialAverage =
    assessedEssentialSkills.length > 0
      ? Math.round(
          (assessedEssentialSkills.reduce(
            (sum, item) => sum + item.average,
            0
          ) /
            assessedEssentialSkills.length) *
            100
        ) / 100
      : 0;

  // ====================================================
  // ระดับคะแนน
  // ====================================================

  const overallLevel =
    averageOverallScore >= 80
      ? "ดีมาก"
      : averageOverallScore >= 50
      ? "ปานกลาง"
      : "ต้องปรับปรุง";

  // ====================================================
  // Filter summary
  // ====================================================

  const filterDescription = [
    academicYear !== "all"
      ? `ปีการศึกษา ${academicYear}`
      : "ทุกปีการศึกษา",

    term !== "all"
      ? `ภาค ${term}`
      : "ทุกภาคการศึกษา",

    program !== "all"
      ? program
      : "ทุกหลักสูตร",

    major !== "all"
      ? major
      : "ทุกวิชาเอก",
  ].join(" • ");

  // ====================================================
  // Render
  // ====================================================

  return (
    <ExecutiveShell activePath="/executive/dashboard">
      <style jsx global>{`
        /* ==================================================
           PRINT / PDF
        ================================================== */

        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 14mm 15mm 14mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ================================================
             ซ่อน Header / Sidebar / ปุ่ม / Filter
          ================================================= */

          main:has(.executive-dashboard-print) > header,
          main:has(.executive-dashboard-print) > div > aside,
          .executive-dashboard-print .no-print {
            display: none !important;
          }

          main:has(.executive-dashboard-print) > div {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .executive-dashboard-print {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
          }

          /* ================================================
             ซ่อน Header หน้า Dashboard ปกติ
          ================================================= */

          .executive-dashboard-print
            .screen-dashboard-header {
            display: none !important;
          }

          /* ================================================
             Print Header
          ================================================= */

          .executive-dashboard-print
            .print-report-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 20px !important;

            margin-bottom: 18px !important;
            padding-bottom: 12px !important;

            border-bottom: 2px solid #1e3a8a !important;
          }

          .executive-dashboard-print
            .print-report-header
            p {
            margin: 0 0 3px 0 !important;
            color: #374151 !important;
            line-height: 1.5 !important;
          }

          .executive-dashboard-print
            .print-report-header
            p:first-child {
            color: #111827 !important;
            font-size: 14px !important;
            font-weight: 700 !important;
          }

          /* ================================================
             Overview
          ================================================= */

          .executive-dashboard-print
            .print-overview {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;

            margin-top: 0 !important;
            margin-bottom: 18px !important;
          }

          .executive-dashboard-print
            .print-overview
            > div {
            display: block !important;

            padding: 10px 12px !important;

            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;

            background: #ffffff !important;

            box-shadow: none !important;

            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .executive-dashboard-print
            .print-overview
            > div
            > div:first-child {
            display: none !important;
          }

          .executive-dashboard-print
            .print-overview
            p {
            margin: 0 !important;
          }

          .executive-dashboard-print
            .print-overview
            p:first-child {
            font-size: 9px !important;
            color: #6b7280 !important;
          }

          .executive-dashboard-print
            .print-overview
            p:nth-child(2) {
            margin-top: 3px !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #111827 !important;
          }

          .executive-dashboard-print
            .print-overview
            p:nth-child(3) {
            font-size: 8px !important;
            color: #6b7280 !important;
          }

          /* ================================================
             ซ่อนกราฟทั้งหมด
          ================================================= */

          .executive-dashboard-print
            .print-hide {
            display: none !important;
          }

          .executive-dashboard-print
            .recharts-responsive-container,
          .executive-dashboard-print
            .recharts-wrapper {
            display: none !important;
          }

          /* ================================================
             ซ่อน Radar + Pie section ทั้งหมด
          ================================================= */

          .executive-dashboard-print
            .print-level-layout {
            display: none !important;
          }

          /* ================================================
             PDF Skill Summary
          ================================================= */

          .executive-dashboard-print
            .print-pdf-skills {
            display: block !important;

            margin-top: 18px !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            h2 {
            margin: 0 !important;
            padding-bottom: 7px !important;

            border-bottom: 1px solid #d1d5db !important;

            font-size: 13px !important;
            font-weight: 700 !important;
            color: #111827 !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            > p {
            margin-top: 5px !important;
            margin-bottom: 8px !important;

            font-size: 9px !important;
            color: #6b7280 !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            table {
            width: 100% !important;

            border-collapse: collapse !important;

            table-layout: fixed !important;

            font-size: 8.5px !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            thead {
            display: table-header-group !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            th {
            padding: 7px 5px !important;

            border: 1px solid #d1d5db !important;

            background: #f3f4f6 !important;

            color: #374151 !important;

            font-weight: 700 !important;
          }

          .executive-dashboard-print
            .print-pdf-skills
            td {
            padding: 6px 5px !important;

            border: 1px solid #e5e7eb !important;

            color: #374151 !important;

            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          /* ================================================
             Summary box
          ================================================= */

          .executive-dashboard-print
            .print-summary-boxes {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;

            gap: 8px !important;

            margin-top: 12px !important;
          }

          .executive-dashboard-print
            .print-summary-box {
            border: 1px solid #d1d5db !important;

            padding: 9px 11px !important;

            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .executive-dashboard-print
            .print-summary-box
            p {
            margin: 0 !important;
          }

          .executive-dashboard-print
            .print-summary-box
            p:first-child {
            font-size: 8.5px !important;
            color: #6b7280 !important;
          }

          .executive-dashboard-print
            .print-summary-box
            p:last-child {
            margin-top: 3px !important;

            font-size: 13px !important;

            font-weight: 700 !important;

            color: #111827 !important;
          }

          /* ================================================
             Level Distribution
          ================================================= */

          .executive-dashboard-print
            .print-level-summary {
            display: block !important;

            margin-top: 18px !important;
          }

          .executive-dashboard-print
            .print-level-summary
            h2 {
            margin: 0 !important;
            padding-bottom: 7px !important;

            border-bottom: 1px solid #d1d5db !important;

            font-size: 13px !important;
            font-weight: 700 !important;
          }

          .executive-dashboard-print
            .print-level-summary
            table {
            width: 100% !important;

            margin-top: 8px !important;

            border-collapse: collapse !important;

            font-size: 8.5px !important;
          }

          .executive-dashboard-print
            .print-level-summary
            th,
          .executive-dashboard-print
            .print-level-summary
            td {
            padding: 6px 5px !important;

            border: 1px solid #d1d5db !important;
          }

          .executive-dashboard-print
            .print-level-summary
            th {
            background: #f3f4f6 !important;
            font-weight: 700 !important;
          }

          .executive-dashboard-print
            .print-level-summary
            tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* ================================================
             Term Statistics
          ================================================= */

          .executive-dashboard-print
            .print-terms {
            margin-top: 18px !important;

            padding: 0 !important;

            border: 0 !important;
            border-radius: 0 !important;

            box-shadow: none !important;

            break-inside: auto !important;
          }

          .executive-dashboard-print
            .print-terms
            h2 {
            margin: 0 !important;
            padding-bottom: 7px !important;

            border-bottom: 1px solid #d1d5db !important;

            font-size: 13px !important;
            font-weight: 700 !important;
            color: #111827 !important;
          }

          .executive-dashboard-print
            .print-terms
            > p {
            margin-top: 5px !important;
            margin-bottom: 8px !important;

            font-size: 9px !important;
            color: #6b7280 !important;
          }

          .executive-dashboard-print
            .print-terms
            > div {
            overflow: visible !important;
          }

          .executive-dashboard-print
            .print-terms
            table {
            width: 100% !important;
            min-width: 0 !important;

            border-collapse: collapse !important;

            table-layout: fixed !important;

            font-size: 8.5px !important;
          }

          .executive-dashboard-print
            .print-terms
            thead {
            display: table-header-group !important;
          }

          .executive-dashboard-print
            .print-terms
            tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .executive-dashboard-print
            .print-terms
            th {
            padding: 7px 5px !important;

            border: 1px solid #d1d5db !important;

            background: #f3f4f6 !important;

            color: #374151 !important;

            font-weight: 700 !important;
          }

          .executive-dashboard-print
            .print-terms
            td {
            padding: 6px 5px !important;

            border: 1px solid #e5e7eb !important;

            color: #374151 !important;

            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          /* ซ่อนคอลัมน์แนวโน้ม */
          .executive-dashboard-print
            .print-terms
            th:last-child,
          .executive-dashboard-print
            .print-terms
            td:last-child {
            display: none !important;
          }

          /* ================================================
             Footer
          ================================================= */

          .executive-dashboard-print
            .print-footer {
            margin-top: 14px !important;

            padding-top: 7px !important;

            border-top: 1px solid #e5e7eb !important;

            font-size: 8px !important;

            color: #9ca3af !important;
          }

          /* ================================================
             ป้องกัน card แตกกลางหน้า
          ================================================= */

          .executive-dashboard-print
            .rounded-2xl {
            box-shadow: none !important;
          }

          /* ================================================
             ซ่อน interactive elements
          ================================================= */

          button,
          select,
          input {
            display: none !important;
          }
        }

        /* ==================================================
           ปกติบนหน้าจอ
        ================================================== */

        .print-pdf-skills,
        .print-level-summary {
          display: none;
        }
      `}</style>

      <section className="executive-dashboard-print p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)]">

          {/* ==================================================
              Header
          ================================================== */}

          <div className="screen-dashboard-header flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                แดชบอร์ดภาพรวมทักษะของนิสิต
              </h1>

              <div className="mt-2 h-1 w-24 rounded-full bg-[#FFC107]" />

              <p className="mt-1 text-sm text-slate-500">
                ข้อมูลล่าสุดจากฐานข้อมูล{" "}
                {new Date().toLocaleDateString(
                  "th-TH"
                )}
              </p>
            </div>

            {/* Buttons */}

            <div className="no-print flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />

                รีเซ็ตตัวกรอง
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0D47A1]"
              >
                <Download className="h-4 w-4" />

                ส่งออก PDF
              </button>
            </div>
          </div>

          {/* ==================================================
              Print Header
          ================================================== */}

          <div className="print-report-header hidden items-center justify-between border-b border-slate-300 pb-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">
                คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
                มหาวิทยาลัยทักษิณ
              </p>

              <p>
                รายงานภาพรวมทักษะของนิสิต
              </p>

              <p className="mt-1">
                {filterDescription}
              </p>
            </div>

            <p>
              พิมพ์เมื่อ{" "}
              {new Date().toLocaleString(
                "th-TH"
              )}
            </p>
          </div>

          {/* ==================================================
              Filters
          ================================================== */}

          <div className="no-print mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                ตัวกรองข้อมูล
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เลือกเงื่อนไขเพื่อดูสถิติทักษะของนิสิต
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* ปีการศึกษา */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ปีการศึกษา
                </label>

                <select
                  value={academicYear}
                  onChange={(e) =>
                    setAcademicYear(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    ทุกปีการศึกษา
                  </option>

                  {academicYears.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {getAcademicYearLabel(
                          year
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* ภาคการศึกษา */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ภาคการศึกษา
                </label>

                <select
                  value={term}
                  onChange={(e) =>
                    setTerm(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    ทุกภาคการศึกษา
                  </option>

                  {terms.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        ภาค {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* หลักสูตร */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  หลักสูตร
                </label>

                <select
                  value={program}
                  onChange={(e) =>
                    setProgram(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    ทุกหลักสูตร
                  </option>

                  {programs.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* วิชาเอก */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  วิชาเอก
                </label>

                <select
                  value={major}
                  onChange={(e) =>
                    setMajor(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">
                    ทุกวิชาเอก
                  </option>

                  {majors.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-[#1565C0]">
              <span className="font-semibold">
                ข้อมูลที่กำลังแสดง:
              </span>{" "}
              {filterDescription}
            </div>
          </div>

          {/* ==================================================
              Overview Cards
          ================================================== */}

          <div className="print-overview mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Students */}

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <UsersRound className="h-6 w-6" />
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
            </div>

            {/* Activities */}

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  กิจกรรมที่เข้าร่วม
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalActivities.toLocaleString()}
                </p>

                <p className="text-xs text-slate-400">
                  กิจกรรม
                </p>
              </div>
            </div>

            {/* Average */}

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
                <Star className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  คะแนนเฉลี่ยทักษะรวม
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {averageOverallScore}%
                </p>

                <p className="text-xs text-slate-400">
                  {overallLevel}
                </p>
              </div>
            </div>

            {/* Latest term */}

            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4598D0] text-white shadow-sm">
                <FileBarChart2 className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  ภาคเรียนล่าสุด
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {termSummary.length > 0
                    ? termSummary[0].term
                    : "-"}
                </p>

                <p className="text-xs text-slate-400">
                  {termSummary.length > 0
                    ? `${(termSummary[0]?.studentCount ?? 0).toLocaleString()} คน`
                    : "ยังไม่มีข้อมูล"}
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              PDF: Skill Summary
          ================================================== */}

          <div className="print-pdf-skills mt-6 hidden">

            <div className="mb-3">
              <h2 className="text-lg font-semibold text-slate-950">
                สรุปคะแนนเฉลี่ยทักษะรายด้าน
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                คะแนนเฉลี่ยคำนวณจากผลการประเมินของนิสิต
                ที่ตรงตามตัวกรองข้อมูล
              </p>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="w-12 px-3 py-2 text-center font-semibold text-slate-700">
                    ลำดับ
                  </th>

                  <th className="px-3 py-2 text-left font-semibold text-slate-700">
                    ทักษะ
                  </th>

                  <th className="w-32 px-3 py-2 text-right font-semibold text-slate-700">
                    คะแนนเฉลี่ย
                  </th>

                  <th className="w-28 px-3 py-2 text-center font-semibold text-slate-700">
                    ระดับ
                  </th>
                </tr>
              </thead>

              <tbody>
                {radarData.map(
                  (item, index) => {
                    const level =
                      item.score >= 80
                        ? "ดีมาก"
                        : item.score >= 50
                        ? "ปานกลาง"
                        : "ต้องปรับปรุง";

                    return (
                      <tr
                        key={item.skill}
                        className="border-b border-slate-200"
                      >
                        <td className="px-3 py-2 text-center text-slate-600">
                          {index + 1}
                        </td>

                        <td className="px-3 py-2 text-slate-800">
                          {item.skill}
                        </td>

                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {item.score.toFixed(2)}%
                        </td>

                        <td className="px-3 py-2 text-center text-slate-700">
                          {level}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>

            {/* คะแนนเฉลี่ยแต่ละหมวด */}

            <div className="print-summary-boxes mt-5 grid grid-cols-2 gap-4">

              <div className="print-summary-box border border-slate-200 p-3">
                <p className="text-xs text-slate-500">
                  คะแนนเฉลี่ยทักษะคณะ
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {facultyAverage.toFixed(2)}%
                </p>
              </div>

              <div className="print-summary-box border border-slate-200 p-3">
                <p className="text-xs text-slate-500">
                  คะแนนเฉลี่ยทักษะจำเป็น
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {essentialAverage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              PDF: Level Summary
          ================================================== */}

          <div className="print-level-summary mt-6 hidden">

            <h2 className="text-lg font-semibold text-slate-950">
              สรุประดับทักษะของนิสิต
            </h2>

            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">
                    ระดับ
                  </th>

                  <th className="px-3 py-2 text-right">
                    จำนวน
                  </th>

                  <th className="px-3 py-2 text-right">
                    ร้อยละ
                  </th>
                </tr>
              </thead>

              <tbody>
                {levelDistribution.map(
                  (item) => (
                    <tr key={item.level}>
                      <td className="px-3 py-2">
                        {item.level}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {item.count.toLocaleString()} คน
                      </td>

                      <td className="px-3 py-2 text-right">
                        {item.percent}%
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              Radar + Pie
          ================================================== */}

          <div className="print-level-layout mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">

            {/* Radar */}

            <div className="print-hide rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                ภาพรวมทักษะทั้งหมด
              </h2>

              <p className="text-xs text-slate-400">
                คะแนนเฉลี่ยของทักษะทั้ง 11 ด้าน
              </p>

              <div className="mt-4 h-[380px] w-full">
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
                        `${Number(value).toFixed(2)}%`,
                        "คะแนนเฉลี่ย",
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFC107]" />

                คะแนนเฉลี่ยของนิสิตที่ตรงตามตัวกรอง
              </div>
            </div>

            {/* Pie */}

            <div className="print-level-chart rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <h2 className="text-lg font-semibold text-slate-950">
                สัดส่วนนิสิตตามระดับทักษะ
              </h2>

              <div className="relative mt-2 h-[220px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
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
                      {levelDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={entry.level}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                            stroke="none"
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        `${value} คน`,
                        "จำนวน",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-500">
                    รวมทั้งหมด
                  </p>

                  <p className="text-2xl font-semibold text-slate-950">
                    {totalStudents.toLocaleString()}
                  </p>

                  <p className="text-xs text-slate-500">
                    คน
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {levelDistribution.map(
                  (item, index) => (
                    <li
                      key={item.level}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.level}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.count.toLocaleString()}{" "}
                          คน ({item.percent}%)
                        </p>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* ==================================================
              Skill Comparison
          ================================================== */}

          <div className="print-hide mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  เปรียบเทียบคะแนนเฉลี่ยทักษะในแต่ละหมวด
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  คะแนนคำนวณจาก earnedScore / maxScore
                  และเฉลี่ยนิสิตที่ตรงตามตัวกรอง
                </p>
              </div>

              <div className="flex gap-4 text-xs text-slate-500">
                <span>
                  ทักษะคณะเฉลี่ย{" "}
                  <strong className="text-[#FFC107]">
                    {facultyAverage}%
                  </strong>
                </span>

                <span>
                  ทักษะจำเป็นเฉลี่ย{" "}
                  <strong className="text-[#1565C0]">
                    {essentialAverage}%
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">

              {/* Faculty */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#FFC107]">
                  🏛️ ทักษะที่นิสิตคณะวิทย์ต้องมี
                </h3>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={facultySkills}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 20,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        stroke="#EEF2F7"
                        horizontal={true}
                        vertical={false}
                      />

                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{
                          fill: "#64748B",
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="skillName"
                        tick={{
                          fill: "#475569",
                          fontSize: 11,
                        }}
                        width={120}
                        tickFormatter={(value) =>
                          value.length > 15
                            ? `${value.slice(
                                0,
                                15
                              )}...`
                            : value
                        }
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${Number(
                            value
                          ).toFixed(2)}%`,
                          "คะแนนเฉลี่ย",
                        ]}
                        labelFormatter={(label) =>
                          `ทักษะ: ${label}`
                        }
                      />

<Bar
  dataKey="average"
  radius={[8, 8, 0, 0]}
/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Essential */}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#1565C0]">
                  ⭐ ทักษะที่นิสิตจำเป็นต้องมี
                </h3>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={essentialSkills}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 20,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        stroke="#EEF2F7"
                        horizontal={true}
                        vertical={false}
                      />

                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{
                          fill: "#64748B",
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="skillName"
                        tick={{
                          fill: "#475569",
                          fontSize: 11,
                        }}
                        width={120}
                        tickFormatter={(value) =>
                          value.length > 15
                            ? `${value.slice(
                                0,
                                15
                              )}...`
                            : value
                        }
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${Number(
                            value
                          ).toFixed(2)}%`,
                          "คะแนนเฉลี่ย",
                        ]}
                        labelFormatter={(label) =>
                          `ทักษะ: ${label}`
                        }
                      />

<Bar
  dataKey="average"
  radius={[8, 8, 0, 0]}
/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Skill detail */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {radarData.map(
                (item) => {
                  const Icon =
                    getSkillIcon(
                      item.skill
                    );

                  return (
                    <div
                      key={item.skill}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-[#1565C0]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-500">
                          {item.skill}
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {item.score.toFixed(
                            2
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ==================================================
              Term Statistics
          ================================================== */}

          <div className="print-terms mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h2 className="text-lg font-semibold text-slate-950">
              สถิติตามภาคการศึกษา
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              คะแนนเฉลี่ยของนิสิตในแต่ละภาคการศึกษา
              โดยใช้สูตรเดียวกับคะแนนรวมของแดชบอร์ด
            </p>

            {termSummary.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
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
                    {termSummary.map(
                      (item, index) => {
                        const previous =
                          index <
                          termSummary.length - 1
                            ? termSummary[index + 1]
                            : undefined;

                        const trendDiff = previous
                          ? Math.round(
                              (item.avgScore -
                                previous.avgScore) *
                                100
                            ) / 100
                          : null;

                        const trend:
                          | "up"
                          | "down"
                          | "same"
                          | null =
                          trendDiff === null
                            ? null
                            : trendDiff > 0
                            ? "up"
                            : trendDiff < 0
                            ? "down"
                            : "same";

                        const levelColor =
                          item.level ===
                          "ดีมาก"
                            ? "text-emerald-600 bg-emerald-50"
                            : item.level ===
                              "ปานกลาง"
                            ? "text-amber-600 bg-amber-50"
                            : "text-red-600 bg-red-50";

                        return (
                          <tr
                            key={`${item.term}-${index}`}
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
                              {(item.studentCount ?? 0).toLocaleString()}{" "}
                              คน
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {item.activityCount}{" "}
                              กิจกรรม
                            </td>

                            <td className="px-4 py-3">
                              {trend ===
                                "up" && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <TrendingUp className="h-4 w-4" />

                                  <span className="text-xs">
                                    ดีขึ้น +{trendDiff?.toFixed(2)} คะแนน
                                  </span>
                                </span>
                              )}

                              {trend ===
                                "down" && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <TrendingDown className="h-4 w-4" />

                                  <span className="text-xs">
                                    ลดลง {trendDiff?.toFixed(2)} คะแนน
                                  </span>
                                </span>
                              )}

                              {trend ===
                                "same" && (
                                <span className="text-xs text-slate-400">
                                  คงที่ 0.00 คะแนน
                                </span>
                              )}

                              {trend ===
                                null && (
                                <span className="text-xs text-slate-400">
                                  ไม่มีภาคก่อนหน้า
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                ยังไม่มีข้อมูลภาคการศึกษา
              </div>
            )}
          </div>

          {/* ==================================================
              Footer
          ================================================== */}

          <div className="print-footer mt-4 text-xs text-slate-400">
            * ข้อมูลอัปเดตล่าสุดเมื่อ{" "}
            {new Date().toLocaleString(
              "th-TH"
            )}
          </div>
        </div>
      </section>
    </ExecutiveShell>
  );
}
