"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  FileBadge,
  LayoutDashboard,
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

// =====================================================
// RADAR CHART LABEL
// ใช้เฉพาะชื่อที่แสดงบนกราฟ
// ไม่เปลี่ยนชื่อจริงจากฐานข้อมูล
// =====================================================

function getRadarLabel(title: string) {
  const labels: Record<string, string> = {
    "ทักษะการสร้างนวัตกรรมสังคม":
      "สร้างนวัตกรรมสังคม",

    "ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ":
      "ห้องปฏิบัติการ\nและความปลอดภัย",

    "ทักษะการคิดเชิงออกแบบนวัตกรรม":
      "คิดเชิงออกแบบ\nนวัตกรรม",

    "ทักษะการใช้เครื่องมือวิทยาศาสตร์":
      "ใช้เครื่องมือ\nวิทยาศาสตร์",

    "ทักษะการใช้ปัญญาประดิษฐ์":
      "ใช้ปัญญาประดิษฐ์",

    "ทักษะความปลอดภัยไซเบอร์":
      "ความปลอดภัย\nไซเบอร์",

    "ทักษะการสื่อสาร":
      "การสื่อสาร",

    "ทักษะการเป็นผู้ประกอบการ":
      "การเป็น\nผู้ประกอบการ",

    "ทักษะการทำงานเป็นทีม":
      "การทำงานเป็นทีม",

    "ทักษะการคิดและการแก้ปัญหา":
      "คิดและแก้ปัญหา",

    "ทักษะดิจิทัล":
      "ทักษะดิจิทัล",
  };

  return labels[title] ?? title.replace(/^ทักษะ/, "").trim();
}

// =====================================================
// FACULTY SKILL CHECK
// =====================================================

function isFacultySkill(title: string) {
  return facultySkillNames.some((name) =>
    title.includes(name),
  );
}

// =====================================================
// SKILL ICON
// =====================================================

function getSkillIcon(title: string): LucideIcon {
  if (title.includes("สื่อสาร")) return MessageCircle;

  if (title.includes("ผู้ประกอบการ")) {
    return BriefcaseBusiness;
  }

  if (title.includes("ทีม")) {
    return UsersRound;
  }

  if (
    title.includes("ดิจิทัล") ||
    title.includes("เครื่องมือ")
  ) {
    return MonitorCheck;
  }

  if (
    title.includes("คิด") ||
    title.includes("แก้ปัญหา")
  ) {
    return GraduationCap;
  }

  if (
    title.includes("ปัญญาประดิษฐ์") ||
    title.includes("AI")
  ) {
    return UsersRound;
  }

  if (
    title.includes("ปลอดภัย") ||
    title.includes("ไซเบอร์")
  ) {
    return ShieldCheck;
  }

  if (title.includes("ห้องปฏิบัติการ")) {
    return Network;
  }

  if (title.includes("นวัตกรรม")) {
    return Lightbulb;
  }

  return Star;
}

// =====================================================
// CONVERT SKILL
// =====================================================

function toProgressItem(
  skill: DashboardSkill,
): SkillProgressItem {
  return {
    ...skill,
    icon: getSkillIcon(skill.title),
  };
}

// =====================================================
// RADAR CALCULATION
// =====================================================

function chartAngles(count: number) {
  return Array.from(
    { length: count },
    (_, index) =>
      -90 + (360 / count) * index,
  );
}

function polarPoint(
  percent: number,
  angle: number,
) {
  const radius = 96 * (percent / 100);
  const radian = (Math.PI / 180) * angle;

  return {
    x: 130 + radius * Math.cos(radian),
    y: 130 + radius * Math.sin(radian),
  };
}

