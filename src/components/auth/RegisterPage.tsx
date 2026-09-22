// components/auth/RegisterPage.tsx
"use client";
import { apiPath } from "@/lib/api-path";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  Plus,
  UserRound,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type TeacherOption = {
  userId: string;
  name: string;
  email: string;
  role: string;
  position: string;
  faculty: string;
  program: string;
};

// โครงสร้างหลักสูตรและวิชาเอก
type Program = {
  name: string;
  majors: string[];
};

const PROGRAMS: Program[] = [
  {
    name: "วิทยาการคอมพิวเตอร์และสารสนเทศ",
    majors: ["วิทยาการดิจิทัล", "วิทยาการข้อมูล"],
  },
  {
    name: "วิทยาศาสตร์และนวัตกรรม",
    majors: ["เคมี", "ฟิสิกส์และวัสดุศาสตร์", "สิ่งแวดล้อม"],
  },
  {
    name: "คณิตศาสตร์และการจัดการข้อมูล",
    majors: ["คณิตศาสตร์", "การจัดการและการวิเคราะห์ข้อมูล"],
  },
  {
    name: "ชีววิทยาศาสตร์",
    majors: ["จุลชีววิทยาและเทคโนโลยีจุลินทรีย์", "ชีววิทยา", "วิทยาศาสตร์ชีวการแพทย์"],
  },
  {
    name: "ดิจิทัลและปัญญาประดิษฐ์ทางการแพทย์",
    majors: [],
  },
  {
    name: "เทคโนโลยีชีวภาพ",
    majors: [],
  },
];

// ฟังก์ชันคำนวณปีการศึกษาและชั้นปี
function getCurrentAcademicYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  return currentMonth < 6 ? currentYear - 1 : currentYear;
}

function calculateYearOfStudy(admissionYear: number): number {
  const currentAcademicYear = getCurrentAcademicYear();
  let year = currentAcademicYear - admissionYear + 1;
  if (year < 1) year = 1;
  if (year > 6) year = 6;
  return year;
}

// แปลงระหว่าง ค.ศ. และ พ.ศ.
function toBuddhistYear(ce: number): number {
  return ce + 543;
}
function toChristianYear(be: number): number {
  return be - 543;
}

// ✅ ฟังก์ชันตรวจสอบรหัสผ่าน: อย่างน้อย 8 ตัว, มีพิมพ์เล็กและพิมพ์ใหญ่อย่างน้อย 1 ตัว
function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);
}

// ✅ ตรวจสอบเบอร์โทร (10 หลัก ตัวเลขเท่านั้น)
function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

// ✅ ตรวจสอบรหัสนิสิต (ตัวเลขเท่านั้น)
function isValidStudentId(id: string): boolean {
  return /^[0-9]+$/.test(id);
}

type TextField = {
  id: FieldName;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  wide?: boolean;
};

const textFields: TextField[] = [
  { id: "firstName", label: "ชื่อ", type: "text", autoComplete: "given-name", placeholder: "ชื่อ" },
  { id: "lastName", label: "นามสกุล", type: "text", autoComplete: "family-name", placeholder: "นามสกุล" },
  { id: "studentId", label: "รหัสนิสิต", type: "text", autoComplete: "off", placeholder: "รหัสนิสิต (ตัวเลขเท่านั้น)" },
  { id: "email", label: "อีเมล", type: "email", autoComplete: "email", placeholder: "example@tsu.ac.th" },
  { id: "phone", label: "เบอร์โทร", type: "tel", autoComplete: "tel", wide: true, placeholder: "0812345678 (10 หลัก)" },
  { id: "password", label: "รหัสผ่าน", type: "password", autoComplete: "new-password", placeholder: "อย่างน้อย 8 ตัว (พิมพ์เล็ก+ใหญ่)" },
  {
    id: "confirmPassword",
    label: "ยืนยันรหัสผ่าน",
    type: "password",
    autoComplete: "new-password",
    placeholder: "ยืนยันรหัสผ่าน",
  },
];

type FieldName =
  | "firstName"
  | "lastName"
  | "studentId"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "program"
  | "major"
  | "admissionYear";

type FieldErrors = Partial<Record<FieldName, string>>;

// ✅ Alert banner สำหรับข้อความสำเร็จ/ผิดพลาดระดับฟอร์ม (ไม่ใช่ระดับฟิลด์)
// role="alert" + aria-live="assertive" สำหรับ error (ต้องอ่านทันที)
// role="status" + aria-live="polite" สำหรับ success (อ่านแบบไม่รบกวน)
type AlertBannerProps = {
  variant: "success" | "error";
  message: string;
  onDismiss: () => void;
};

