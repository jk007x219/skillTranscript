"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileBadge,
  Loader2,
  MapPin,
  QrCode,
  Search,
  Download,
  X,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type A = {
  activityId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  location: string;
  organizer: string;
  status: string;
  hasEvaluation: boolean;
  applicationEnabled: boolean;
  registrationEnabled: boolean;
  confirmationEnabled: boolean;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  registrationOpen?: boolean;
  participationStatus?: string | null;
  qrPayload?: string | null;
};
type P = {
  participationId: string;
  activityId: string;
  activityName: string;
  description: string;
  date: string;
  time: string;
  endTime?: string | null;
  location: string;
  organizer: string;
  score: number | null;
  status: string;
};
const date = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";
const time = (v?: string | null) => (v ? String(v).slice(0, 5) : "-");
function Card({
  a,
  tab,
  onApply,
  onShowQr,
  onEvaluate,
  onCertificate,
  onDetail,
}: {
  a: A;
  tab: string;
  onApply: () => void;
  onShowQr: () => void;
  onEvaluate: () => void;
  onCertificate: () => void;
  onDetail: () => void;
}) {
  const s = a.participationStatus;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-950">
          {a.title}
        </p>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#1565C0]">
          {s === "applied"
            ? "สมัครแล้ว"
            : s === "registered"
              ? "ลงทะเบียนแล้ว"
              : s === "confirmed"
                ? "สแกนแล้ว"
                : s === "completed"
                  ? "สำเร็จแล้ว"
                : "เปิดรับสมัคร"}
        </span>
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <p className="flex gap-2">
          <CalendarDays className="h-4 w-4" />
          {date(a.date)}
        </p>
        <p className="flex gap-2">
          <span className="w-4">◷</span>
          {time(a.time)}
          {a.endTime ? ` - ${time(a.endTime)}` : ""}
        </p>
        <p className="flex gap-2">
          <span className="w-4">ลง</span>
          ลงทะเบียน {a.registrationStart ? time(a.registrationStart) : "-"}
          {a.registrationEnd ? ` - ${time(a.registrationEnd)}` : ""}
        </p>
        <p className="flex gap-2">
          <MapPin className="h-4 w-4" />
          {a.location || "-"}
        </p>
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        {tab === "past" ? (
          <button
            onClick={onCertificate}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1565C0] text-sm font-semibold text-white transition hover:bg-[#0D47A1]"
          >
            <FileBadge className="h-4 w-4" />
            ดูใบรับรอง
          </button>
        ) : tab === "open" ? (
          <button
            onClick={onApply}
            className="h-11 flex-1 rounded-xl bg-[#1565C0] text-sm font-semibold text-white"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            สมัครกิจกรรม
          </button>
        ) : s === "applied" ? (
          <button
            onClick={onShowQr}
            className="h-11 flex-1 rounded-xl border border-[#1565C0] text-sm font-semibold text-[#1565C0]"
          >
            "แสดง QR ลงทะเบียน"
          </button>
        ) : s === "registered" || s === "confirmed" ? (
          <button
            onClick={s === "confirmed" ? onEvaluate : onShowQr}
            disabled={s === "confirmed" && !a.confirmationEnabled}
            className="h-11 flex-1 rounded-xl border border-[#1565C0] text-sm font-semibold text-[#1565C0] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <QrCode className="mr-2 inline h-4 w-4" />
            {s === "confirmed"
              ? a.confirmationEnabled
                ? "ทำแบบประเมิน"
                : "รอเจ้าหน้าที่เปิดแบบประเมิน"
              : "แสดง QR ลงทะเบียน"}
          </button>
        ) : (
          <button
            disabled
            className="h-11 flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-500"
          >
            ยืนยันแล้ว • รอทำแบบประเมิน
          </button>
        )}
        <button
          onClick={onDetail}
          className="h-11 w-11 rounded-xl border border-blue-100 text-slate-500"
        >
          <Eye className="mx-auto h-4 w-4" />
        </button>
      </div>
      {s === "applied" && (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          ขั้นต่อไป: นำ QR ให้เจ้าหน้าที่สแกนหน้างาน
        </p>
      )}
    </article>
  );
}
export default function StudentActivitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [a, setA] = useState<A[]>([]);
  const [p, setP] = useState<P[]>([]);
  const [tab, setTab] = useState<"open" | "applied" | "past">("open");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<A | P | null>(null);
  const [qrActivity, setQrActivity] = useState<A | null>(null);
  const load = async () => {
    if (!user?.studentId) return;
    setLoading(true);
    try {
      const r = await fetch("/api/activities/workflow", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "โหลดกิจกรรมไม่สำเร็จ");
      setA(Array.isArray(d) ? d : []);
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [user?.studentId]);
  useEffect(() => {
    if (tab === "past" && user?.studentId)
      fetch(`/api/students/${user.studentId}/participations`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((d) => setP(d.participations || []))
        .catch(() => setP([]));
  }, [tab, user?.studentId]);
  const downloadQr = async (activity: A) => {
    if (!activity.qrPayload) return;

    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=24&data=${encodeURIComponent(activity.qrPayload)}`;
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error("ดาวน์โหลด QR ไม่สำเร็จ");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${activity.title.replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("ไม่สามารถดาวน์โหลด QR ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const apply = async (x: A) => {
    const r = await fetch(`/api/activities/${x.activityId}/register`, {
      method: "POST",
    });
    const d = await r.json();
    if (!r.ok) return alert(d?.error || d?.message);
    await load();
    setTab("applied");
  };
  const list = useMemo(
    () =>
      a
        .filter((x) =>
          tab === "open"
            ? !x.participationStatus &&
              x.applicationEnabled
            : ["applied", "registered", "confirmed"].includes(
                x.participationStatus || "",
              ),
        )
        .filter((x) => x.title.toLowerCase().includes(q.toLowerCase())),
    [a, tab, q],
  );
  const past = p.filter((x) =>
    x.activityName.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <StudentShell activePath="/student/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                {tab === "open"
                  ? "กิจกรรมที่เปิดรับนิสิต"
                  : tab === "applied"
                    ? "กิจกรรมที่สมัคร"
                    : "กิจกรรมที่เคยเข้าร่วม"}
              </h1>
              <div className="mt-2 h-0.5 w-24 bg-[#FFC107]" />
              <p className="mt-3 text-sm text-slate-500">
                {tab === "open"
                  ? "กิจกรรมที่เจ้าหน้าที่เปิดรับสมัครนิสิต"
                  : tab === "applied"
                    ? "สมัครแล้ว → รอลงทะเบียน → รอยืนยันการเข้าร่วม"
                    : "ยืนยันการเข้าร่วมและทำแบบประเมินเสร็จแล้ว"}
              </p>
            </div>
            <label className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหากิจกรรม"
                className="h-11 w-full rounded-xl border border-blue-100 pl-10 text-sm outline-none focus:border-[#1565C0]"
              />
            </label>
          </div>
          <div className="mt-6 flex gap-6 border-b border-blue-50">
            <button
              onClick={() => setTab("open")}
              className="pb-3 text-sm font-semibold text-[#1565C0]"
            >
              กิจกรรมที่เปิดรับ
            </button>
            <button
              onClick={() => setTab("applied")}
              className="pb-3 text-sm font-semibold text-[#1565C0]"
            >
              กิจกรรมที่สมัคร
            </button>
            <button
              onClick={() => setTab("past")}
              className="pb-3 text-sm font-semibold text-[#1565C0]"
            >
              กิจกรรมที่เคยเข้าร่วม
            </button>
          </div>
          <div className="mt-6">
            {loading && tab !== "past" ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
              </div>
            ) : tab !== "past" && list.length === 0 ? (
              <p className="py-12 text-center text-slate-400">ไม่มีรายการ</p>
            ) : tab === "past" && past.length === 0 ? (
              <p className="py-12 text-center text-slate-400">
                ยังไม่มีกิจกรรม
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(tab === "past" ? past : list).map((x: any) => {
                  const isP = tab === "past";
                  const aa: A = isP
                    ? {
                        activityId: x.activityId,
                        title: x.activityName,
                        description: x.description,
                        date: x.date,
                        time: x.time,
                        endTime: x.endTime,
                        location: x.location,
                        organizer: x.organizer,
                        status: "past",
                        hasEvaluation: true,
                        applicationEnabled: false,
                        registrationEnabled: false,
                        confirmationEnabled: false,
                        participationStatus: "completed",
                        qrPayload: null,
                      }
                    : x;
                  return (
                    <Card
                      key={aa.activityId}
                      a={aa}
                      tab={tab}
                      onApply={() => apply(aa)}
                      onShowQr={() => setQrActivity(aa)}
                      onEvaluate={() => router.push(`/student/evaluate/${aa.activityId}`)}
                      onCertificate={() => router.push(`/student/certificate/${aa.activityId}`)}
                      onDetail={() => setDetail(isP ? x : aa)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setDetail(null)}
              className="absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="pr-8 text-xl font-semibold">
              {"activityName" in detail ? detail.activityName : detail.title}
            </h2>
            <p className="mt-4 text-sm text-slate-500">
              {date(detail.date)} • {time(detail.time)}
              {detail.endTime ? ` - ${time(detail.endTime)}` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              สถานที่: {detail.location || "-"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              ผู้จัด: {detail.organizer || "-"}
            </p>
            <button
              onClick={() => setDetail(null)}
              className="mt-6 rounded-lg bg-[#1565C0] px-5 py-2 text-sm font-semibold text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
      {qrActivity && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">QR สำหรับลงทะเบียนกิจกรรม</h2>
                <p className="mt-1 text-sm font-medium text-slate-700">{qrActivity.title}</p>
              </div>
              <button onClick={() => setQrActivity(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              นำ QR นี้ให้เจ้าหน้าที่สแกนที่หน้างาน นิสิตแต่ละคนจะได้รับ QR ไม่ซ้ำกัน
            </p>
            <div className="mt-5 flex justify-center rounded-2xl border border-blue-100 bg-slate-50 p-4">
              {qrActivity.qrPayload ? (
                <img
                  alt="QR ลงทะเบียนกิจกรรม"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(qrActivity.qrPayload)}`}
                  className="h-60 w-60 rounded-xl bg-white"
                />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center rounded-xl bg-white text-center text-sm text-slate-400">
                  ไม่พบข้อมูล QR กรุณาลองโหลดหน้าใหม่
                </div>
              )}
            </div>
            {qrActivity.qrPayload && (
              <textarea
                value={qrActivity.qrPayload}
                readOnly
                className="mt-4 h-20 w-full resize-none rounded-xl border border-blue-100 bg-white p-3 text-xs text-slate-500"
              />
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setQrActivity(null)}
                className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ปิด
              </button>
              <button
                onClick={() => void downloadQr(qrActivity)}
                disabled={!qrActivity.qrPayload}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1565C0] text-sm font-semibold text-white transition hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลด QR
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