function polygonPoints(
  values: number[],
  angles: number[],
) {
  return values
    .map((value, index) => {
      const point = polarPoint(
        value,
        angles[index],
      );

      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function gridPolygonPoints(
  size: number,
  angles: number[],
) {
  return angles
    .map((angle) => {
      const point = polarPoint(size, angle);

      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

// =====================================================
// RADAR CHART
// =====================================================

function RadarChart({
  accent = "#FFC107",
  values,
  labels,
  id,
}: {
  accent?: string;
  values: number[];
  labels: string[];
  id: string;
}) {
  if (values.length < 3) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-[330px] items-center justify-center rounded-full bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-6 text-center text-sm text-slate-500 shadow-[inset_0_0_0_1px_rgba(21,101,192,0.08)]">
        ยังไม่มีข้อมูลทักษะเพียงพอสำหรับกราฟเรดาร์
      </div>
    );
  }

  const softPoints = values.map((value) =>
    Math.max(0, value - 18),
  );

  const angles = chartAngles(values.length);

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[330px] items-center justify-center rounded-full bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-5 shadow-[inset_0_0_0_1px_rgba(21,101,192,0.08)]">
      {/* Glow */}
      <div className="absolute inset-7 rounded-full bg-white/70 blur-2xl" />

      {/* Radar SVG */}
      <svg
        viewBox="0 0 260 260"
        className="relative h-full w-full overflow-visible drop-shadow-sm"
      >
        <defs>
          {/* Glow */}
          <radialGradient
            id={`${id}-glow`}
            cx="50%"
            cy="50%"
            r="62%"
          >
            <stop
              offset="0%"
              stopColor={accent}
              stopOpacity="0.34"
            />

            <stop
              offset="100%"
              stopColor={accent}
              stopOpacity="0"
            />
          </radialGradient>

          {/* Fill */}
          <linearGradient
            id={`${id}-fill`}
            x1="50"
            x2="210"
            y1="30"
            y2="230"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              stopColor={accent}
              stopOpacity="0.34"
            />

            <stop
              offset="1"
              stopColor={accent}
              stopOpacity="0.08"
            />
          </linearGradient>

          {/* Shadow */}
          <filter
            id={`${id}-shadow`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="8"
              floodColor={accent}
              floodOpacity="0.24"
            />
          </filter>
        </defs>

        {/* Background glow */}
        <circle
          cx="130"
          cy="130"
          r="98"
          fill={`url(#${id}-glow)`}
        />

        {/* Grid */}
        {[100, 80, 60, 40, 20].map(
          (size) => (
            <polygon
              key={size}
              points={gridPolygonPoints(
                size,
                angles,
              )}
              fill="none"
              stroke={
                size === 100
                  ? "#BFD8F3"
                  : "#D8E7F7"
              }
              strokeWidth="1"
            />
          ),
        )}

        {/* Axis */}
        {angles.map((angle) => (
          <line
            key={angle}
            x1="130"
            y1="130"
            x2="130"
            y2="26"
            stroke="#D8E7F7"
            strokeWidth="1"
            transform={`rotate(${angle} 130 130)`}
          />
        ))}

        {/* Main polygon */}
        <polygon
          points={polygonPoints(
            values,
            angles,
          )}
          fill={`url(#${id}-fill)`}
          stroke={accent}
          strokeLinejoin="round"
          strokeWidth="4"
          filter={`url(#${id}-shadow)`}
        />

        {/* Soft polygon */}
        <polygon
          points={polygonPoints(
            softPoints,
            angles,
          )}
          fill="white"
          fillOpacity="0.2"
          stroke={accent}
          strokeDasharray="4 7"
          strokeLinecap="round"
          strokeOpacity="0.55"
          strokeWidth="2"
        />

        {/* Points */}
        {values.map((value, index) => {
          const point = polarPoint(
            value,
            angles[index],
          );

          return (
            <g
              key={`${id}-${labels[index]}`}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="6.5"
                fill="white"
                stroke={accent}
                strokeWidth="3"
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill={accent}
              />
            </g>
          );
        })}
      </svg>

      {/* ================================================= */}
      {/* RADAR LABELS */}
      {/* ================================================= */}

      {labels.map((label, index) => {
        const point = polarPoint(
          122,
          angles[index],
        );

        return (
          <span
            key={`${id}-label-${index}`}
            className="absolute w-[7.5rem] -translate-x-1/2 -translate-y-1/2 whitespace-pre-line rounded-full bg-white/90 px-2 py-1.5 text-center text-[10px] font-medium leading-[1.35] text-slate-600 shadow-sm ring-1 ring-blue-100"
            style={{
              left: `${(point.x / 260) * 100}%`,
              top: `${(point.y / 260) * 100}%`,
            }}
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

function ProgressList({
  items,
  accent,
}: {
  items: SkillProgressItem[];
  accent: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-6 text-center text-sm text-slate-500">
        ยังไม่มีข้อมูลคะแนนทักษะจากฐานข้อมูลสำหรับหมวดนี้
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.skillId}
          className="grid grid-cols-[36px_1fr_48px] items-center gap-3 rounded-lg border border-slate-100 bg-white/80 p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
        >
          {/* Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
            <item.icon
              className="h-5 w-5 text-slate-800"
              aria-hidden="true"
            />
          </div>

          {/* Skill + progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="line-clamp-1">
                {item.title}
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full shadow-sm transition-all duration-700"
                style={{
                  width: `${item.percent}%`,
                  background: `linear-gradient(90deg, ${accent} 0%, ${accent}CC 55%, #ffffff 155%)`,
                }}
              />
            </div>
          </div>

          {/* Percent */}
          <span className="rounded-full bg-slate-50 px-2 py-1 text-right text-xs font-semibold text-[#1565C0] ring-1 ring-slate-100">
            {item.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// DASHBOARD PANEL
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
  const average =
    items.length > 0
      ? Math.round(
          items.reduce(
            (total, item) =>
              total + item.percent,
            0,
          ) / items.length,
        )
      : 0;

  // ป้องกัน unused variable warning
  void average;

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-blue-50 bg-gradient-to-r from-white via-blue-50/60 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm"
              style={{
                backgroundColor: accent,
              }}
            >
              <LayoutDashboard
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>

            <h2 className="text-base font-semibold text-slate-950">
              {title}
            </h2>
          </div>

          <p className="mt-1 text-xs text-[#1565C0]">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <RadarChart
          accent={accent}
          values={items.map(
            (item) => item.percent,
          )}
          labels={items.map((item) =>
            getRadarLabel(item.title),
          )}
          id={chartId}
        />

        <ProgressList
          items={items}
          accent={accent}
        />
      </div>
    </section>
  );
}

// =====================================================
// MAIN
// =====================================================

export default function StudentDashboard() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [dashboard, setDashboard] =
    useState<StudentDashboardData | null>(
      null,
    );

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // DISPLAY NAME
  // ===================================================

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "นิสิต";

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  useEffect(() => {
    if (!user?.studentId) {
      setDashboard(null);
      return;
    }

    const controller =
      new AbortController();

    setIsLoadingDashboard(true);
    setError("");

    fetch(
      `/api/students/${user.studentId}/dashboard`,
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดข้อมูลคะแนนนิสิตได้",
          );
        }

        console.log(
          "Dashboard data:",
          data,
        );

        setDashboard(data);
      })
      .catch((fetchError) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "ไม่สามารถโหลดข้อมูลคะแนนนิสิตได้",
        );

        setDashboard(null);
      })
      .finally(() =>
        setIsLoadingDashboard(false),
      );

    return () =>
      controller.abort();
  }, [user?.studentId]);

  // ===================================================
  // SKILL GROUPS
  // ===================================================

  const {
    facultySkillProgress,
    essentialSkillProgress,
  } = useMemo(() => {
    const skills =
      dashboard?.skills.map(
        toProgressItem,
      ) ?? [];

    const facultyItems =
      skills.filter((skill) =>
        isFacultySkill(skill.title),
      );

    const essentialItems =
      skills.filter(
        (skill) =>
          !isFacultySkill(
            skill.title,
          ),
      );

    return {
      facultySkillProgress:
        facultyItems,
      essentialSkillProgress:
        essentialItems,
    };
  }, [dashboard]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    dashboard?.summary ?? {
      earnedSkillCount: 0,
      totalSkillCount: 0,
      participatedActivities: 0,
      totalHours: 0,
      certificates: 0,
      overallPercent: 0,
    };

  // ===================================================
  // SUMMARY CARDS
  // ===================================================

  const summaryCards = [
    {
      icon: Star,
      value: String(
        summary.earnedSkillCount,
      ),
      label: "ทักษะที่ได้รับ",
      description: `จากทั้งหมด ${summary.totalSkillCount} ทักษะ`,
      iconClassName:
        "bg-gradient-to-br from-[#1565C0] to-[#0D47A1] text-white",
    },

    {
      icon: CalendarDays,
      value: String(
        summary.participatedActivities,
      ),
      label: "กิจกรรมที่เข้าร่วม",
      description: `${summary.totalHours} ชั่วโมงรวม`,
      iconClassName:
        "bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-slate-950",
    },

    {
      icon: FileBadge,
      value: String(
        summary.certificates,
      ),
      label: "ใบรับรองที่ได้รับ",
      description:
        "อ้างอิงจากกิจกรรมที่เข้าร่วม",
      iconClassName:
        "bg-gradient-to-br from-[#4AA3D8] to-[#1565C0] text-white",
    },
  ];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <StudentShell activePath="/student/dashboard">
      <section className="space-y-6 p-4 sm:p-6 lg:p-7">
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#4AA3D8] p-6 text-white shadow-[0_22px_60px_rgba(13,71,161,0.24)] lg:grid lg:grid-cols-[1fr_280px] lg:items-center lg:p-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFC107]/20 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-32 w-72 bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 ring-1 ring-white/20">
              <Sparkles
                className="h-4 w-4 text-[#FFC107]"
                aria-hidden="true"
              />

              Skill Transcript Dashboard
            </p>

            <h1 className="mt-4 flex items-center gap-2 text-3xl font-semibold leading-tight sm:text-4xl">
              สวัสดี, {displayName}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50">
              แสดงคะแนนทักษะและกิจกรรมจากฐานข้อมูลของนิสิตที่เข้าสู่ระบบอยู่ในขณะนี้
            </p>

            <Link
              href="/student/skilltranscript"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1565C0] shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              ดู Skill Transcript ของฉัน

              <Award
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {(authLoading ||
          isLoadingDashboard) && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1565C0]">
            กำลังโหลดข้อมูลคะแนนจากฐานข้อมูล...
          </div>
        )}

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* NO USER */}
        {/* ================================================= */}

        {!authLoading && !user && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบอีกครั้ง
          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map(
            (card) => (
              <article
                key={card.label}
                className="group flex items-center gap-5 rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.1)]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-105 ${card.iconClassName}`}
                >
                  <card.icon
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {card.label}
                  </p>

                  <p className="text-3xl font-semibold text-slate-950">
                    {card.value}
                  </p>

                  <p className="text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>

        {/* ================================================= */}
        {/* FACULTY SKILLS */}
        {/* ================================================= */}

        <DashboardPanel
          title="ทักษะของนิสิตคณะวิทยาศาสตร์ต้องมี"
          subtitle="คำนวณจากกิจกรรมและชั่วโมงที่นิสิตเข้าร่วมในฐานข้อมูล"
          accent="#FFC107"
          items={facultySkillProgress}
          chartId="faculty-skill-chart"
        />

        {/* ================================================= */}
        {/* ESSENTIAL SKILLS */}
        {/* ================================================= */}

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