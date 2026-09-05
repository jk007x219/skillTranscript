"use client";

import { useState } from "react";
import { File as FileIcon, Plus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

interface FileItem {
  id: string;
  file: File;
  name: string;
}

export default function RequestActivityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    activityName: "",
    organizer: "",
    date: "",
    endDate: "",
    summary: "",
  });

  const [files, setFiles] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      if (name === "date" && next.endDate && next.endDate < value) {
        next.endDate = "";
      }
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;

    if (!selectedFiles) return;

    const remainingSlots = 5 - files.length;

    if (remainingSlots <= 0) {
      alert("สามารถแนบไฟล์ได้สูงสุด 5 ไฟล์");
      return;
    }

    const selectedArray = Array.from(selectedFiles).slice(0, remainingSlots);

    const newFiles: FileItem[] = selectedArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.studentId) {
      alert("ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSubmitting(true);
      const requestFormData = new FormData();
      requestFormData.append("studentId", user.studentId);
      requestFormData.append("activityName", formData.activityName);
      requestFormData.append("organizer", formData.organizer);
      requestFormData.append("activityDate", formData.date);
      requestFormData.append("activityEndDate", formData.endDate);
      requestFormData.append("description", formData.summary);
      files.forEach((item) => {
        requestFormData.append("evidenceFiles", item.file);
      });

      const res = await fetch("/api/activity-requests", {
        method: "POST",
        body: requestFormData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ส่งคำขอไม่สำเร็จ");
      }

      alert("ส่งคำขอเพิ่มกิจกรรมเรียบร้อยแล้ว");
      setFormData({
        activityName: "",
        organizer: "",
        date: "",
        endDate: "",
        summary: "",
      });
      setFiles([]);
      router.push("/student/request-status");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentShell activePath="/student/request-activity">
      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          {/* ===================================================== */}
          {/* HEADER */}
          {/* ===================================================== */}
          <div className="mb-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-[25px] font-semibold tracking-[-0.02em] text-[#17243A] sm:text-[28px]">
                  ขอเพิ่มกิจกรรมจากภายนอก
                </h1>

                <div className="mt-2 h-[2px] w-20 rounded-full bg-[#FFC107]" />
              </div>

              {/* จำนวนไฟล์ */}
              <div className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#1565C0] sm:block">
                เอกสาร {files.length}/5
              </div>
            </div>

            <p className="mt-2 max-w-3xl text-[13px] leading-5 text-slate-500">
              กรอกรายละเอียดกิจกรรมที่เข้าร่วมภายนอกมหาวิทยาลัย
              พร้อมแนบหลักฐานเพื่อขอรับการพิจารณาทักษะ
            </p>
          </div>

          {/* ===================================================== */}
          {/* FORM */}
          {/* ===================================================== */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.9fr]">
              {/* ================================================= */}
              {/* LEFT : ACTIVITY INFORMATION */}
              {/* ================================================= */}
              <div className="rounded-2xl border border-[#DCEBFA] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
                {/* Section Header */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF5FF] text-sm font-semibold text-[#1565C0]">
                    01
                  </div>

                  <div>
                    <h2 className="text-[16px] font-semibold text-[#17243A]">
                      ข้อมูลกิจกรรม
                    </h2>

                    <p className="text-[11px] text-slate-400">
                      กรอกข้อมูลพื้นฐานของกิจกรรม
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* ชื่อกิจกรรม */}
                  <div>
                    <label
                      htmlFor="activityName"
                      className="mb-1.5 block text-[13px] font-medium text-[#334155]"
                    >
                      ชื่อกิจกรรม{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      id="activityName"
                      name="activityName"
                      value={formData.activityName}
                      onChange={handleInputChange}
                      required
                      className="h-10 w-full rounded-lg border border-[#B7D7F3] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#1565C0] focus:ring-3 focus:ring-blue-50"
                      placeholder="เช่น อบรมการบริหารจัดการด้านการเงิน"
                    />
                  </div>

                  {/* ผู้จัด + วันที่ */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px_180px]">
                    <div>
                      <label
                        htmlFor="organizer"
                        className="mb-1.5 block text-[13px] font-medium text-[#334155]"
                      >
                        ผู้จัดกิจกรรม / หน่วยงาน{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        id="organizer"
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleInputChange}
                        required
                        className="h-10 w-full rounded-lg border border-[#B7D7F3] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#1565C0] focus:ring-3 focus:ring-blue-50"
                        placeholder="เช่น มหาวิทยาลัยทักษิณ"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="date"
                        className="mb-1.5 block text-[13px] font-medium text-[#334155]"
                      >
                        วันที่จัดกิจกรรม{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="h-10 w-full rounded-lg border border-[#B7D7F3] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-3 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="endDate"
                        className="mb-1.5 block text-[13px] font-medium text-[#334155]"
                      >
                        วันที่สิ้นสุด{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.date || undefined}
                        required
                        className="h-10 w-full rounded-lg border border-[#B7D7F3] bg-white px-3.5 text-[13px] text-slate-700 outline-none transition focus:border-[#1565C0] focus:ring-3 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="summary"
                        className="text-[13px] font-medium text-[#334155]"
                      >
                        รายละเอียดสรุปองค์ความรู้ที่ได้รับ{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <span className="text-[10px] text-slate-400">
                        สำคัญต่อการพิจารณาทักษะ
                      </span>
                    </div>

                    <textarea
                      id="summary"
                      name="summary"
                      rows={7}
                      value={formData.summary}
                      onChange={handleInputChange}
                      required
                      className="w-full resize-none rounded-lg border border-[#B7D7F3] bg-white px-3.5 py-3 text-[13px] leading-6 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#1565C0] focus:ring-3 focus:ring-blue-50"
                      placeholder="อธิบายความรู้ ทักษะ หรือประสบการณ์ที่ได้รับจากกิจกรรมนี้ เช่น สิ่งที่ได้เรียนรู้ วิธีนำไปใช้ หรือประโยชน์ที่ได้รับ"
                    />

                    <div className="mt-1.5 rounded-lg bg-[#FFF9E6] px-3 py-2 text-[11px] leading-5 text-[#856404]">
                      <span className="font-semibold">หมายเหตุ:</span>{" "}
                      โปรดอธิบายรายละเอียดให้ชัดเจน
                      เพื่อช่วยให้เจ้าหน้าที่พิจารณาทักษะที่ได้รับได้เหมาะสม
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* RIGHT : EVIDENCE */}
              {/* ================================================= */}
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-[#DCEBFA] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
                  {/* Section Header */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF5FF] text-sm font-semibold text-[#1565C0]">
                        02
                      </div>

                      <div>
                        <h2 className="text-[16px] font-semibold text-[#17243A]">
                          เอกสารหลักฐาน
                        </h2>

                        <p className="text-[11px] text-slate-400">
                          แนบหลักฐานการเข้าร่วมกิจกรรม
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        files.length === 5
                          ? "bg-green-50 text-green-600"
                          : "bg-blue-50 text-[#1565C0]"
                      }`}
                    >
                      {files.length}/5
                    </span>
                  </div>

                  {/* Upload Box */}
                  <label
                    htmlFor="file-upload"
                    className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition ${
                      files.length >= 5
                        ? "cursor-not-allowed border-slate-200 bg-slate-50"
                        : "border-[#8FC5EE] bg-[#F8FCFF] hover:border-[#1565C0] hover:bg-[#F0F8FF]"
                    }`}
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF5FF]">
                      <Plus className="h-5 w-5 text-[#1565C0]" />
                    </div>

                    <p className="text-[13px] font-medium text-[#1565C0]">
                      เพิ่มไฟล์หลักฐาน
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      ภาพถ่าย, ใบประกาศ หรือเอกสาร
                      <br />
                      สามารถแนบได้สูงสุด 5 ไฟล์
                    </p>

                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      disabled={files.length >= 5}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                  </label>

                  {/* File List */}
                  {files.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {files.map((item, index) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between rounded-lg border border-[#E2EDF7] bg-[#FAFCFF] px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EAF5FF]">
                              <FileIcon className="h-4 w-4 text-[#1565C0]" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-medium text-slate-700">
                                {item.name}
                              </p>

                              <p className="text-[9px] text-slate-400">
                                ไฟล์ที่ {index + 1}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label={`ลบ ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-400">
                      ยังไม่มีไฟล์หลักฐาน
                    </div>
                  )}
                </div>

                {/* ================================================= */}
                {/* SUBMIT CARD */}
                {/* ================================================= */}
                <div className="rounded-2xl border border-[#DCEBFA] bg-[#F8FCFF] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF5FF]">
                      <Upload className="h-4 w-4 text-[#1565C0]" />
                    </div>

                    <div>
                      <h3 className="text-[13px] font-semibold text-[#334155]">
                        ตรวจสอบข้อมูลก่อนส่ง
                      </h3>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        กรุณาตรวจสอบข้อมูลและเอกสารหลักฐานให้ถูกต้อง
                        หลังจากส่งคำขอแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบ
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || authLoading}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4598D0] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1565C0] active:scale-[0.99]"
                  >
                    <Upload className="h-4 w-4" />
                    {submitting ? "กำลังส่งคำขอ..." : "ส่งคำขอเพิ่มกิจกรรม"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </StudentShell>
  );
}
