"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  KeyRound,
  Loader2,
  MapPin,
  Search,
  Tag,
  X,
} from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type Skill = { name: string; level: string };

type Activity = {
  id: string;
  title: string;
  description?: string;
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
  registrationOpen?: boolean;
  registrationEnabled?: boolean;
  hasEvaluation: boolean;
  participationStatus?: "registered" | "confirmed" | "completed" | string | null;
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
  score: number | null;
  status: string;
  skillScores?: { name: string; earnedScore: number; maxScore: number }[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const raw = String(value).slice(0, 5);
  const date = new Date(`2000-01-01T${raw}`);
  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function DetailModal({ activity, onClose }: { activity: Activity | PastActivity | null; onClose: () => void }) {
  if (!activity) return null;
  const isPast = "activityName" in activity;
  const title = isPast ? activity.activityName : activity.title;
  const skills = isPast ? [] : activity.skills;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="ปิด">
          <X className="h-5 w-5" />
        </button>
        <h2 className="pr-10 text-2xl font-semibold text-slate-950">{title}</h2>
        <div className="mt-2 h-0.5 w-20 bg-[#FFC107]" />
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          {activity.description && <div><p className="font-medium text-slate-800">คำอธิบาย</p><p className="mt-1">{activity.description}</p></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><p className="font-medium text-slate-800">วันที่</p><p className="mt-1">{formatDate(activity.date)}</p></div>
            <div><p className="font-medium text-slate-800">เวลา</p><p className="mt-1">{formatTime(activity.time)}{activity.endTime ? ` - ${formatTime(activity.endTime)}` : ""}</p></div>
          </div>
          <div><p className="font-medium text-slate-800">สถานที่</p><p className="mt-1">{activity.location || "-"}</p></div>
          <div><p className="font-medium text-slate-800">ผู้จัด</p><p className="mt-1">{activity.organizer || "-"}</p></div>
          {skills.length > 0 && <div><p className="font-medium text-slate-800">ทักษะที่เกี่ยวข้อง</p><div className="mt-2 flex flex-wrap gap-2">{skills.map((s, i) => <span key={`${s.name}-${i}`} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs">{s.name} : {s.level}</span>)}</div></div>}
          {isPast && activity.skillScores && activity.skillScores.length > 0 && <div><p className="font-medium text-slate-800">คะแนนรายทักษะ</p><div className="mt-2 space-y-2">{activity.skillScores.map((s) => <div key={s.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"><span>{s.name}</span><b>{s.earnedScore}/{s.maxScore}</b></div>)}</div></div>}
        </div>
        <div className="mt-6 flex justify-end"><button onClick={onClose} className="rounded-lg bg-[#1565C0] px-6 py-2 text-sm font-semibold text-white">ปิด</button></div>
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  mode,
  onRegister,
  onConfirm,
  onDetail,
}: {
  activity: Activity;
  mode: "open" | "registered";
  onRegister: (activity: Activity) => void;
  onConfirm: (activity: Activity) => void;
  onDetail: (activity: Activity) => void;
}) {
  const registered = activity.participationStatus === "registered";
  const confirmed = activity.participationStatus === "confirmed";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-slate-950">{activity.title}</p>
          {activity.skills?.length > 0 && <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#1565C0]"><Tag className="h-3.5 w-3.5" />{activity.skills[0].name}{activity.skills.length > 1 ? ` +${activity.skills.length - 1}` : ""}</span>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${mode === "open" ? "bg-emerald-50 text-emerald-700" : confirmed ? "bg-green-50 text-green-700" : "bg-blue-50 text-[#1565C0]"}`}>
          {mode === "open" ? "เปิดรับสมัคร" : confirmed ? "ยืนยันแล้ว" : "สมัครแล้ว"}
        </span>
      </div>
      <div className="space-y-2 text-xs text-slate-500">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(activity.date)}</p>
        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{formatTime(activity.time)}</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span className="line-clamp-1">{activity.location || "-"}</span></p>
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        {mode === "open" ? (
          <button onClick={() => onRegister(activity)} disabled={!activity.registrationOpen} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            <CheckCircle2 className="h-4 w-4" />สมัครกิจกรรม
          </button>
        ) : confirmed ? (
          <button disabled className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-500">
            <CheckCircle2 className="h-4 w-4" />ยืนยันแล้ว รอทำแบบประเมิน
          </button>
        ) : activity.confirmationEnabled ? (
          <button onClick={() => onConfirm(activity)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#1565C0] bg-white px-4 text-sm font-semibold text-[#1565C0] hover:bg-[#1565C0] hover:text-white">
            <KeyRound className="h-4 w-4" />ยืนยันการเข้าร่วม
          </button>
        ) : (
          <button disabled className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400">รอผู้จัดเปิดยืนยัน</button>
        )}
        <button onClick={() => onDetail(activity)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 text-slate-500 hover:text-[#1565C0]" aria-label="ดูรายละเอียด"><Eye className="h-4 w-4" /></button>
      </div>
      {mode === "registered" && registered && !activity.confirmationEnabled && <p className="mt-2 text-center text-[11px] text-slate-400">เมื่อผู้จัดเปิดการยืนยัน จะสามารถยืนยันด้วยรหัสกิจกรรมได้</p>}
    </article>
  );
}

function PastCard({ activity, onDetail }: { activity: PastActivity; onDetail: (a: PastActivity) => void }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
      <div className="mb-4 flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-semibold text-slate-950">{activity.activityName}</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">เสร็จสิ้น</span></div>
      <div className="space-y-2 text-xs text-slate-500"><p className="flex gap-2"><CalendarDays className="h-4 w-4" />{formatDate(activity.date)}</p><p className="flex gap-2"><Clock3 className="h-4 w-4" />{formatTime(activity.time)}</p><p className="flex gap-2"><MapPin className="h-4 w-4" />{activity.location || "-"}</p><p className="flex gap-2 font-medium text-[#1565C0]"><CheckCircle2 className="h-4 w-4" />ทำแบบประเมินเสร็จแล้ว{activity.score != null ? ` • คะแนน ${activity.score}` : ""}</p></div>
      <div className="mt-auto flex gap-2 pt-5"><button onClick={() => onDetail(activity)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#1565C0] text-sm font-semibold text-[#1565C0]"><Eye className="h-4 w-4" />ดูรายละเอียด</button><button onClick={() => window.location.href = `/student/certificate/${activity.activityId}`} className="h-11 rounded-xl bg-[#1565C0] px-4 text-sm font-semibold text-white">ใบรับรอง</button></div>
    </article>
  );
}

export default function StudentActivitiesWorkflowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [past, setPast] = useState<PastActivity[]>([]);
  const [tab, setTab] = useState<"open" | "registered" | "past">("open");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Activity | PastActivity | null>(null);
  const [confirmActivity, setConfirmActivity] = useState<Activity | null>(null);
  const [code, setCode] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const loadActivities = async () => {
    if (!user?.studentId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/activities?visible=true&studentId=${encodeURIComponent(user.studentId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "ไม่สามารถโหลดกิจกรรมได้");
      setActivities(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const loadPast = async () => {
    if (!user?.studentId) return;
    try {
      setLoadingPast(true);
      const res = await fetch(`/api/students/${user.studentId}/participations`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "ไม่สามารถโหลดกิจกรรมที่เคยเข้าร่วมได้");
      setPast(Array.isArray(data.participations) ? data.participations : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoadingPast(false);
    }
  };

  useEffect(() => { void loadActivities(); }, [user?.studentId]);
  useEffect(() => { if (tab === "past") void loadPast(); }, [tab, user?.studentId]);

  const openActivities = useMemo(() => activities.filter((a) => !a.participationStatus && a.registrationOpen), [activities]);
  const registeredActivities = useMemo(() => activities.filter((a) => a.participationStatus === "registered" || a.participationStatus === "confirmed"), [activities]);
  const searchFilter = (a: Activity) => a.title.toLowerCase().includes(search.toLowerCase());
  const filteredOpen = openActivities.filter(searchFilter);
  const filteredRegistered = registeredActivities.filter(searchFilter);
  const filteredPast = past.filter((a) => a.activityName.toLowerCase().includes(search.toLowerCase()));

  const register = async (activity: Activity) => {
    try {
      const res = await fetch(`/api/activities/${activity.id}/register`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "สมัครกิจกรรมไม่สำเร็จ");
      await loadActivities();
      setTab("registered");
    } catch (e) { alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); }
  };

  const confirmAttendance = async () => {
    if (!confirmActivity || code.length !== 6) return;
    try {
      setConfirming(true);
      setConfirmError("");
      const res = await fetch(`/api/activities/${confirmActivity.id}/verify-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "รหัสยืนยันไม่ถูกต้อง");
      setConfirmActivity(null);
      setCode("");
      await loadActivities();
      router.push(`/student/evaluate/${confirmActivity.id}`);
    } catch (e) { setConfirmError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); } finally { setConfirming(false); }
  };

  const title = tab === "open" ? "กิจกรรมที่เปิดรับ" : tab === "registered" ? "กิจกรรมที่สมัคร" : "กิจกรรมที่เคยเข้าร่วม";
  const description = tab === "open" ? "แสดงเฉพาะกิจกรรมที่เจ้าหน้าที่เปิดรับสมัครอยู่ สามารถสมัครกิจกรรมได้จากรายการนี้" : tab === "registered" ? "แสดงเฉพาะกิจกรรมที่คุณสมัครแล้ว จากนั้นจึงยืนยันการเข้าร่วมเมื่อผู้จัดเปิดระบบ" : "แสดงเฉพาะกิจกรรมที่ยืนยันการเข้าร่วมและทำแบบประเมินเสร็จสมบูรณ์แล้ว";

  return (
    <StudentShell activePath="/student/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1><div className="mt-2 h-0.5 w-24 bg-[#FFC107]" /><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>
            <label className="relative block w-full sm:w-[280px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหากิจกรรม" className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/50 pl-10 pr-3 text-sm outline-none focus:border-[#1565C0] focus:bg-white" /></label>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 border-b border-blue-50">
            {(["open", "registered", "past"] as const).map((key) => <button key={key} onClick={() => setTab(key)} className={`relative pb-3 text-sm font-semibold ${tab === key ? "text-[#1565C0]" : "text-slate-500"}`}>{key === "open" ? "กิจกรรมที่เปิดรับ" : key === "registered" ? "กิจกรรมที่สมัคร" : "กิจกรรมที่เคยเข้าร่วม"}{tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1565C0]" />}</button>)}
          </div>

          <div className="mt-6">
            {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {tab !== "past" && loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" /></div> : tab === "past" && loadingPast ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" /></div> : tab === "open" && filteredOpen.length === 0 ? <Empty text={search ? "ไม่พบกิจกรรมที่ค้นหา" : "ขณะนี้ไม่มีกิจกรรมที่เปิดรับสมัคร"} /> : tab === "registered" && filteredRegistered.length === 0 ? <Empty text={search ? "ไม่พบกิจกรรมที่ค้นหา" : "คุณยังไม่ได้สมัครกิจกรรม"} /> : tab === "past" && filteredPast.length === 0 ? <Empty text={search ? "ไม่พบกิจกรรมที่ค้นหา" : "ยังไม่มีกิจกรรมที่ยืนยันและทำแบบประเมินเสร็จแล้ว"} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tab === "past" ? filteredPast.map((a) => <PastCard key={a.participationId} activity={a} onDetail={setDetail} />) : (tab === "open" ? filteredOpen : filteredRegistered).map((a) => <ActivityCard key={a.id} activity={a} mode={tab} onRegister={register} onConfirm={setConfirmActivity} onDetail={setDetail} />)}</div>}
          </div>
        </div>
      </section>

      <DetailModal activity={detail} onClose={() => setDetail(null)} />

      {confirmActivity && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><button onClick={() => setConfirmActivity(null)} className="absolute right-4 top-4 text-slate-400"><X /></button><div className="pt-4 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1565C0]"><KeyRound /></div><h2 className="mt-4 text-xl font-semibold text-slate-950">ยืนยันการเข้าร่วมกิจกรรม</h2><p className="mt-2 text-sm text-slate-500">{confirmActivity.title}</p>{confirmError && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{confirmError}</div>}<input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="รหัส 6 หลัก" className="mt-6 h-12 w-full rounded-xl border border-blue-100 text-center text-lg tracking-[0.5em] outline-none focus:border-[#1565C0]" /><button disabled={code.length !== 6 || confirming} onClick={confirmAttendance} className="mt-4 h-12 w-full rounded-xl bg-[#1565C0] text-sm font-semibold text-white disabled:opacity-50">{confirming ? "กำลังยืนยัน..." : "ยืนยันการเข้าร่วม"}</button></div></div></div>}
    </StudentShell>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-blue-100 py-12 text-center text-slate-400"><CalendarDays className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-3 text-sm">{text}</p></div>;
}
