// components/staff/StaffActivitiesPage.tsx
// รีดีไซน์เลเอาท์ใหม่ทั้งหมด: การ์ดกิจกรรมแบบชั้นเดียว อ่านง่าย ลดความรก
// ตรรกะ/สถานะ/การเรียก API ทั้งหมดยังเหมือนเดิม มีการปรับเฉพาะโครงสร้าง UI

"use client";

import { apiPath } from "@/lib/api-path";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  CameraOff,
  ClipboardList,
  FileWarning,
  MapPin,
  Plus,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  Edit,
  QrCode,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

type JsQrResult = {
  data: string;
};

type JsQrFunction = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" },
) => JsQrResult | null;

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  successCallback: (stream: MediaStream) => void,
  errorCallback: (error: DOMException) => void,
) => void;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
    jsQR?: JsQrFunction;
  }

  interface Navigator {
    webkitGetUserMedia?: LegacyGetUserMedia;
    mozGetUserMedia?: LegacyGetUserMedia;
    msGetUserMedia?: LegacyGetUserMedia;
  }
}

type ActivityStatus = "active" | "past";
type ActivityDisplayStatus = "not_open" | "open" | "running" | "registration_closed" | "past";
type ActivityCategory = "all" | "mine" | "past" | "external";
type MineStatusFilter = "all" | "active" | "past";

type ActivitySkill = {
  skillId?: string;
  name: string;
  level: string;
};

type EvaluationQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  skillNames: string[];
};

type Template = {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  fileType: string;
  status: "active" | "inactive";
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StaffActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  hours?: number | null;
  term: string;
  location: string;
  organizer: string;
  attendeeCount: number;
  registeredCount: number;
  evaluationCompletedCount: number;
  capacity: number;
  hasConfirmedParticipants?: boolean;
  confirmationEnabled: boolean;
  registrationEnabled: boolean;
  applicationEnabled?: boolean;
  hasEvaluation: boolean;
  status: ActivityStatus;
  skills: ActivitySkill[];
  evaluation?: EvaluationQuestion[];
  verificationCode?: string | null;
  codeExpiresAt?: string | null;
  templateId?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  registrationOpen?: boolean;
  normalRegistrationOpen?: boolean;
  emergencyRegistrationOpen?: boolean;
  activityStarted?: boolean;
  createdBy?: string | null;
};

type ActivityForm = {
  activityCode: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  term: string;
  location: string;
  organizer: string;
  selectedSkills: { skillId: string; name: string; level: string }[];
  templateId?: string;
  registrationStart: string;
  registrationEnd: string;
  capacity: string;
};

type SkillOption = {
  skillId: string;
  skillname: string;
  level: string;
};

const LEVELS = ["พื้นฐาน", "กลาง", "สูง"];
const emptyForm: ActivityForm = {
  activityCode: "",
  title: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  term: "1",
  location: "",
  organizer: "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
  selectedSkills: [],
  templateId: "",
  registrationStart: "",
  registrationEnd: "",
  capacity: "30",
};

// ===== Helper functions (ตรรกะเดิมทั้งหมด ไม่เปลี่ยนแปลง) =====
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidEndDateTime(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
) {
  if (!startDate || !startTime || !endDate || !endTime) return true;
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  return end > start;
}

function calculateHoursMinutes(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
) {
  if (!startDate || !startTime || !endDate || !endTime)
    return { hours: 0, minutes: 0 };
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  if (end <= start) return { hours: 0, minutes: 0 };
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

function formatHoursMinutes(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return "";
  if (hours === 0) return `${minutes} นาที`;
  if (minutes === 0) return `${hours} ชั่วโมง`;
  return `${hours} ชั่วโมง ${minutes} นาที`;
}

function toDateTimeInputValue(date?: string | null, time?: string | null) {
  if (!date || !time) return "";
  return `${String(date).slice(0, 10)}T${String(time).slice(0, 5)}`;
}

function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  return "";
}

function toDateTimeLocalValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getActivityStartDateTime(activity: StaffActivity): Date | null {
  if (!activity.date) return null;
  const date = String(activity.date).slice(0, 10);
  const time = String(activity.time || "00:00").slice(0, 5);
  return new Date(`${date}T${time}`);
}

function formatThaiDate(value?: string | null, short = false): string {
  if (!value) return "ไม่ระบุ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุ";

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: short ? "short" : "long",
    day: "numeric",
  });
}

function formatThaiTime(value?: string | null): string {
  if (!value) return "ไม่ระบุ";

  const raw = String(value).trim();
  let text = "";

  // รองรับทั้งเวลา HH:mm / HH:mm:ss และวันที่เวลา ISO เช่น 2026-09-23T11:25:00.000Z
  if (/^\d{2}:\d{2}/.test(raw)) {
    text = raw.slice(0, 5);
  } else {
    const timeMatch = raw.match(/[T ](\d{2}:\d{2})/);
    text = timeMatch?.[1] || "";
  }

  if (!text) return "ไม่ระบุ";

  const date = new Date(`2000-01-01T${text}`);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุ";

  return (
    date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " น."
  );
}

function formatActivityDateRange(activity: StaffActivity): string {
  const startDate = formatThaiDate(activity.date);
  const endDate = activity.endDate ? formatThaiDate(activity.endDate) : startDate;

  if (startDate === "ไม่ระบุ") return "ไม่ระบุวันที่";
  if (endDate === startDate) return startDate;

  return `${startDate} - ${endDate}`;
}

function formatActivityTimeRange(activity: StaffActivity): string {
  const startTime = formatThaiTime(activity.time);
  const endTime = activity.endTime ? formatThaiTime(activity.endTime) : "";

  if (startTime === "ไม่ระบุ") return "ไม่ระบุเวลา";
  return endTime ? `${startTime} – ${endTime}` : startTime;
}

function formatRegistrationRange(activity: StaffActivity): string {
  const start = activity.registrationStart;
  const end = activity.registrationEnd;

  if (!start && !end) return "ไม่ระบุ";

  const startText = start
    ? `${formatThaiDate(start, true)} · ${formatThaiTime(start)}`
    : "ไม่ระบุ";

  const endText = end
    ? `${formatThaiDate(end, true)} · ${formatThaiTime(end)}`
    : "ไม่ระบุ";

  return `${startText} - ${endText}`;
}

function isExternalActivity(activity: StaffActivity) {
  return activity.location === "กิจกรรมภายนอก";
}

function isActivityPast(activity: StaffActivity, now: Date = new Date()) {
  const date = String(activity.endDate || activity.date || "").slice(0, 10);
  const time = String(activity.endTime || activity.time || "00:00").slice(0, 5);
  const activityEnd = new Date(`${date}T${time}`);
  return !Number.isNaN(activityEnd.getTime()) && activityEnd < now;
}
function getActivityDisplayStatus(activity: StaffActivity, now: Date = new Date()) {
  const past = activity.status === "past" || isActivityPast(activity, now);

  if (past) return {
    key: "past" as ActivityDisplayStatus,
    label: "สิ้นสุดกิจกรรม",
    description: "กิจกรรมสิ้นสุดแล้ว",
    badgeClass: "border border-slate-300 bg-slate-100 text-slate-600",
    dotClass: "bg-slate-500",
  };

  // สวิตช์ของเจ้าหน้าที่เป็นตัวกำหนดสถานะหลัก
  // เปิดรับสมัคร = แสดง "เปิดรับสมัครอยู่"
  // ปิดรับสมัคร + เปิดลงทะเบียน = แสดง "เปิดลงทะเบียนอยู่"
  // ปิดทั้งสอง = แสดง "ปิดรับสมัครแล้ว"
  // วันที่มีไว้กำหนดสถานะ "สิ้นสุดกิจกรรม" เท่านั้น
  if (activity.applicationEnabled) return {
    key: "open" as ActivityDisplayStatus,
    label: "เปิดรับสมัครอยู่",
    description: "เจ้าหน้าที่เปิดสวิตช์รับสมัครอยู่",
    badgeClass: "border border-sky-200 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-500",
  };

  if (activity.registrationEnabled) return {
    key: "open" as ActivityDisplayStatus,
    label: "เปิดลงทะเบียนอยู่",
    description: "เจ้าหน้าที่เปิดสวิตช์ลงทะเบียนอยู่",
    badgeClass: "border border-blue-200 bg-blue-100 text-blue-700",
    dotClass: "bg-blue-600",
  };

  return {
    key: "registration_closed" as ActivityDisplayStatus,
    label: "ปิดรับสมัครแล้ว",
    description: "เจ้าหน้าที่ปิดสวิตช์รับสมัครและลงทะเบียนแล้ว",
    badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  };
}
// ---------- shared presentational building blocks ----------

