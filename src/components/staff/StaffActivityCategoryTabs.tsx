"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, DoorOpen, Eye, History, LockKeyhole } from "lucide-react";

type Activity = {
  id: string;
  title: string;
  date?: string | null;
  time?: string | null;
  status?: string;
  applicationEnabled?: boolean;
  registrationEnabled?: boolean;
  hasEvaluation?: boolean;
};

type Category = "pending" | "application" | "registration" | "closed" | "past";

const categories: Array<{ key: Category; label: string; icon: typeof Eye }> = [
  { key: "pending", label: "กิจกรรมที่กำลังดำเนิน", icon: ClipboardList },
  { key: "application", label: "กิจกรรมที่เปิดรับ", icon: Eye },
  { key: "registration", label: "กิจกรรมที่เปิดลงทะเบียน", icon: DoorOpen },
  { key: "closed", label: "กิจกรรมที่ปิดลงทะเบียน", icon: LockKeyhole },
  { key: "past", label: "กิจกรรมที่เคยจัด", icon: History },
];

function activityDateTime(activity: Activity) {
  if (!activity.date) return null;
  const date = String(activity.date).slice(0, 10);
  const time = String(activity.time || "00:00").slice(0, 5);
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function matches(activity: Activity, category: Category, now: Date) {
  const start = activityDateTime(activity);
  if (category === "past") return !!start && start < now;
  if (start && start < now) return false;

  if (category === "pending") return activity.hasEvaluation === false;
  if (category === "application") return activity.applicationEnabled === true && activity.registrationEnabled !== true;
  if (category === "registration") return activity.registrationEnabled === true;
  if (category === "closed") return activity.applicationEnabled === true && activity.registrationEnabled !== true;
  return false;
}

export default function StaffActivityCategoryTabs() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [active, setActive] = useState<Category>("pending");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/activities/workflow", { cache: "no-store" });
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      } catch {
        setActivities([]);
      }
    };
    void load();
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const result = {} as Record<Category, number>;
    for (const category of categories) result[category.key] = activities.filter((a) => matches(a, category.key, now)).length;
    return result;
  }, [activities, now]);

  useEffect(() => {
    const syncCards = () => {
      const articles = Array.from(document.querySelectorAll<HTMLElement>(".staff-legacy-activity-page article.grid"));
      const byTitle = new Map(activities.map((a) => [a.title.trim(), a]));
      for (const article of articles) {
        const title = article.querySelector("h2")?.textContent?.trim();
        const activity = title ? byTitle.get(title) : undefined;
        article.style.display = activity && matches(activity, active, now) ? "grid" : "none";
      }

      const legacyTabs = Array.from(document.querySelectorAll<HTMLElement>(".staff-legacy-activity-page button")).find((button) => button.textContent?.includes("กิจกรรมที่กำลังดำเนิน"));
      const legacyTabBar = legacyTabs?.parentElement;
      if (legacyTabBar) legacyTabBar.style.display = "none";
    };

    syncCards();
    const observer = new MutationObserver(syncCards);
    observer.observe(document.querySelector(".staff-legacy-activity-page") || document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activities, active, now]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-4">
      <div className="mb-3 px-1">
        <p className="text-sm font-bold text-slate-800">สถานะกิจกรรม</p>
        <p className="mt-0.5 text-xs text-slate-400">เลือกดูรายการตามสถานะและช่วงการเปิดใช้งาน</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map(({ key, label, icon: Icon }) => {
          const selected = active === key;
          return (
            <button key={key} type="button" onClick={() => setActive(key)} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${selected ? "border-blue-200 bg-blue-50 text-[#1565C0] shadow-sm" : "border-slate-100 bg-slate-50/60 text-slate-600 hover:border-blue-100 hover:bg-blue-50/40"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? "bg-white text-[#1565C0]" : "bg-white text-slate-400"}`}>{counts[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
