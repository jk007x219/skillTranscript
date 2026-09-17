"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ClipboardCheck, Eye, Loader2 } from "lucide-react";

type Activity = {
  id: string;
  title: string;
  applicationEnabled: boolean;
  registrationEnabled: boolean;
  confirmationEnabled: boolean;
  hasEvaluation: boolean;
};

type PortalTarget = {
  activity: Activity;
  element: HTMLElement;
};

function Switch({
  enabled,
  disabled,
  onClick,
}: {
  enabled: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-[#1565C0]" : "bg-slate-200"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function WorkflowStep({
  number,
  icon,
  title,
  description,
  enabled,
  disabled,
  busy,
  onToggle,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  busy?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        enabled
          ? "border-blue-100 bg-blue-50/55"
          : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          enabled ? "bg-[#1565C0] text-white" : "bg-white text-slate-400"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            ขั้นที่ {number}
          </span>
          {enabled && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </div>
        <p className="truncate text-xs font-semibold text-slate-800">{title}</p>
        <p className="truncate text-[10px] text-slate-500">{description}</p>
      </div>
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1565C0]" />
      ) : (
        <Switch
          enabled={enabled}
          disabled={disabled}
          onClick={onToggle}
        />
      )}
    </div>
  );
}

function InlineWorkflow({ activity }: { activity: Activity }) {
  const [current, setCurrent] = useState(activity);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(activity);
  }, [activity]);

  const toggle = async (
    field: "applicationEnabled" | "registrationEnabled" | "confirmationEnabled",
  ) => {
    setBusy(field);
    try {
      const response = await fetch("/api/activities/workflow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: current.id,
          field,
          value: !current[field],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "อัปเดตไม่สำเร็จ");
      }
      setCurrent((prev) => ({ ...prev, ...data }));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 lg:col-span-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-800">ลำดับการเปิดใช้งาน</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            เปิดทีละขั้นตามลำดับ เพื่อให้นิสิตไม่สามารถข้ามขั้นตอนได้
          </p>
        </div>
        <span className="hidden rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500 sm:inline-flex">
          1 สมัคร → 2 ลงทะเบียน → 3 ยืนยัน
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <WorkflowStep
          number={1}
          icon={<Eye className="h-4 w-4" />}
          title="มองเห็นการสมัคร"
          description="นิสิตมองเห็นและสมัครกิจกรรมได้"
          enabled={current.applicationEnabled}
          busy={busy === "applicationEnabled"}
          onToggle={() => toggle("applicationEnabled")}
        />
        <WorkflowStep
          number={2}
          icon={<ClipboardCheck className="h-4 w-4" />}
          title="เปิดการลงทะเบียน"
          description={
            current.applicationEnabled
              ? "ผู้ที่สมัครแล้วจึงลงทะเบียนได้"
              : "ต้องเปิดขั้นที่ 1 ก่อน"
          }
          enabled={current.registrationEnabled}
          disabled={!current.applicationEnabled || busy !== null}
          busy={busy === "registrationEnabled"}
          onToggle={() => toggle("registrationEnabled")}
        />
        <WorkflowStep
          number={3}
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="เปิดยืนยันการเข้าร่วม"
          description={
            !current.registrationEnabled
              ? "ต้องเปิดขั้นที่ 2 ก่อน"
              : !current.hasEvaluation
                ? "ต้องสร้างแบบประเมินก่อน"
                : "นิสิตยืนยันด้วยรหัสกิจกรรม"
          }
          enabled={current.confirmationEnabled}
          disabled={
            !current.registrationEnabled ||
            !current.hasEvaluation ||
            busy !== null
          }
          busy={busy === "confirmationEnabled"}
          onToggle={() => toggle("confirmationEnabled")}
        />
      </div>
    </div>
  );
}

export default function ActivityWorkflowPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targets, setTargets] = useState<PortalTarget[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/activities/workflow", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!cancelled) {
          setActivities(
            (Array.isArray(data) ? data : []).filter(
              (item) => item.status === "active",
            ),
          );
        }
      } catch {
        if (!cancelled) setActivities([]);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activityMap = useMemo(
    () => new Map(activities.map((activity) => [activity.title.trim(), activity])),
    [activities],
  );

  useEffect(() => {
    const syncTargets = () => {
      const articles = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".staff-legacy-activity-page article.grid",
        ),
      );
      const next: PortalTarget[] = [];

      for (const article of articles) {
        const title = article.querySelector("h2")?.textContent?.trim();
        if (!title) continue;
        const activity = activityMap.get(title);
        if (!activity) continue;

        let mount = article.querySelector<HTMLElement>(
          ":scope > .activity-workflow-mount",
        );
        if (!mount) {
          mount = document.createElement("div");
          mount.className = "activity-workflow-mount";
          article.appendChild(mount);
        }
        next.push({ activity, element: mount });
      }

      setTargets(next);
    };

    syncTargets();
    const observer = new MutationObserver(syncTargets);
    observer.observe(document.querySelector(".staff-legacy-activity-page") || document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [activityMap]);

  return (
    <>
      {targets.map(({ activity, element }) =>
        createPortal(
          <InlineWorkflow key={activity.id} activity={activity} />,
          element,
          activity.id,
        ),
      )}
    </>
  );
}
