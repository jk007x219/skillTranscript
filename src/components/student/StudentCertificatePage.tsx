// components/student/StudentCertificatePage.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Download, Printer } from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type CertificateData = {
  studentName: string;
  activityName: string;
  date: string | null;
  time: string | null;
  endDate: string | null;
  endTime: string | null;
  hours: number;
  organizer: string;
  templateImageUrl: string;
  templateName: string;
  score?: number;
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

function formatThaiDateTimeRange(certificate: CertificateData) {
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

export default function StudentCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const activityId = params.activityId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!user?.studentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูลกิจกรรมและข้อมูลนิสิต
        const res = await fetch(`/api/activities/${activityId}?studentId=${user.studentId}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลกิจกรรม");
        const data = await res.json();

        // ตรวจสอบว่านิสิตเข้าร่วมกิจกรรมนี้แล้ว
        if (!data.participationStatus || data.participationStatus !== "completed") {
          throw new Error("คุณยังไม่ได้เข้าร่วมกิจกรรมนี้");
        }

        setCertificate({
          studentName: `${user.firstName} ${user.lastName}`,
          activityName: data.title,
          date: data.date || null,
          time: data.time || null,
          endDate: data.endDate || null,
          endTime: data.endTime || null,
          hours: data.hours || 0,
          organizer: data.organizer || "-",
          templateImageUrl: data.template?.imageUrl || "/certificate-placeholder.png",
          templateName: data.template?.name || "แม่แบบมาตรฐาน",
          score: data.participationScore || undefined,
        });

        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityId, user]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // ใช้ html2canvas หรือ window.print เพื่อบันทึกเป็น PDF
    alert("ฟังก์ชันดาวน์โหลดกำลังพัฒนา (ใช้ Print to PDF แทน)");
  };

  if (loading) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-3 text-slate-500">กำลังโหลดเกียรติบัตร...</span>
        </div>
      </StudentShell>
    );
  }

  if (error || !certificate) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error || "ไม่พบข้อมูลเกียรติบัตร"}
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1565C0] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0D47A1]"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell activePath="/student/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">เกียรติบัตร</h1>
            <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-[#FFC107]" />
          </div>

          {/* แสดงเกียรติบัตร */}
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
              {/* ภาพแม่แบบเป็นพื้นหลัง */}
              <div className="relative">
                <img
                  src={certificate.templateImageUrl}
                  alt={certificate.templateName}
                  className="w-full rounded-t-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/certificate-placeholder.png";
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <p className="text-sm font-medium text-slate-700 sm:text-base">
                    ผู้จัดกิจกรรม: {certificate.organizer}
                  </p>
                  <p className="mt-8 text-2xl font-semibold text-[#1565C0] sm:text-4xl">
                    {certificate.studentName}
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
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#1565C0] px-6 text-sm font-semibold text-[#1565C0] transition hover:bg-blue-50"
            >
              <Printer className="h-4 w-4" />
              พิมพ์
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1565C0] px-6 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด
            </button>
          </div>
        </div>
      </section>
    </StudentShell>
  );
}
