"use client";

import { apiPath } from "@/lib/api-path";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Cpu,
  FileBadge,
  Lightbulb,
  MessageCircle,
  MonitorCheck,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  GraduationCap,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// =====================================================
// TYPES
// =====================================================

type DashboardSkill = {
  skillId: string;
  title: string;
  level: string | null;
  hours: number;
  activityCount: number;
  percent: number;
  basicPercent?: number;
  intermediatePercent?: number;
  advancedPercent?: number;
  basicActivityCount?: number;
  intermediateActivityCount?: number;
  advancedActivityCount?: number;
};

type StudentDashboardData = {
  summary: {
    earnedSkillCount: number;
    totalSkillCount: number;
    participatedActivities: number;
    totalHours: number;
    certificates: number;
    overallPercent: number;
  };
  skills: DashboardSkill[];
};

type SkillProgressItem = DashboardSkill & {
  icon: LucideIcon;
};

// =====================================================
// FACULTY SKILLS
// =====================================================

const facultySkillNames = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

function isFacultySkill(title: string) {
  return facultySkillNames.some((name) => title.includes(name));
}

// =====================================================
// RADAR CHART LABEL
// ใช้เฉพาะชื่อที่แสดงบนกราฟ ไม่เปลี่ยนชื่อจริงจากฐานข้อมูล
// =====================================================

function getRadarLabel(title: string) {
  const labels: Record<string, string> = {
    "ทักษะการสร้างนวัตกรรมสังคม": "สร้างนวัตกรรมสังคม",
    "ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ":
      "ห้องปฏิบัติการ\nและความปลอดภัย",
    "ทักษะการคิดเชิงออกแบบนวัตกรรม": "คิดเชิงออกแบบ\nนวัตกรรม",
    "ทักษะการใช้เครื่องมือวิทยาศาสตร์": "ใช้เครื่องมือ\nวิทยาศาสตร์",
    "ทักษะการใช้ปัญญาประดิษฐ์": "ใช้ปัญญาประดิษฐ์",
    "ทักษะความปลอดภัยไซเบอร์": "ความปลอดภัย\nไซเบอร์",
    "ทักษะการสื่อสาร": "การสื่อสาร",
    "ทักษะการเป็นผู้ประกอบการ": "การเป็น\nผู้ประกอบการ",
    "ทักษะการทำงานเป็นทีม": "การทำงานเป็นทีม",
    "ทักษะการคิดและการแก้ปัญหา": "คิดและแก้ปัญหา",
    "ทักษะดิจิทัล": "ทักษะดิจิทัล",
  };

  return labels[title] ?? title.replace(/^ทักษะ/, "").trim();
}

// =====================================================
// SKILL ICON
// =====================================================

function getSkillIcon(title: string): LucideIcon {
  if (title.includes("สื่อสาร")) return MessageCircle;
  if (title.includes("ผู้ประกอบการ")) return BriefcaseBusiness;
  if (title.includes("ทีม")) return UsersRound;
  if (title.includes("ดิจิทัล") || title.includes("เครื่องมือ")) return MonitorCheck;
  if (title.includes("คิด") || title.includes("แก้ปัญหา")) return GraduationCap;
  if (title.includes("ปัญญาประดิษฐ์") || title.includes("AI")) return Cpu;
  if (title.includes("ปลอดภัย") || title.includes("ไซเบอร์")) return ShieldCheck;
  if (title.includes("ห้องปฏิบัติการ")) return Network;
  if (title.includes("นวัตกรรม")) return Lightbulb;
  return Star;
}

function toProgressItem(skill: DashboardSkill): SkillProgressItem {
  return { ...skill, icon: getSkillIcon(skill.title) };
}

function averagePercent(items: SkillProgressItem[]) {
  if (items.length === 0) return 0;
  return Math.round(
    items.reduce((total, item) => total + item.percent, 0) / items.length,
  );
}

// =====================================================
// RADAR MATH
// =====================================================

function chartAngles(count: number) {
  return Array.from({ length: count }, (_, index) => -90 + (360 / count) * index);
}

function polarPoint(percent: number, angle: number, radius: number, center: number) {
  const r = radius * (percent / 100);
  const radian = (Math.PI / 180) * angle;
  return { x: center + r * Math.cos(radian), y: center + r * Math.sin(radian) };
}