// เชลล์กลางของโมดัลทั้งหมด ให้หน้าตาสม่ำเสมอ ลดโค้ดซ้ำ
function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = "max-w-lg",
  zIndexClass = "z-[70]",
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  zIndexClass?: string;
}) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm`}
    >
      <div
        className={`relative w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-8">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {title}
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-[#C8932A]" />
          {subtitle && (
            <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ActivityPill({ skill }: { skill: ActivitySkill }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#EEF2F8] px-3 py-1 text-xs font-medium text-[#2455A4]">
      {skill.name}
      <span className="mx-1.5 h-1 w-1 rounded-full bg-[#9FB4D6]" />
      {skill.level}
    </span>
  );
}

function ToggleSwitch({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  const Icon = enabled ? ToggleRight : ToggleLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center rounded-full transition ${enabled ? "text-[#2455A4]" : "text-slate-300"}`}
      aria-label={
        enabled ? "ปิดการยืนยันการเข้าร่วม" : "เปิดการยืนยันการเข้าร่วม"
      }
    >
      <Icon className="h-7 w-12" />
    </button>
  );
}

// แถวควบคุมแบบ toggle พร้อมป้ายกำกับ ใช้แทนบล็อกใหญ่เดิมที่กินพื้นที่มาก
function ToggleRow({
  label,
  hint,
  enabled,
  onClick,
}: {
  label: string;
  hint?: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
      <ToggleSwitch enabled={enabled} onClick={onClick} />
    </div>
  );
}

// บล็อกตัวเลขสรุป แทนคอลัมน์กว้าง ๆ ที่มีเส้นแบ่งเยอะแบบเดิม
function StatBlock({
  label,
  value,
  caption,
  children,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold leading-none text-slate-900">
        {value}
      </p>
      {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

// ปุ่มไอคอน+ข้อความขนาดเล็ก ใช้ในแถบคำสั่งของการ์ด
function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "default" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-slate-200 text-slate-600 hover:border-[#2455A4] hover:text-[#2455A4] hover:bg-blue-50/40";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 ${toneClass}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function loadJsQr() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.jsQR) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-skilltranscript-jsqr="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.jsQR)), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    script.dataset.skilltranscriptJsqr = "true";
    script.onload = () => resolve(Boolean(window.jsQR));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function requestCameraStream(constraints: MediaStreamConstraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia =
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (!legacyGetUserMedia) {
    return Promise.reject(
      new DOMException("getUserMedia is unavailable", "NotSupportedError"),
    );
  }

  return new Promise<MediaStream>((resolve, reject) => {
    legacyGetUserMedia.call(navigator, constraints, resolve, reject);
  });
}


function TimeField({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];

  const updatePart = (part: "hour" | "minute", nextValue: string) => {
    const nextHour = part === "hour" ? nextValue : hour;
    const nextMinute = part === "minute" ? nextValue : minute;

    if (!nextHour && !nextMinute) {
      onChange("");
      return;
    }

    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={hour}
        onChange={(e) => updatePart("hour", e.target.value)}
        className="staff-activity-input appearance-none bg-white pr-8"
        required={required}
        aria-label="ชั่วโมง"
      >
        <option value="">ชั่วโมง</option>
        {Array.from({ length: 24 }, (_, index) => {
          const item = String(index).padStart(2, "0");
          return (
            <option key={item} value={item}>
              {item} นาฬิกา
            </option>
          );
        })}
      </select>

      <select
        value={minute}
        onChange={(e) => updatePart("minute", e.target.value)}
        className="staff-activity-input appearance-none bg-white pr-8"
        required={required}
        aria-label="นาที"
      >
        <option value="">นาที</option>
        {Array.from({ length: 60 }, (_, index) => {
          const item = String(index).padStart(2, "0");
          return (
            <option key={item} value={item}>
              {item} นาที
            </option>
          );
        })}
      </select>
    </div>
  );
}

function DateTimeField({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  const date = value ? value.slice(0, 10) : "";
  const time = value && value.length >= 16 ? value.slice(11, 16) : "";

  return (
    <div className="grid gap-2 sm:grid-cols-[1.15fr_1fr]">
      <input
        type="date"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => {
          const nextDate = e.target.value;
          onChange(nextDate ? `${nextDate}T${time || "00:00"}` : "");
        }}
        className="staff-activity-input"
      />
      <TimeField
        value={time}
        onChange={(nextTime) => {
          onChange(date && nextTime ? `${date}T${nextTime}` : "");
        }}
      />
    </div>
  );
}

// ---------- AddActivityModal ----------
function AddActivityModal({
  form,
  skillOptions,
  templates,
  onChange,
  onToggleSkill,
  onSkillLevelChange,
  onTemplateChange,
  onClose,
  onSubmit,
  isEditing = false,
}: {
  form: ActivityForm;
  skillOptions: SkillOption[];
  templates: Template[];
  onChange: (field: keyof ActivityForm, value: string) => void;
  onToggleSkill: (skillId: string) => void;
  onSkillLevelChange: (skillId: string, level: string) => void;
  onTemplateChange: (templateId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isEditing?: boolean;
}) {
  const today = getTodayDate();

  const { hours, minutes } = calculateHoursMinutes(
    form.startDate,
    form.startTime,
    form.endDate,
    form.endTime,
  );
  const durationDisplay = formatHoursMinutes(hours, minutes);

  return (
    <ModalShell
      title={isEditing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zIndexClass="z-[70]"
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-4">
          {!isEditing && (
            <Field
              label="รหัสกิจกรรม"
              hint="กำหนดเองได้ เช่น AI01, CS01, OPENHOUSE69 (ไม่เกิน 20 ตัวอักษร และห้ามซ้ำ)"
            >
              <input
                value={form.activityCode}
                onChange={(e) => onChange("activityCode", e.target.value.toUpperCase())}
                className="staff-activity-input"
                maxLength={20}
                pattern="[A-Z0-9_-]{1,20}"
                placeholder="เช่น AI01"
                required
              />
            </Field>
          )}

          <Field label="ชื่อกิจกรรม/อบรม">
            <input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="staff-activity-input"
              required
            />
          </Field>

          <Field label="คำอธิบายกิจกรรม">
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
              className="staff-activity-input min-h-[90px] resize-none py-2.5"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-800">วันเวลาจัดกิจกรรม</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="วันที่เริ่มต้น">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
                min={isEditing ? undefined : today}
                className="staff-activity-input"
                required
              />
            </Field>
            <Field label="เวลาเริ่มต้น" hint="เลือกชั่วโมงและนาที">
              <TimeField
                value={form.startTime}
                onChange={(value) => onChange("startTime", value)}
                required
              />
            </Field>
            <Field label="วันที่สิ้นสุด">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (form.startDate && val && val < form.startDate) return;
                  onChange("endDate", val);
                }}
                min={form.startDate || (isEditing ? undefined : today)}
                className="staff-activity-input"
                required
              />
            </Field>
            <Field label="เวลาสิ้นสุด" hint="เลือกชั่วโมงและนาที">
              <TimeField
                value={form.endTime}
                onChange={(value) => {
                  if (
                    form.startDate &&
                    form.startTime &&
                    value &&
                    !isValidEndDateTime(
                      form.startDate,
                      form.startTime,
                      form.endDate,
                      value,
                    )
                  ) {
                    return;
                  }
                  onChange("endTime", value);
                }}
                required
              />
            </Field>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            รวมเวลา:{" "}
            <span className="font-medium text-[#2455A4]">
              {durationDisplay || "—"}
            </span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ภาคเรียน">
            <select
              value={form.term}
              onChange={(e) => onChange("term", e.target.value)}
              className="staff-activity-input appearance-none bg-white pr-8"
            >
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
              <option value="3">ภาคเรียนที่ 3</option>
            </select>
          </Field>
          <Field label="สถานที่จัดกิจกรรม">
            <input
              value={form.location}
              onChange={(e) => onChange("location", e.target.value)}
              className="staff-activity-input"
            />
          </Field>
          <Field label="จำนวนที่รับนิสิต">
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => onChange("capacity", e.target.value)}
              className="staff-activity-input"
              placeholder="เช่น 30"
              required
            />
          </Field>
          <Field label="ผู้จัดกิจกรรม">
            <input
              value={form.organizer}
              onChange={(e) => onChange("organizer", e.target.value)}
              className="staff-activity-input"
              placeholder="คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-800">
            ช่วงเวลาลงทะเบียน
          </p>
          <p className="mt-1 text-xs text-slate-500">
            นิสิตต้องลงทะเบียนในช่วงเวลานี้ก่อนจึงจะยืนยันการเข้าร่วมได้
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="เริ่มลงทะเบียน">
              <DateTimeField
                value={form.registrationStart}
                minDate={isEditing ? undefined : today}
                maxDate={form.endDate || undefined}
                onChange={(value) => {
                  if (
                    form.registrationEnd &&
                    value &&
                    value >= form.registrationEnd
                  ) {
                    return;
                  }
                  if (
                    form.endDate &&
                    form.endTime &&
                    value &&
                    value > `${form.endDate}T${form.endTime}`
                  ) {
                    return;
                  }
                  onChange("registrationStart", value);
                }}
              />
            </Field>
            <Field label="สิ้นสุดลงทะเบียน">
              <DateTimeField
                value={form.registrationEnd}
                minDate={
                  form.registrationStart
                    ? form.registrationStart.slice(0, 10)
                    : isEditing
                      ? undefined
                      : today
                }
                maxDate={form.endDate || undefined}
                onChange={(value) => {
                  if (
                    form.registrationStart &&
                    value &&
                    value <= form.registrationStart
                  ) {
                    return;
                  }
                  if (
                    form.endDate &&
                    form.endTime &&
                    value &&
                    value > `${form.endDate}T${form.endTime}`
                  ) {
                    return;
                  }
                  onChange("registrationEnd", value);
                }}
              />
            </Field>
          </div>
        </div>

        <Field
          label="แม่แบบเกียรติบัตร (ใบเซอร์)"
          hint="เลือกแม่แบบเพื่อใช้สร้างเกียรติบัตรให้ผู้เข้าร่วม"
        >
          <select
            value={form.templateId || ""}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="staff-activity-input appearance-none bg-white pr-8"
          >
            <option value="">-- ไม่ระบุ --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            ทักษะที่ได้รับจากกิจกรรม
          </p>
          <p className="mt-1 text-xs text-slate-500">
            เลือกทักษะที่เกี่ยวข้องกับกิจกรรมนี้
          </p>
          <div className="mt-3 grid gap-2">
            {skillOptions.map((skill) => {
              const selected = form.selectedSkills.find(
                (s) => s.skillId === skill.skillId,
              );
              const isSelected = !!selected;
              const level = selected ? selected.level : skill.level;
              return (
                <div
                  key={skill.skillId}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                    isSelected
                      ? "border-[#2455A4] bg-blue-50/60"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`skill-${skill.skillId}`}
                    checked={isSelected}
                    onChange={() => onToggleSkill(skill.skillId)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2455A4] focus:ring-[#2455A4]"
                  />
                  <label
                    htmlFor={`skill-${skill.skillId}`}
                    className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
                  >
                    {skill.skillname}
                  </label>
                  {isSelected && (
                    <select
                      value={level}
                      onChange={(e) =>
                        onSkillLevelChange(skill.skillId, e.target.value)
                      }
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#2455A4]"
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-[#2455A4] text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B3F80]"
        >
          {isEditing ? "อัปเดตกิจกรรม" : "เพิ่มกิจกรรม"}
        </button>
      </form>
    </ModalShell>
  );
}

// ---------- EvaluationModal ----------
function EvaluationModal({
  activity,
  initialQuestions,
  isEditing = false,
  onClose,
  onSave,
}: {
  activity: StaffActivity;
  initialQuestions?: EvaluationQuestion[];
  isEditing?: boolean;
  onClose: () => void;
  onSave: (evaluation: EvaluationQuestion[]) => void;
}) {
  const [questions, setQuestions] = useState<EvaluationQuestion[]>(
    initialQuestions && initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            id: Date.now().toString(),
            question: "",
            options: ["", ""],
            correctAnswer: 0,
            skillNames:
              activity.skills.length > 0 ? [activity.skills[0].name] : [],
          },
        ],
  );

  const skillOptions = activity.skills.map((s) => s.name);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        question: "",
        options: ["", ""],
        correctAnswer: 0,
        skillNames: skillOptions.length > 0 ? [skillOptions[0]] : [],
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (
    id: string,
    field: keyof EvaluationQuestion,
    value: any,
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
          const newCorrect =
            q.correctAnswer === optionIndex
              ? 0
              : q.correctAnswer > optionIndex
                ? q.correctAnswer - 1
                : q.correctAnswer;
          return { ...q, options: newOptions, correctAnswer: newCorrect };
        }
        return q;
      }),
    );
  };

  const selectCorrectAnswer = (questionId: string, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: optionIndex } : q,
      ),
    );
  };

  const toggleSkill = (questionId: string, skillName: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const current = q.skillNames || [];
          const newSkillNames = current.includes(skillName)
            ? current.filter((s) => s !== skillName)
            : [...current, skillName];
          return { ...q, skillNames: newSkillNames };
        }
        return q;
      }),
    );
  };

  const handleSave = () => {
    if (questions.length < 5) {
      alert("แบบประเมินต้องมีคำถามอย่างน้อย 5 ข้อ");
      return;
    }

    const requiredSkills = activity.skills.map((skill) => skill.name.trim()).filter(Boolean);
    const selectedSkills = new Set(
      questions.flatMap((question) =>
        (question.skillNames || []).map((name) => name.trim()).filter(Boolean),
      ),
    );
    const missingSkills = requiredSkills.filter((skill) => !selectedSkills.has(skill));

    if (missingSkills.length > 0) {
      alert(
        `กรุณาเลือกทักษะให้ครบทุกทักษะที่กำหนดไว้: ${missingSkills.join(", ")}`,
      );
      return;
    }

    const isValid = questions.every(
      (q) =>
        q.question.trim() !== "" &&
        q.options.every((opt) => opt.trim() !== "") &&
        q.options.length >= 2 &&
        q.skillNames &&
        q.skillNames.length > 0,
    );
    if (!isValid) {
      alert(
        "กรุณากรอกข้อมูลให้ครบถ้วน: คำถาม, ตัวเลือกอย่างน้อย 2 ตัว และเลือกทักษะให้ทุกข้อ",
      );
      return;
    }

    onSave(questions);
  };

  return (
    <ModalShell
      title={isEditing ? "แก้ไขแบบประเมินความรู้" : "สร้างแบบประเมินความรู้"}
      subtitle={
        <>
          กิจกรรม: <span className="font-medium text-slate-700">{activity.title}</span>
        </>
      }
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      zIndexClass="z-[80]"
    >
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">
                  คำถามข้อ {qIndex + 1}
                </label>
                <textarea
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(q.id, "question", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2455A4] focus:ring-2 focus:ring-blue-100 resize-y min-h-[60px]"
                  placeholder="พิมพ์คำถาม..."
                  rows={2}
                />
              </div>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="mt-5 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="ลบคำถาม"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700">
                ตัวเลือก (คลิกที่ตัวเลือกเพื่อเลือกเป็นคำตอบที่ถูกต้อง)
              </label>
              {q.options.map((opt, optIndex) => (
                <div
                  key={optIndex}
                  className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 transition cursor-pointer ${
                    q.correctAnswer === optIndex
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => selectCorrectAnswer(q.id, optIndex)}
                >
                  <span className="text-sm font-medium text-slate-400 min-w-[55px] shrink-0">
                    ข้อ {optIndex + 1}:
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      updateOption(q.id, optIndex, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={`พิมพ์ตัวเลือกข้อ ${optIndex + 1}...`}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(q.id, optIndex);
                      }}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(q.id)}
                className="mt-2 text-sm text-[#2455A4] hover:underline"
              >
                + เพิ่มตัวเลือก
              </button>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700">
                ทักษะที่เกี่ยวข้อง (เลือกได้หลายทักษะ)
              </label>
              <div className="mt-1 flex flex-wrap gap-3">
                {skillOptions.length > 0 ? (
                  skillOptions.map((skill) => {
                    const activitySkill = activity.skills.find((s) => s.name === skill);
                    return (
                      <label
                        key={skill}
                        className={"flex items-center gap-2 rounded-lg border px-3 py-2 transition cursor-pointer " +
                          ((q.skillNames || []).includes(skill)
                            ? "border-[#2455A4] bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300")}
                      >
                        <input
                          type="checkbox"
                          checked={(q.skillNames || []).includes(skill)}
                          onChange={() => toggleSkill(q.id, skill)}
                          className="h-4 w-4 rounded border-slate-300 text-[#2455A4] focus:ring-[#2455A4]"
                        />
                        <span className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">{skill}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {activitySkill?.level || "ไม่ระบุระดับ"}
                          </span>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <span className="text-sm text-slate-400">
                    ไม่มีทักษะในกิจกรรมนี้ กรุณาเพิ่มทักษะก่อน
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#2455A4] px-4 py-2 text-sm font-medium text-[#2455A4] transition hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" /> เพิ่มคำถาม
        </button>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-[#2455A4] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B3F80]"
        >
          {isEditing ? "อัปเดตแบบประเมิน" : "บันทึกแบบประเมิน"}
        </button>
      </div>
    </ModalShell>
  );
}

// ---------- VerificationCodeModal ----------
function VerificationCodeModal({
  code,
  expiresAt,
  onClose,
  onRegenerate,
  isRegenerating,
}: {
  code: string;
  expiresAt: string;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ModalShell
      title={code ? "รหัสยืนยันการเข้าร่วม" : "ยังไม่มีรหัสยืนยัน"}
      onClose={onClose}
      maxWidthClass="max-w-md"
      zIndexClass="z-[90]"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2455A4]">
        <KeyRound className="h-7 w-7" />
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">รหัสยืนยัน</p>
          {code ? (
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-[#2455A4]">
              {code}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              ยังไม่มีรหัส กรุณาสร้างรหัสใหม่
            </p>
          )}
        </div>

        {code && (
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">หมดอายุ</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatDate(expiresAt)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2455A4] bg-white px-4 py-2 text-sm font-medium text-[#2455A4] transition hover:bg-blue-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> คัดลอก
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {code && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex-1 h-11 rounded-xl border border-[#2455A4] text-sm font-semibold text-[#2455A4] transition hover:bg-blue-50 disabled:opacity-50"
            >
              {isRegenerating ? "กำลังสร้าง..." : "สร้างรหัสใหม่"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${code ? "flex-1" : "w-full"} h-11 rounded-xl bg-[#2455A4] text-sm font-semibold text-white shadow-md transition hover:bg-[#1B3F80]`}
          >
            ปิด
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------- Main Page ----------
export default function StaffActivitiesPage() {
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityCategory>("mine");
  const [mineStatusFilter, setMineStatusFilter] = useState<MineStatusFilter>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [evaluationActivity, setEvaluationActivity] =
    useState<StaffActivity | null>(null);
  const [editingEvaluationActivity, setEditingEvaluationActivity] =
    useState<StaffActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [modalActivityId, setModalActivityId] = useState<string | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipantActivityId, setSelectedParticipantActivityId] =
    useState<string | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [scanActivity, setScanActivity] = useState<StaffActivity | null>(null);
  const [scanActivityCode, setScanActivityCode] = useState("");
  const [scanPayload, setScanPayload] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrImageInputRef = useRef<HTMLInputElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetectorLike | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<StaffActivity | null>(
    null,
  );
  const [editForm, setEditForm] = useState<ActivityForm>(emptyForm);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(apiPath("/api/skills"));
      if (!res.ok) throw new Error("ไม่สามารถโหลดรายการทักษะ");
      const data = await res.json();
      setSkillOptions(data);
    } catch (err) {
      console.error(err);
      setError("โหลดทักษะล้มเหลว");
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(apiPath("/api/staff/templates"));
      if (!res.ok) throw new Error("ไม่สามารถโหลดแม่แบบ");
      const data = await res.json();
      setTemplates(
        data.templates.filter((t: Template) => t.status === "active") || [],
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(apiPath("/api/auth/session"));
      if (!res.ok) return;
      const text = await res.text();
      if (!text.trim()) {
        setCurrentUserId(null);
        return;
      }
      const session = JSON.parse(text);
      setCurrentUserId(session?.user?.id ? String(session.user.id) : null);
    } catch (err) {
      console.error(err);
      setCurrentUserId(null);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiPath("/api/activities"));
      if (!res.ok) throw new Error("ไม่สามารถโหลดกิจกรรม");
      const data = await res.json();
      setActivities(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("โหลดกิจกรรมล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchSkills();
    fetchTemplates();
    fetchActivities();
  }, [fetchCurrentUser, fetchSkills, fetchTemplates, fetchActivities]);

  const activityCategories: Array<{ key: ActivityCategory; label: string }> = [
    { key: "all", label: "กิจกรรมทั้งหมด" },
    { key: "mine", label: "กิจกรรมที่สร้างโดยฉัน" },
    { key: "past", label: "กิจกรรมที่สิ้นสุดแล้ว" },
    { key: "external", label: "กิจกรรมที่นิสิตขอเพิ่ม" },
  ];

  const matchesActivityCategory = useCallback(
    (activity: StaffActivity, category: ActivityCategory) => {
      if (category === "mine") {
        if (!currentUserId || activity.createdBy !== currentUserId) return false;

        if (mineStatusFilter === "past") {
          return activity.status === "past" || isActivityPast(activity);
        }

        if (mineStatusFilter === "active") {
          return activity.status !== "past" && !isActivityPast(activity);
        }

        return true;
      }

      if (category === "past") {
        return activity.status === "past" || isActivityPast(activity);
      }

      if (category === "external") {
        return isExternalActivity(activity);
      }

      // กิจกรรมทั้งหมด: แสดงเฉพาะกิจกรรมที่กำลังดำเนินอยู่
      // ไม่รวมกิจกรรมที่ถูกสิ้นสุดแล้ว หรือหมดเวลาจัดกิจกรรม
      return activity.status !== "past" && !isActivityPast(activity);
    },
    [currentUserId, mineStatusFilter],
  );

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) =>
        matchesActivityCategory(activity, activeTab),
      ),
    [activities, activeTab, matchesActivityCategory],
  );

  const categoryCounts = useMemo(() => {
    return activityCategories.reduce<Record<ActivityCategory, number>>(
      (counts, category) => {
        counts[category.key] = activities.filter((activity) =>
          matchesActivityCategory(activity, category.key),
        ).length;
        return counts;
      },
      { all: 0, mine: 0, past: 0, external: 0 },
    );
  }, [activities, matchesActivityCategory]);

  // ---------- กิจกรรม ----------
  const updateConfirmation = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    const newVal = !activity.confirmationEnabled;

    try {
      if (newVal) {
        if (!activity.hasEvaluation) {
          throw new Error("ต้องสร้างแบบประเมินก่อน จึงจะเปิดแบบประเมินกิจกรรมได้");
        }

        const updateRes = await fetch(apiPath("/api/activities/workflow"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId,
            field: "confirmationEnabled",
            value: true,
          }),
        });
        if (!updateRes.ok) throw new Error("อัปเดตไม่สำเร็จ");

        await fetchActivities();
      } else {
        const updateRes = await fetch(apiPath("/api/activities/workflow"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId,
            field: "confirmationEnabled",
            value: false,
          }),
        });
        if (!updateRes.ok) throw new Error("อัปเดตไม่สำเร็จ");

        await fetchActivities();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const updateWorkflow = async (
    activityId: string,
    field: "applicationEnabled" | "registrationEnabled",
  ) => {
    try {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;
      const value = field === "applicationEnabled"
        ? !activity.applicationEnabled
        : !activity.registrationEnabled;
      const res = await fetch(apiPath("/api/activities/workflow"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId,
          field,
          value,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "อัปเดตสถานะกิจกรรมไม่สำเร็จ");
      }
      await fetchActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const stopCamera = useCallback(() => {
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((track) => track.stop());
      scanStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraStarting(false);
  }, []);

  const readCameraFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        let value = "";
        const detector = barcodeDetectorRef.current;

        if (detector) {
          const codes = await detector.detect(video);
          value = codes.find((code) => code.rawValue)?.rawValue?.trim() || "";
        } else if (window.jsQR) {
          const canvas = canvasRef.current || document.createElement("canvas");
          canvasRef.current = canvas;
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, width, height);
              const imageData = context.getImageData(0, 0, width, height);
              value =
                window
                  .jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth",
                  })
                  ?.data?.trim() || "";
            }
          }
        }

        if (value) {
          setScanPayload(value);
          setScanMessage("อ่าน QR สำเร็จ กดบันทึกการลงทะเบียนได้เลย");
          setScanError("");
          stopCamera();
          return;
        }
      }
    } catch (error) {
      console.error("QR camera scan failed", error);
    }

    scanFrameRef.current = window.requestAnimationFrame(readCameraFrame);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setScanError("");

    try {
      setCameraStarting(true);
      barcodeDetectorRef.current = window.BarcodeDetector
        ? new window.BarcodeDetector({ formats: ["qr_code"] })
        : null;

      if (!barcodeDetectorRef.current) {
        const loaded = await loadJsQr();
        if (!loaded) {
          setCameraError("เปิดกล้องได้ แต่ยังโหลดตัวอ่าน QR ไม่สำเร็จ กรุณาต่ออินเทอร์เน็ตหรือวางข้อมูล QR ในช่องด้านล่าง");
        }
      }

      const stream = await requestCameraStream({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanFrameRef.current = window.requestAnimationFrame(readCameraFrame);
    } catch (error) {
      console.error("Open QR camera failed", error);
      stopCamera();
      const insecureMessage =
        typeof window !== "undefined" && !window.isSecureContext
          ? "Chrome อนุญาตกล้องสดเฉพาะ HTTPS หรือ localhost เท่านั้น สำหรับเว็บ HTTP นี้ให้ใช้ปุ่มถ่าย/เลือกภาพ QR หรือเปลี่ยนระบบเป็น HTTPS"
          : "";
      setCameraError(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "ไม่สามารถเปิดกล้องได้ เพราะยังไม่ได้อนุญาตสิทธิ์กล้อง"
          : insecureMessage ||
              "เปิดกล้องไม่สำเร็จ กรุณาตรวจสอบสิทธิ์กล้องหรือใช้อีกเบราว์เซอร์",
      );
    } finally {
      setCameraStarting(false);
    }
  }, [readCameraFrame, stopCamera]);

  const decodeQrImageFile = useCallback(async (file: File) => {
    setCameraError("");
    setScanError("");
    setScanMessage("");

    try {
      const loaded = await loadJsQr();
      if (!loaded || !window.jsQR) {
        setCameraError("โหลดตัวอ่าน QR ไม่สำเร็จ กรุณาลองใหม่หรือนำข้อมูล QR มาวางในช่องด้านล่าง");
        return;
      }

      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("ไม่สามารถอ่านรูปภาพได้"));
      });

      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("ไม่สามารถเตรียมพื้นที่อ่าน QR ได้");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(image.src);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (!result?.data?.trim()) {
        setCameraError("ไม่พบ QR ในรูปภาพ กรุณาถ่ายใหม่ให้ QR ชัดและอยู่เต็มกรอบ");
        return;
      }

      setScanPayload(result.data.trim());
      setScanMessage("อ่าน QR จากรูปภาพสำเร็จ กดบันทึกการลงทะเบียนได้เลย");
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "อ่าน QR จากรูปภาพไม่สำเร็จ");
    }
  }, []);

  const handleQrImageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      void decodeQrImageFile(file);
    },
    [decodeQrImageFile],
  );

  const closeScanModal = useCallback(() => {
    stopCamera();
    setScanActivity(null);
  }, [stopCamera]);

  useEffect(() => {
    if (!scanActivity) stopCamera();
    return () => stopCamera();
  }, [scanActivity, stopCamera]);

  const openScanModal = (activity: StaffActivity) => {
    stopCamera();
    setScanActivity(activity);
    setScanActivityCode(activity.id);
    setScanPayload("");
    setScanMessage("");
    setScanError("");
    setCameraError("");
  };

  const submitScan = async () => {
    if (!scanActivity) return;
    setScanSubmitting(true);
    setScanError("");
    setScanMessage("");
    try {
      const res = await fetch(apiPath(`/api/activities/${scanActivity.id}/scan-qr`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityCode: scanActivityCode,
          qrPayload: scanPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "สแกน QR ไม่สำเร็จ");
      const studentName = `${data.student?.firstname || ""} ${data.student?.lastname || ""}`.trim();
      setScanMessage(`ลงทะเบียนสำเร็จ: ${data.student?.studentId || ""}${studentName ? ` ${studentName}` : ""}`);
      setScanPayload("");
      await fetchActivities();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setScanSubmitting(false);
    }
  };

  // ===== สร้างกิจกรรม =====
  const createActivity = async () => {
    try {
      const startDateTime = combineDateTime(form.startDate, form.startTime);
      const endDateTime = combineDateTime(form.endDate, form.endTime);

      if (!startDateTime || !endDateTime) {
        throw new Error("กรุณาระบุวันที่และเวลาเริ่มต้นและสิ้นสุดกิจกรรม");
      }

      const startDateObj = new Date(startDateTime);
      const endDateObj = new Date(endDateTime);
      const now = new Date();

      if (startDateObj.getTime() < now.getTime() - 60_000) {
        throw new Error("ไม่สามารถเลือกวันที่หรือเวลาย้อนหลังได้");
      }
      if (endDateObj <= startDateObj) {
        throw new Error("วันที่เวลาสิ้นสุดต้องมากกว่าวันที่เวลาเริ่มต้น");
      }
      if (!form.registrationStart || !form.registrationEnd) {
        throw new Error("กรุณาระบุช่วงเวลาลงทะเบียน");
      }
      const registrationStartObj = parseLocalDateTime(form.registrationStart);
      const registrationEndObj = parseLocalDateTime(form.registrationEnd);

      if (!registrationStartObj || !registrationEndObj) {
        throw new Error("รูปแบบช่วงเวลาลงทะเบียนไม่ถูกต้อง");
      }

      if (registrationEndObj <= registrationStartObj) {
        throw new Error("เวลาสิ้นสุดลงทะเบียนต้องอยู่หลังเวลาเริ่มลงทะเบียน");
      }

      if (registrationStartObj > endDateObj || registrationEndObj > endDateObj) {
        throw new Error(
          "ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม",
        );
      }

      const payload = {
        activityCode: form.activityCode,
        title: form.title,
        description: form.description,
        dateTime: startDateTime,
        endDateTime: endDateTime,
        term: form.term,
        location: form.location,
        organizer: form.organizer,
        selectedSkills: form.selectedSkills,
        templateId: form.templateId || undefined,
        registrationStart: form.registrationStart,
        registrationEnd: form.registrationEnd,
        capacity: Number(form.capacity),
      };

      const res = await fetch(apiPath("/api/activities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "สร้างกิจกรรมไม่สำเร็จ");
      }
      const data = await res.json();
      await fetchActivities();
      setForm(emptyForm);
      setIsModalOpen(false);
      if (data?.activityId) {
        alert(`สร้างกิจกรรมสำเร็จ\nรหัสกิจกรรม: ${data.activityId}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  // ===== บันทึกแบบประเมิน =====
  const saveEvaluation = async (
    evaluation: EvaluationQuestion[],
    activityId: string,
  ) => {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity) {
      alert("ไม่พบกิจกรรม");
      return;
    }

    if (activity.evaluationCompletedCount > 0) {
      alert("มีนิสิตทำแบบประเมินแล้ว จึงไม่สามารถแก้ไขแบบประเมินได้");
      return;
    }

    if (activity.confirmationEnabled) {
      alert("แบบประเมินกำลังเปิดอยู่ กรุณาปิดแบบประเมินก่อนจึงจะแก้ไขได้");
      return;
    }

    if (evaluation.length < 5) {
      alert("แบบประเมินต้องมีคำถามอย่างน้อย 5 ข้อ");
      return;
    }

    const requiredSkills = activity.skills.map((skill) => skill.name.trim()).filter(Boolean);
    const selectedSkills = new Set(
      evaluation.flatMap((question) =>
        (question.skillNames || []).map((name) => name.trim()).filter(Boolean),
      ),
    );
    const missingSkills = requiredSkills.filter((skill) => !selectedSkills.has(skill));

    if (missingSkills.length > 0) {
      alert(
        `กรุณาเลือกทักษะให้ครบทุกทักษะที่กำหนดไว้: ${missingSkills.join(", ")}`,
      );
      return;
    }

    try {
      const res = await fetch(apiPath(`/api/activities/${activityId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluation,
          hasEvaluation: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "บันทึกแบบประเมินไม่สำเร็จ");
      }
      await fetchActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  // ===== แก้ไขกิจกรรม =====
  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    try {
      const startDateTime = combineDateTime(
        editForm.startDate,
        editForm.startTime,
      );
      const endDateTime = combineDateTime(editForm.endDate, editForm.endTime);

      if (!startDateTime || !endDateTime) {
        throw new Error("กรุณาระบุวันที่และเวลาเริ่มต้นและสิ้นสุดกิจกรรม");
      }

      const startDateObj = new Date(startDateTime);
      const endDateObj = new Date(endDateTime);
      const now = new Date();

      if (startDateObj.getTime() < now.getTime() - 60_000) {
        throw new Error("ไม่สามารถเลือกวันที่หรือเวลาย้อนหลังได้");
      }
      if (endDateObj <= startDateObj) {
        throw new Error("วันที่เวลาสิ้นสุดต้องมากกว่าวันที่เวลาเริ่มต้น");
      }
      if (!editForm.registrationStart || !editForm.registrationEnd) {
        throw new Error("กรุณาระบุช่วงเวลาลงทะเบียน");
      }
      const registrationStartObj = parseLocalDateTime(editForm.registrationStart);
      const registrationEndObj = parseLocalDateTime(editForm.registrationEnd);

      if (!registrationStartObj || !registrationEndObj) {
        throw new Error("รูปแบบช่วงเวลาลงทะเบียนไม่ถูกต้อง");
      }

      if (registrationEndObj <= registrationStartObj) {
        throw new Error("เวลาสิ้นสุดลงทะเบียนต้องอยู่หลังเวลาเริ่มลงทะเบียน");
      }

      if (registrationStartObj > endDateObj || registrationEndObj > endDateObj) {
        throw new Error(
          "ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม",
        );
      }

      const updatedSkills = editForm.selectedSkills.map((skill) => {
        const matched = skillOptions.find((s) => s.skillname === skill.name);
        return { ...skill, skillId: skill.skillId || matched?.skillId || "" };
      });

      const payload = {
        title: editForm.title,
        description: editForm.description,
        dateTime: startDateTime,
        endDateTime: endDateTime,
        term: editForm.term,
        location: editForm.location,
        organizer: editForm.organizer,
        selectedSkills: updatedSkills,
        templateId: editForm.templateId || undefined,
        registrationStart: editForm.registrationStart,
        registrationEnd: editForm.registrationEnd,
        capacity: Number(editForm.capacity),
      };

      const res = await fetch(apiPath(`/api/activities/${editingActivity.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "อัปเดตกิจกรรมไม่สำเร็จ");
      }
      await fetchActivities();
      setIsEditModalOpen(false);
      setEditingActivity(null);
      setEditForm(emptyForm);
      alert("อัปเดตกิจกรรมสำเร็จ");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleEdit = (activity: StaffActivity) => {
    setEditingActivity(activity);

    setEditForm({
      activityCode: activity.id,
      title: activity.title,
      description: activity.description,
      startDate: toDateInputValue(activity.date),
      startTime: activity.time ? String(activity.time).slice(0, 5) : "",
      endDate: toDateInputValue(activity.endDate),
      endTime: activity.endTime ? String(activity.endTime).slice(0, 5) : "",
      term: activity.term,
      location: activity.location,
      organizer: activity.organizer || "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
      capacity: String(activity.capacity ?? 30),
      selectedSkills: activity.skills.map((skill) => ({
        skillId: skill.skillId || "",
        name: skill.name,
        level: skill.level,
      })),
      templateId: activity.templateId || "",
      registrationStart: toDateTimeInputValue(
        activity.registrationStart?.slice(0, 10),
        activity.registrationStart?.slice(11, 16),
      ),
      registrationEnd: toDateTimeInputValue(
        activity.registrationEnd?.slice(0, 10),
        activity.registrationEnd?.slice(11, 16),
      ),
    });

    setIsEditModalOpen(true);
  };

  const handleEndActivity = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const isPast = activity.status === "past";

    const message = isPast
      ? `ต้องการเปิดกิจกรรม "${activity.title}" กลับมาใช้งานหรือไม่?\\n\\nเมื่อเปิดกลับมา กิจกรรมจะย้ายไปอยู่ใน "กิจกรรมที่กำลังดำเนินอยู่"`
      : `ต้องการสิ้นสุดกิจกรรม "${activity.title}" ใช่หรือไม่?\\n\\nเมื่อสิ้นสุดแล้ว กิจกรรมจะย้ายไปอยู่ใน "กิจกรรมที่สิ้นสุดแล้ว"`;

    if (!confirm(message)) return;

    try {
      const res = await fetch(apiPath("/api/activities/workflow"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          field: "status",
          value: isPast ? "active" : "past",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || (isPast ? "เปิดกิจกรรมกลับไม่สำเร็จ" : "สิ้นสุดกิจกรรมไม่สำเร็จ"));
      }

      await fetchActivities();
      setActiveTab(isPast ? "all" : "past");
      alert(isPast ? "เปิดกิจกรรมกลับมาเรียบร้อยแล้ว" : "สิ้นสุดกิจกรรมเรียบร้อยแล้ว");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (activityId: string) => {
    if (
      !confirm(
        "คุณต้องการลบกิจกรรมนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้",
      )
    )
      return;
    try {
      const res = await fetch(apiPath(`/api/activities/${activityId}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "ลบกิจกรรมไม่สำเร็จ");
      }
      await fetchActivities();
      alert("ลบกิจกรรมสำเร็จ");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleViewParticipants = async (activityId: string) => {
    setSelectedParticipantActivityId(activityId);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);
    setParticipants([]);
    try {
      const res = await fetch(apiPath(`/api/activities/${encodeURIComponent(activityId)}/participants`), {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้");
      }
      const data = await res.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้");
      setShowParticipantsModal(false);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // ---------- ฟอร์ม ----------
  const handleFormChange = (field: keyof ActivityForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "startDate" || field === "startTime") {
        if (
          next.endDate &&
          next.endTime &&
          !isValidEndDateTime(
            next.startDate,
            next.startTime,
            next.endDate,
            next.endTime,
          )
        ) {
          next.endDate = "";
          next.endTime = "";
        }
      }
      if (field === "endDate" || field === "endTime") {
        if (next.startDate && next.startTime && next.endDate && next.endTime) {
          if (
            !isValidEndDateTime(
              next.startDate,
              next.startTime,
              next.endDate,
              next.endTime,
            )
          ) {
            return prev;
          }
        }
      }
      return next;
    });
  };

  const toggleSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.selectedSkills.some((s) => s.skillId === skillId);
      if (exists) {
        return {
          ...prev,
          selectedSkills: prev.selectedSkills.filter(
            (s) => s.skillId !== skillId,
          ),
        };
      } else {
        const skill = skillOptions.find((s) => s.skillId === skillId);
        if (!skill) return prev;
        return {
          ...prev,
          selectedSkills: [
            ...prev.selectedSkills,
            {
              skillId: skill.skillId,
              name: skill.skillname,
              level: skill.level,
            },
          ],
        };
      }
    });
  };

  const skillLevelChange = (skillId: string, level: string) => {
    setForm((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.map((s) =>
        s.skillId === skillId ? { ...s, level } : s,
      ),
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setForm((prev) => ({ ...prev, templateId }));
  };

  // ---------- ฟอร์มแก้ไข ----------
  const handleEditFormChange = (field: keyof ActivityForm, value: string) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "startDate" || field === "startTime") {
        if (
          next.endDate &&
          next.endTime &&
          !isValidEndDateTime(
            next.startDate,
            next.startTime,
            next.endDate,
            next.endTime,
          )
        ) {
          next.endDate = "";
          next.endTime = "";
        }
      }
      if (field === "endDate" || field === "endTime") {
        if (next.startDate && next.startTime && next.endDate && next.endTime) {
          if (
            !isValidEndDateTime(
              next.startDate,
              next.startTime,
              next.endDate,
              next.endTime,
            )
          ) {
            return prev;
          }
        }
      }
      return next;
    });
  };

  const toggleEditSkill = (skillId: string) => {
    setEditForm((prev) => {
      const exists = prev.selectedSkills.some((s) => s.skillId === skillId);
      if (exists) {
        return {
          ...prev,
          selectedSkills: prev.selectedSkills.filter(
            (s) => s.skillId !== skillId,
          ),
        };
      } else {
        const skill = skillOptions.find((s) => s.skillId === skillId);
        if (!skill) return prev;
        return {
          ...prev,
          selectedSkills: [
            ...prev.selectedSkills,
            {
              skillId: skill.skillId,
              name: skill.skillname,
              level: skill.level,
            },
          ],
        };
      }
    });
  };

  const editSkillLevelChange = (skillId: string, level: string) => {
    setEditForm((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.map((s) =>
        s.skillId === skillId ? { ...s, level } : s,
      ),
    }));
  };

  const handleEditTemplateChange = (templateId: string) => {
    setEditForm((prev) => ({ ...prev, templateId }));
  };

  const formatActivityHours = (hours: number | null | undefined): string => {
    if (hours === null || hours === undefined || hours === 0) return "";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return formatHoursMinutes(h, m);
  };

  return (
    <StaffShell activePath="/staff/activities">
      <section className="bg-[#F5F6F8] p-4 sm:p-6 lg:p-7">
        <div className="mx-auto max-w-6xl">
          {/* หัวเรื่อง */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">
                จัดการกิจกรรมและการอบรม
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                สร้าง ติดตาม และจัดการกิจกรรมทั้งหมดของหน่วยงาน
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2455A4] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B3F80] focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <Plus className="h-5 w-5" /> เพิ่มกิจกรรมใหม่
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* แท็บกรอง แบบ segmented control */}
          <nav
            className="mt-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1"
            aria-label="ตัวกรองกิจกรรม"
          >
            {activityCategories.map((category) => {
              const isActive = activeTab === category.key;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveTab(category.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-[#1B3F80] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {category.label}
                  <span
                    className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                      isActive
                        ? "bg-[#2455A4] text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {categoryCounts[category.key]}
                  </span>
                </button>
              );
            })}
          </nav>

          {activeTab === "mine" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">
                สถานะกิจกรรม
              </span>
              <select
                value={mineStatusFilter}
                onChange={(e) =>
                  setMineStatusFilter(e.target.value as MineStatusFilter)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#2455A4] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">กำลังดำเนินอยู่</option>
                <option value="past">สิ้นสุดแล้ว</option>
              </select>
            </div>
          )}

          {/* รายการกิจกรรม */}
          {loading ? (
            <div className="mt-10 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลด...
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-sm text-slate-400">
                  ไม่มีกิจกรรมในหมวดนี้
                </div>
              ) : (
                filteredActivities.map((activity) => {
                  const displayStatus = getActivityDisplayStatus(activity);
                  const past = displayStatus.key === "past";
                  const external = isExternalActivity(activity);
                  return (
                    <article
                      key={activity.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:shadow-[0_6px_18px_rgba(15,23,42,0.07)] sm:p-6"
                    >
                      {/* แถวบน: สถานะ + รหัส + ปุ่มคำสั่งหลัก */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            title={displayStatus.description}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${displayStatus.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${displayStatus.dotClass}`}
                            />
                            {displayStatus.label}
                          </span>
                          {external && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              กิจกรรมภายนอก
                            </span>
                          )}
                          <span className="rounded-full bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-500">
                            {activity.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center rounded-lg border border-slate-100 bg-white px-2">
                            <span className="mr-2 text-xs font-medium text-slate-600">
                              สิ้นสุดกิจกรรม
                            </span>
                            <ToggleSwitch
                              enabled={past}
                              onClick={() => handleEndActivity(activity.id)}
                            />
                          </div>
                          <ActionButton
                            icon={Edit}
                            label="แก้ไข"
                            onClick={() => handleEdit(activity)}
                            disabled={activity.hasConfirmedParticipants}
                            title={
                              activity.hasConfirmedParticipants
                                ? "มีนิสิตยืนยันการเข้าร่วมแล้ว"
                                : undefined
                            }
                          />
                          <ActionButton
                            icon={Trash2}
                            label="ลบ"
                            onClick={() => handleDelete(activity.id)}
                            tone="danger"
                          />
                        </div>
                      </div>

                      {/* หัวข้อ + รายละเอียดเวลา/สถานที่ */}
                      <h2 className="mt-3 text-base font-semibold leading-6 text-slate-950 sm:text-lg">
                        {activity.title}
                      </h2>

                      <div className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                          <p className="text-xs font-semibold text-slate-500">วันจัดกิจกรรม</p>
                          <div className="mt-1.5 flex items-center gap-2 text-slate-700">
                            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="font-medium">{formatActivityDateRange(activity)}</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">เวลา</p>
                              <div className="mt-1 flex items-center gap-2 text-blue-700">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span className="font-medium">{formatActivityTimeRange(activity)}</span>
                              </div>
                            </div>
                            {activity.hours ? (
                              <div>
                                <p className="text-xs font-semibold text-slate-500">ระยะเวลา</p>
                                <p className="mt-1 font-medium text-slate-600">
                                  {formatActivityHours(activity.hours)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 sm:col-span-2">
                          <p className="text-xs font-semibold text-emerald-700">เวลาลงทะเบียน</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-emerald-800">
                            <span className="font-medium">{formatRegistrationRange(activity)}</span>
                          </div>
                        </div>

                        {activity.location && (
                          <div className="inline-flex items-center gap-1.5 text-slate-500 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {activity.location}
                          </div>
                        )}
                      </div>

                      {/* ทักษะ */}
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {activity.skills.length > 0 ? (
                          activity.skills.map((skill, index) => (
                            <ActivityPill key={`${activity.id}-${index}`} skill={skill} />
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">ยังไม่ได้กำหนดทักษะ</span>
                        )}
                      </div>

                      {/* สถานะแบบประเมิน / รหัสยืนยัน แบบข้อความบรรทัดเดียว */}
                      {!external && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {!activity.hasEvaluation ? (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <FileWarning className="h-3.5 w-3.5" />
                              ยังไม่มีแบบประเมินความรู้
                              <button
                                type="button"
                                onClick={() => setEvaluationActivity(activity)}
                                className="ml-1 font-medium text-[#2455A4] underline underline-offset-2 hover:text-[#1B3F80]"
                              >
                                สร้างแบบประเมิน
                              </button>
                            </span>
                          ) : activity.evaluationCompletedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <ClipboardList className="h-3.5 w-3.5" />
                              มีนิสิตทำแบบประเมินแล้ว ไม่สามารถแก้ไขได้
                            </span>
                          ) : activity.confirmationEnabled ? (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <ClipboardList className="h-3.5 w-3.5" />
                              แบบประเมินเปิดอยู่ ไม่สามารถแก้ไขได้
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingEvaluationActivity(activity)}
                              className="font-medium text-[#2455A4] underline underline-offset-2 hover:text-[#1B3F80]"
                            >
                              แก้ไขแบบประเมิน
                            </button>
                          )}

                        </div>
                      )}

                      <div className="my-4 h-px bg-slate-100" />

                      {/* สรุปตัวเลข + คำสั่งย่อย */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <StatBlock
                          label="เปิดรับสมัคร"
                          value={`${activity.attendeeCount || 0}/${activity.capacity || 0}`}
                          caption="สมัครแล้ว / จำนวนที่รับ"
                        >
                          <ToggleRow
                            label={activity.applicationEnabled ? "เปิดรับสมัครอยู่" : "ปิดรับสมัคร"}
                            enabled={Boolean(activity.applicationEnabled)}
                            onClick={() => updateWorkflow(activity.id, "applicationEnabled")}
                          />
                        </StatBlock>

                        <StatBlock
                          label="ลงทะเบียนนิสิต"
                          value={activity.attendeeCount}
                          caption="จำนวนผู้ลงทะเบียนเข้าร่วม"
                        >
                          <div className="flex gap-2">
                            <ActionButton
                              icon={QrCode}
                              label="สแกน QR"
                              onClick={() => openScanModal(activity)}
                            />
                            <ActionButton
                              icon={Users}
                              label="รายชื่อ"
                              onClick={() => handleViewParticipants(activity.id)}
                            />
                          </div>
                        </StatBlock>

                        {!external ? (
                          <StatBlock
                            label="เปิด/ปิดแบบประเมิน"
                            value={activity.evaluationCompletedCount}
                            caption="ทำแบบประเมินแล้ว"
                          >
                            <ToggleRow
                              label={activity.confirmationEnabled ? "เปิดแบบประเมิน" : "ปิดแบบประเมิน"}
                              enabled={activity.confirmationEnabled}
                              onClick={() => updateConfirmation(activity.id)}
                            />
                          </StatBlock>
                        ) : (
                          <StatBlock
                            label="ผู้ลงทะเบียนทั้งหมด"
                            value={activity.registeredCount}
                            caption="รวมทุกช่องทาง"
                          />
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal เพิ่มกิจกรรม */}
      {isModalOpen && (
        <AddActivityModal
          form={form}
          skillOptions={skillOptions}
          templates={templates}
          onChange={handleFormChange}
          onToggleSkill={toggleSkill}
          onSkillLevelChange={skillLevelChange}
          onTemplateChange={handleTemplateChange}
          onClose={() => {
            setForm(emptyForm);
            setIsModalOpen(false);
          }}
          onSubmit={createActivity}
          isEditing={false}
        />
      )}

      {/* Modal แก้ไขกิจกรรม */}
      {isEditModalOpen && editingActivity && (
        <AddActivityModal
          form={editForm}
          skillOptions={skillOptions}
          templates={templates}
          onChange={handleEditFormChange}
          onToggleSkill={toggleEditSkill}
          onSkillLevelChange={editSkillLevelChange}
          onTemplateChange={handleEditTemplateChange}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingActivity(null);
            setEditForm(emptyForm);
          }}
          onSubmit={handleUpdateActivity}
          isEditing={true}
        />
      )}

      {/* Modal สร้างแบบประเมิน */}
      {evaluationActivity && (
        <EvaluationModal
          activity={evaluationActivity}
          onClose={() => setEvaluationActivity(null)}
          onSave={(updatedEvaluation) => {
            saveEvaluation(updatedEvaluation, evaluationActivity.id);
            setEvaluationActivity(null);
          }}
        />
      )}

      {/* Modal แก้ไขแบบประเมิน */}
      {editingEvaluationActivity && (
        <EvaluationModal
          activity={editingEvaluationActivity}
          initialQuestions={editingEvaluationActivity.evaluation}
          isEditing={true}
          onClose={() => setEditingEvaluationActivity(null)}
          onSave={(updatedEvaluation) => {
            saveEvaluation(updatedEvaluation, editingEvaluationActivity.id);
            setEditingEvaluationActivity(null);
          }}
        />
      )}

      {/* Modal แสดงรหัสยืนยัน */}

      {/* Modal สแกน QR นิสิต */}
      {scanActivity && (
        <ModalShell
          title="สแกน QR ลงทะเบียน"
          subtitle={scanActivity.title}
          onClose={closeScanModal}
          maxWidthClass="max-w-lg"
          zIndexClass="z-[100]"
        >
          <div className="space-y-4">
            <Field label="รหัสกิจกรรม">
              <input
                value={scanActivityCode}
                onChange={(e) => setScanActivityCode(e.target.value)}
                className="staff-activity-input bg-white"
              />
            </Field>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    กล้องสแกน QR นิสิต
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ใช้ได้ทั้งคอมพิวเตอร์และมือถือ โดยมือถือจะพยายามใช้กล้องหลัง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={cameraStarting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2455A4] bg-white px-4 text-sm font-semibold text-[#2455A4] transition hover:bg-blue-50 disabled:cursor-wait disabled:border-slate-300 disabled:text-slate-400"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="h-4 w-4" />
                      ปิดกล้อง
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      {cameraStarting ? "กำลังเปิด..." : "เปิดกล้อง"}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => qrImageInputRef.current?.click()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2455A4] px-4 text-sm font-semibold text-white transition hover:bg-[#1B3F80]"
                >
                  <QrCode className="h-4 w-4" />
                  ถ่าย/เลือกภาพ QR
                </button>
                <p className="flex items-center text-xs leading-5 text-slate-500">
                  ใช้ปุ่มนี้เมื่อเปิดผ่าน HTTP เช่น miscis.scidi.tsu.ac.th:3086
                </p>
                <input
                  ref={qrImageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleQrImageChange}
                  className="hidden"
                />
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`aspect-video w-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />
                {!cameraActive && (
                  <div className="flex aspect-video w-full items-center justify-center px-6 text-center text-sm text-slate-300">
                    เปิดกล้องแล้วนำ QR ของนิสิตให้อยู่ในกรอบ
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {cameraError}
                </p>
              )}
            </div>

            <Field label="ข้อมูลจาก QR นิสิต">
              <textarea
                value={scanPayload}
                onChange={(e) => setScanPayload(e.target.value)}
                autoFocus
                placeholder="สแกน QR ด้วยเครื่องสแกน หรือวางข้อมูล QR ที่นิสิตแสดง"
                className="min-h-[120px] w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-[#2455A4] focus:ring-4 focus:ring-blue-100"
              />
            </Field>

            {scanMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {scanMessage}
              </div>
            )}
            {scanError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {scanError}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={closeScanModal}
              className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={submitScan}
              disabled={!scanActivityCode.trim() || !scanPayload.trim() || scanSubmitting}
              className="h-11 flex-1 rounded-xl bg-[#2455A4] text-sm font-semibold text-white transition hover:bg-[#1B3F80] disabled:bg-slate-300"
            >
              {scanSubmitting ? "กำลังบันทึก..." : "บันทึกการลงทะเบียน"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal แสดงรายชื่อผู้เข้าร่วม */}
      {showParticipantsModal && (
        <ModalShell
          title="รายชื่อผู้เข้าร่วมกิจกรรม"
          subtitle={
            <>
              กิจกรรม:{" "}
              <span className="font-medium text-slate-700">
                {activities.find((a) => a.id === selectedParticipantActivityId)?.title || ""}
              </span>
            </>
          }
          onClose={() => {
            setShowParticipantsModal(false);
            setParticipants([]);
            setSelectedParticipantActivityId(null);
          }}
          maxWidthClass="max-w-3xl"
          zIndexClass="z-[100]"
        >
          {loadingParticipants ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#2455A4]" />
              <span className="ml-2 text-slate-500">กำลังโหลด...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              ไม่มีผู้เข้าร่วม
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">ลำดับ</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">รหัสนิสิต</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">หลักสูตร</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">คะแนน</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, index) => (
                    <tr key={p.studentId} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.studentId}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {`${p.firstname || ""} ${p.lastname || ""}`.trim()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.program || "-"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[#2455A4]">
                        {p.earnedScore !== null && p.earnedScore !== undefined ? `${Number(p.earnedScore).toFixed(Number(p.earnedScore) % 1 === 0 ? 0 : 2)}/${Number(p.maxScore ?? 10).toFixed(Number(p.maxScore ?? 10) % 1 === 0 ? 0 : 2)}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowParticipantsModal(false);
                setParticipants([]);
                setSelectedParticipantActivityId(null);
              }}
              className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ปิด
            </button>
          </div>
        </ModalShell>
      )}

      <style jsx global>{`
        .staff-activity-input {
          height: 38px;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d7deea;
          background: #ffffff;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
          outline: none;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }
        .staff-activity-input:focus {
          border-color: #2455a4;
          box-shadow: 0 0 0 3px rgba(36, 85, 164, 0.1);
        }
        .staff-activity-input[type="date"]::-webkit-calendar-picker-indicator,
        .staff-activity-input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.4) sepia(1) hue-rotate(180deg);
        }
        .staff-activity-input option {
          color: #0f172a;
        }
      `}</style>
    </StaffShell>
  );
}
