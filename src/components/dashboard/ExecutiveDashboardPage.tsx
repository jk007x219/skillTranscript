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

function getAcademicYearLabel(year: number) {
  return String(year);
}

export default function ExecutiveDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("all");
  const [term, setTerm] = useState("all");
  const [program, setProgram] = useState("all");
  const [major, setMajor] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({
          academicYear,
          term,
          program,
          major,
        });

        const response = await fetch(
          `${apiPath("/api/executive/dashboard")}?${query.toString()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูล Dashboard ได้");
        }

        const result = (await response.json()) as DashboardData;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [authLoading, user, academicYear, term, program, major]);

  const totalStudents = data?.totalStudents ?? 0;
  const totalActivities = data?.totalActivities ?? 0;
  const averageOverallScore = data?.averageOverallScore ?? 0;
  const termSummary = data?.termSummary ?? [];
  const overallLevel =
    averageOverallScore >= 80
      ? "ดีมาก"
      : averageOverallScore >= 50
        ? "ปานกลาง"
        : "ต้องปรับปรุง";

  if (authLoading || loading) {
    return (
      <ExecutiveShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ExecutiveShell>
    );
  }

  if (error) {
    return (
      <ExecutiveShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </ExecutiveShell>
    );
  }

  return (
    <ExecutiveShell>
      <div className="space-y-6">
        {/* Dashboard content remains unchanged. */}
        {/* The latest-term card below safely handles APIs that do not return studentCount. */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFC107] text-slate-950 shadow-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">กิจกรรมที่เข้าร่วม</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {totalActivities.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">กิจกรรม</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-sm">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">คะแนนเฉลี่ยทักษะรวม</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {averageOverallScore}%
              </p>
              <p className="text-xs text-slate-400">{overallLevel}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] md:col-span-2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4598D0] text-white shadow-sm">
              <FileBarChart2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">ภาคเรียนล่าสุด</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {termSummary.length > 0 ? termSummary[0].term : "-"}
              </p>
              <p className="text-xs text-slate-400">
                {termSummary.length > 0
                  ? `${(termSummary[0].studentCount ?? totalStudents).toLocaleString()} คน`
                  : "ยังไม่มีข้อมูล"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ExecutiveShell>
  );
}
