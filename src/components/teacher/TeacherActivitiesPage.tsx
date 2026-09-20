// components/teacher/TeacherActivitiesPage.tsx
// แก้ไขแล้ว: แยก date/time, แสดงชั่วโมง:นาที, รองรับแก้ไขแบบประเมิน
"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  CameraOff,
  ClipboardList,
  FileWarning,
  KeyRound,
  Plus,
  ToggleLeft,
  ToggleRight,
  X,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  Edit,
  QrCode,
} from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";

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
type ActivityCategory = "all" | "mine" | "past" | "external";

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

type TeacherActivity = {
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
  createdBy?: string | null;
};

type ActivityForm = {
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

// ===== Helper functions =====
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

  // รองรับ YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  // รองรับ YYYY-MM-DDTHH:mm:ss...
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

function getActivityStartDateTime(activity: TeacherActivity): Date | null {
  if (!activity.date) return null;
  const date = String(activity.date).slice(0, 10);
  const time = String(activity.time || "00:00").slice(0, 5);
  return new Date(`${date}T${time}`);
}

function isExternalActivity(activity: TeacherActivity) {
  return activity.location === "กิจกรรมภายนอก";
}

function isActivityPast(activity: TeacherActivity, now: Date = new Date()) {
  const date = String(activity.endDate || activity.date || "").slice(0, 10);
  const time = String(activity.endTime || activity.time || "00:00").slice(0, 5);
  const activityEnd = new Date(`${date}T${time}`);
  return !Number.isNaN(activityEnd.getTime()) && activityEnd < now;
}

// ---------- helper components ----------
function ActivityPill({ skill }: { skill: ActivitySkill }) {
  return (
    <span className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#76B7F2] bg-white px-4 py-1.5 text-center text-[11px] font-medium text-slate-700 shadow-sm">
      {skill.name} : {skill.level}
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
      className={`inline-flex items-center rounded-full transition ${enabled ? "text-[#4598D0]" : "text-slate-400"}`}
      aria-label={
        enabled ? "ปิดการยืนยันการเข้าร่วม" : "เปิดการยืนยันการเข้าร่วม"
      }
    >
      <Icon className="h-8 w-14" />
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-800 sm:mb-2">
        {label}
      </span>
      {children}
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

// ---------- AddActivityModal (แก้ไข: แยก date/time, แสดงชั่วโมง:นาที) ----------
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
  const currentTime = getCurrentTime();

  const { hours, minutes } = calculateHoursMinutes(
    form.startDate,
    form.startTime,
    form.endDate,
    form.endTime,
  );
  const durationDisplay = formatHoursMinutes(hours, minutes);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/15 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[690px] max-h-[90vh] overflow-y-auto rounded-xl bg-[#EAF3FA] px-8 py-8 shadow-[0_26px_90px_rgba(15,23,42,0.18)] sm:px-12 sm:py-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/70 sm:right-6 sm:top-5"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0D47A1] sm:text-2xl">
            {isEditing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
          </h2>
          <div className="mx-auto mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
        </div>

        <form
          className="mx-auto mt-5 max-w-[520px] space-y-3 sm:mt-6 sm:space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <Field label="ชื่อกิจกรรม/อบรม">
            <input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              className="teacher-activity-input"
              required
            />
          </Field>

          <Field label="คำอธิบายกิจกรรม">
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              className="teacher-activity-input min-h-[100px] resize-none py-2.5 sm:min-h-[142px] sm:py-3"
            />
          </Field>

          {/* ===== วันที่และเวลา (แยกกัน) ===== */}
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            <Field label="วันที่เริ่มต้น">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
                min={today}
                className="teacher-activity-input"
                required
              />
            </Field>
            <Field label="เวลาเริ่มต้น">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => onChange("startTime", e.target.value)}
                step="60"
                className="teacher-activity-input"
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            <Field label="วันที่สิ้นสุด">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (form.startDate && val && val < form.startDate) return;
                  onChange("endDate", val);
                }}
                min={form.startDate || today}
                className="teacher-activity-input"
                required
              />
            </Field>
            <Field label="เวลาสิ้นสุด">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    form.startDate &&
                    form.startTime &&
                    val &&
                    !isValidEndDateTime(
                      form.startDate,
                      form.startTime,
                      form.endDate,
                      val,
                    )
                  ) {
                    // ไม่ต้องตั้งค่า
                    return;
                  }
                  onChange("endTime", val);
                }}
                step="60"
                className="teacher-activity-input"
                required
              />
            </Field>
          </div>

          <Field label="จำนวนชั่วโมงกิจกรรม">
            <input
              value={durationDisplay}
              className="teacher-activity-input bg-white/70 text-slate-700"
              placeholder="คำนวณอัตโนมัติ"
              readOnly
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            <Field label="ภาคเรียน">
              <select
                value={form.term}
                onChange={(e) => onChange("term", e.target.value)}
                className="teacher-activity-input appearance-none bg-white pr-8"
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
                className="teacher-activity-input"
              />
            </Field>
          </div>

          <Field label="จำนวนที่รับนิสิต">
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => onChange("capacity", e.target.value)}
              className="teacher-activity-input"
              placeholder="เช่น 30"
              required
            />
          </Field>

          <Field label="ผู้จัดกิจกรรม">
            <input
              value={form.organizer}
              onChange={(e) => onChange("organizer", e.target.value)}
              className="teacher-activity-input"
              placeholder="คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล"
            />
          </Field>

          <div className="rounded-lg border border-blue-100 bg-white/60 p-4">
            <p className="text-sm font-semibold text-slate-800">
              ช่วงเวลาลงทะเบียน
            </p>
            <p className="mt-1 text-xs text-slate-500">
              นิสิตต้องลงทะเบียนในช่วงเวลานี้ก่อนจึงจะยืนยันการเข้าร่วมได้
            </p>
