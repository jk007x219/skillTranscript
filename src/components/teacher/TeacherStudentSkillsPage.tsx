// components/teacher/TeacherStudentSkillsPage.tsx
"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageCircle,
  MonitorCheck,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  X,
  CalendarDays,
  Cpu,
  MapPin,
  Clock,
} from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { useAuth } from "@/context/auth-context";

type Student = {
  studentId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  faculty: string | null;
  major: string | null;
  program: string | null;
  year: number | null;
};

type SkillData = {
  skillId: string;
  skillName: string;
  level: string;
  activities: number;
  completed: number;
  score: number;
  maxScore: number;
  percent: number;
  basicPercent?: number;
  intermediatePercent?: number;
  advancedPercent?: number;
  basicActivityCount?: number;
  intermediateActivityCount?: number;
  advancedActivityCount?: number;
};

type SkillWithIcon = SkillData & { icon: React.ElementType };

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

function getSkillIcon(title: string): React.ElementType {
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

function chartAngles(count: number) {
  return Array.from({ length: count }, (_, index) => -90 + (360 / count) * index);
}

function polarPoint(percent: number, angle: number, radius = 100, center = 130) {
  const r = radius * (percent / 100);
  const radian = (Math.PI / 180) * angle;
  return { x: center + r * Math.cos(radian), y: center + r * Math.sin(radian) };
}

function polygonPoints(values: number[], angles: number[], radius = 100, center = 130) {
  return values.map((value, index) => {
    const point = polarPoint(value, angles[index], radius, center);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
}

function getRadarLabel(title: string) {
  const labels: Record<string, string> = {
    "ทักษะการสร้างนวัตกรรมสังคม": "สร้างนวัตกรรมสังคม",
    "ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ": "ห้องปฏิบัติการ\nและความปลอดภัย",
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

function RadarChart({ accent, values, labels, id }: { accent: string; values: number[]; labels: string[]; id: string }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  if (values.length < 3) {
    return <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">ยังไม่มีข้อมูลทักษะเพียงพอสำหรับกราฟเรดาร์</div>;
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
        {[100, 75, 50, 25].map((ring) => <polygon key={ring} points={polygonPoints(angles.map(() => ring), angles, radius, center)} fill="none" stroke="#E2E8F0" strokeWidth="1" />)}
        {angles.map((angle) => {
          const end = polarPoint(100, angle, radius, center);
          return <line key={angle} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#E2E8F0" strokeWidth="1" />;
        })}
        <polygon points={polygonPoints(values, angles, radius, center)} fill={`url(#${id}-fill)`} stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
        {values.map((value, index) => {
          const point = polarPoint(value, angles[index], radius, center);
          return <circle key={`${id}-pt-${index}`} cx={point.x} cy={point.y} r="4" fill="white" stroke={accent} strokeWidth="2.5" />;
        })}
      </svg>
      {labels.map((label, index) => {
        const point = polarPoint(122, angles[index], radius, center);
        return <span key={`${id}-label-${index}`} className="absolute w-24 -translate-x-1/2 -translate-y-1/2 whitespace-pre-line text-center text-[10px] font-medium leading-tight text-slate-500" style={{ left: `${(point.x / size) * 100}%`, top: `${(point.y / size) * 100}%` }}>{label}</span>;
      })}
    </div>
  );
}

function ProgressList({ items, accent, onSkillClick }: { items: SkillWithIcon[]; accent: string; onSkillClick?: (skill: SkillWithIcon) => void }) {
  if (items.length === 0) {
    return <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">ยังไม่มีข้อมูลทักษะในหมวดนี้</div>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.skillId} onClick={() => onSkillClick?.(item)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition-colors hover:border-slate-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
            <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{item.skillName}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percent}%`, backgroundColor: accent }} />
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{item.percent}%</span>
        </div>
      ))}
    </div>
  );
}
type SkillLevel = "basic" | "intermediate" | "advanced";
type ProgressTab = SkillLevel | "all";

const levelLabels: Record<ProgressTab, string> = {
  all: "รวม",
  basic: "พื้นฐาน",
  intermediate: "กลาง",
  advanced: "สูง",
};

function DashboardPanel({ title, subtitle, accent, items, chartId, onSkillClick }: {
  title: string;
  subtitle: string;
  accent: string;
  items: SkillWithIcon[];
  chartId: string;
  onSkillClick?: (skill: SkillWithIcon) => void;
}) {
  const [activeTab, setActiveTab] = useState<ProgressTab>("all");

  // ใช้จำนวนกิจกรรมจริงของแต่ละระดับ เหมือน Student Dashboard
  const grouped = useMemo(
    () => ({
      basic: items.filter((item) => (item.basicActivityCount ?? 0) > 0),
      intermediate: items.filter((item) => (item.intermediateActivityCount ?? 0) > 0),
      advanced: items.filter((item) => (item.advancedActivityCount ?? 0) > 0),
    }),
    [items],
  );

  // Radar ต้องแสดงทุกทักษะเสมอ
  // ทักษะที่ไม่มีข้อมูลของระดับที่เลือกจะเป็น 0%
  const chartItems = items.map((item) => {
    if (activeTab === "all") {
      return { ...item, percent: item.activities > 0 ? item.percent : 0 };
    }

    const activityCount =
      activeTab === "basic"
        ? item.basicActivityCount ?? 0
        : activeTab === "intermediate"
          ? item.intermediateActivityCount ?? 0
          : item.advancedActivityCount ?? 0;

    const percent =
      activeTab === "basic"
        ? item.basicPercent ?? 0
        : activeTab === "intermediate"
          ? item.intermediatePercent ?? 0
          : item.advancedPercent ?? 0;

    return { ...item, percent: activityCount > 0 ? percent : 0 };
  });

  // รายการด้านขวา: รวมเฉพาะทักษะที่มีข้อมูลจริง
  const visibleItems =
    activeTab === "all"
      ? chartItems.filter((item) => item.activities > 0)
      : chartItems.filter((item) => {
          const activityCount =
            activeTab === "basic"
              ? item.basicActivityCount ?? 0
              : activeTab === "intermediate"
                ? item.intermediateActivityCount ?? 0
                : item.advancedActivityCount ?? 0;
          return activityCount > 0;
        });
