// components/student/StudentCertificatePage.tsx
"use client";

import { apiPath, withBasePath } from "@/lib/api-path";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Download,
  Printer,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type Skill = {
  name: string;
  level: string;
};

type CertificateData = {
  activityName: string;
  studentName: string;
  skills: Skill[];
  certifiedDate: string | null;
  signerName: string;
  deanSignatureUrl: string | null;
  templateImageUrl: string;
  templateName: string;
};

// ============================================================
// ✅ ฟังก์ชันจัดรูปแบบวันที่ รองรับ null, undefined
// ============================================================

function formatThaiDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================================
// Certificate Preview Component
// ============================================================

function CertificatePreview({ certificate }: { certificate: CertificateData }) {
  return (
    <div
      id="certificate-preview"
      className="
        relative
        mx-auto
        w-full
        max-w-[1100px]
        overflow-hidden
        bg-white
        shadow-xl
        print:shadow-none
      "
      style={{ aspectRatio: "1.414 / 1" }}
    >
      {/* Template Background */}
      <img
        src={withBasePath(certificate.templateImageUrl)}
        alt={certificate.templateName}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith("/certificate-placeholder.png")) {
            target.src = apiPath("/certificate-placeholder.png");
          }
        }}
      />

      <div className="absolute left-1/2 top-[6%] -translate-x-1/2">
        <img
          src={apiPath("/tsu-logo.png")}
          alt="TSU Logo"
          className="h-14 w-auto object-contain"
        />
      </div>

      <div className="absolute left-[10%] right-[10%] top-[18%] text-center text-[#173F70]">
        <p className="text-[24px] font-bold sm:text-4xl">ใบรับรองทักษะ</p>
        <p className="mt-2 text-[15px] font-bold sm:text-xl">{certificate.activityName || "-"}</p>
        <p className="mt-1 text-[11px] font-bold sm:text-sm">คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล มหาวิทยาลัยทักษิณ</p>
      </div>

      <div className="absolute left-[15%] right-[15%] top-[38%] text-center text-[#24466D]">
        <p className="text-[13px] font-bold sm:text-lg">ขอรับรองว่า</p>
      </div>

      <div className="absolute left-[15%] right-[15%] top-[44%] flex justify-center">
        <div className="rounded-md bg-white/85 px-4 py-1 text-center text-[27px] font-bold leading-tight text-[#173F70] sm:text-4xl md:text-5xl">
          {certificate.studentName || "-"}
        </div>
      </div>

      <div className="absolute left-[14%] right-[14%] top-[56%] text-center text-[#24466D]">
        <p className="text-[12px] font-bold sm:text-lg">ได้รับทักษะการรับรองทักษะ</p>
        <div className="mt-2 rounded-md bg-white/80 px-3 py-2">
          {certificate.skills.map((skill) => (
            <p key={`${skill.name}-${skill.level}`} className="text-[12px] font-bold leading-tight text-[#173F70] sm:text-lg">
              {skill.name} ระดับ{skill.level}
            </p>
          ))}
        </div>
      </div>
      {/* วันที่รับรอง */}
      <div className="absolute left-[28%] right-[28%] top-[77%] text-center text-[13px] font-medium text-[#24466D] sm:text-lg">
        ให้ไว้ ณ วันที่&nbsp;
        {formatThaiDate(certificate.certifiedDate)}
      </div>

      <div className="absolute bottom-[7%] left-1/2 w-[34%] -translate-x-1/2 text-center">
        {certificate.deanSignatureUrl && (
          <img
            src={withBasePath(certificate.deanSignatureUrl)}
            alt="ลายเซ็นคณบดี"
            className="mx-auto mb-[-2px] h-10 max-w-full object-contain"
          />
        )}
        <div className="mb-2 border-t border-[#24466D]" />
        <p className="text-[11px] font-medium text-[#24466D] sm:text-base">
          ( {certificate.signerName || "-"} )
        </p>
        <p className="mt-1 text-[10px] leading-tight text-[#24466D] sm:text-sm">
          คณบดีคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
          <br />
          มหาวิทยาลัยทักษิณ
        </p>
      </div>

    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

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

    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError("");

const studentId = user.studentId;
if (!studentId) return;

const res = await fetch(
  apiPath(`/api/activities/${activityId}/certificate?studentId=${encodeURIComponent(studentId)}`)
);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "ไม่สามารถโหลดใบรับรองได้");
        }

        const data = await res.json();

        if (data.participationStatus && data.participationStatus !== "completed") {
          throw new Error("คุณยังไม่ได้รับการรับรองทักษะนี้");
        }

        const skills: Skill[] = Array.isArray(data.skills) ? data.skills : [];

        const certifiedDate =
          data.certifiedDate ||
          data.certificateDate ||
          data.completedAt ||
          data.issuedDate ||
          data.date ||
          null;

        const signerName =
          data.signerName ||
          data.deanName ||
          data.certificate?.signerName ||
          "ผศ.ดร.นพมาศ ปักเข็ม";

        const studentName =
          data.studentName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim();

        const templateImageUrl =
          data.imageUrl ||
          data.template?.imageUrl ||
          data.templateImageUrl ||
          "/certificate-placeholder.png";

        const templateName =
          data.templateName ||
          data.template?.name ||
          "ใบรับรองทักษะ";

        setCertificate({
          activityName: data.activityName || "ไม่ระบุชื่อกิจกรรม",
          studentName,
          skills,
          certifiedDate,
          signerName,
          deanSignatureUrl: data.deanSignatureUrl || null,
          templateImageUrl,
          templateName,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [activityId, user?.studentId]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    try {
      const element = document.getElementById("certificate-preview");
      if (!element) {
        alert("ไม่พบใบรับรองสำหรับดาวน์โหลด");
        return;
      }

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `ใบรับรองทักษะ_${certificate?.studentName || "certificate"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download certificate error:", err);
      alert("ไม่สามารถดาวน์โหลดใบรับรองได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (loading) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-3 text-slate-500">กำลังโหลดใบรับรอง...</span>
        </div>
      </StudentShell>
    );
  }

  if (error || !certificate) {
    return (
      <StudentShell activePath="/student/activities">
        <div className="p-6">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error || "ไม่พบข้อมูลใบรับรอง"}
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
      <section className="p-4 sm:p-6 lg:p-7 print:p-0">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6 print:min-h-0 print:border-0 print:bg-white print:p-0 print:shadow-none">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700 print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>

          {/* Header */}
          <div className="text-center print:hidden">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              ใบรับรองทักษะ
            </h1>
            <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-[#FFC107]" />
            <p className="mt-2 text-sm text-slate-500">{certificate.skills.map((skill) => skill.name).join(", ")}</p>
          </div>

          {/* Certificate */}
          <div className="mt-6 flex justify-center print:mt-0">
            <CertificatePreview certificate={certificate} />
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-center gap-4 print:hidden">
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
