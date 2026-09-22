"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  FileText,
  ChevronRight,
  Building2,
  BookOpen,
  Paperclip,
  ExternalLink,
  X,
  Award,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// =====================================================
// TYPES
// =====================================================

type RequestStatus = "pending" | "approved" | "rejected";

type RequestSkill = {
  skill: string;
  level: string;
};

type EvidenceFile = {
  name: string;
  url: string | null;
  type: string | null;
};

type RequestItem = {
  id: string;
  studentId?: string;
  studentName?: string;
  major?: string;

  activityName: string;
  organizer: string;

  activityDate: string;
  activityEndDate?: string | null;

  description: string;

  submitDate: string;
  submittedAt?: string;

  status: RequestStatus;

  approvedDate?: string | null;
  approvedBy?: string | null;

  reviewedAt?: string | null;

  skills: RequestSkill[];

  reason?: string | null;

  evidenceFiles: EvidenceFile[];

  approvedActivityId?: string | null;
};

// =====================================================
// STATUS CONFIG
// =====================================================

const statusConfig = {
  pending: {
    label: "รอพิจารณา",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },

  approved: {
    label: "อนุมัติแล้ว",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },

  rejected: {
    label: "ไม่อนุมัติ",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

// =====================================================
// LEVEL CONFIG
// =====================================================

const levelScoreMap: Record<string, number> = {
  พื้นฐาน: 1,
  กลาง: 2,
  สูง: 3,

  // รองรับกรณีข้อมูลเดิมใช้คำว่า "ปานกลาง"
  ปานกลาง: 2,
};

function getLevelLabel(level: string) {
  if (level === "พื้นฐาน") return "ระดับพื้นฐาน";
  if (level === "กลาง" || level === "ปานกลาง") return "ระดับกลาง";
  if (level === "สูง") return "ระดับสูง";

  return level;
}

function getLevelScore(level: string) {
  return levelScoreMap[level] || 0;
}

// =====================================================
// DATE FORMAT
// =====================================================

function formatThaiDate(
  value?: string | null,
  includeTime = false,
): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}

function formatActivityDate(
  start?: string | null,
  end?: string | null,
): string {
  if (!start) return "-";

  const startText = formatThaiDate(start);

  if (!end || end === start) {
    return startText;
  }

  return `${startText} - ${formatThaiDate(end)}`;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function RequestStatusPage() {
  const { user, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<RequestStatus | "all">("all");

  // รายการที่ถูกเลือกเพื่อเปิดรายละเอียด
  const [selectedRequest, setSelectedRequest] =
    useState<RequestItem | null>(null);

  // ===================================================
  // FETCH REQUESTS
  // ===================================================

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.studentId) {
        if (!authLoading) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          apiPath(`/api/activity-requests?studentId=${encodeURIComponent(
            user.studentId,
          )}`),
          {
            cache: "no-store",
          },
        );

        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลได้");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          setRequests([]);
          return;
        }

        const mapped: RequestItem[] = data.map((item: any) => ({
          id: String(item.id || ""),

          studentId: item.studentId
            ? String(item.studentId)
            : undefined,

          studentName: item.studentName
            ? String(item.studentName)
            : undefined,

          major: item.major ? String(item.major) : undefined,

          activityName: String(item.activityName || "-"),

          organizer: String(item.organizer || "-"),

          activityDate: String(item.activityDate || ""),

          activityEndDate: item.activityEndDate
            ? String(item.activityEndDate)
            : null,

          description: String(item.description || "-"),

          submittedAt: item.submittedAt
            ? String(item.submittedAt)
            : undefined,

          submitDate: formatThaiDate(item.submittedAt),

          status: item.status as RequestStatus,

          approvedDate: item.reviewedAt
            ? formatThaiDate(item.reviewedAt)
            : null,

          approvedBy:
            item.status === "approved" ? "เจ้าหน้าที่" : null,

          reviewedAt: item.reviewedAt
            ? String(item.reviewedAt)
            : null,

          skills: Array.isArray(item.skills)
            ? item.skills
                .filter(
                  (skill: any) =>
                    skill &&
                    skill.skill &&
                    skill.level,
                )
                .map((skill: any) => ({
                  skill: String(skill.skill),
                  level: String(skill.level),
                }))
            : [],

          reason: item.reason
            ? String(item.reason)
            : null,

          evidenceFiles: Array.isArray(item.evidenceFiles)
            ? item.evidenceFiles.map((file: any) => ({
                name: String(
                  file?.name || "ไฟล์หลักฐาน",
                ),
                url: file?.url
                  ? String(file.url)
                  : null,
                type: file?.type
                  ? String(file.type)
                  : null,
              }))
            : [],

          approvedActivityId:
            item.approvedActivityId
              ? String(item.approvedActivityId)
              : null,
        }));

        setRequests(mapped);
      } catch (error) {
        console.error(
          "Failed to load activity requests:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [authLoading, user?.studentId]);

  // ===================================================
  // COUNT
  // ===================================================

  const countByStatus = (status: RequestStatus) =>
    requests.filter((req) => req.status === status).length;

  // ===================================================
  // FILTER
  // ===================================================

  const filteredRequests =
    activeTab === "all"
      ? requests
      : requests.filter(
          (req) => req.status === activeTab,
        );

  // ===================================================
  // TABS
  // ===================================================

  const tabs = [
    {
      key: "all" as const,
      label: "ทั้งหมด",
      count: requests.length,
    },

    {
      key: "pending" as const,
      label: "รอพิจารณา",
      count: countByStatus("pending"),
    },

    {
      key: "approved" as const,
      label: "อนุมัติแล้ว",
      count: countByStatus("approved"),
    },

    {
      key: "rejected" as const,
      label: "ไม่อนุมัติ",
      count: countByStatus("rejected"),
    },
  ];

  // ===================================================
  // OPEN / CLOSE DETAIL
  // ===================================================

  const openDetail = (request: RequestItem) => {
    setSelectedRequest(request);
  };

  const closeDetail = () => {
    setSelectedRequest(null);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <StudentShell activePath="/student/request-status">
      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-[#17243A] sm:text-[28px]">
                สถานะคำขอ
              </h1>

              <div className="mt-2 h-[2px] w-20 rounded-full bg-[#FFC107]" />

              <p className="mt-2 text-[13px] text-slate-500">
                ตรวจสอบสถานะกิจกรรมที่ยื่นขอเพิ่มจากภายนอก
              </p>
            </div>

            {/* Summary */}
            <div className="hidden rounded-xl border border-[#DCEBFA] bg-white px-4 py-2.5 shadow-sm sm:block">
              <p className="text-[10px] text-slate-400">
                คำขอทั้งหมด
              </p>

              <p className="mt-0.5 text-lg font-semibold text-[#1565C0]">
                {requests.length}

                <span className="ml-1 text-xs font-normal text-slate-400">
                  รายการ
                </span>
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* TABS */}
          {/* ================================================= */}

          <div className="mb-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-[#DCEBFA] bg-white p-1.5 shadow-sm">
              {tabs.map((tab) => {
                const isActive =
                  activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.key)
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition ${
                      isActive
                        ? "bg-[#EAF5FF] text-[#1565C0] shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] ${
                        isActive
                          ? "bg-[#1565C0] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================= */}
          {/* REQUEST LIST */}
          {/* ================================================= */}

          <div>
            {loading ? (
              <div className="rounded-xl border border-[#DCEBFA] bg-white py-14 text-center shadow-sm">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-100 border-t-[#1565C0]" />

                <p className="mt-3 text-[12px] text-slate-400">
                  กำลังโหลดข้อมูล...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-[#DCEBFA] bg-white py-14 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <FileText className="h-6 w-6 text-slate-300" />
                </div>

                <p className="mt-3 text-[13px] font-medium text-slate-500">
                  ไม่มีคำขอในสถานะนี้
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  รายการคำขอจะแสดงที่นี่เมื่อมีข้อมูล
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(
                  (req, index) => {
                    const status =
                      statusConfig[req.status];

                    const StatusIcon =
                      status.icon;

                    return (
                      <article
                        key={req.id}
                        onClick={() =>
                          openDetail(req)
                        }
                        className="group cursor-pointer rounded-xl border border-[#DCE5EE] bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition hover:border-[#B8D8F2] hover:shadow-[0_7px_22px_rgba(15,23,42,0.07)]"
                      >
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4">
                          {/* ================= LEFT ================= */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              {/* Number */}

                              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF5FF] text-[11px] font-semibold text-[#1565C0] sm:flex">
                                {String(
                                  requests.findIndex(
                                    (item) =>
                                      item.id ===
                                      req.id,
                                  ) + 1,
                                ).padStart(2, "0")}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-2 text-[14px] font-medium leading-5 text-[#17243A]">
                                  {
                                    req.activityName
                                  }
                                </h3>

                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5" />

                                    วันที่ยื่น{" "}
                                    {
                                      req.submitDate
                                    }
                                  </span>

                                  <span className="hidden text-slate-300 sm:inline">
                                    •
                                  </span>

                                  <span>
                                    รหัสคำขอ #
                                    {req.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ================= MIDDLE ================= */}

                          <div className="sm:w-[300px]">
                            {/* Approved */}

                            {req.status ===
                              "approved" &&
                              req.skills.length >
                                0 && (
                                <div>
                                  <p className="mb-1.5 text-[10px] font-medium text-slate-500">
                                    ทักษะที่ได้รับ
                                  </p>

                                  <div className="flex flex-wrap gap-1.5">
                                    {req.skills.map(
                                      (
                                        skill,
                                        skillIndex,
                                      ) => (
                                        <span
                                          key={`${skill.skill}-${skillIndex}`}
                                          className="rounded-md bg-[#EAF5FF] px-2 py-1 text-[9px] font-medium text-[#1565C0]"
                                        >
                                          {skill.skill}{" "}
                                          ·{" "}
                                          {getLevelLabel(
                                            skill.level,
                                          )}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Rejected */}

                            {req.status ===
                              "rejected" &&
                              req.reason && (
                                <div className="rounded-lg bg-red-50 px-3 py-2">
                                  <p className="text-[9px] font-medium text-red-500">
                                    เหตุผลที่ไม่อนุมัติ
                                  </p>

                                  <p className="mt-0.5 line-clamp-2 text-[10px] text-red-700">
                                    {
                                      req.reason
                                    }
                                  </p>
                                </div>
                              )}

                            {/* Pending */}

                            {req.status ===
                              "pending" && (
                                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />

                                  <p className="text-[10px] text-amber-700">
                                    อยู่ระหว่างการตรวจสอบโดยเจ้าหน้าที่
                                  </p>
                                </div>
                              )}
                          </div>

                          {/* ================= STATUS ================= */}

                          <div className="flex shrink-0 items-center justify-between gap-3 sm:w-[135px] sm:justify-end">
                            <div
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${status.bg} ${status.text} ${status.border}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                              />

                              <StatusIcon className="h-3.5 w-3.5" />

                              {status.label}
                            </div>

                            <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1565C0]" />
                          </div>
                        </div>

                        {/* Approved Footer */}

                        {req.status ===
                          "approved" && (
                          <div className="border-t border-slate-100 bg-[#FCFEFF] px-5 py-2.5">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-slate-400">
                              {req.approvedDate && (
                                <span>
                                  วันที่อนุมัติ:{" "}
                                  <span className="text-slate-600">
                                    {
                                      req.approvedDate
                                    }
                                  </span>
                                </span>
                              )}

                              {req.approvedBy && (
                                <span>
                                  ผู้อนุมัติ:{" "}
                                  <span className="text-slate-600">
                                    {
                                      req.approvedBy
                                    }
                                  </span>
                                </span>
                              )}

                              <span className="text-[#1565C0]">
                                คลิกเพื่อดูรายละเอียด
                              </span>
                            </div>
                          </div>
                        )}

                        {req.status !==
                          "approved" && (
                          <div className="border-t border-slate-100 bg-[#FCFEFF] px-5 py-2.5">
                            <p className="text-[10px] text-[#1565C0]">
                              คลิกเพื่อดูรายละเอียดกิจกรรม
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* DETAIL MODAL */}
      {/* ===================================================== */}

      {selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* ================================================= */}
            {/* MODAL HEADER */}
            {/* ================================================= */}

            <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF5FF]">
                      <FileText className="h-4 w-4 text-[#1565C0]" />
                    </div>

                    <span className="text-[10px] font-medium text-slate-400">
                      รายละเอียดคำขอ #{selectedRequest.id}
                    </span>
                  </div>

                  <h2 className="text-[18px] font-semibold leading-6 text-[#17243A]">
                    {selectedRequest.activityName}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDetail}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="ปิด"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ================================================= */}
            {/* MODAL CONTENT */}
            {/* ================================================= */}

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              {/* =============================================== */}
              {/* STATUS */}
              {/* =============================================== */}

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-[10px] text-slate-400">
                    สถานะคำขอ
                  </p>

                  <div className="mt-1">
                    {(() => {
                      const config =
                        statusConfig[
                          selectedRequest.status
                        ];

                      const Icon =
                        config.icon;

                      return (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          <Icon className="h-3.5 w-3.5" />

                          {config.label}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400">
                    วันที่ยื่นคำขอ
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-slate-700">
                    {selectedRequest.submitDate}
                  </p>
                </div>
              </div>

              {/* =============================================== */}
              {/* ACTIVITY INFORMATION */}
              {/* =============================================== */}

              <section className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF5FF]">
                    <BookOpen className="h-3.5 w-3.5 text-[#1565C0]" />
                  </div>

                  <h3 className="text-[13px] font-semibold text-[#17243A]">
                    ข้อมูลกิจกรรม
                  </h3>
                </div>

                <div className="rounded-xl border border-[#E2EDF7] bg-[#FCFEFF]">
                  <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {/* Organizer */}

                    <div className="p-3.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Building2 className="h-3.5 w-3.5" />
                        ผู้จัดกิจกรรม / หน่วยงาน
                      </div>

                      <p className="mt-1.5 text-[12px] font-medium text-slate-700">
                        {selectedRequest.organizer ||
                          "-"}
                      </p>
                    </div>

                    {/* Date */}

                    <div className="p-3.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        วันที่จัดกิจกรรม
                      </div>

                      <p className="mt-1.5 text-[12px] font-medium text-slate-700">
                        {formatActivityDate(
                          selectedRequest.activityDate,
                          selectedRequest.activityEndDate,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Description */}

                  <div className="border-t border-slate-100 p-3.5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <FileText className="h-3.5 w-3.5" />
                      รายละเอียดสรุปองค์ความรู้ที่ได้รับ
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-slate-600">
                      {selectedRequest.description ||
                        "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* =============================================== */}
              {/* APPROVED SKILLS */}
              {/* =============================================== */}

              {selectedRequest.status ===
                "approved" && (
                <section className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                      <Award className="h-3.5 w-3.5 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="text-[13px] font-semibold text-[#17243A]">
                        ทักษะที่ได้รับ
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        คะแนนได้รับเต็มตามระดับที่เจ้าหน้าที่กำหนด
                      </p>
                    </div>
                  </div>

                  {selectedRequest.skills.length >
                  0 ? (
                    <div className="overflow-hidden rounded-xl border border-[#DCEBFA]">
                      <div className="grid grid-cols-[1fr_110px_90px] bg-[#F8FCFF] px-4 py-2.5 text-[10px] font-semibold text-slate-500">
                        <span>ทักษะ</span>
                        <span>ระดับ</span>
                        <span className="text-right">
                          คะแนน
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {selectedRequest.skills.map(
                          (
                            skill,
                            index,
                          ) => {
                            const score =
                              getLevelScore(
                                skill.level,
                              );

                            return (
                              <div
                                key={`${skill.skill}-${index}`}
                                className="grid grid-cols-[1fr_110px_90px] items-center px-4 py-3"
                              >
                                {/* Skill */}

                                <div className="min-w-0 pr-3">
                                  <p className="text-[11px] font-medium leading-5 text-slate-700">
                                    {
                                      skill.skill
                                    }
                                  </p>
                                </div>

                                {/* Level */}

                                <div>
                                  <span
                                    className={`inline-flex rounded-md px-2 py-1 text-[9px] font-medium ${
                                      skill.level ===
                                      "สูง"
                                        ? "bg-purple-50 text-purple-600"
                                        : skill.level ===
                                            "กลาง" ||
                                          skill.level ===
                                            "ปานกลาง"
                                        ? "bg-blue-50 text-[#1565C0]"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {getLevelLabel(
                                      skill.level,
                                    )}
                                  </span>
                                </div>

                                {/* Score */}

                                <div className="text-right">
                                  <span className="text-[12px] font-bold text-emerald-600">
                                    {score} /{" "}
                                    {score}
                                  </span>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-5 text-center text-[11px] text-slate-400">
                      ไม่พบข้อมูลทักษะ
                    </div>
                  )}

                  <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] leading-5 text-emerald-700">
                    <span className="font-semibold">
                      หมายเหตุ:
                    </span>{" "}
                    กิจกรรมจากภายนอกไม่มีการทำแบบประเมิน
                    คะแนนจะได้รับเต็มตามระดับทักษะที่เจ้าหน้าที่กำหนด
                  </div>
                </section>
              )}

              {/* =============================================== */}
              {/* REJECTED REASON */}
              {/* =============================================== */}

              {selectedRequest.status ===
                "rejected" && (
                <section className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    </div>

                    <h3 className="text-[13px] font-semibold text-[#17243A]">
                      ผลการพิจารณา
                    </h3>
                  </div>

                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-[10px] font-medium text-red-500">
                      เหตุผลที่ไม่อนุมัติ
                    </p>

                    <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-5 text-red-700">
                      {selectedRequest.reason ||
                        "ไม่ได้ระบุเหตุผล"}
                    </p>
                  </div>
                </section>
              )}

              {/* =============================================== */}
              {/* PENDING */}
              {/* =============================================== */}

              {selectedRequest.status ===
                "pending" && (
                <section className="mb-5">
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                      <div>
                        <p className="text-[11px] font-semibold text-amber-700">
                          อยู่ระหว่างการพิจารณา
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-amber-600">
                          เจ้าหน้าที่กำลังตรวจสอบข้อมูลกิจกรรมและเอกสารหลักฐาน
                          เมื่อพิจารณาแล้ว ผลการพิจารณาและทักษะที่ได้รับจะแสดงที่นี่
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* =============================================== */}
              {/* EVIDENCE FILES */}
              {/* =============================================== */}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF5FF]">
                    <Paperclip className="h-3.5 w-3.5 text-[#1565C0]" />
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-[#17243A]">
                      เอกสารหลักฐาน
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      หลักฐานที่แนบมากับคำขอ
                    </p>
                  </div>
                </div>

                {selectedRequest.evidenceFiles
                  .length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.evidenceFiles.map(
                      (
                        file,
                        index,
                      ) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#E2EDF7] bg-[#FAFCFF] px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF5FF]">
                              <FileText className="h-4 w-4 text-[#1565C0]" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-medium text-slate-700">
                                {file.name}
                              </p>

                              <p className="mt-0.5 text-[9px] text-slate-400">
                                ไฟล์ที่ {index + 1}
                              </p>
                            </div>
                          </div>

                          {file.url ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#EAF5FF] px-2.5 py-1.5 text-[10px] font-medium text-[#1565C0] transition hover:bg-[#DCEEFF]"
                            >
                              เปิดไฟล์
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              ไม่มีไฟล์
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-5 text-center text-[11px] text-slate-400">
                    ไม่พบเอกสารหลักฐาน
                  </div>
                )}
              </section>
            </div>

            {/* ================================================= */}
            {/* MODAL FOOTER */}
            {/* ================================================= */}

            <div className="shrink-0 border-t border-slate-100 bg-[#FCFEFF] px-5 py-3.5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[9px] text-slate-400">
                  {selectedRequest.reviewedAt
                    ? `ตรวจสอบเมื่อ ${formatThaiDate(
                        selectedRequest.reviewedAt,
                        true,
                      )}`
                    : "ยังไม่ได้พิจารณา"}
                </div>

                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}