function polygonPoints(values: number[], angles: number[], radius: number, center: number) {
  return values
    .map((value, index) => {
      const p = polarPoint(value, angles[index], radius, center);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

// =====================================================
// RADAR CHART
// accent is fixed per panel (yellow for faculty, blue for essential)
// =====================================================

function RadarChart({
  accent,
  values,
  labels,
  id,
}: {
  accent: string;
  values: number[];
  labels: string[];
  id: string;
}) {
  const size = 280;
  const center = size / 2;
  const radius = 100;

  if (values.length < 3) {
    return (
      <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
        ยังไม่มีข้อมูลทักษะเพียงพอสำหรับกราฟเรดาร์
      </div>
    );
  }

  const angles = chartAngles(values.length);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor={accent} stopOpacity="0.32" />
            <stop offset="1" stopColor={accent} stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* grid rings */}
        {[100, 75, 50, 25].map((ring) => (
          <polygon
            key={ring}
            points={polygonPoints(
              angles.map(() => ring),
              angles,
              radius,
              center,
            )}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        ))}

        {/* axes */}
        {angles.map((angle) => {
          const end = polarPoint(100, angle, radius, center);
          return (
            <line
              key={angle}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {/* data polygon */}
        <polygon
          points={polygonPoints(values, angles, radius, center)}
          fill={`url(#${id}-fill)`}
          stroke={accent}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* points */}
        {values.map((value, index) => {
          const p = polarPoint(value, angles[index], radius, center);
          return (
            <circle
              key={`${id}-pt-${index}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke={accent}
              strokeWidth="2.5"
            />
          );
        })}
      </svg>

      {/* labels */}
      {labels.map((label, index) => {
        const p = polarPoint(122, angles[index], radius, center);
        return (
          <span
            key={`${id}-label-${index}`}
            className="absolute w-24 -translate-x-1/2 -translate-y-1/2 whitespace-pre-line text-center text-[10px] font-medium leading-tight text-slate-500"
            style={{ left: `${(p.x / size) * 100}%`, top: `${(p.y / size) * 100}%` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// =====================================================
// PROGRESS LIST
// =====================================================

function ProgressList({ items, accent }: { items: SkillProgressItem[]; accent: string }) {
  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
        ยังไม่มีข้อมูลทักษะในหมวดนี้
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.skillId}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition-colors hover:border-slate-200"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
            <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{item.title}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.percent}%`, backgroundColor: accent }}
              />
            </div>
          </div>

          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
            {item.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// LEVEL FILTER (tabs only — colors always follow the panel's own accent)
// =====================================================

type SkillLevel = "basic" | "intermediate" | "advanced";
type ProgressTab = SkillLevel | "all";

function normalizeSkillLevel(level?: string | null): SkillLevel {
  const value = (level || "").trim().toLowerCase();

  if (
    value.includes("สูง") ||
    value.includes("advanced") ||
    value.includes("high") ||
    value === "3"
  ) {
    return "advanced";
  }

  if (
    value.includes("กลาง") ||
    value.includes("intermediate") ||
    value.includes("medium") ||
    value.includes("mid") ||
    value === "2"
  ) {
    return "intermediate";
  }

  return "basic";
}

const levelLabels: Record<ProgressTab, string> = {
  all: "รวม",
  basic: "พื้นฐาน",
  intermediate: "กลาง",
  advanced: "สูง",
};

// =====================================================
// PANEL (header + tabs + radar + list)
// accent is fixed for the whole panel — the radar and progress
// bars always render in the panel's own color regardless of tab.
// =====================================================

function DashboardPanel({
  title,
  subtitle,
  accent,
  items,
  chartId,
}: {
  title: string;
  subtitle: string;
  accent: string;
  items: SkillProgressItem[];
  chartId: string;
}) {
  const [activeTab, setActiveTab] = useState<ProgressTab>("all");

  const grouped = useMemo(
    () => ({
      basic: items.filter((item) => normalizeSkillLevel(item.level) === "basic"),
      intermediate: items.filter(
        (item) => normalizeSkillLevel(item.level) === "intermediate",
      ),
      advanced: items.filter((item) => normalizeSkillLevel(item.level) === "advanced"),
    }),
    [items],
  );

  // โครงสร้างกราฟคงครบทุกทักษะเสมอ
  // และใช้คะแนนของ "ระดับที่เลือก" โดยตรงจาก API
  // ถ้าไม่มีข้อมูลในระดับนั้น ต้องเป็น 0
  const chartItems = items.map((item) => {
    if (activeTab === "all") return item;

    const percent =
      activeTab === "basic"
        ? (item.basicActivityCount ?? 0) > 0
          ? item.basicPercent ?? 0
          : 0
        : activeTab === "intermediate"
          ? (item.intermediateActivityCount ?? 0) > 0
            ? item.intermediatePercent ?? 0
            : 0
          : (item.advancedActivityCount ?? 0) > 0
            ? item.advancedPercent ?? 0
            : 0;

    return { ...item, percent };
  });

  const visibleItems = activeTab === "all" ? items : grouped[activeTab];

  const tabs: Array<{ key: ProgressTab; count: number }> = [
    { key: "all", count: items.length },
    { key: "basic", count: grouped.basic.length },
    { key: "intermediate", count: grouped.intermediate.length },
    { key: "advanced", count: grouped.advanced.length },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {items.length} ทักษะ
        </span>
      </div>

      <div className="px-5 py-5">
        {/* tabs */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
                style={active ? { backgroundColor: accent } : undefined}
              >
                {levelLabels[tab.key]}
                <span className="ml-1.5 opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* radar + list — radar always uses the panel's fixed accent color */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50/60 p-4">
            <RadarChart
              accent={accent}
              values={chartItems.length >= 3 ? chartItems.map((item) => item.percent) : []}
              labels={chartItems.map((item) => getRadarLabel(item.title))}
              id={`${chartId}-${activeTab}`}
            />
          </div>

          <ProgressList items={visibleItems} accent={accent} />
        </div>
      </div>
    </section>
  );
}

// =====================================================
// MAIN
// =====================================================

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [error, setError] = useState("");

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "นิสิต";

  useEffect(() => {
    if (!user?.studentId) {
      setDashboard(null);
      return;
    }

    const controller = new AbortController();
    setIsLoadingDashboard(true);
    setError("");

    fetch(apiPath(`/api/students/${user.studentId}/dashboard`), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "ไม่สามารถโหลดข้อมูลคะแนนนิสิตได้");
        }

        setDashboard(data);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "ไม่สามารถโหลดข้อมูลคะแนนนิสิตได้",
        );
        setDashboard(null);
      })
      .finally(() => setIsLoadingDashboard(false));

    return () => controller.abort();
  }, [user?.studentId]);

  const { facultySkillProgress, essentialSkillProgress } = useMemo(() => {
    const skills = dashboard?.skills.map(toProgressItem) ?? [];
    return {
      facultySkillProgress: skills.filter((skill) => isFacultySkill(skill.title)),
      essentialSkillProgress: skills.filter((skill) => !isFacultySkill(skill.title)),
    };
  }, [dashboard]);

  const summary = dashboard?.summary ?? {
    earnedSkillCount: 0,
    totalSkillCount: 0,
    participatedActivities: 0,
    totalHours: 0,
    certificates: 0,
    overallPercent: 0,
  };

  const summaryCards: Array<{
    icon: LucideIcon;
    value: string;
    label: string;
    description: string;
  }> = [
    {
      icon: Star,
      value: String(summary.earnedSkillCount),
      label: "ทักษะที่ได้รับ",
      description: `จากทั้งหมด ${summary.totalSkillCount} ทักษะ`,
    },
    {
      icon: CalendarDays,
      value: String(summary.participatedActivities),
      label: "กิจกรรมที่เข้าร่วม",
      description: `${summary.totalHours} ชั่วโมงรวม`,
    },
    {
      icon: FileBadge,
      value: String(summary.certificates),
      label: "ใบรับรองที่ได้รับ",
      description: "อ้างอิงจากกิจกรรมที่เข้าร่วม",
    },
  ];

  return (
    <StudentShell activePath="/student/dashboard">
      <section className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        {/* ================= HERO ================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D47A1] to-[#1565C0] px-6 py-7 text-white sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#FFC107]/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
                <Sparkles className="h-3.5 w-3.5 text-[#FFC107]" aria-hidden="true" />
                Skill Transcript Dashboard
              </p>

              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
                สวัสดี, {displayName}
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-blue-50/90">
                ภาพรวมคะแนนทักษะและกิจกรรมของคุณ อัปเดตล่าสุดจากฐานข้อมูลระบบ
              </p>
            </div>

            <Link
              href="/student/skilltranscript"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#1565C0] transition hover:bg-blue-50"
            >
              ดู Skill Transcript ของฉัน
              <Award className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ================= STATUS MESSAGES ================= */}
        {(authLoading || isLoadingDashboard) && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1565C0]">
            กำลังโหลดข้อมูลคะแนนจากฐานข้อมูล...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!authLoading && !user && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบอีกครั้ง
          </div>
        )}

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-[#1565C0]">
                <card.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>

              <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">
                {card.value}
              </p>
              <p className="text-sm font-medium text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-500">{card.description}</p>
            </article>
          ))}
        </div>

        {/* ================= PANELS ================= */}
        <DashboardPanel
          title="ทักษะของนิสิตคณะวิทยาศาสตร์ต้องมี"
          subtitle="คำนวณจากกิจกรรมและชั่วโมงที่นิสิตเข้าร่วมในฐานข้อมูล"
          accent="#FFC107"
          items={facultySkillProgress}
          chartId="faculty-skill-chart"
        />

        <DashboardPanel
          title="ทักษะที่จำเป็นสำหรับนิสิต"
          subtitle="คำนวณจากกิจกรรมและชั่วโมงที่นิสิตเข้าร่วมในฐานข้อมูล"
          accent="#1565C0"
          items={essentialSkillProgress}
          chartId="essential-skill-chart"
        />
      </section>
    </StudentShell>
  );
}
