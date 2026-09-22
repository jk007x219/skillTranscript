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

// ===== Types =====
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
};

type SkillWithIcon = SkillData & {
  icon: React.ElementType;
};

// ===== ฟังก์ชันช่วยเหลือ =====
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

// ===== Radar Chart =====
function chartAngles(count: number) {
  return Array.from({ length: count }, (_, index) => -90 + (360 / count) * index);
}

function polarPoint(percent: number, angle: number, radius = 100, center = 130) {
  const r = radius * (percent / 100);
  const radian = (Math.PI / 180) * angle;
  return { x: center + r * Math.cos(radian), y: center + r * Math.sin(radian) };
}

function polygonPoints(values: number[], angles: number[], radius = 100, center = 130) {
  return values
    .map((value, index) => {
      const point = polarPoint(value, angles[index], radius, center);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
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
        {[100, 75, 50, 25].map((ring) => (
          <polygon
            key={ring}
            points={polygonPoints(angles.map(() => ring), angles, radius, center)}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        ))}
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
        <polygon
          points={polygonPoints(values, angles, radius, center)}
          fill={`url(#${id}-fill)`}
          stroke={accent}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {values.map((value, index) => {
          const point = polarPoint(value, angles[index], radius, center);
          return (
            <circle
              key={`${id}-pt-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={accent}
              strokeWidth="2.5"
            />
          );
        })}
      </svg>
      {labels.map((label, index) => {
        const point = polarPoint(122, angles[index], radius, center);
        return (
          <span
            key={`${id}-label-${index}`}
            className="absolute w-24 -translate-x-1/2 -translate-y-1/2 whitespace-pre-line text-center text-[10px] font-medium leading-tight text-slate-500"
            style={{ left: `${(point.x / size) * 100}%`, top: `${(point.y / size) * 100}%` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ===== ProgressList (เพิ่ม onSkillClick) =====
function ProgressList({ items, accent, onSkillClick }: { items: SkillWithIcon[]; accent: string; onSkillClick?: (skill: SkillWithIcon) => void }) {
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
          onClick={() => onSkillClick && onSkillClick(item)}
          className="grid grid-cols-[36px_1fr_48px] items-center gap-3 rounded-lg border border-slate-100 bg-white/80 p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
            <item.icon className="h-5 w-5 text-slate-800" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="line-clamp-1">{item.skillName}</span>
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
          <span className="rounded-full bg-slate-50 px-2 py-1 text-right text-xs font-semibold text-[#1565C0] ring-1 ring-slate-100">
            {item.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ===== DashboardPanel =====
type SkillLevel = "basic" | "intermediate" | "advanced";
type ProgressTab = SkillLevel | "all";

function normalizeSkillLevel(level?: string | null): SkillLevel {
  const value = (level || "").trim().toLowerCase();
  if (value.includes("สูง") || value.includes("advanced") || value.includes("high") || value === "3") return "advanced";
  if (value.includes("กลาง") || value.includes("intermediate") || value.includes("medium") || value.includes("mid") || value === "2") return "intermediate";
  return "basic";
}

const levelLabels: Record<ProgressTab, string> = {
  all: "รวม",
  basic: "พื้นฐาน",
  intermediate: "กลาง",
  advanced: "สูง",
};

function averagePercent(items: SkillWithIcon[]) {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((total, item) => total + item.percent, 0) / items.length);
}

function DashboardPanel({
  title,
  subtitle,
  accent,
  items,
  chartId,
  onSkillClick,
}: {
  title: string;
  subtitle: string;
  accent: string;
  items: SkillWithIcon[];
  chartId: string;
  onSkillClick?: (skill: SkillWithIcon) => void;
}) {
  const [activeTab, setActiveTab] = useState<ProgressTab>("all");

  const grouped = useMemo(
    () => ({
      basic: items.filter((item) => normalizeSkillLevel(item.level) === "basic"),
      intermediate: items.filter((item) => normalizeSkillLevel(item.level) === "intermediate"),
      advanced: items.filter((item) => normalizeSkillLevel(item.level) === "advanced"),
    }),
    [items],
  );

  const visibleItems = activeTab === "all" ? items : grouped[activeTab];
  const tabs: Array<{ key: ProgressTab; count: number }> = [
    { key: "all", count: items.length },
    { key: "basic", count: grouped.basic.length },
    { key: "intermediate", count: grouped.intermediate.length },
    { key: "advanced", count: grouped.advanced.length },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${active ? "text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
                style={active ? { backgroundColor: accent } : undefined}
              >
                {levelLabels[tab.key]}
                <span className="ml-1.5 opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50/60 p-4">
            <RadarChart
              accent={accent}
              values={visibleItems.length >= 3 ? visibleItems.map((item) => item.percent) : []}
              labels={visibleItems.map((item) => getRadarLabel(item.skillName))}
              id={`${chartId}-${activeTab}`}
            />
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{averagePercent(visibleItems)}%</p>
              <p className="text-xs text-slate-500">คะแนนเฉลี่ยของหมวดนี้</p>
            </div>
          </div>

          <ProgressList items={visibleItems} accent={accent} onSkillClick={onSkillClick} />
        </div>
      </div>
    </section>
  );
}

// ===== Modal แสดงกิจกรรม =====
function ActivityModal({
  skill,
  activities,
  onClose,
  loading,
}: {
  skill: SkillWithIcon | null;
  activities: any[];
  onClose: () => void;
  loading: boolean;
}) {
  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-3">
            <skill.icon className="h-6 w-6 text-[#1565C0]" />
            <h2 className="text-2xl font-semibold text-slate-950">{skill.skillName}</h2>
          </div>
          <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
          <p className="mt-2 text-sm text-slate-500">
            กิจกรรมที่นิสิตเข้าร่วมและได้รับทักษะนี้ (คะแนน {skill.percent}%)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
            <span className="ml-3 text-slate-500">กำลังโหลดข้อมูล...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>ยังไม่มีกิจกรรมที่เกี่ยวข้องกับทักษะนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act, index) => (
              <div
                key={`${act.id}-${index}`}   // ✅ แก้ไข key ให้ไม่ซ้ำกัน
                className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-slate-950">{act.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>
                      {act.date
                        ? new Date(act.date).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  {act.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>
                        {new Date(`2000-01-01T${act.time}`).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {act.location && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{act.location}</span>
                    </div>
                  )}
                  {act.organizer && (
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="text-slate-400">ผู้จัด:</span>
                      <span>{act.organizer}</span>
                    </div>
                  )}
                  {act.hours !== null && act.hours !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">ชั่วโมง:</span>
                      <span>{Number(act.hours).toFixed(2)}</span>
                    </div>
                  )}
                  {act.score !== null && act.score !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">คะแนน:</span>
                      <span className="font-semibold text-[#1565C0]">{Number(act.score).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {act.description && (
                  <p className="mt-2 text-sm text-slate-500 border-t border-slate-100 pt-2">
                    {act.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1565C0] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D47A1]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
// ===== Main Component =====
export default function TeacherStudentSkillsPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [allSkills, setAllSkills] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State สำหรับ Modal
  const [selectedSkill, setSelectedSkill] = useState<SkillWithIcon | null>(null);
  const [skillActivities, setSkillActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const studentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setError("ไม่พบข้อมูลอาจารย์ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    if (!studentId) {
      setLoading(false);
      setError("ไม่พบรหัสนิสิต");
      return;
    }

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const studentRes = await fetch(
          apiPath(`/api/advisor/students?advisorUserId=${encodeURIComponent(user.id)}`)
        );
        if (!studentRes.ok) {
          const data = await studentRes.json().catch(() => ({}));
          throw new Error(data.message || "ไม่สามารถโหลดข้อมูลนิสิตได้");
        }
        const studentData = await studentRes.json();
        const found = (studentData.students || []).find(
          (item: Student) => item.studentId === studentId
        );
        if (!found) {
          throw new Error("ไม่พบนิสิตในความดูแลของอาจารย์");
        }
        setStudent(found);

        const skillRes = await fetch(
          apiPath(`/api/advisor/students/${studentId}/skills`)
        );
        if (!skillRes.ok) {
          const data = await skillRes.json().catch(() => ({}));
          throw new Error(data.message || "ไม่สามารถโหลดข้อมูลทักษะได้");
        }
        const skillData = await skillRes.json();
        setAllSkills(skillData.skills || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user, authLoading, studentId]);

  // แปลงทักษะให้มีไอคอน
  const skillsWithIcon = useMemo(() => {
    return allSkills.map((skill) => ({
      ...skill,
      icon: getSkillIcon(skill.skillName),
    }));
  }, [allSkills]);

  const { facultySkillProgress, essentialSkillProgress } = useMemo(() => {
    return {
      facultySkillProgress: skillsWithIcon.filter((skill) => isFacultySkill(skill.skillName)),
      essentialSkillProgress: skillsWithIcon.filter((skill) => !isFacultySkill(skill.skillName)),
    };
  }, [skillsWithIcon]);

  const totalSkills = skillsWithIcon.length;
  const receivedSkills = skillsWithIcon.filter((s) => s.percent >= 80).length;

  const studentInitial = useMemo(() => {
    if (!student) return "";
    return student.firstName?.charAt(0) || student.name?.charAt(0) || "";
  }, [student]);

  // ฟังก์ชันคลิกที่ทักษะ
  const handleSkillClick = async (skill: SkillWithIcon) => {
    setSelectedSkill(skill);
    setShowModal(true);
    setLoadingActivities(true);
    setSkillActivities([]);

    try {
      const res = await fetch(
        apiPath(`/api/advisor/students/${studentId}/skills/${skill.skillId}/activities`)
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถโหลดกิจกรรมได้");
      }
      const data = await res.json();
      setSkillActivities(data.activities || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setSkillActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSkill(null);
    setSkillActivities([]);
  };

  if (authLoading || loading) {
    return (
      <TeacherShell activePath="/teacher/students">
        <section className="flex min-h-[calc(100vh-8.5rem)] items-center justify-center p-6">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-[#1565C0]" />
            กำลังโหลดข้อมูลนิสิต...
          </div>
        </section>
      </TeacherShell>
    );
  }

  if (error || !student) {
    return (
      <TeacherShell activePath="/teacher/students">
        <section className="p-4 sm:p-6 lg:p-7">
          <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
            <div className="text-sm text-red-600">
              {error || "ไม่พบข้อมูลนิสิต"}
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d47a1]"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </button>
          </div>
        </section>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell activePath="/teacher/students">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-1.5 text-slate-700 transition hover:bg-blue-50"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                ตรวจสอบข้อมูลทักษะนิสิตที่ปรึกษา
              </h1>
              <div className="mt-1 h-0.5 w-20 rounded-full bg-[#FFC107]" />
            </div>
          </div>

          {/* Student profile */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[145px_1fr_1fr]">
              <div className="mx-auto flex h-[105px] w-[105px] items-center justify-center overflow-hidden rounded-full border border-[#64b5f6] bg-slate-100 md:mx-0">
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl font-medium text-slate-500">
                  {studentInitial || <GraduationCap className="h-12 w-12" />}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <h2 className="text-lg font-semibold text-slate-900">
                  {student.name}
                </h2>
                <p>
                  <span className="font-semibold text-slate-900">รหัสประจำตัว :</span>{" "}
                  {student.studentId}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">คณะ :</span>{" "}
                  {student.faculty || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">หลักสูตร :</span>{" "}
                  {student.program || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">วิชาเอก :</span>{" "}
                  {student.major || "-"}
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">ชั้นปี :</span>{" "}
                  {student.year || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">อีเมล :</span>{" "}
                  {student.email}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">เบอร์โทร :</span>{" "}
                  {student.phone || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-slate-700">ทักษะทั้งหมด</p>
              <p className="text-3xl font-semibold text-slate-950">{totalSkills}</p>
              <p className="text-xs text-slate-500">จากทั้งหมดในระบบ</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-slate-700">ทักษะที่ผ่านเกณฑ์</p>
              <p className="text-3xl font-semibold text-emerald-600">{receivedSkills}</p>
              <p className="text-xs text-slate-500">คะแนน ≥ 80%</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-slate-700">คะแนนเฉลี่ย</p>
              <p className="text-3xl font-semibold text-[#1565C0]">
                {skillsWithIcon.length > 0
                  ? Math.round(skillsWithIcon.reduce((sum, s) => sum + s.percent, 0) / skillsWithIcon.length)
                  : 0}%
              </p>
              <p className="text-xs text-slate-500">ภาพรวมทุกทักษะ</p>
            </div>
          </div>

          {/* กราฟทักษะเหมือนหน้า Student Dashboard */}
          <DashboardPanel
            title="ทักษะของนิสิตคณะวิทยาศาสตร์ต้องมี"
            subtitle="คำนวณจากกิจกรรมและชั่วโมงที่นิสิตเข้าร่วมในฐานข้อมูล"
            accent="#FFC107"
            items={facultySkillProgress}
            chartId="faculty-skill-chart"
            onSkillClick={handleSkillClick}
          />

          <DashboardPanel
            title="ทักษะที่จำเป็นสำหรับนิสิต"
            subtitle="คำนวณจากกิจกรรมและชั่วโมงที่นิสิตเข้าร่วมในฐานข้อมูล"
            accent="#1565C0"
            items={essentialSkillProgress}
            chartId="essential-skill-chart"
            onSkillClick={handleSkillClick}
          />

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-[#39b54a]" />
            แสดงข้อมูลทักษะของนิสิตที่ปรึกษารายบุคคล (ดึงจากฐานข้อมูลจริง)
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <ActivityModal
          skill={selectedSkill}
          activities={skillActivities}
          onClose={closeModal}
          loading={loadingActivities}
        />
      )}
    </TeacherShell>
  );
}