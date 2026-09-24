"use client";
// ปรับให้ responsive สำหรับมือถือ + แก้บั๊กเล็กน้อย (แท็บไม่มีสถานะ active, ปุ่ม QR มีเครื่องหมายคำพูดเกิน)
import { apiPath } from "@/lib/api-path";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileBadge,
  Loader2,
  MapPin,
  QrCode,
  Search,
  Download,
  X,
  Clock3,
  Users,
  Sparkles,
  BookOpenCheck,
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
  hours?: number | null;
  term?: string | null;
  isExternal?: boolean;
  attendeeCount?: number;
  capacity?: number;
  applicantCount?: number;
  isFull?: boolean;
  skills?: Array<{ skillId?: string | null; name: string; level: string }>;
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
  endDate?: string | null;
  hours?: number | null;
  term?: string | null;
  joinDate?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  skillScores?: Array<{ name: string; earnedScore: number; maxScore: number }>;
};
const date = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";
const time = (v?: string | null) => {
  if (!v) return "-";
  const value = String(v);
  const match = value.match(/(?:T|\s)(\d{2}:\d{2})/);
  return match?.[1] ?? value.match(/\d{2}:\d{2}/)?.[0] ?? "-";
};

// ---------- ป้ายสถานะการเข้าร่วม ----------
function StatusPill({ status }: { status?: string | null }) {
  const label =
    status === "applied"
      ? "สมัครแล้ว"
      : status === "registered"
        ? "ลงทะเบียนแล้ว"
        : status === "confirmed"
          ? "สแกนแล้ว"
          : status === "completed"
            ? "สำเร็จแล้ว"
            : "เปิดรับสมัคร";
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#2455A4]">
      {label}
    </span>
  );
}

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
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-950">
          {a.title}
        </p>
        <StatusPill status={s} />
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <p className="flex gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>
            {date(a.date)}
            {a.endDate && a.endDate !== a.date ? ` - ${date(a.endDate)}` : ""}
          </span>
        </p>
        <p className="flex gap-2">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>
            {time(a.time)}
            {a.endTime ? ` - ${time(a.endTime)}` : ""}
          </span>
        </p>
        <p className="flex gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span>
            <span className="block">
              ช่วงลงทะเบียน {a.registrationStart ? date(a.registrationStart) : "-"}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-400">
              เวลา {a.registrationStart ? time(a.registrationStart) : "-"}
              {a.registrationEnd ? ` - ${time(a.registrationEnd)}` : ""}
            </span>
          </span>
        </p>
        <p className="flex gap-2">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            รับ {a.capacity || 0} คน
            {a.capacity ? ` • สมัครแล้ว ${a.applicantCount || 0}/${a.capacity} คน` : ""}
          </span>
        </p>
        <p className="flex gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{a.location || "-"}</span>
        </p>
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        {tab === "past" ? (
          a.isExternal ? (
            <button
              type="button"
              disabled
              className="h-11 flex-1 cursor-not-allowed rounded-xl bg-slate-100 text-sm font-semibold text-slate-400"
              aria-disabled="true"
            >
              ไม่มีใบรับรองทักษะ
            </button>
          ) : (
            <button
              onClick={onCertificate}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80]"
            >
              <FileBadge className="h-4 w-4" />
              ดูใบรับรอง
            </button>
          )
        ) : s === "applied" ? (
          <button
            type="button"
            onClick={tab === "applied" ? onShowQr : undefined}
            disabled={tab !== "applied"}
            className={
              tab === "applied"
                ? "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80]"
                : "h-11 flex-1 cursor-not-allowed rounded-xl bg-slate-400 text-sm font-bold text-white"
            }
            aria-label={tab === "applied" ? "แสดง QR สำหรับลงทะเบียนกิจกรรม" : "สมัครแล้ว"}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {tab === "applied" ? (
                <QrCode className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {tab === "applied" ? "แสดง QR โค้ด" : "สมัครแล้ว"}
            </span>
          </button>
        ) : s === "registered" ? (
          <button
            type="button"
            disabled
            className="h-11 flex-1 cursor-not-allowed rounded-xl bg-slate-400 text-sm font-bold text-white"
            aria-disabled="true"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              ลงทะเบียนแล้ว
            </span>
          </button>
        ) : s === "confirmed" ? (
          <button
            onClick={onEvaluate}
            disabled={!a.confirmationEnabled}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#2455A4] text-sm font-semibold text-[#2455A4] transition hover:bg-blue-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <QrCode className="h-4 w-4" />
            {a.confirmationEnabled
              ? "ทำแบบประเมิน"
              : "รอเจ้าหน้าที่เปิดแบบประเมิน"}
          </button>
        ) : s ? (
          <button
            type="button"
            disabled
            className="h-11 flex-1 cursor-not-allowed rounded-xl bg-slate-400 text-sm font-bold text-white"
            aria-disabled="true"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              สมัครแล้ว
            </span>
          </button>
        ) : (
          <button
            onClick={onApply}
            disabled={Boolean(a.isFull)}
            className={
              a.isFull
                ? "h-11 flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-400"
                : "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80]"
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            {a.isFull ? "เต็มแล้ว" : "สมัครกิจกรรม"}
          </button>
        )}
        <button
          onClick={onDetail}
          aria-label="ดูรายละเอียดกิจกรรม"
          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#2455A4] hover:text-[#2455A4]"
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
      const r = await fetch(apiPath("/api/activities/workflow"), { cache: "no-store" });
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
      fetch(apiPath(`/api/students/${user.studentId}/participations`), {
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
    const r = await fetch(apiPath(`/api/activities/${x.activityId}/register`), {
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
        .filter((x) => {
          const participationStatus = x.participationStatus || "";
          const appliedByStudent = ["applied", "registered"].includes(
            participationStatus,
          );

          if (tab === "open") {
            // เปิดรับ = กำลังเปิดรับและยังไม่สมัคร
            // หรือ = นิสิตสมัครไว้แล้ว (ปุ่มต้องเป็นสีเทาและกดไม่ได้)
            return (
              (!participationStatus && x.applicationEnabled) ||
              appliedByStudent
            );
          }

          // แท็บกิจกรรมที่สมัคร แสดงทุกสถานะก่อนถึงการยืนยันเสร็จสิ้น
          return ["applied", "registered", "confirmed"].includes(
            participationStatus,
          );
        })
        .filter((x) =>
          x.title.toLowerCase().includes(q.toLowerCase()),
        ),
    [a, tab, q],
  );
  const past = p.filter((x) =>
    x.activityName.toLowerCase().includes(q.toLowerCase()),
  );

  const tabs: Array<{ key: typeof tab; label: string; shortLabel: string }> = [
    { key: "open", label: "กิจกรรมที่เปิดรับ", shortLabel: "เปิดรับ" },
    { key: "applied", label: "กิจกรรมที่สมัคร", shortLabel: "สมัครแล้ว" },
    { key: "past", label: "กิจกรรมที่เคยเข้าร่วม", shortLabel: "เคยเข้าร่วม" },
  ];

  return (
    <StudentShell activePath="/student/activities">
      <section className="bg-[#F5F6F8] p-3 sm:p-6 lg:p-7">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
            {/* หัวเรื่อง + ค้นหา */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl lg:text-[28px]">
                  {tab === "open"
                    ? "กิจกรรมที่เปิดรับนิสิต"
                    : tab === "applied"
                      ? "กิจกรรมที่สมัคร"
                      : "กิจกรรมที่เคยเข้าร่วม"}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  {tab === "open"
                    ? "กิจกรรมที่เจ้าหน้าที่เปิดรับสมัครนิสิต"
                    : tab === "applied"
                      ? "สมัครแล้ว → รอลงทะเบียน → รอยืนยันการเข้าร่วม"
                      : "ยืนยันการเข้าร่วมและทำแบบประเมินเสร็จแล้ว"}
                </p>
              </div>
              <label className="relative w-full lg:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ค้นหากิจกรรม"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2455A4] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {/* แท็บ: เลื่อนแนวนอนได้บนมือถือ พร้อมแสดงสถานะ active ชัดเจน */}
            <div className="-mx-1 mt-6 flex gap-4 overflow-x-auto border-b border-slate-100 px-1 sm:gap-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => {
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition ${
                      isActive
                        ? "border-[#2455A4] text-[#2455A4]"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span className="sm:hidden">{t.shortLabel}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {loading && tab !== "past" ? (
                <div className="flex justify-center py-14">
                  <Loader2 className="h-7 w-7 animate-spin text-[#2455A4]" />
                </div>
              ) : tab !== "past" && list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
                  ไม่มีรายการ
                </p>
              ) : tab === "past" && past.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
                  ยังไม่มีกิจกรรม
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                          isExternal: x.term === "ภายนอก",
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
        </div>
      </section>

      {/* โมดัลรายละเอียดกิจกรรม */}
      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-3 sm:px-4">
          <div className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <button
              onClick={() => setDetail(null)}
              aria-label="ปิดหน้าต่าง"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            {(() => {
              const isParticipation = "activityName" in detail;
              const title = isParticipation ? detail.activityName : detail.title;
              const skills = isParticipation ? [] : detail.skills || [];
              const skillScores = isParticipation ? detail.skillScores || [] : [];
              const duration = detail.hours ?? null;
              return (
                <>
                  <div className="border-b border-slate-100 pb-4 pr-10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2455A4]">
                      <BookOpenCheck className="h-4 w-4" /> รายละเอียดกิจกรรม
                    </div>
                    <h2 className="mt-2 text-lg font-semibold leading-7 text-slate-950 sm:text-xl">
                      {title}
                    </h2>
                    {"description" in detail && detail.description ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {detail.description}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">
                        ไม่มีรายละเอียดเพิ่มเติม
                      </p>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CalendarDays className="h-4 w-4" /> วันจัดกิจกรรม
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {date(detail.date)}
                        {detail.endDate && detail.endDate !== detail.date
                          ? ` - ${date(detail.endDate)}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock3 className="h-4 w-4" /> เวลา
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {time(detail.time)}
                        {detail.endTime ? ` - ${time(detail.endTime)}` : ""}
                        {duration ? ` • ${duration} ชม.` : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CalendarClock className="h-4 w-4" /> ช่วงลงทะเบียน
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {detail.registrationStart ? `${date(detail.registrationStart)}` : "-"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {detail.registrationStart ? time(detail.registrationStart) : "-"}
                        {detail.registrationEnd ? ` - ${time(detail.registrationEnd)}` : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <MapPin className="h-4 w-4" /> สถานที่
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {detail.location || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Users className="h-4 w-4" /> ผู้จัดกิจกรรม
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {detail.organizer || "-"}
                      </p>
                    </div>
                  </div>

                  {(("term" in detail && detail.term) ||
                  ("attendeeCount" in detail && detail.attendeeCount != null)) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {"term" in detail && detail.term ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2455A4]">
                          ภาคเรียน {detail.term}
                        </span>
                      ) : null}
                      {"attendeeCount" in detail && detail.attendeeCount != null ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          ผู้เข้าร่วม {detail.attendeeCount} คน
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {!isParticipation && (
                    <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Sparkles className="h-4 w-4 text-amber-500" /> ทักษะที่ได้รับจากกิจกรรม
                      </div>
                      {skills.length > 0 ? (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {skills.map((skill) => (
                            <div
                              key={`${skill.skillId || skill.name}-${skill.level}`}
                              className="rounded-xl border border-white bg-white p-3 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                ระดับ {skill.level}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          กิจกรรมนี้ยังไม่ได้ระบุทักษะที่ได้รับ
                        </p>
                      )}
                    </div>
                  )}

                  {isParticipation && (
                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Sparkles className="h-4 w-4 text-emerald-600" /> ทักษะที่ได้รับและผลการประเมิน
                      </div>
                      {skillScores.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {skillScores.map((skill) => {
                            const percent =
                              skill.maxScore > 0
                                ? Math.min(100, Math.round((skill.earnedScore / skill.maxScore) * 100))
                                : 0;
                            return (
                              <div key={skill.name} className="rounded-xl border border-white bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                                  <span className="text-xs font-semibold text-slate-500">
                                    {skill.earnedScore}/{skill.maxScore}
                                  </span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          ยังไม่มีคะแนนแยกตามทักษะสำหรับกิจกรรมนี้
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setDetail(null)}
                      className="h-11 w-full rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80] sm:w-auto sm:px-5"
                    >
                      ปิด
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* โมดัล QR ลงทะเบียน */}
      {qrActivity && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-3 sm:px-4">
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold sm:text-xl">QR สำหรับลงทะเบียนกิจกรรม</h2>
                <p className="mt-1 truncate text-sm font-medium text-slate-700">
                  {qrActivity.title}
                </p>
              </div>
              <button
                onClick={() => setQrActivity(null)}
                aria-label="ปิดหน้าต่าง"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              นำ QR นี้ให้เจ้าหน้าที่สแกนที่หน้างาน นิสิตแต่ละคนจะได้รับ QR ไม่ซ้ำกัน
            </p>
            <div className="mt-5 flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {qrActivity.qrPayload ? (
                <img
                  alt="QR ลงทะเบียนกิจกรรม"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(qrActivity.qrPayload)}`}
                  className="h-52 w-52 rounded-xl bg-white sm:h-60 sm:w-60"
                />
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-white text-center text-sm text-slate-400 sm:h-60 sm:w-60">
                  ไม่พบข้อมูล QR กรุณาลองโหลดหน้าใหม่
                </div>
              )}
            </div>
            {qrActivity.qrPayload && (
              <textarea
                value={user?.studentId || ""}
                readOnly
                className="mt-4 h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
