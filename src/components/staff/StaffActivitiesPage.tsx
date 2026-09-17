// components/staff/StaffActivitiesPage.tsx
// แก้ไขแล้ว: แยก date/time, แสดงชั่วโมง:นาที, รองรับแก้ไขแบบประเมิน
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
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
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

type ActivityStatus = "active" | "past";

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
  hasConfirmedParticipants?: boolean;
  confirmationEnabled: boolean;
  registrationEnabled: boolean;
  hasEvaluation: boolean;
  status: ActivityStatus;
  skills: ActivitySkill[];
  evaluation?: EvaluationQuestion[];
  verificationCode?: string | null;
  codeExpiresAt?: string | null;
  templateId?: string | null;
  registrationStart?: string | null;
  registrationEnd?: string | null;
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

function getActivityStartDateTime(activity: StaffActivity): Date | null {
  if (!activity.date) return null;
  const date = String(activity.date).slice(0, 10);
  const time = String(activity.time || "00:00").slice(0, 5);
  return new Date(`${date}T${time}`);
}

function getRegistrationWindowStatus(
  activity: StaffActivity,
  now: Date = new Date(),
) {
  const activityStart = getActivityStartDateTime(activity);
  if (!activityStart) {
    return {
      normalOpen: false,
      emergencyOpen: false,
      open: false,
      label: "ไม่สามารถตรวจสอบเวลาได้",
    };
  }

  if (now >= activityStart) {
    return {
      normalOpen: false,
      emergencyOpen: false,
      open: false,
      label: "กิจกรรมเริ่มแล้ว",
    };
  }

  const registrationStart = activity.registrationStart
    ? new Date(String(activity.registrationStart).replace(" ", "T"))
    : null;
  const registrationEnd = activity.registrationEnd
    ? new Date(String(activity.registrationEnd).replace(" ", "T"))
    : null;

  const normalOpen = Boolean(
    registrationStart &&
      registrationEnd &&
      now >= registrationStart &&
      now < registrationEnd &&
      now < activityStart,
  );

  const emergencyOpen = Boolean(activity.registrationEnabled && now < activityStart);

  return {
    normalOpen,
    emergencyOpen,
    open: normalOpen || emergencyOpen,
    label: emergencyOpen
      ? "เปิดด้วย Emergency Override"
      : normalOpen
        ? "เปิดตามช่วงเวลาอัตโนมัติ"
        : registrationStart && now < registrationStart
          ? "ยังไม่ถึงเวลาเปิด"
          : registrationEnd && now >= registrationEnd
            ? "หมดเวลาลงทะเบียน"
            : "ปิดการลงทะเบียน",
  };
}

function formatRegistrationDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-2 pb-2 text-sm font-semibold transition ${
        active ? "text-[#1565C0]" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1565C0]" />
      )}
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
              className="staff-activity-input"
              required
            />
          </Field>

          <Field label="คำอธิบายกิจกรรม">
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              className="staff-activity-input min-h-[100px] resize-none py-2.5 sm:min-h-[142px] sm:py-3"
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
                className="staff-activity-input"
                required
              />
            </Field>
            <Field label="เวลาเริ่มต้น">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => onChange("startTime", e.target.value)}
                step="60"
                className="staff-activity-input"
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
                className="staff-activity-input"
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
                className="staff-activity-input"
                required
              />
            </Field>
          </div>

          <Field label="จำนวนชั่วโมงกิจกรรม">
            <input
              value={durationDisplay}
              className="staff-activity-input bg-white/70 text-slate-700"
              placeholder="คำนวณอัตโนมัติ"
              readOnly
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
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
          </div>

          <Field label="ผู้จัดกิจกรรม">
            <input
              value={form.organizer}
              onChange={(e) => onChange("organizer", e.target.value)}
              className="staff-activity-input"
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

        // เริ่มลงทะเบียนต้องก่อนเวลาเริ่มกิจกรรม
        if (
          form.startDate &&
          form.startTime &&
          value &&
          value >= `${form.startDate}T${form.startTime}`
        ) {
          return;
        }

        onChange("registrationStart", value);
      }}
      min={`${today}T00:00`}
      max={
        form.startDate && form.startTime
          ? form.registrationEnd &&
            form.registrationEnd < `${form.startDate}T${form.startTime}`
            ? form.registrationEnd
            : `${form.startDate}T${form.startTime}`
          : form.registrationEnd || undefined
      }
      className="staff-activity-input"
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

        // สิ้นสุดลงทะเบียนต้องก่อนเวลาเริ่มกิจกรรม
        if (
          form.startDate &&
          form.startTime &&
          value &&
          value >= `${form.startDate}T${form.startTime}`
        ) {
          return;
        }

        onChange("registrationEnd", value);
      }}
      min={
        form.registrationStart || `${today}T00:00`
      }
      max={
        form.startDate && form.startTime
          ? `${form.startDate}T${form.startTime}`
          : undefined
      }
      className="staff-activity-input"
    />
  </Field>
