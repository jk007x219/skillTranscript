// components/student/StudentActivitiesPage.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Tag,
  X,
  KeyRound,
  Award,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// ============================================================
// Types
// ============================================================

type Skill = {
  name: string;
  level: string;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  hours?: number | null;
  location: string;
  organizer: string;
  term: string;
  status: "active" | "past";
  attendeeCount: number;
  confirmationEnabled: boolean;
  hasEvaluation: boolean;
  participationStatus?: string | null;
  participationScore?: number | null;
  skills: Skill[];
  templateId?: string | null;
};

type PastActivity = {
  participationId: string;
  activityId: string;
  activityName: string;
  description: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  hours?: number | null;
  location: string;
  organizer: string;
  term: string;
  joinDate: string;
  score: number;
  status: string;
  templateId?: string | null;
  skills?: Skill[];
};

type CertificatePreviewData = {
  imageUrl: string;
  templateName: string;
  studentName: string;
  skills: Skill[];
  certifiedDate: string | null;
  signerName: string;
  deanSignatureUrl: string | null;
};

// ============================================================
// Format functions
// ============================================================

function formatThaiDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatThaiTime(value?: string | null) {
  if (!value) return "";
  const raw = String(value).slice(0, 5);
  const date = new Date(`2000-01-01T${raw}`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// Modal: รายละเอียดกิจกรรม
// ============================================================

function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: Activity | PastActivity | null;
  onClose: () => void;
}) {
  if (!activity) return null;

  const isActive = "title" in activity;
  const title = isActive ? activity.title : activity.activityName;
  const skills = isActive ? activity.skills : activity.skills || [];
  const attendeeCount = isActive ? activity.attendeeCount : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
          <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
        </div>

        <div className="space-y-4 text-sm">
          {activity.description && (
            <div>
              <p className="font-medium text-slate-700">คำอธิบาย</p>
              <p className="mt-1 text-slate-600">{activity.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-slate-700">วันที่เริ่มต้น</p>
              <p className="mt-1 text-slate-600">{formatThaiDate(activity.date)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">เวลา</p>
              <p className="mt-1 text-slate-600">
                {activity.time ? formatThaiTime(activity.time) : "-"}
                {activity.endTime && ` - ${formatThaiTime(activity.endTime)}`}
              </p>
            </div>
          </div>

          {activity.endDate && activity.endDate !== activity.date && (
            <div>
              <p className="font-medium text-slate-700">วันที่สิ้นสุด</p>
              <p className="mt-1 text-slate-600">{formatThaiDate(activity.endDate)}</p>
            </div>
          )}

          {activity.hours !== null && activity.hours !== undefined && (
            <div>
              <p className="font-medium text-slate-700">จำนวนชั่วโมง</p>
              <p className="mt-1 text-slate-600">{Number(activity.hours).toFixed(2)} ชั่วโมง</p>
            </div>
          )}

          <div>
            <p className="font-medium text-slate-700">สถานที่</p>
            <p className="mt-1 text-slate-600">{activity.location || "-"}</p>
          </div>

          <div>
            <p className="font-medium text-slate-700">ผู้จัด</p>
            <p className="mt-1 text-slate-600">{activity.organizer || "-"}</p>
          </div>

          <div>
            <p className="font-medium text-slate-700">ภาคเรียน</p>
            <p className="mt-1 text-slate-600">
              {activity.term === "1"
                ? "ภาคเรียนที่ 1"
                : activity.term === "2"
                ? "ภาคเรียนที่ 2"
                : activity.term === "3"
                ? "ภาคเรียนที่ 3"
                : activity.term || "-"}
            </p>
          </div>

          {skills.length > 0 && (
            <div>
              <p className="font-medium text-slate-700">ทักษะที่เกี่ยวข้อง</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={`${skill.name}-${index}`}
                    className="inline-flex items-center rounded-full border border-[#76B7F2] bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill.name} : {skill.level}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isActive && (
            <div>
              <p className="font-medium text-slate-700">จำนวนผู้เข้าร่วม</p>
              <p className="mt-1 text-slate-600">{attendeeCount} คน</p>
            </div>
          )}

          {!isActive && (
            <div>
              <p className="font-medium text-slate-700">คะแนนที่ได้</p>
              <p className="mt-1 text-slate-600">{activity.score ?? "-"}</p>
            </div>
          )}
        </div>

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

// ============================================================
// Modal: ยืนยันรหัส
// ============================================================

function ConfirmationCodeModal({
  activity,
  code,
  onCodeChange,
  onConfirm,
  onClose,
  isVerifying,
  error,
}: {
  activity: Activity | null;
  code: string;
  onCodeChange: (code: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isVerifying: boolean;
  error: string;
}) {
  if (!activity) return null;

  const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-[610px] rounded-3xl bg-gradient-to-br from-white via-[#F4FAFF] to-[#E9F5FF] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:p-8">
        <button
          type="button"
          aria-label="ปิดหน้าต่างยืนยัน"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex max-w-[390px] flex-col items-center pt-8 text-center">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1565C0] shadow-sm ring-1 ring-blue-100">
            <KeyRound className="h-6 w-6" />
          </span>

          <h2 className="text-xl font-semibold text-[#0D47A1] sm:text-2xl">
            กรอกรหัสยืนยันการเข้าร่วม
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#1565C0]">
            ผู้จัดกิจกรรมระบบจะเปิดรหัสยืนยันการเข้าร่วม
            <br />
            โปรดตรวจสอบรหัสที่ได้รับก่อนกดยืนยัน
          </p>

          <p className="mt-3 line-clamp-1 max-w-full rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-blue-100">
            {activity.title}
          </p>

          {error && (
            <div className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="relative mt-10 block w-full">
            <span className="sr-only">รหัสยืนยัน 6 หลัก</span>
            <input
              value={code}
              onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoFocus
              maxLength={6}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
            <div className="grid grid-cols-6 gap-4">
              {digits.map((digit, index) => (
                <span
                  key={index}
                  className={`flex h-9 items-center justify-center border-b-2 text-lg font-semibold text-[#0D47A1] transition ${
                    digit ? "border-[#1565C0]" : "border-[#4AA3D8]"
                  }`}
                >
                  {digit}
                </span>
              ))}
            </div>
          </label>

          <button
            type="button"
            onClick={onConfirm}
            disabled={code.length !== 6 || isVerifying}
            className="mt-8 h-12 w-full rounded-xl bg-[#4AA3D8] px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? "กำลังตรวจสอบ..." : "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Certificate Preview Component
// ============================================================

function CertificatePreview({ certificate }: { certificate: CertificatePreviewData }) {
  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-hidden bg-white shadow-lg"
      style={{ aspectRatio: "1.414 / 1" }}
    >
      {/* Template Background */}
      <img
        src={certificate.imageUrl}
        alt={certificate.templateName}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith("/certificate-placeholder.png")) {
            target.src = "/certificate-placeholder.png";
          }
        }}
      />

      <div className="absolute left-1/2 top-[6%] -translate-x-1/2">
        <img src="/tsu-logo.png" alt="TSU Logo" className="h-14 w-auto object-contain" />
      </div>

      <div className="absolute left-[10%] right-[10%] top-[20%] text-center text-[#173F70]">
        <p className="text-[18px] font-bold sm:text-2xl">ใบรับรองทักษะ</p>
        <p className="mt-1 text-[8px] font-medium sm:text-xs">คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล มหาวิทยาลัยทักษิณ</p>
      </div>

      <div className="absolute left-[15%] right-[15%] top-[38%] text-center text-[#24466D]">
        <p className="text-[10px] font-medium sm:text-sm">ขอรับรองว่า</p>
      </div>

      <div className="absolute left-[15%] right-[15%] top-[44%] flex justify-center">
        <div className="rounded-md bg-white/85 px-4 py-1 text-center text-[21px] font-bold leading-tight text-[#173F70] sm:text-3xl md:text-4xl">
          {certificate.studentName || "-"}
        </div>
      </div>

      <div className="absolute left-[14%] right-[14%] top-[56%] text-center text-[#24466D]">
        <p className="text-[9px] font-medium sm:text-sm">ได้รับทักษะการรับรองทักษะ</p>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md bg-white/80 px-3 py-2 sm:grid-cols-3">
          {certificate.skills.map((skill) => (
            <p key={`${skill.name}-${skill.level}`} className="text-[7px] font-medium leading-tight text-[#173F70] sm:text-[10px]">
              {skill.name} <span className="text-slate-600">ระดับ{skill.level}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="absolute left-[28%] right-[28%] top-[77%] text-center text-[10px] font-medium text-[#24466D] sm:text-sm">
        ให้ไว้ ณ วันที่&nbsp;{formatThaiDate(certificate.certifiedDate)}
      </div>

      <div className="absolute bottom-[7%] left-1/2 w-[34%] -translate-x-1/2 text-center">
        {certificate.deanSignatureUrl && (
          <img
            src={certificate.deanSignatureUrl}
            alt="ลายเซ็นคณบดี"
            className="mx-auto mb-[-2px] h-10 max-w-full object-contain"
          />
        )}
        <div className="mb-2 border-t border-[#24466D]" />
        <p className="text-[8px] font-medium text-[#24466D] sm:text-xs">
          ( {certificate.signerName || "-"} )
        </p>
        <p className="mt-1 text-[7px] leading-tight text-[#24466D] sm:text-[10px]">
          คณบดีคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
          <br />
          มหาวิทยาลัยทักษิณ
        </p>
      </div>

    </div>
  );
}

// ============================================================
// Activity Card
// ============================================================

function ActivityCard({
  activity,
  onConfirm,
  onDetail,
}: {
  activity: Activity;
  onConfirm: (activity: Activity) => void;
  onDetail: (activity: Activity) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.11)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">{activity.title}</p>
          {activity.skills.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#1565C0]">
              <Tag className="h-3.5 w-3.5" />
              {activity.skills[0].name}
              {activity.skills.length > 1 && ` +${activity.skills.length - 1}`}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          เปิดรับเข้าร่วม
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatThaiDate(activity.date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          {formatThaiTime(activity.time)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="line-clamp-1">{activity.location}</span>
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(activity)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#1565C0] bg-white px-4 text-sm font-semibold text-[#1565C0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1565C0] hover:text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          ยืนยัน
        </button>
        <button
          type="button"
          onClick={() => onDetail(activity)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 transition hover:border-blue-300 hover:text-[#1565C0]"
          aria-label="ดูรายละเอียด"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

// ============================================================
// Past Activity Card
// ============================================================

function PastActivityCard({
  activity,
  onViewCertificate,
  onDetail,
}: {
  activity: PastActivity;
  onViewCertificate: (activity: PastActivity) => void;
  onDetail: (activity: PastActivity) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.11)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">{activity.activityName}</p>
          {activity.skills && activity.skills.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#1565C0]">
              <Tag className="h-3.5 w-3.5" />
              {activity.skills[0].name}
              {activity.skills.length > 1 && ` +${activity.skills.length - 1}`}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          เข้าร่วมแล้ว
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatThaiDate(activity.date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          {formatThaiTime(activity.time)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="line-clamp-1">{activity.location}</span>
        </p>
        {activity.score !== null && activity.score !== undefined && (
          <p className="flex items-center gap-2 text-[#1565C0]">
            <CheckCircle2 className="h-4 w-4" />
            คะแนน: {activity.score}
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => onViewCertificate(activity)}
          disabled={!activity.templateId}
          className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
            activity.templateId
              ? "border border-[#1565C0] bg-white text-[#1565C0] shadow-sm hover:-translate-y-0.5 hover:bg-[#1565C0] hover:text-white"
              : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
          }`}
        >
          <Award className="h-4 w-4" />
          ใบรับรองทักษะ
        </button>
        <button
          type="button"
          onClick={() => onDetail(activity)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 transition hover:border-blue-300 hover:text-[#1565C0]"
          aria-label="ดูรายละเอียด"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function StudentActivitiesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [pastActivities, setPastActivities] = useState<PastActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);
  const [error, setError] = useState("");
  const [errorPast, setErrorPast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  // Confirmation Modal
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Detail Modal
  const [detailActivity, setDetailActivity] = useState<Activity | PastActivity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Certificate Modal
  const [certificateModal, setCertificateModal] = useState<{
    isOpen: boolean;
    certificate: CertificatePreviewData | null;
    activityName: string;
    loading: boolean;
  }>({
    isOpen: false,
    certificate: null,
    activityName: "",
    loading: false,
  });

  // Ref for certificate download
  const certificateRef = useRef<HTMLDivElement>(null);

  // ==========================================================
  // Fetch Active Activities
  // ==========================================================

  useEffect(() => {
    const fetchActiveActivities = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ visible: "true" });
        if (user?.studentId) params.set("studentId", user.studentId);

        const res = await fetch(`/api/activities?${params.toString()}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดกิจกรรมได้");
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveActivities();
  }, [user?.studentId]);

  // ==========================================================
  // Fetch Past Activities
  // ==========================================================

  useEffect(() => {
    if (activeTab !== "past" || !user?.studentId) return;

    const fetchPastActivities = async () => {
      try {
        setLoadingPast(true);
        const res = await fetch(`/api/students/${user.studentId}/participations`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดกิจกรรมที่เคยเข้าร่วม");
        const data = await res.json();

        const participations = data.participations || [];
        const pastWithData = await Promise.all(
          participations.map(async (p: PastActivity) => {
            try {
              const activityRes = await fetch(`/api/activities/${p.activityId}`);
              if (!activityRes.ok) {
                return { ...p, templateId: null, skills: [] };
              }
              const activityData = await activityRes.json();
              return {
                ...p,
                templateId: activityData.templateId || activityData.template?.id || null,
                skills: activityData.skills || activityData.activity?.skills || [],
              };
            } catch {
              return { ...p, templateId: null, skills: [] };
            }
          })
        );

        setPastActivities(pastWithData);
        setErrorPast("");
      } catch (err) {
        setErrorPast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoadingPast(false);
      }
    };

    fetchPastActivities();
  }, [user?.studentId, activeTab]);

  // ==========================================================
  // Search
  // ==========================================================

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================================
  // Confirmation
  // ==========================================================

  const openConfirmationModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setConfirmationCode("");
    setVerifyError("");
    setIsVerifying(false);
  };

  const closeConfirmationModal = () => {
    setSelectedActivity(null);
    setConfirmationCode("");
    setVerifyError("");
    setIsVerifying(false);
  };

  // ==========================================================
  // Detail
  // ==========================================================

  const openDetailModal = (activity: Activity | PastActivity) => {
    setDetailActivity(activity);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailActivity(null);
    setIsDetailModalOpen(false);
  };

  // ==========================================================
  // Verify Code
  // ==========================================================

  const handleConfirmCode = async () => {
    if (!selectedActivity || confirmationCode.length !== 6) return;

    setIsVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch(`/api/activities/${selectedActivity.id}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: confirmationCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "รหัสยืนยันไม่ถูกต้อง");
      }

      router.push(`/student/evaluate/${selectedActivity.id}`);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsVerifying(false);
    }
  };

  // ==========================================================
  // Open Certificate
  // ==========================================================

  const handleViewCertificate = async (activity: PastActivity) => {
    if (!user?.studentId) {
      alert("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setCertificateModal({
      isOpen: true,
      certificate: null,
      activityName: activity.activityName,
      loading: true,
    });

    try {
      const res = await fetch(
        `/api/activities/${activity.activityId}/certificate?studentId=${encodeURIComponent(
          user.studentId
        )}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "ไม่สามารถสร้างใบรับรองได้");
      }

      const data = await res.json();

      const skills: Skill[] = Array.isArray(data.skills) ? data.skills : activity.skills || [];
      const certifiedDate = data.certifiedDate || data.certificateDate || data.completedAt || data.issuedDate || activity.date || null;
      const signerName = data.signerName || data.deanName || data.certificate?.signerName || "ผศ.ดร.นพมาศ ปักเข็ม";
      const studentName = data.studentName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

      const imageUrl = data.imageUrl || data.template?.imageUrl || data.templateImageUrl || "/certificate-placeholder.png";
      const templateName = data.templateName || data.template?.name || "ใบรับรองทักษะ";

      setCertificateModal({
        isOpen: true,
        certificate: {
          imageUrl,
          templateName,
          studentName,
          skills,
          certifiedDate,
          signerName,
          deanSignatureUrl: data.deanSignatureUrl || null,
        },
        activityName: activity.activityName,
        loading: false,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setCertificateModal({
        isOpen: false,
        certificate: null,
        activityName: "",
        loading: false,
      });
    }
  };

  const closeCertificateModal = () => {
    setCertificateModal({
      isOpen: false,
      certificate: null,
      activityName: "",
      loading: false,
    });
  };

  // ==========================================================
  // Download Certificate (using html2canvas)
  // ==========================================================

  const handleDownloadCertificate = async () => {
    if (!certificateModal.certificate) {
      alert("ไม่พบข้อมูลใบรับรอง");
      return;
    }

    const element = certificateRef.current;
    if (!element) {
      alert("ไม่พบใบรับรองสำหรับดาวน์โหลด");
      return;
    }

    try {
      // Save original styles
      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;

      // Set to show full content
      element.style.overflow = "visible";
      element.style.maxHeight = "none";

      // Wait for DOM update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Restore original styles
      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;

      const link = document.createElement("a");
      link.download = `ใบรับรองทักษะ_${certificateModal.certificate.studentName || "certificate"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download certificate error:", err);
      alert("ไม่สามารถดาวน์โหลดใบรับรองได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <StudentShell activePath="/student/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                กิจกรรมที่เข้าร่วม
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                แสดงกิจกรรมที่เปิดให้ยืนยันการเข้าร่วมและมีแบบประเมิน
                หรือกิจกรรมที่คุณเคยเข้าร่วมแล้ว
              </p>
            </div>

            <div className="w-full sm:w-[280px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="ค้นหากิจกรรม"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-8 border-b border-blue-50">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`relative pb-2 text-sm font-semibold transition ${
                activeTab === "active" ? "text-[#1565C0]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              กิจกรรมที่รอยืนยัน
              {activeTab === "active" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1565C0]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`relative pb-2 text-sm font-semibold transition ${
                activeTab === "past" ? "text-[#1565C0]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              กิจกรรมที่เคยเข้าร่วม
              {activeTab === "past" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1565C0]" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {/* Active */}
            {activeTab === "active" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
                    <span className="ml-3 text-slate-500">กำลังโหลด...</span>
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="rounded-2xl border border-blue-100 bg-white py-12 text-center text-slate-400 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
                    <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm">
                      {searchTerm ? "ไม่พบกิจกรรมที่ค้นหา" : "ขณะนี้ไม่มีกิจกรรมที่เปิดให้ยืนยันการเข้าร่วม"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onConfirm={openConfirmationModal}
                        onDetail={openDetailModal}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Past */}
            {activeTab === "past" && (
              <>
                {loadingPast ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
                    <span className="ml-3 text-slate-500">กำลังโหลด...</span>
                  </div>
                ) : errorPast ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorPast}
                  </div>
                ) : pastActivities.length === 0 ? (
                  <div className="rounded-2xl border border-blue-100 bg-white py-12 text-center text-slate-400 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
                    <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm">คุณยังไม่ได้เข้าร่วมกิจกรรมใด ๆ</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {pastActivities.map((activity) => (
                      <PastActivityCard
                        key={activity.participationId}
                        activity={activity}
                        onViewCertificate={handleViewCertificate}
                        onDetail={openDetailModal}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      <ConfirmationCodeModal
        activity={selectedActivity}
        code={confirmationCode}
        onCodeChange={setConfirmationCode}
        onConfirm={handleConfirmCode}
        onClose={closeConfirmationModal}
        isVerifying={isVerifying}
        error={verifyError}
      />

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <ActivityDetailModal activity={detailActivity} onClose={closeDetailModal} />
      )}

      {/* Certificate Modal */}
      {certificateModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Close */}
            <button
              type="button"
              onClick={closeCertificateModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-900"
              aria-label="ปิดใบรับรอง"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">
                  ใบรับรองทักษะ
                </h3>
                {certificateModal.certificate && (
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {certificateModal.certificate.skills.map((skill) => skill.name).join(", ")}
                  </p>
                )}
              </div>

              {/* Certificate - with ref for download */}
              <div
                ref={certificateRef}
                id="certificate-preview-modal"
                className="max-h-[calc(95vh-150px)] overflow-auto rounded-lg bg-slate-100 p-2"
              >
                {certificateModal.loading ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#1565C0]" />
                    <span className="ml-3 text-slate-500">กำลังสร้างใบรับรอง...</span>
                  </div>
                ) : certificateModal.certificate ? (
                  <CertificatePreview certificate={certificateModal.certificate} />
                ) : null}
              </div>

              {/* Buttons */}
              {!certificateModal.loading && certificateModal.certificate && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]"
                  >
                    <Download className="h-4 w-4" />
                    ดาวน์โหลดใบรับรอง
                  </button>

                  <button
                    type="button"
                    onClick={closeCertificateModal}
                    className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    ปิด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
