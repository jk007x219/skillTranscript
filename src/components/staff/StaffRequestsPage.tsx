// components/staff/StaffRequestsPage.tsx
"use client";

import { apiPath, withBasePath } from "@/lib/api-path";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Loader2,
  X,
  UserRound,
  FileText,
  Plus,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

// ---------- Types ----------
type RequestStatus = "pending" | "approved" | "rejected";

type SkillItem = {
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
  studentId: string;
  studentName: string;
  major: string;
  activityName: string;
  organizer: string;
  activityDate: string;
  activityEndDate?: string | null;
  submittedAt: string;
  evidenceFiles: EvidenceFile[];
  description: string;
  skills: SkillItem[];
  status: RequestStatus;
};

function formatThaiDate(value: string, month: "short" | "long" = "short") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month,
    year: "numeric",
  });
}

function formatThaiDateRange(start: string, end?: string | null) {
  const startText = formatThaiDate(start, "long");
  if (!end || end === start) return startText;
  return `${startText} - ${formatThaiDate(end, "long")}`;
}

function isImageFile(file: EvidenceFile) {
  return Boolean(file.type?.startsWith("image/") || file.url?.match(/\.(png|jpe?g|gif|webp)$/i));
}

// ---------- Main Component ----------
export default function StaffRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  const [selectedRequest, setSelectedRequest] =
    useState<RequestItem | null>(null);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);

  // ---------- Skills from API ----------
  const [skillOptions, setSkillOptions] = useState<
    { skillId: string; skillname: string; level: string }[]
  >([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // ---------- Local skills state for selected request ----------
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [draftSkill, setDraftSkill] = useState("");
  const [draftLevel, setDraftLevel] = useState("");

  const [decision, setDecision] = useState<"approved" | "rejected">(
    "approved"
  );
  const [reason, setReason] = useState("");

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoadingSkills(true);
        const res = await fetch(apiPath("/api/skills"));
        if (res.ok) {
          const data = await res.json();
          setSkillOptions(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiPath("/api/activity-requests"));
      if (!res.ok) throw new Error("ไม่สามารถโหลดคำขอได้");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ---------- Tabs ----------
  const tabs = [
    { key: "pending" as const, label: "รอดำเนินการ" },
    { key: "approved" as const, label: "อนุมัติแล้ว" },
    { key: "rejected" as const, label: "ไม่อนุมัติ" },
  ];

  const filteredRequests = requests.filter(
    (request) => request.status === activeTab
  );

  // ---------- Open Detail ----------
  const openRequestDetail = (request: RequestItem) => {
    setSelectedRequest(request);

    // โหลด skill เดิมของ request ถ้ามี
    setSkills(request.skills ?? []);
    setDraftSkill("");
    setDraftLevel("");
    setDecision("approved");
    setReason("");
  };

  const closeRequestDetail = () => {
    setSelectedRequest(null);
    setPreviewFile(null);
  };

  // ---------- Skills Management ----------
  const addSkill = () => {
    if (!draftSkill || !draftLevel) {
      alert("กรุณาเลือกทักษะและระดับก่อนกดเพิ่ม");
      return;
    }

    const alreadyAdded = skills.some(
      (item) => item.skill === draftSkill && item.level === draftLevel,
    );

    if (alreadyAdded) {
      alert("ทักษะนี้ถูกเพิ่มไว้แล้ว");
      return;
    }

    setSkills((prev) => [
      ...prev,
      { skill: draftSkill, level: draftLevel },
    ]);
    setDraftSkill("");
    setDraftLevel("");
  };

  const removeSkill = (index: number) => {
    if (skills.length <= 1) return; // ต้องมีอย่างน้อย 1 แถว
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------- Submit Decision ----------
  const handleSubmitDecision = async () => {
    if (!selectedRequest) return;

    const cleanedSkills = skills.filter((item) => item.skill && item.level);
    if (decision === "approved" && cleanedSkills.length === 0) {
      alert("กรุณากำหนดทักษะอย่างน้อย 1 รายการก่อนอนุมัติ");
      return;
    }

    try {
      setSavingDecision(true);
      const res = await fetch(apiPath(`/api/activity-requests/${selectedRequest.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          reason,
          skills: cleanedSkills,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "บันทึกผลการพิจารณาไม่สำเร็จ");
      }

      await fetchRequests();
      setSelectedRequest(null);
      setReason("");
      setSkills([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingDecision(false);
    }
  };

  return (
    <StaffShell activePath="/staff/requests">
      <section className="min-h-[calc(100vh-5.75rem)] px-5 py-7 sm:px-7 lg:px-8">
        <div className="max-w-[1100px]">
          {/* ================= PAGE TITLE ================= */}
          <div className="mb-5">
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[#17243A]">
              อนุมัติคำขอเพิ่มทักษะจากกิจกรรมภายนอก
            </h1>

            <div className="mt-2 h-[2px] w-24 rounded-full bg-[#FFC107]" />
          </div>

          {/* ================= TABS ================= */}
          <div className="mb-7 flex items-end gap-14">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedRequest(null);
                  }}
                  className={`relative pb-2 text-[15px] font-medium transition ${
                    isActive
                      ? "text-[#1565C0]"
                      : "text-[#64748B] hover:text-[#1565C0]"
                  }`}
                >
                  {tab.label}

                  {isActive && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full bg-[#1565C0]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ================= REQUEST TABLE ================= */}
          <div className="overflow-hidden rounded-md">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />

                <span className="ml-2 text-sm">กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="w-[16%] rounded-l-md border border-[#1565C0] bg-[#EAF5FF] px-5 py-2 text-left font-medium text-[#334155]">
                      รหัสนิสิต
                    </th>

                    <th className="w-[22%] border-y border-[#1565C0] bg-[#EAF5FF] px-5 py-2 text-left font-medium text-[#334155]">
                      ชื่อ-นามสกุล
                    </th>

                    <th className="w-[47%] border-y border-[#1565C0] bg-[#EAF5FF] px-5 py-2 text-left font-medium text-[#334155]">
                      ชื่อกิจกรรม
                    </th>

                    <th className="w-[15%] rounded-r-md border border-[#1565C0] bg-[#EAF5FF] px-5 py-2 text-left font-medium text-[#334155]">
                      วันที่ส่งคำขอ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="group cursor-pointer transition hover:bg-[#F7FBFF]"
                        onClick={() => openRequestDetail(req)}
                      >
                        <td className="border-b border-transparent px-5 py-3 align-top text-[15px] text-[#334155]">
                          {req.studentId}
                        </td>

                        <td className="border-b border-transparent px-5 py-3 align-top text-[15px] text-[#334155]">
                          {req.studentName}
                        </td>

                        <td className="border-b border-transparent px-5 py-3 align-top text-[15px] leading-6 text-[#334155]">
                          <div className="flex items-start justify-between gap-3">
                            <span>{req.activityName}</span>

                            <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-[#7A8797] transition group-hover:translate-x-0.5" />
                          </div>
                        </td>

                        <td className="border-b border-transparent px-5 py-3 align-top text-[15px] text-[#334155]">
                          {formatThaiDate(req.submittedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-14 text-center text-sm text-slate-400"
                      >
                        {activeTab === "pending"
                          ? "ยังไม่มีคำขอที่รอดำเนินการ"
                          : activeTab === "approved"
                            ? "ยังไม่มีคำขอที่อนุมัติแล้ว"
                            : "ยังไม่มีคำขอที่ไม่อนุมัติ"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* DETAIL DRAWER */}
      {/* ========================================================= */}

      {selectedRequest && (
        <>
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-[317px] flex-col border-l border-[#D8E3EF] bg-white shadow-[-4px_0_14px_rgba(0,0,0,0.04)]">
            {/* ================= DRAWER HEADER ================= */}
            <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-7">
              <h2 className="text-[16px] font-semibold text-[#17243A]">
                รายละเอียดคำขอ
              </h2>

              <button
                type="button"
                onClick={closeRequestDetail}
                className="rounded-full p-1 text-[#17243A] transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* ================= SCROLL CONTENT ================= */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              {/* ---------- Student ---------- */}
              <div className="flex items-center gap-4 pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1F3F5]">
                  <UserRound
                    className="h-7 w-7 text-[#858E9B]"
                    strokeWidth={1.6}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[13px] leading-6 text-[#334155]">
                    {selectedRequest.studentName}
                  </p>

                  <p className="text-[13px] leading-6 text-[#334155]">
                    รหัสนิสิต {selectedRequest.studentId}
                  </p>

                  <p className="text-[11px] leading-5 text-[#64748B]">
                    {selectedRequest.major}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]" />

              {/* ================= ACTIVITY ================= */}
              <div className="py-4">
                <h3 className="mb-3 text-[15px] font-semibold text-[#334155]">
                  ข้อมูลกิจกรรมภายนอก
                </h3>

                <div className="space-y-2 text-[12px] leading-5">
                  <div className="flex items-start">
                    <span className="w-[68px] shrink-0 text-[#334155]">
                      ชื่อกิจกรรม
                    </span>

                    <span className="text-[#64748B]">
                      {selectedRequest.activityName}
                    </span>
                  </div>

                  <div className="flex items-start">
                    <span className="w-[68px] shrink-0 text-[#334155]">
                      จัดโดย
                    </span>

                    <span className="text-[#64748B]">
                      {selectedRequest.organizer}
                    </span>
                  </div>

                  <div className="flex items-start">
                    <span className="w-[68px] shrink-0 text-[#334155]">
                      วันที่จัด
                    </span>

                    <span className="text-[#64748B]">
                      {formatThaiDateRange(
                        selectedRequest.activityDate,
                        selectedRequest.activityEndDate,
                      )}
                    </span>
                  </div>
                </div>

                {/* ---------- Evidence ---------- */}
                <div className="mt-3">
                  <p className="mb-1.5 text-[12px] text-[#334155]">
                    เอกสารหลักฐาน
                  </p>

                  {selectedRequest.evidenceFiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.evidenceFiles.map((file, index) => (
                        <button
                          key={`${file.name}-${file.url || "legacy"}-${index}`}
                          type="button"
                          onClick={() => {
                            if (file.url && isImageFile(file)) {
                              setPreviewFile(file);
                            } else if (file.url) {
                              window.open(withBasePath(file.url), "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="min-w-0 rounded-lg border border-[#DCEBFA] bg-[#F8FCFF] p-2 text-left transition hover:border-[#8EC5F4] hover:bg-white"
                        >
                          {file.url && isImageFile(file) ? (
                            <img
                              src={withBasePath(file.url)}
                              alt={file.name}
                              className="mb-2 h-20 w-full rounded-md object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-20 w-full items-center justify-center rounded-md bg-white text-[#1565C0]">
                              <FileText className="h-7 w-7" strokeWidth={1.7} />
                            </div>
                          )}
                          <span className="flex min-w-0 items-center gap-1 text-[11px] text-[#1565C0]">
                            {isImageFile(file) ? (
                              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-400">
                      ไม่มีไฟล์หลักฐาน
                    </p>
                  )}
                </div>

                {/* ---------- Description ---------- */}
                <div className="mt-4">
                  <p className="mb-1.5 text-[12px] text-[#334155]">
                    รายละเอียดหรือประสบการณ์ความรู้ที่ได้รับ
                  </p>

                  <p className="text-[12px] leading-6 text-[#64748B]">
                    {selectedRequest.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]" />

              {/* ================= SKILLS ================= */}
              <div className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#334155]">
                      ทักษะที่ได้รับ
                    </h3>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      เลือกทักษะและระดับ แล้วกด “เพิ่มทักษะ” เพื่อบันทึกเข้ารายการ
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1565C0]">
                    {skills.length} รายการ
                  </span>
                </div>

                <div className="mt-3 rounded-lg border border-[#D8E8F7] bg-[#F8FCFF] p-3">
                  <p className="mb-2 text-[11px] font-medium text-[#64748B]">
                    เลือกทักษะและระดับที่ต้องการเพิ่ม
                  </p>

                  <div className="space-y-2">
                    <select
                      value={draftSkill}
                      onChange={(e) => setDraftSkill(e.target.value)}
                      className="h-10 w-full rounded-md border border-[#B9D7F1] bg-white px-3 text-[12px] text-[#334155] outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0]"
                      disabled={loadingSkills}
                    >
                      <option value="">
                        {loadingSkills ? "กำลังโหลดทักษะ..." : "เลือกทักษะ..."}
                      </option>
                      {skillOptions.map((skill) => (
                        <option key={skill.skillId} value={skill.skillname}>
                          {skill.skillname}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-3 gap-1.5">
                      {["พื้นฐาน", "กลาง", "สูง"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDraftLevel(level)}
                          className={`h-9 rounded-md border text-[11px] font-medium transition ${
                            draftLevel === level
                              ? "border-[#1565C0] bg-[#1565C0] text-white shadow-sm"
                              : "border-[#B9D7F1] bg-white text-[#64748B] hover:border-[#8EC5F4] hover:text-[#1565C0]"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addSkill}
                      className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-md bg-[#1565C0] px-3 text-[12px] font-medium text-white transition hover:bg-[#0D56A5]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มทักษะที่เลือก
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {skills.length > 0 ? (
                    skills.map((item, index) => (
                      <div
                        key={`${item.skill}-${item.level}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-[#334155]">
                            {item.skill}
                          </p>
                          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#1565C0]">
                            {item.level}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`ลบทักษะ ${item.skill}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-400">
                      ยังไม่ได้เพิ่มทักษะ
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#E5E7EB]" />

              {/* ================= DECISION ================= */}
              <div className="py-4">
                <h3 className="mb-3 text-[15px] font-semibold text-[#334155]">
                  การพิจารณา
                </h3>

                <div className="flex items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#334155]">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === "approved"}
                      onChange={() => setDecision("approved")}
                      className="h-4 w-4 accent-[#4397D0]"
                    />
                    <span>อนุมัติ</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#334155]">
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === "rejected"}
                      onChange={() => setDecision("rejected")}
                      className="h-4 w-4 accent-[#4397D0]"
                    />
                    <span>ไม่อนุมัติ</span>
                  </label>
                </div>

                {decision === "rejected" && (
                  <div className="mt-3">
                    <label className="mb-2 block text-[11px] text-[#64748B]">
                      เหตุผลที่ไม่อนุมัติ
                    </label>

                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#8EC5F4] px-3 py-2 text-[12px] text-[#334155] outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0]"
                      placeholder="ระบุเหตุผล..."
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitDecision}
                  disabled={savingDecision}
                  className="mt-4 h-[35px] w-full rounded-md bg-[#4397D0] text-[13px] font-medium text-white transition hover:bg-[#3689C2] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDecision ? "กำลังบันทึก..." : "ยืนยันผลการพิจารณา"}
                </button>
              </div>

              <div className="h-5" />
            </div>
          </aside>
        </>
      )}

      {previewFile?.url && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="relative max-h-full w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-700">
                {previewFile.name}
              </p>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="ปิดรูปหลักฐาน"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-auto bg-slate-50 p-4">
              <img
                src={withBasePath(previewFile.url)}
                alt={previewFile.name}
                className="mx-auto max-h-[calc(100vh-10rem)] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
