// components/student/RequestStatusPage.tsx
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  FileText,
  ChevronRight,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// ---------- Types ----------
type RequestStatus = "pending" | "approved" | "rejected";

type RequestItem = {
  id: string;
  activityName: string;
  submitDate: string;
  status: RequestStatus;
  approvedDate?: string | null;
  approvedBy?: string | null;
  skills?: string[];
  reason?: string | null;
};

// ---------- Status Config ----------
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

// ---------- Main Component ----------
export default function RequestStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RequestStatus | "all">("all");

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.studentId) {
        if (!authLoading) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`/api/activity-requests?studentId=${encodeURIComponent(user.studentId)}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
        const data = await res.json();
        setRequests(
          data.map((item: any) => ({
            id: item.id,
            activityName: item.activityName,
            submitDate: new Date(item.submittedAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: item.status,
            approvedDate: item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null,
            approvedBy: item.status === "approved" ? "เจ้าหน้าที่" : null,
            skills: Array.isArray(item.skills)
              ? item.skills.map((skill: any) => `${skill.skill}: ${skill.level}`)
              : [],
            reason: item.reason,
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [authLoading, user?.studentId]);

  // ---------- Count ----------
  const countByStatus = (status: RequestStatus) =>
    requests.filter((req) => req.status === status).length;

  // ---------- Filter ----------
  const filteredRequests =
    activeTab === "all"
      ? requests
      : requests.filter((req) => req.status === activeTab);

  // ---------- Tabs ----------
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

  return (
    <StudentShell activePath="/student/request-status">
      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          {/* ===================================================== */}
          {/* HEADER */}
          {/* ===================================================== */}
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

          {/* ===================================================== */}
          {/* TABS */}
          {/* ===================================================== */}
          <div className="mb-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-[#DCEBFA] bg-white p-1.5 shadow-sm">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
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

          {/* ===================================================== */}
          {/* REQUEST LIST */}
          {/* ===================================================== */}
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
                {filteredRequests.map((req) => {
                  const status = statusConfig[req.status];
                  const StatusIcon = status.icon;

                  return (
                    <article
                      key={req.id}
                      className="group rounded-xl border border-[#DCE5EE] bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition hover:border-[#B8D8F2] hover:shadow-[0_7px_22px_rgba(15,23,42,0.07)]"
                    >
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4">
                        {/* ================= LEFT ================= */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            {/* Number */}
                            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF5FF] text-[11px] font-semibold text-[#1565C0] sm:flex">
                              {String(
                                requests.findIndex(
                                  (item) => item.id === req.id
                                ) + 1
                              ).padStart(2, "0")}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-[14px] font-medium leading-5 text-[#17243A]">
                                {req.activityName}
                              </h3>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  วันที่ยื่น {req.submitDate}
                                </span>

                                <span className="hidden text-slate-300 sm:inline">
                                  •
                                </span>

                                <span>รหัสคำขอ #{req.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ================= MIDDLE ================= */}
                        <div className="sm:w-[300px]">
                          {/* Approved */}
                          {req.status === "approved" &&
                            req.skills &&
                            req.skills.length > 0 && (
                              <div>
                                <p className="mb-1.5 text-[10px] font-medium text-slate-500">
                                  ทักษะที่ได้รับ
                                </p>

                                <div className="flex flex-wrap gap-1.5">
                                  {req.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-md bg-[#EAF5FF] px-2 py-1 text-[9px] font-medium text-[#1565C0]"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Rejected */}
                          {req.status === "rejected" && req.reason && (
                            <div className="rounded-lg bg-red-50 px-3 py-2">
                              <p className="text-[9px] font-medium text-red-500">
                                เหตุผลที่ไม่อนุมัติ
                              </p>

                              <p className="mt-0.5 text-[10px] text-red-700">
                                {req.reason}
                              </p>
                            </div>
                          )}

                          {/* Pending */}
                          {req.status === "pending" && (
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
                      {req.status === "approved" && (
                        <div className="border-t border-slate-100 bg-[#FCFEFF] px-5 py-2.5">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-slate-400">
                            {req.approvedDate && (
                              <span>
                                วันที่อนุมัติ:{" "}
                                <span className="text-slate-600">
                                  {req.approvedDate}
                                </span>
                              </span>
                            )}

                            {req.approvedBy && (
                              <span>
                                ผู้อนุมัติ:{" "}
                                <span className="text-slate-600">
                                  {req.approvedBy}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </StudentShell>
  );
}