<div className="mt-3 grid gap-4 sm:grid-cols-2">
  <Field label="เริ่มลงทะเบียน">
    <input
      type="datetime-local"
      value={form.registrationStart}
      onChange={(e) => {
        const value = e.target.value;

        // เริ่มลงทะเบียนต้องไม่เกินเวลาสิ้นสุดลงทะเบียน
        if (
          form.registrationEnd &&
          value &&
          value >= form.registrationEnd
        ) {
          return;
        }

        // เริ่มลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม
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
      min={`${today}T00:00`}
      max={
          form.endDate && form.endTime
            ? `${form.endDate}T${form.endTime}`
            : undefined
        }
      className="teacher-activity-input"
    />
  </Field>

  <Field label="สิ้นสุดลงทะเบียน">
    <input
      type="datetime-local"
      value={form.registrationEnd}
      onChange={(e) => {
        const value = e.target.value;

        // สิ้นสุดลงทะเบียนต้องหลังเริ่มลงทะเบียน
        if (
          form.registrationStart &&
          value &&
          value <= form.registrationStart
        ) {
          return;
        }

        // สิ้นสุดลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม
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
      min={
        form.registrationStart || `${today}T00:00`
      }
      max={
        form.endDate && form.endTime
          ? `${form.endDate}T${form.endTime}`
          : undefined
      }
      className="teacher-activity-input"
    />
  </Field>
</div>
          </div>

          <Field label="แม่แบบเกียรติบัตร (ใบเซอร์)">
            <select
              value={form.templateId || ""}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="teacher-activity-input appearance-none bg-white pr-8"
            >
              <option value="">-- ไม่ระบุ --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              เลือกแม่แบบเพื่อใช้สร้างเกียรติบัตรให้ผู้เข้าร่วม
            </p>
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
                        ? "border-[#1565C0] bg-blue-50"
                        : "border-blue-100 bg-white hover:border-blue-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`skill-${skill.skillId}`}
                      checked={isSelected}
                      onChange={() => onToggleSkill(skill.skillId)}
                      className="h-4 w-4 rounded border-blue-300 text-[#1565C0] focus:ring-[#1565C0]"
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
                        className="h-8 rounded-lg border border-blue-200 bg-white px-2 text-sm outline-none focus:border-[#1565C0]"
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

          <div className="pt-4 text-center sm:pt-6">
            <button
              type="submit"
              className="h-10 w-full max-w-[390px] rounded-lg bg-[#4598D0] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1565C0] sm:h-11 sm:text-base"
            >
              {isEditing ? "อัปเดตกิจกรรม" : "เพิ่มกิจกรรม"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  activity: TeacherActivity;
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-950">
            {isEditing ? "แก้ไขแบบประเมินความรู้" : "สร้างแบบประเมินความรู้"}
          </h2>
          <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
          <p className="mt-2 text-sm text-slate-500">
            กิจกรรม: <span className="font-medium">{activity.title}</span>
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="rounded-xl border border-blue-100 bg-blue-50/30 p-4"
            >
              {/* คำถาม */}
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
                    className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 resize-y min-h-[60px]"
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

              {/* ตัวเลือก */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700">
                  ตัวเลือก (คลิกที่ตัวเลือกเพื่อเลือกเป็นคำตอบที่ถูกต้อง)
                </label>
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2 transition cursor-pointer ${
                      q.correctAnswer === optIndex
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                        : "border-blue-200 bg-white hover:border-blue-400"
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
                  className="mt-2 text-sm text-[#1565C0] hover:underline"
                >
                  + เพิ่มตัวเลือก
                </button>
              </div>

              {/* ทักษะที่เกี่ยวข้อง */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700">
                  ทักษะที่เกี่ยวข้อง (เลือกได้หลายทักษะ)
                </label>
                <div className="mt-1 flex flex-wrap gap-3">
                  {skillOptions.length > 0 ? (
                    skillOptions.map((skill) => (
                      <label
                        key={skill}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={(q.skillNames || []).includes(skill)}
                          onChange={() => toggleSkill(q.id, skill)}
                          className="h-4 w-4 rounded border-blue-300 text-[#1565C0] focus:ring-[#1565C0]"
                        />
                        <span>{skill}</span>
                      </label>
                    ))
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
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#1565C0] px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" /> เพิ่มคำถาม
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[#1565C0] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D47A1]"
          >
            {isEditing ? "อัปเดตแบบประเมิน" : "บันทึกแบบประเมิน"}
          </button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1565C0]">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            {code ? "รหัสยืนยันการเข้าร่วม" : "ยังไม่มีรหัสยืนยัน"}
          </h2>
          <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-[#FFC107]" />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 text-center">
            <p className="text-sm text-slate-500">รหัสยืนยัน</p>
            {code ? (
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-[#1565C0]">
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
                className="inline-flex items-center gap-2 rounded-lg border border-[#1565C0] bg-white px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
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
                className="flex-1 h-11 rounded-xl border border-[#1565C0] text-sm font-semibold text-[#1565C0] transition hover:bg-blue-50 disabled:opacity-50"
              >
                {isRegenerating ? "กำลังสร้าง..." : "สร้างรหัสใหม่"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`${code ? "flex-1" : "w-full"} h-11 rounded-xl bg-[#1565C0] text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]`}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function StaffActivitiesPage() {
  const [activities, setActivities] = useState<TeacherActivity[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityCategory>("mine");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [evaluationActivity, setEvaluationActivity] =
    useState<TeacherActivity | null>(null);
  const [editingEvaluationActivity, setEditingEvaluationActivity] =
    useState<TeacherActivity | null>(null);
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
  const [scanActivity, setScanActivity] = useState<TeacherActivity | null>(null);
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

  // State สำหรับแก้ไขกิจกรรม
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<TeacherActivity | null>(
    null,
  );
  const [editForm, setEditForm] = useState<ActivityForm>(emptyForm);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
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
      const res = await fetch("/api/staff/templates");
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
      const res = await fetch("/api/auth/session");
      if (!res.ok) return;
      const session = await res.json();
      setCurrentUserId(session?.user?.id ? String(session.user.id) : null);
    } catch (err) {
      console.error(err);
      setCurrentUserId(null);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activities");
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

  // แบ่งกิจกรรมเป็น 3 มุมมองหลัก โดยเน้นกิจกรรมที่เจ้าหน้าที่บัญชีปัจจุบันเป็นผู้สร้าง
  const activityCategories: Array<{ key: ActivityCategory; label: string }> = [
    { key: "all", label: "กิจกรรมทั้งหมด" },
    { key: "mine", label: "กิจกรรมที่สร้างโดยฉัน" },
    { key: "past", label: "กิจกรรมที่สิ้นสุดแล้ว" },
    { key: "external", label: "กิจกรรมที่นิสิตขอเพิ่ม" },
  ];

  const matchesActivityCategory = useCallback(
    (activity: TeacherActivity, category: ActivityCategory) => {
      if (category === "mine") {
        return Boolean(
          currentUserId && activity.createdBy === currentUserId,
        );
      }

      if (category === "past") {
        return isActivityPast(activity);
      }

      if (category === "external") {
        return isExternalActivity(activity);
      }

      return true;
    },
    [currentUserId],
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

        const updateRes = await fetch("/api/activities/workflow", {
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
        const updateRes = await fetch("/api/activities/workflow", {
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
    const res = await fetch("/api/activities/workflow", {
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

  const openScanModal = (activity: TeacherActivity) => {
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
      const res = await fetch(`/api/activities/${scanActivity.id}/scan-qr`, {
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

  // ===== สร้างกิจกรรม (ปรับ payload) =====
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

      // ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม
      if (registrationStartObj > endDateObj || registrationEndObj > endDateObj) {
        throw new Error(
          "ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม",
        );
      }

      const payload = {
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

      const res = await fetch("/api/activities", {
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
      const res = await fetch(`/api/activities/${activityId}`, {
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

  // ===== แก้ไขกิจกรรม (ปรับ payload) =====
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

      // ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม
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

      const res = await fetch(`/api/activities/${editingActivity.id}`, {
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

  const showVerificationCode = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    if (activity.verificationCode) {
      setModalActivityId(activityId);
      setShowCodeModal(true);
      return;
    }
    setGeneratingId(activityId);
    try {
      const res = await fetch(`/api/activities/${activityId}/generate-code`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "สร้างรหัสไม่สำเร็จ");
      }
      const data = await res.json();
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                verificationCode: data.code,
                codeExpiresAt: data.expiresAt,
              }
            : a,
        ),
      );
      setModalActivityId(activityId);
      setShowCodeModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setGeneratingId(null);
    }
  };

  const regenerateCode = async () => {
    if (!modalActivityId) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(
        `/api/activities/${modalActivityId}/generate-code`,
        { method: "POST" },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "สร้างรหัสไม่สำเร็จ");
      }
      const data = await res.json();
      setActivities((prev) =>
        prev.map((a) =>
          a.id === modalActivityId
            ? {
                ...a,
                verificationCode: data.code,
                codeExpiresAt: data.expiresAt,
              }
            : a,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleViewParticipants = async (activityId: string) => {
    setSelectedParticipantActivityId(activityId);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/participants`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดรายชื่อผู้เข้าร่วม");
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // ---------- แก้ไขกิจกรรม ----------
  const handleEdit = (activity: TeacherActivity) => {
    setEditingActivity(activity);

    setEditForm({
      title: activity.title,
      description: activity.description,

      // แปลงให้เป็น YYYY-MM-DD สำหรับ input type="date"
      startDate: toDateInputValue(activity.date),
      startTime: activity.time ? String(activity.time).slice(0, 5) : "",

      // แปลงให้เป็น YYYY-MM-DD สำหรับ input type="date"
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

  const handleDelete = async (activityId: string) => {
    if (
      !confirm(
        "คุณต้องการลบกิจกรรมนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้",
      )
    )
      return;
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
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

  // ---------- ฟอร์ม ----------
  const handleFormChange = (field: keyof ActivityForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // ตรวจสอบความถูกต้องของ endDate/endTime
      if (field === "startDate" || field === "startTime") {
        // ถ้า endDate/endTime มีอยู่แล้วและไม่ถูกต้อง ให้เคลียร์
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
            // ถ้าไม่ถูกต้อง ให้คืนค่าเดิม (ไม่เปลี่ยนแปลง)
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

  const modalActivity = modalActivityId
    ? activities.find((a) => a.id === modalActivityId)
    : null;

  // ===== ฟังก์ชันแปลง hours เป็นชั่วโมง:นาที =====
  const formatActivityHours = (hours: number | null | undefined): string => {
    if (hours === null || hours === undefined || hours === 0) return "";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return formatHoursMinutes(h, m);
  };

  return (
    <TeacherShell activePath="/staff/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-slate-200 bg-white px-4 py-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:px-7 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              จัดการกิจกรรมและการอบรม
            </h1>
            <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
            <p className="mt-3 text-sm text-slate-500">
              สร้างและจัดการกิจกรรมทั้งหมด
            </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1565C0] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <Plus className="h-5 w-5" /> เพิ่มกิจกรรมใหม่
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 border-b border-slate-200">
            <nav
              className="flex gap-1 overflow-x-auto"
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
                    className={`relative whitespace-nowrap rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-50 text-[#1565C0]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                        isActive
                          ? "bg-[#1565C0] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {categoryCounts[category.key]}
                    </span>
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#1565C0]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {loading ? (
            <div className="mt-8 text-center text-slate-500">กำลังโหลด...</div>
          ) : (
            <div className="mt-7 space-y-5">
              {filteredActivities.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  ไม่มีกิจกรรมในหมวดนี้
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <article
                    key={activity.id}
                    className="grid gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] lg:grid-cols-3 xl:grid-cols-[2fr_1.05fr_1fr_1fr_1fr]"
                  >
                    <div className="flex min-h-[150px] flex-col justify-start border-b border-slate-100 p-5 lg:border-b-0 lg:border-r xl:p-5">
                      <h2 className="text-base font-semibold leading-6 text-slate-950">
                        {activity.title}
                      </h2>
                      <p className="mt-2 inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#1565C0]">
                        รหัสกิจกรรม: {activity.id}
                      </p>
                      <div className="mt-4 flex gap-3 text-xs leading-5 text-slate-500">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p>
                            {activity.date
                              ? new Date(activity.date).toLocaleDateString(
                                  "th-TH",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )
                              : "ไม่ระบุวันที่"}
                          </p>
                          <p>
                            {activity.time
                              ? new Date(
                                  `2000-01-01T${activity.time}`,
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " น."
                              : "ไม่ระบุเวลา"}
                            {activity.endTime
                              ? ` - ${new Date(
                                  `2000-01-01T${activity.endTime}`,
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} น.`
                              : ""}
                          </p>
                          {activity.hours ? (
                            <p className="mt-1 text-[#1565C0]">
                              {formatActivityHours(activity.hours)}
                            </p>
                          ) : null}
                          <p className="mt-2 font-medium text-slate-700">
                            รับ {activity.capacity || 0} คน • สมัครแล้ว {activity.attendeeCount || 0}/{activity.capacity || 0} คน
                          </p>
                        </div>
                      </div>
                      {!isExternalActivity(activity) && (
                        <>
                          {/* แสดงปุ่มสร้าง/แก้ไขแบบประเมิน */}
                          {!activity.hasEvaluation ? (
                            <p className="mt-3 flex items-center gap-1 text-[10px] text-red-500">
                              <FileWarning className="h-3 w-3" />
                              ยังไม่มีแบบประเมินความรู้
                              <button
                                type="button"
                                onClick={() => setEvaluationActivity(activity)}
                                className="ml-1 text-[#1565C0] underline underline-offset-2 hover:text-[#0D47A1]"
                              >
                                สร้างแบบประเมิน
                              </button>
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingEvaluationActivity(activity)}
                              className="mt-3 text-xs text-[#1565C0] underline underline-offset-2 hover:text-[#0D47A1]"
                            >
                              แก้ไขแบบประเมิน
                            </button>
                          )}
                          {activity.verificationCode &&
                            activity.confirmationEnabled && (
                              <p className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                                <KeyRound className="h-3 w-3" />
                                รหัสเดิม:{" "}
                                <span className="font-mono font-bold">
                                  {activity.verificationCode}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  (เปิดอยู่)
                                </span>
                              </p>
                            )}

                        </>
                      )}
                      {!isExternalActivity(activity) &&
                        activity.verificationCode &&
                        !activity.confirmationEnabled && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <KeyRound className="h-3 w-3" /> รหัสถูกซ่อน
                            (ปิดการมองเห็น)
                          </p>
                        )}
                    </div>

                    <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r xl:p-5">
                      <p className="mb-5 text-sm font-bold text-slate-950">
                        ทักษะ:
                      </p>
                      <div className="flex flex-col items-start gap-3">
                        {activity.skills.length > 0 ? (
                          activity.skills.map((skill, index) => (
                            <ActivityPill
                              key={`${activity.id}-${index}`}
                              skill={skill}
                            />
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            ยังไม่ได้กำหนดทักษะ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r xl:p-5">
                      <p className="mb-2 text-sm font-bold text-slate-950">
                        เปิดรับสมัคร
                      </p>
                      <p className="text-lg font-semibold text-slate-900">
                        {activity.attendeeCount}/{activity.capacity} คน
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        สมัครแล้ว / จำนวนที่รับ
                      </p>
                      <ToggleSwitch
                        enabled={Boolean(activity.applicationEnabled)}
                        onClick={() => updateWorkflow(activity.id, "applicationEnabled")}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {activity.applicationEnabled ? "เปิดรับสมัครอยู่" : "ปิดรับสมัคร"}
                      </p>
                    </div>

                    <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r xl:p-5">
                      <p className="mb-2 text-sm font-bold text-slate-950">
                        ลงทะเบียนนิสิต
                      </p>
                      <p className="text-lg font-semibold text-slate-900">
                        {activity.attendeeCount} คน
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        จำนวนผู้ลงทะเบียนเข้าร่วม
                      </p>
                      <button
                        type="button"
                        onClick={() => openScanModal(activity)}
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#1565C0] bg-white px-3 text-xs font-semibold text-[#1565C0] transition hover:bg-blue-50"
                      >
                        <QrCode className="h-4 w-4" />
                        สแกน QR นิสิต
                      </button>
                    </div>

                    {!isExternalActivity(activity) && (
                      <div className="border-blue-100 lg:border-l p-5">
                        <p className="mb-2 text-sm font-bold text-slate-950">
                          เปิด/ปิดแบบประเมิน
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {activity.evaluationCompletedCount} คน
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ทำแบบประเมินแล้ว
                        </p>
                        <ToggleSwitch
                          enabled={activity.confirmationEnabled}
                          onClick={() => updateConfirmation(activity.id)}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {activity.confirmationEnabled ? "เปิดแบบประเมิน" : "ปิดแบบประเมิน"}
                        </p>
                      </div>
                    )}
                      {/* ปุ่มแก้ไขและลบ */}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(activity)}
                          disabled={activity.hasConfirmedParticipants}
                          title={
                            activity.hasConfirmedParticipants
                              ? "มีนิสิตยืนยันการเข้าร่วมแล้ว"
                              : undefined
                          }
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[#1565C0] bg-white px-2 text-xs font-medium text-[#1565C0] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <Edit className="h-3.5 w-3.5" /> แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(activity.id)}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-red-300 bg-white px-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> ลบ
                        </button>
                      </div>
                  </article>
                ))
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
      {showCodeModal && modalActivity && (
        <VerificationCodeModal
          code={modalActivity.verificationCode || ""}
          expiresAt={modalActivity.codeExpiresAt || new Date().toISOString()}
          onClose={() => {
            setShowCodeModal(false);
            setModalActivityId(null);
          }}
          onRegenerate={regenerateCode}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Modal สแกน QR นิสิต */}
      {scanActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={closeScanModal}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
              <h2 className="text-2xl font-semibold text-slate-950">
                สแกน QR ลงทะเบียน
              </h2>
              <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
              <p className="mt-3 text-sm text-slate-500">
                {scanActivity.title}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="รหัสกิจกรรม">
                <input
                  value={scanActivityCode}
                  onChange={(e) => setScanActivityCode(e.target.value)}
                  className="teacher-activity-input bg-white"
                />
              </Field>

              <div className="rounded-2xl border border-blue-100 bg-slate-50 p-3">
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1565C0] bg-white px-4 text-sm font-semibold text-[#1565C0] transition hover:bg-blue-50 disabled:cursor-wait disabled:border-slate-300 disabled:text-slate-400"
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-4 text-sm font-semibold text-white transition hover:bg-[#0D47A1]"
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

                <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-slate-900">
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

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  ข้อมูลจาก QR นิสิต
                </span>
                <textarea
                  value={scanPayload}
                  onChange={(e) => setScanPayload(e.target.value)}
                  autoFocus
                  placeholder="สแกน QR ด้วยเครื่องสแกน หรือวางข้อมูล QR ที่นิสิตแสดง"
                  className="min-h-[140px] w-full resize-none rounded-lg border border-[#7bbaf2] bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-blue-100"
                />
              </label>

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
                className="h-11 flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={submitScan}
                disabled={!scanActivityCode.trim() || !scanPayload.trim() || scanSubmitting}
                className="h-11 flex-1 rounded-xl bg-[#1565C0] text-sm font-semibold text-white transition hover:bg-[#0D47A1] disabled:bg-slate-300"
              >
                {scanSubmitting ? "กำลังบันทึก..." : "บันทึกการลงทะเบียน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แสดงรายชื่อผู้เข้าร่วม */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => {
                setShowParticipantsModal(false);
                setParticipants([]);
                setSelectedParticipantActivityId(null);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">
                รายชื่อผู้เข้าร่วมกิจกรรม
              </h2>
              <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
              <p className="mt-2 text-sm text-slate-500">
                กิจกรรม:{" "}
                <span className="font-medium">
                  {activities.find(
                    (a) => a.id === selectedParticipantActivityId,
                  )?.title || ""}
                </span>
              </p>
            </div>

            {loadingParticipants ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#1565C0]" />
                <span className="ml-2 text-slate-500">กำลังโหลด...</span>
              </div>
            ) : participants.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                ไม่มีผู้เข้าร่วม
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-blue-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        ลำดับ
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        รหัสนิสิต
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        หลักสูตร
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-slate-500">
                        คะแนน
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, index) => (
                      <tr
                        key={p.studentId}
                        className="border-b border-blue-50/50 transition hover:bg-blue-50/30"
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {p.studentId}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {`${p.firstname || ""} ${p.lastname || ""}`.trim()}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {p.program || "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[#1565C0]">
                          {p.score !== null && p.score !== undefined
                            ? Number(p.score).toFixed(1)
                            : "-"}
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
                className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .teacher-activity-input {
          height: 38px;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #7bbaf2;
          background: transparent;
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
        .teacher-activity-input:focus {
          border-color: #1565c0;
          background: rgba(255, 255, 255, 0.38);
          box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
        }
        .teacher-activity-input[type="date"]::-webkit-calendar-picker-indicator,
        .teacher-activity-input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.4) sepia(1) hue-rotate(180deg);
        }
        .teacher-activity-input option {
          color: #0f172a;
        }
      `}</style>
    </TeacherShell>
  );
}