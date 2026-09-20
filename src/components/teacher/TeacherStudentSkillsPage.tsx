// components/teacher/TeacherStudentSkillsPage.tsx
"use client";

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
  if (title.includes("ปัญญาประดิษฐ์") || title.includes("AI")) return UsersRound;
  if (title.includes("ปลอดภัย") || title.includes("ไซเบอร์")) return ShieldCheck;
  if (title.includes("ห้องปฏิบัติการ")) return Network;
  if (title.includes("นวัตกรรม")) return Lightbulb;
  return Star;
}

// ===== Radar Chart =====
function chartAngles(count: number) {
  return Array.from({ length: count }, (_, index) => -90 + (360 / count) * index);
}

function polarPoint(percent: number, angle: number) {
  const radius = 96 * (percent / 100);
  const radian = (Math.PI / 180) * angle;
  return {
    x: 130 + radius * Math.cos(radian),
    y: 130 + radius * Math.sin(radian),
  };
}

function polygonPoints(values: number[], angles: number[]) {
  return values
    .map((value, index) => {
      const point = polarPoint(value, angles[index]);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function gridPolygonPoints(size: number, angles: number[]) {
  return angles
    .map((angle) => {
      const point = polarPoint(size, angle);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");
}

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

  const softPoints = values.map((value) => Math.max(0, value - 18));
  const angles = chartAngles(values.length);

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[330px] items-center justify-center rounded-full bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-5 shadow-[inset_0_0_0_1px_rgba(21,101,192,0.08)]">
      <div className="absolute inset-7 rounded-full bg-white/70 blur-2xl" />
      <svg viewBox="0 0 260 260" className="relative h-full w-full overflow-visible drop-shadow-sm">
        <defs>
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-fill`} x1="50" x2="210" y1="30" y2="230" gradientUnits="userSpaceOnUse">
            <stop stopColor={accent} stopOpacity="0.34" />
            <stop offset="1" stopColor={accent} stopOpacity="0.08" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor={accent} floodOpacity="0.24" />
          </filter>
        </defs>

        <circle cx="130" cy="130" r="98" fill={`url(#${id}-glow)`} />
        {[100, 80, 60, 40, 20].map((size) => (
          <polygon
            key={size}
            points={gridPolygonPoints(size, angles)}
            fill="none"
            stroke={size === 100 ? "#BFD8F3" : "#D8E7F7"}
            strokeWidth="1"
          />
        ))}
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
        <polygon
          points={polygonPoints(values, angles)}
          fill={`url(#${id}-fill)`}
          stroke={accent}
          strokeLinejoin="round"
          strokeWidth="4"
          filter={`url(#${id}-shadow)`}
        />
        <polygon
          points={polygonPoints(softPoints, angles)}
          fill="white"
          fillOpacity="0.2"
          stroke={accent}
          strokeDasharray="4 7"
          strokeLinecap="round"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        {values.map((value, index) => {
          const point = polarPoint(value, angles[index]);
          return (
            <g key={`${id}-${index}`}>
              <circle cx={point.x} cy={point.y} r="6.5" fill="white" stroke={accent} strokeWidth="3" />
              <circle cx={point.x} cy={point.y} r="2.5" fill={accent} />
            </g>
          );
        })}
      </svg>
      {labels.map((label, index) => {
        const point = polarPoint(122, angles[index]);
        return (
          <span
            key={label}
            className="absolute max-w-[7rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 px-2 py-1 text-center text-[10px] font-medium leading-4 text-slate-600 shadow-sm ring-1 ring-blue-100"
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

// ===== DashboardPanel (เพิ่ม onSkillClick) =====
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
  const average =
    items.length > 0 ? Math.round(items.reduce((total, item) => total + item.percent, 0) / items.length) : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-blue-50 bg-gradient-to-r from-white via-blue-50/60 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: accent }}>
              <Star className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-[#1565C0]">{subtitle}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-blue-100">
          <CheckCircle2 className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
          ภาพรวม {average}%
        </div>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <RadarChart accent={accent} values={items.map((item) => item.percent)} labels={items.map((item) => item.skillName)} id={chartId} />
        <ProgressList items={items} accent={accent} onSkillClick={onSkillClick} />
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
          `/api/advisor/students?advisorUserId=${encodeURIComponent(user.id)}`
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
          `/api/advisor/students/${studentId}/skills`
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

  // แยกทักษะตาม "ระดับ" ทั้ง 3 ระดับ
  // พื้นฐาน / กลาง / สูง
  const skillsByLevel = useMemo(() => {
    const groups: Record<string, SkillWithIcon[]> = {
      "พื้นฐาน": [],
      "กลาง": [],
      "สูง": [],
    };

    skillsWithIcon.forEach((skill) => {
      const level = skill.level === "พื้นฐาน" || skill.level === "สูง" ? skill.level : "กลาง";
      groups[level].push(skill);
    });

    return groups;
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
        `/api/advisor/students/${studentId}/skills/${skill.skillId}/activities`
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

          {/* กราฟทักษะทั้ง 3 ระดับ */}
          <DashboardPanel
            title="ทักษะระดับพื้นฐาน"
            subtitle="กราฟแสดงทักษะที่อยู่ในระดับพื้นฐาน"
            accent="#39b54a"
            items={skillsByLevel["พื้นฐาน"]}
            chartId="basic-skill-chart"
            onSkillClick={handleSkillClick}
          />

          <DashboardPanel
            title="ทักษะระดับกลาง"
            subtitle="กราฟแสดงทักษะที่อยู่ในระดับกลาง"
            accent="#FFC107"
            items={skillsByLevel["กลาง"]}
            chartId="intermediate-skill-chart"
            onSkillClick={handleSkillClick}
          />

          <DashboardPanel
            title="ทักษะระดับสูง"
            subtitle="กราฟแสดงทักษะที่อยู่ในระดับสูง"
            accent="#1565C0"
            items={skillsByLevel["สูง"]}
            chartId="advanced-skill-chart"
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