</div>
          </div>

          <Field label="แม่แบบเกียรติบัตร (ใบเซอร์)">
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
        "กรุณากรอกข้อมูลให้ครบถ้วน: คำถาม, ตัวเลือก (อย่างน้อย 2 ตัว), และเลือกทักษะอย่างน้อย 1 ตัว",
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
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityStatus>("active");
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

  // อัปเดตสถานะลงทะเบียนทุก 30 วินาที เพื่อให้หน้าเจ้าหน้าที่สะท้อนเวลาจริง
  const [registrationNow, setRegistrationNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRegistrationNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  // State สำหรับแก้ไขกิจกรรม
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<StaffActivity | null>(
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
    fetchSkills();
    fetchTemplates();
    fetchActivities();
  }, [fetchSkills, fetchTemplates, fetchActivities]);

  const filteredActivities = useMemo(
    () => activities.filter((activity) => activity.status === activeTab),
    [activities, activeTab],
  );

  // ---------- กิจกรรม ----------
  const updateConfirmation = async (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    const newVal = !activity.confirmationEnabled;

    try {
      if (newVal && activity.hasEvaluation) {
        const res = await fetch(`/api/activities/${activityId}/generate-code`, {
          method: "POST",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "สร้างรหัสไม่สำเร็จ");
        }
        const data = await res.json();

        const updateRes = await fetch(`/api/activities/${activityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmationEnabled: true,
            verificationCode: data.code,
            codeExpiresAt: data.expiresAt,
            status: "active",
          }),
        });
        if (!updateRes.ok) throw new Error("อัปเดตไม่สำเร็จ");

        await fetchActivities();
        setModalActivityId(activityId);
        setShowCodeModal(true);
      } else {
        const updateRes = await fetch(`/api/activities/${activityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmationEnabled: false,
            verificationCode: null,
            codeExpiresAt: null,
            status: "past",
          }),
        });
        if (!updateRes.ok) throw new Error("อัปเดตไม่สำเร็จ");

        await fetchActivities();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };
const updateRegistration = async (activityId: string) => {
  const activity = activities.find((item) => item.id === activityId);
  if (!activity) return;

  const activityStart = getActivityStartDateTime(activity);
  if (!activityStart) {
    alert("ไม่สามารถตรวจสอบเวลาเริ่มกิจกรรมได้");
    return;
  }

  const now = new Date();
  const newValue = !activity.registrationEnabled;

  // ปิด Emergency Override ได้ตลอด
  if (!newValue) {
    const res = await fetch(`/api/activities/${activityId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registrationEnabled: false,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.message || "ปิด Emergency Override ไม่สำเร็จ",
      );
    }

    await fetchActivities();
    return;
  }

  // ห้ามเปิด Emergency Override หลังเริ่มกิจกรรม
  if (now >= activityStart) {
    alert(
      "ไม่สามารถเปิด Emergency Override ได้ เนื่องจากกิจกรรมเริ่มแล้ว",
    );
    return;
  }

  const res = await fetch(`/api/activities/${activityId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registrationEnabled: true,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.message || "เปิด Emergency Override ไม่สำเร็จ",
    );
  }

  await fetchActivities();
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
      if (
        new Date(form.registrationEnd) <= new Date(form.registrationStart) ||
        new Date(form.registrationEnd) >= startDateObj
      ) {
        throw new Error(
          "เวลาสิ้นสุดลงทะเบียนต้องอยู่หลังเวลาเริ่มลงทะเบียนและก่อนเวลาเริ่มกิจกรรม",
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
      await fetchActivities();
      setForm(emptyForm);
      setIsModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  // ===== บันทึกแบบประเมิน =====
  const saveEvaluation = async (
    evaluation: EvaluationQuestion[],
    activityId: string,
  ) => {
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
      if (
        new Date(editForm.registrationEnd) <=
          new Date(editForm.registrationStart) ||
        new Date(editForm.registrationEnd) >= startDateObj
      ) {
        throw new Error(
          "เวลาสิ้นสุดลงทะเบียนต้องอยู่หลังเวลาเริ่มลงทะเบียนและก่อนเวลาเริ่มกิจกรรม",
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
  const handleEdit = (activity: StaffActivity) => {
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
    <StaffShell activePath="/staff/activities">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 px-4 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:px-10">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              จัดการกิจกรรมและการอบรม
            </h1>
            <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
            <p className="mt-3 text-sm text-slate-500">
              สร้างและจัดการกิจกรรมทั้งหมด
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-12 inline-flex h-11 items-center justify-center gap-2 rounded bg-[#1565C0] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D47A1]"
          >
            <Plus className="h-5 w-5" /> เพิ่มกิจกรรมใหม่
          </button>

          <div className="mt-5 flex gap-8 border-b border-transparent">
            <TabButton
              active={activeTab === "active"}
              onClick={() => setActiveTab("active")}
            >
              กิจกรรมที่กำลังดำเนิน
            </TabButton>
            <TabButton
              active={activeTab === "past"}
              onClick={() => setActiveTab("past")}
            >
              กิจกรรมที่ผ่านมาแล้ว
            </TabButton>
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
                    className="grid gap-4 rounded-xl border border-blue-100 bg-white px-8 py-4 shadow-[0_8px_18px_rgba(21,101,192,0.16)] lg:grid-cols-[1.05fr_1.18fr_0.75fr_0.8fr_1.05fr]"
                  >
                    <div className="flex min-h-[96px] flex-col justify-center">
                      <h2 className="text-sm font-bold text-slate-950">
                        {activity.title}
                      </h2>
                      <div className="mt-6 flex gap-3 text-xs leading-5 text-slate-500">
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
                        </div>
                      </div>
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
                            รหัส:{" "}
                            <span className="font-mono font-bold">
                              {activity.verificationCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (เปิดอยู่)
                            </span>
                          </p>
                        )}
                      {activity.verificationCode &&
                        !activity.confirmationEnabled && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <KeyRound className="h-3 w-3" /> รหัสถูกซ่อน
                            (ปิดการมองเห็น)
                          </p>
                        )}
                    </div>

                    <div className="border-blue-100 lg:border-l lg:px-7">
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

                    <div className="border-blue-100 lg:border-l lg:px-5">
                      <p className="mb-5 text-sm font-bold text-slate-950">
                        รายชื่อ (คน)
                      </p>
                      <p className="text-sm text-slate-700">
                        {activity.attendeeCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleViewParticipants(activity.id)}
                            className="mr-3 text-[#1565C0] underline underline-offset-2 hover:text-[#0D47A1]"
                          >
                            {activity.attendeeCount}
                          </button>
                        )}
                        คน
                      </p>
                    </div>

                    <div className="border-blue-100 lg:border-l lg:pl-5">
                      {(() => {
                        const registration = getRegistrationWindowStatus(
                          activity,
                          registrationNow,
                        );

                        return (
                          <>
                            <p className="mb-2 text-sm font-bold text-slate-950">
                              Emergency Override
                            </p>

                            <ToggleSwitch
                              enabled={activity.registrationEnabled}
                              onClick={() => updateRegistration(activity.id)}
                            />

                            <p className="mt-2 text-xs font-medium text-slate-700">
                              {registration.label}
                            </p>

                            <div className="mt-2 space-y-1 text-[11px] leading-4 text-slate-500">
                              <p>
                                ช่วงเวลาปกติ: {formatRegistrationDateTime(
                                  activity.registrationStart,
                                )}
                                {activity.registrationEnd
                                  ? ` - ${formatRegistrationDateTime(
                                      activity.registrationEnd,
                                    )}`
                                  : ""}
                              </p>
                              <p>
                                {activity.registrationEnabled
                                  ? "เปิดรับฉุกเฉินนอกช่วงเวลาได้ จนถึงก่อนเริ่มกิจกรรม"
                                  : "ระบบเปิด/ปิดตามช่วงเวลาที่กำหนดอัตโนมัติ"}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-blue-100 lg:border-l lg:pl-5">
                      <p className="mb-2 text-sm font-bold text-slate-950">
                        ยืนยันการเข้าร่วม
                      </p>
                      <ToggleSwitch
                        enabled={activity.confirmationEnabled}
                        onClick={() => updateConfirmation(activity.id)}
                      />
                      <button
                        type="button"
                        disabled={
                          !activity.hasEvaluation ||
                          !activity.confirmationEnabled
                        }
                        onClick={() => showVerificationCode(activity.id)}
                        className={`mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                          activity.hasEvaluation && activity.confirmationEnabled
                            ? "border-[#1565C0] bg-white text-[#1565C0] hover:bg-blue-50"
                            : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {generatingId === activity.id ? (
                          "กำลังสร้าง..."
                        ) : !activity.hasEvaluation ? (
                          <>
                            <ClipboardList className="h-4 w-4" />{" "}
                            ต้องมีแบบประเมินก่อน
                          </>
                        ) : !activity.confirmationEnabled ? (
                          <>
                            <ClipboardList className="h-4 w-4" />{" "}
                            ต้องเปิดการยืนยันก่อน
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-4 w-4" />
                            {activity.verificationCode
                              ? "ดูรหัสยืนยัน"
                              : "สร้างรหัสยืนยันการเข้าร่วม"}
                          </>
                        )}
                      </button>

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
        .staff-activity-input {
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
        .staff-activity-input:focus {
          border-color: #1565c0;
          background: rgba(255, 255, 255, 0.38);
          box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
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