function AlertBanner({ variant, message, onDismiss }: AlertBannerProps) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`mt-4 flex items-start gap-3 rounded-xl border p-3 pr-2 shadow-sm animate-[fadeSlideIn_0.25s_ease-out] ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isError ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
        }`}
        aria-hidden="true"
      >
        {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </span>
      <p className="flex-1 text-sm leading-5">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="ปิดข้อความแจ้งเตือน"
        className={`shrink-0 rounded-full p-1 transition ${
          isError ? "hover:bg-red-100" : "hover:bg-emerald-100"
        }`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ✅ ข้อความ error ใต้ฟิลด์ (แทนที่ tooltip เริ่มต้นของเบราว์เซอร์)
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [advisorUserIds, setAdvisorUserIds] = useState<string[]>([]);

  // ปีที่เข้าเรียน (เก็บเป็น ค.ศ.)
  const [admissionYear, setAdmissionYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return currentYear - 1;
  });

  // ✅ state สำหรับ error รายฟิลด์ทั้งหมด (แทนที่ browser validation tooltip)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const admissionYearBE = toBuddhistYear(admissionYear);
  const computedYear = calculateYearOfStudy(admissionYear);

  const clearFieldError = (name: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleAdmissionYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    clearFieldError("admissionYear");
    if (!isNaN(value) && value > 0) {
      const ce = toChristianYear(value);
      const minBE = 2500;
      const maxBE = new Date().getFullYear() + 543 + 10;
      if (value >= minBE && value <= maxBE) {
        setAdmissionYear(ce);
      }
    }
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch(apiPath("/api/users/teachers"));
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลอาจารย์ได้");
        const data = await res.json();
        setTeachers(data.teachers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูลอาจารย์");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  const displayTeachers = useMemo(() => {
    return teachers.map((teacher) => ({
      ...teacher,
      displayName: `${teacher.name} (${teacher.program || "ไม่ระบุหลักสูตร"})`,
    }));
  }, [teachers]);

  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
    setSelectedMajor("");
    clearFieldError("program");
    clearFieldError("major");
  };

  const getTeacherName = (userId: string) => {
    const teacher = teachers.find((item) => item.userId === userId);
    return teacher ? teacher.name : userId;
  };

  const getTeacherDisplay = (userId: string) => {
    const teacher = teachers.find((item) => item.userId === userId);
    return teacher ? `${teacher.name} (${teacher.program || "ไม่ระบุหลักสูตร"})` : userId;
  };

  const addAdvisor = () => {
    if (!selectedAdvisorId) return;
    if (advisorUserIds.includes(selectedAdvisorId)) {
      setError("อาจารย์ที่ปรึกษาท่านนี้ถูกเลือกแล้ว");
      return;
    }
    setAdvisorUserIds((prev) => [...prev, selectedAdvisorId]);
    setSelectedAdvisorId("");
    setError("");
  };

  const removeAdvisor = (userId: string) => {
    setAdvisorUserIds((prev) => prev.filter((id) => id !== userId));
  };

  // ✅ จัดการการเปลี่ยนแปลงฟิลด์ (กรองเฉพาะตัวเลขสำหรับ studentId และ phone + ล้าง error ของฟิลด์นั้น)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    if (id === "studentId") {
      const digitsOnly = value.replace(/\D/g, "");
      e.target.value = digitsOnly;
    }

    if (id === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      e.target.value = digitsOnly;
    }

    clearFieldError(id as FieldName);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const email = String(formData.get("email") || "").trim();
    const studentId = String(formData.get("studentId") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    // ✅ ตรวจสอบทุกฟิลด์เอง แล้วแสดงผลแบบ inline แทน browser tooltip เริ่มต้น
    const errors: FieldErrors = {};

    if (!firstName) errors.firstName = "กรุณากรอกชื่อ";
    if (!lastName) errors.lastName = "กรุณากรอกนามสกุล";

    if (studentId && !isValidStudentId(studentId)) {
      errors.studentId = "รหัสนิสิตต้องเป็นตัวเลขเท่านั้น";
    }

    if (!email) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@tsu\.ac\.th$/i.test(email)) {
      errors.email = "อีเมลต้องเป็นอีเมลมหาวิทยาลัยที่ลงท้ายด้วย @tsu.ac.th เท่านั้น";
    }

    if (phone && !isValidPhone(phone)) {
      errors.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น";
    }

    if (!password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    } else if (!isValidPassword(password)) {
      errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว และมีตัวพิมพ์เล็ก-ใหญ่อย่างน้อย 1 ตัว";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    if (!selectedProgram) {
      errors.program = "กรุณาเลือกหลักสูตร";
    }

    const program = PROGRAMS.find((p) => p.name === selectedProgram);
    if (program && program.majors.length > 0 && !selectedMajor) {
      errors.major = "กรุณาเลือกวิชาเอก";
    }

    if (!admissionYearBE) {
      errors.admissionYear = "กรุณากรอกปีที่เข้าเรียน";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // โฟกัสไปที่ฟิลด์แรกที่ผิดพลาด เพื่อ UX ที่ดีขึ้น
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const majorValue = selectedMajor || selectedProgram;

    const userData = {
      firstName,
      lastName,
      studentId: studentId || "",
      email,
      major: majorValue,
      program: selectedProgram,
      admissionYear: admissionYear,
      year: computedYear,
      phone: phone,
      password: password,
      role: "student",
      advisorUserIds,
    };

    try {
      await register(userData);
      // ✅ แสดงข้อความสำเร็จก่อนพาไปหน้าถัดไป
      setSuccess("สมัครสมาชิกสำเร็จ! กำลังพาคุณไปยังหน้าแดชบอร์ด...");
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      setLoading(false);
    }
  };

  const selectedProgramObj = PROGRAMS.find((p) => p.name === selectedProgram);
  const hasMajors = selectedProgramObj && selectedProgramObj.majors.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden min-h-[560px] overflow-hidden bg-[#1F2B3D] p-6 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="relative z-10">
              <Image
                src="/tsu-logo.png"
                alt="TSU Logo"
                width={280}
                height={90}
                priority
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <div className="relative z-10 mx-auto max-w-sm text-center">
              <h1 className="text-2xl font-semibold">เริ่มต้นใช้งาน</h1>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                สร้างบัญชีผู้ใช้งานเพื่อบันทึกและติดตามทักษะของคุณในระบบ
              </p>
              <p className="mt-10 text-sm text-blue-100">
                มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
                <Link href="/login" className="font-semibold text-white transition hover:text-[#FFC107]">
                  เข้าสู่ระบบ
                </Link>
              </p>
              <Link
                href="/login"
                className="mx-auto mt-4 inline-flex min-w-36 items-center justify-center rounded-xl bg-white px-7 py-2.5 text-sm font-medium text-[#1565C0] shadow-md transition hover:bg-blue-50"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
            <p className="relative z-10 text-center text-xs text-blue-100">
              © Faculty of Science and Digital Innovation
            </p>
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-sky-300/70 via-sky-500/25 to-transparent" />
            <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-300/40 blur-3xl" />
          </aside>

          <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              กลับหน้าแรก
            </Link>

            <div className="mx-auto max-w-lg">
              <div className="text-center">
                <div className="mb-3 flex justify-center lg:hidden">
                  <Image src="/tsu-logo.png" alt="TSU Logo" width={230} height={74} priority className="h-10 w-auto" />
                </div>
                <h2 className="text-2xl font-semibold text-[#1565C0]">สร้างบัญชีผู้ใช้งาน</h2>
                <p className="mt-2 text-xs leading-5 text-blue-500">
                  กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน เพื่อใช้ในการสร้างบัญชีผู้ใช้งาน
                </p>
                <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
              </div>

              {success && (
                <AlertBanner variant="success" message={success} onDismiss={() => setSuccess("")} />
              )}
              {error && (
                <AlertBanner variant="error" message={error} onDismiss={() => setError("")} />
              )}

              {/* ✅ noValidate: ปิด browser validation tooltip เริ่มต้น เราจัดการ validation เอง */}
              <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-3 sm:grid-cols-2">
                {textFields.map((field) => {
                  const fieldError = fieldErrors[field.id as FieldName];
                  const errorId = fieldError ? `${field.id}-error` : undefined;

                  return (
                    <label key={field.id} htmlFor={field.id} className={`block ${field.wide ? "sm:col-span-2" : ""}`}>
                      <span className="text-sm font-medium text-[#1565C0]">{field.label}</span>
                      <span className="relative mt-1.5 block">
                        <input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          autoComplete={field.autoComplete}
                          placeholder={field.placeholder}
                          required={field.id !== "phone" && field.id !== "studentId"}
                          onChange={handleInputChange}
                          aria-invalid={fieldError ? "true" : undefined}
                          aria-describedby={errorId}
                          className={`h-10 w-full rounded-xl border ${
                            fieldError
                              ? "border-red-400 focus:ring-red-200"
                              : "border-blue-300 focus:ring-blue-100"
                          } bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4`}
                        />
                      </span>
                      <FieldError id={errorId ?? `${field.id}-error`} message={fieldError} />
                    </label>
                  );
                })}

                {/* หลักสูตร */}
                <label htmlFor="program" className="block sm:col-span-2">
                  <span className="text-sm font-medium text-[#1565C0]">หลักสูตร</span>
                  <span className="relative mt-1.5 block">
                    <select
                      id="program"
                      value={selectedProgram}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      aria-invalid={fieldErrors.program ? "true" : undefined}
                      aria-describedby={fieldErrors.program ? "program-error" : undefined}
                      className={`h-10 w-full rounded-xl border ${
                        fieldErrors.program ? "border-red-400 focus:ring-red-200" : "border-blue-300 focus:ring-blue-100"
                      } bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4`}
                    >
                      <option value="">-- เลือกหลักสูตร --</option>
                      {PROGRAMS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </span>
                  <FieldError id="program-error" message={fieldErrors.program} />
                </label>

                {/* วิชาเอก */}
                {hasMajors && (
                  <label htmlFor="major" className="block sm:col-span-2">
                    <span className="text-sm font-medium text-[#1565C0]">วิชาเอก</span>
                    <span className="relative mt-1.5 block">
                      <select
                        id="major"
                        value={selectedMajor}
                        onChange={(e) => {
                          setSelectedMajor(e.target.value);
                          clearFieldError("major");
                        }}
                        aria-invalid={fieldErrors.major ? "true" : undefined}
                        aria-describedby={fieldErrors.major ? "major-error" : undefined}
                        className={`h-10 w-full rounded-xl border ${
                          fieldErrors.major ? "border-red-400 focus:ring-red-200" : "border-blue-300 focus:ring-blue-100"
                        } bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4`}
                      >
                        <option value="">-- เลือกวิชาเอก --</option>
                        {selectedProgramObj?.majors.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </span>
                    <FieldError id="major-error" message={fieldErrors.major} />
                  </label>
                )}

                {/* ปีที่เข้าเรียน (พ.ศ.) */}
                <label htmlFor="admissionYear" className="block sm:col-span-2">
                  <span className="text-sm font-medium text-[#1565C0]">
                    ปีที่เข้าเรียน (พ.ศ.) <span className="text-red-500">*</span>
                  </span>
                  <span className="relative mt-1.5 block">
                    <input
                      id="admissionYear"
                      type="number"
                      value={admissionYearBE || ""}
                      onChange={handleAdmissionYearChange}
                      placeholder="เช่น 2565"
                      min={2500}
                      max={new Date().getFullYear() + 543 + 10}
                      aria-invalid={fieldErrors.admissionYear ? "true" : undefined}
                      aria-describedby={fieldErrors.admissionYear ? "admissionYear-error" : undefined}
                      className={`h-10 w-full rounded-xl border ${
                        fieldErrors.admissionYear ? "border-red-400 focus:ring-red-200" : "border-blue-300 focus:ring-blue-100"
                      } bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4`}
                    />
                  </span>
                  <FieldError id="admissionYear-error" message={fieldErrors.admissionYear} />
                </label>

                {/* ชั้นปีที่คำนวณอัตโนมัติ */}
                <label htmlFor="computedYear" className="block sm:col-span-2">
                  <span className="text-sm font-medium text-[#1565C0]">
                    ชั้นปีปัจจุบัน <span className="text-xs text-blue-400">(คำนวณอัตโนมัติ)</span>
                  </span>
                  <span className="relative mt-1.5 block">
                    <input
                      id="computedYear"
                      type="text"
                      value={`ชั้นปีที่ ${computedYear}`}
                      readOnly
                      disabled
                      className="h-10 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 text-sm text-slate-700 outline-none cursor-not-allowed"
                    />
                  </span>
                </label>

                {/* อาจารย์ที่ปรึกษา */}
                <div className="sm:col-span-2">
                  <span className="text-sm font-medium text-[#1565C0]">
                    อาจารย์ที่ปรึกษา{" "}
                    <span className="text-xs font-normal text-blue-400">
                      (เลือกได้มากกว่า 1 คน)
                    </span>
                  </span>

                  <div className="mt-1.5 flex gap-2">
                    <select
                      value={selectedAdvisorId}
                      onChange={(e) => setSelectedAdvisorId(e.target.value)}
                      disabled={loadingTeachers}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {loadingTeachers
                          ? "กำลังโหลดอาจารย์..."
                          : "-- เลือกอาจารย์ที่ปรึกษา --"}
                      </option>
                      {displayTeachers.map((teacher) => (
                        <option key={teacher.userId} value={teacher.userId}>
                          {teacher.displayName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addAdvisor}
                      disabled={!selectedAdvisorId || loadingTeachers}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1565C0] text-white shadow-md transition hover:bg-[#0D47A1] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="เพิ่มอาจารย์ที่ปรึกษา"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {advisorUserIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {advisorUserIds.map((advisorId) => (
                        <span
                          key={advisorId}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-xs text-blue-700"
                        >
                          {getTeacherDisplay(advisorId)}
                          <button
                            type="button"
                            onClick={() => removeAdvisor(advisorId)}
                            className="rounded-full p-0.5 transition hover:bg-blue-200"
                            aria-label={`ลบ ${getTeacherName(advisorId)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    * เลือกอาจารย์ที่ปรึกษาได้จากทุกหลักสูตร
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2"
                >
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  {loading ? "กำลังบันทึก..." : "ลงทะเบียน"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}