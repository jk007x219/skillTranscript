// components/student/StudentActivitiesPage.tsx
"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// ---------- Types ----------
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
  skills: { name: string; level: string }[];
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
};

type CertificatePreviewData = {
  imageUrl: string;
  templateName: string;
  studentName: string;
  activityName: string;
  organizer: string;
  date: string;
  time: string | null;
  endDate: string | null;
  endTime: string | null;
};

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
  const date = new Date(`2000-01-01T${String(value).slice(0, 5)}`);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatThaiDateTimeRange(certificate: CertificatePreviewData) {
  const startDate = formatThaiDate(certificate.date);
  const startTime = formatThaiTime(certificate.time);
  const endDate = formatThaiDate(certificate.endDate);
  const endTime = formatThaiTime(certificate.endTime);

  if (!startTime && !endTime) {
    return certificate.endDate && certificate.endDate !== certificate.date
      ? `${startDate} - ${endDate}`
      : startDate;
  }

  if (certificate.endDate && certificate.endDate !== certificate.date) {
    return `${startDate} เวลา ${startTime || "-"} น. - ${endDate} เวลา ${endTime || "-"} น.`;
  }

  return `${startDate} เวลา ${startTime || "-"}${endTime ? ` - ${endTime}` : ""} น.`;
}

// ---------- Modal Confirm ----------
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
              onChange={(event) =>
                onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
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

function CertificatePreview({ certificate }: { certificate: CertificatePreviewData }) {
  return (
    <div className="relative mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
      <img
        src={certificate.imageUrl}
        alt={certificate.templateName}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        <p className="text-sm font-medium text-slate-700 sm:text-base">
          ผู้จัดกิจกรรม: {certificate.organizer || "-"}
        </p>
        <p className="mt-8 text-2xl font-semibold text-[#1565C0] sm:text-4xl">
          {certificate.studentName || "-"}
        </p>
        <p className="mt-5 text-sm text-slate-600 sm:text-base">
          ได้เข้าร่วมกิจกรรม/อบรม
        </p>
        <p className="mt-2 max-w-2xl text-lg font-semibold text-slate-900 sm:text-2xl">
          {certificate.activityName}
        </p>
        <p className="mt-5 text-xs font-medium text-slate-600 sm:text-sm">
          วันที่และเวลาที่จัดกิจกรรม: {formatThaiDateTimeRange(certificate)}
        </p>
        <div className="mt-10 w-56 text-center">
          <div className="border-t border-slate-500 pt-2 text-sm font-medium text-slate-700">
            ลายเซ็นคณบดี
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- ActivityCard (สำหรับกิจกรรมที่กำลังเปิด) ----------
function ActivityCard({
  activity,
  onConfirm,
}: {
  activity: Activity;
  onConfirm: (activity: Activity) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.11)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">
            {activity.title}
          </p>
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
          {activity.date}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          {activity.time}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="line-clamp-1">{activity.location}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(activity)}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1565C0] bg-white px-4 text-sm font-semibold text-[#1565C0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1565C0] hover:text-white"
      >
        <CheckCircle2 className="h-4 w-4" />
        ยืนยันการเข้าร่วม
      </button>
    </article>
  );
}

// ---------- PastActivityCard (สำหรับกิจกรรมที่เคยเข้าร่วม) ----------
function PastActivityCard({
  activity,
  onViewCertificate,
}: {
  activity: PastActivity;
  onViewCertificate: (activityId: string, activityName: string) => void;
}) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.11)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">
            {activity.activityName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          เข้าร่วมแล้ว
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {activity.date}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          {activity.time}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="line-clamp-1">{activity.location}</span>
        </p>
        {activity.score !== null && (
          <p className="flex items-center gap-2 text-[#1565C0]">
            <CheckCircle2 className="h-4 w-4" />
            คะแนน: {activity.score}
          </p>
        )}
      </div>

      {/* ปุ่มดูเกียรติบัตร */}
      <button
        type="button"
        onClick={() => onViewCertificate(activity.activityId, activity.activityName)}
        disabled={!activity.templateId}
        className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
          activity.templateId
            ? "border border-[#1565C0] bg-white text-[#1565C0] shadow-sm hover:-translate-y-0.5 hover:bg-[#1565C0] hover:text-white"
            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
        }`}
      >
        <Award className="h-4 w-4" />
        {activity.templateId ? "ดูเกียรติบัตร" : "ไม่มีเกียรติบัตร"}
      </button>
    </article>
  );
}

// ---------- Main Component ----------
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

  // Modal state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Certificate modal state
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

  // โหลดกิจกรรมที่กำลังเปิดรับ (active)
  useEffect(() => {
    const fetchActiveActivities = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ visible: "true" });
        if (user?.studentId) params.set("studentId", user.studentId);

        const res = await fetch(`/api/activities?${params.toString()}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดกิจกรรมได้");
        const data = await res.json();
        setActivities(data);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveActivities();
  }, [user?.studentId]);

  // โหลดกิจกรรมที่เคยเข้าร่วม (past)
  useEffect(() => {
    if (activeTab !== "past" || !user?.studentId) {
      setPastActivities([]);
      return;
    }

    const fetchPastActivities = async () => {
      try {
        setLoadingPast(true);
        const res = await fetch(`/api/students/${user.studentId}/participations`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดกิจกรรมที่เคยเข้าร่วม");
        const data = await res.json();

        // ดึง templateId สำหรับแต่ละกิจกรรม
        const participations = data.participations || [];
        const pastWithTemplate = await Promise.all(
          participations.map(async (p: any) => {
            try {
              const activityRes = await fetch(`/api/activities/${p.activityId}`);
              if (activityRes.ok) {
                const activityData = await activityRes.json();
                return {
                  ...p,
                  templateId: activityData.templateId || null,
                };
              }
              return { ...p, templateId: null };
            } catch {
              return { ...p, templateId: null };
            }
          })
        );

        setPastActivities(pastWithTemplate);
        setErrorPast("");
      } catch (err) {
        setErrorPast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoadingPast(false);
      }
    };

    fetchPastActivities();
  }, [user?.studentId, activeTab]);

  // ค้นหา
  const filteredActivities = activities.filter((act) =>
    act.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เปิด modal ยืนยัน
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

  // ตรวจสอบรหัสยืนยัน
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

  // เปิด modal ดูเกียรติบัตร
  const handleViewCertificate = async (activityId: string, activityName: string) => {
    if (!user?.studentId) {
      alert("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setCertificateModal({
      isOpen: true,
      certificate: null,
      activityName,
      loading: true,
    });

    try {
      const res = await fetch(
        `/api/activities/${activityId}/certificate?studentId=${encodeURIComponent(user.studentId)}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถสร้างเกียรติบัตรได้");
      }

      const data = await res.json();
      setCertificateModal({
        isOpen: true,
        certificate: {
          imageUrl: data.imageUrl,
          templateName: data.templateName || "แม่แบบเกียรติบัตร",
          studentName: data.studentName || `${user.firstName} ${user.lastName}`,
          activityName: data.activityName || activityName,
          organizer: data.organizer || "-",
          date: data.date,
          time: data.time,
          endDate: data.endDate,
          endTime: data.endTime,
        },
        activityName,
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
                แสดงกิจกรรมที่เปิดให้ยืนยันการเข้าร่วมและมีแบบประเมิน หรือกิจกรรมที่คุณเคยเข้าร่วมแล้ว
              </p>
            </div>

            <div className="w-full sm:w-[280px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="ค้นหากิจกรรม"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-8 border-b border-blue-50">
            <button
              onClick={() => setActiveTab("active")}
              className={`relative pb-2 text-sm font-semibold transition ${
                activeTab === "active" ? "text-[#1565C0]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              กิจกรรมที่กำลังเปิดรับ
              {activeTab === "active" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1565C0]" />
              )}
            </button>
            <button
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
                      {searchTerm
                        ? "ไม่พบกิจกรรมที่ค้นหา"
                        : "ขณะนี้ไม่มีกิจกรรมที่เปิดให้ยืนยันการเข้าร่วม"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onConfirm={openConfirmationModal}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

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
                    {pastActivities.map((act) => (
                      <PastActivityCard
                        key={act.participationId}
                        activity={act}
                        onViewCertificate={handleViewCertificate}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal ยืนยันรหัส */}
      <ConfirmationCodeModal
        activity={selectedActivity}
        code={confirmationCode}
        onCodeChange={setConfirmationCode}
        onConfirm={handleConfirmCode}
        onClose={closeConfirmationModal}
        isVerifying={isVerifying}
        error={verifyError}
      />

      {/* Modal แสดงเกียรติบัตร */}
      {certificateModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeCertificateModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-4">
              <div className="mb-3 text-center">
                <h3 className="text-lg font-semibold text-slate-950">
                  เกียรติบัตร: {certificateModal.activityName}
                </h3>
              </div>
              <div className="max-h-[calc(90vh-120px)] overflow-auto rounded-lg bg-slate-100 p-2">
                {certificateModal.loading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#1565C0]" />
                    <span className="ml-3 text-slate-500">กำลังสร้างเกียรติบัตร...</span>
                  </div>
                ) : certificateModal.certificate ? (
                  <CertificatePreview certificate={certificateModal.certificate} />
                ) : null}
              </div>
              {!certificateModal.loading && certificateModal.certificate && (
                <div className="mt-3 flex justify-center gap-3">
                  <a
                    href={certificateModal.certificate.imageUrl}
                    download={`เกียรติบัตร_${certificateModal.certificate.activityName}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]"
                  >
                    <Award className="h-4 w-4" />
                    ดาวน์โหลดเกียรติบัตร
                  </a>
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
