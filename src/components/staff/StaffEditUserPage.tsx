// components/staff/StaffEditUserPage.tsx
"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Phone,
  Users,
  Building,
  X,
  Plus,
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

type TeacherOption = {
  userId: string;
  name: string;
  email: string;
  role: string;
  position: string;
  faculty: string;
  program: string;
};

const FACULTY = "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล";

const PROGRAM_OPTIONS = [
  "วิทยาการคอมพิวเตอร์และสารสนเทศ",
  "วิทยาศาสตร์และนวัตกรรม",
  "คณิตศาสตร์และการจัดการข้อมูล",
  "ชีววิทยาศาสตร์",
  "ดิจิทัลและปัญญาประดิษฐ์ทางการแพทย์",
  "เทคโนโลยีชีวภาพ",
];

const MAJOR_OPTIONS_BY_PROGRAM: Record<string, string[]> = {
  "วิทยาการคอมพิวเตอร์และสารสนเทศ": ["วิทยาการดิจิทัล", "วิทยาการข้อมูล"],
  "วิทยาศาสตร์และนวัตกรรม": ["เคมี", "ฟิสิกส์และวัสดุศาสตร์", "สิ่งแวดล้อม"],
  "คณิตศาสตร์และการจัดการข้อมูล": ["คณิตศาสตร์", "การจัดการและการวิเคราะห์ข้อมูล"],
  "ชีววิทยาศาสตร์": [
    "จุลชีววิทยาและเทคโนโลยีจุลินทรีย์",
    "ชีววิทยา",
    "วิทยาศาสตร์ชีวการแพทย์",
  ],
  "ดิจิทัลและปัญญาประดิษฐ์ทางการแพทย์": [],
  "เทคโนโลยีชีวภาพ": [],
};

// ✅ ชุดเดียวกับ StaffAddUserPage
const EXECUTIVE_POSITIONS = [
  "รองคณบดีฝ่ายบริหารและพัฒนาองค์กร",
  "รองคณบดีฝ่ายฝ่ายวิชาการและดิจิทัลองค์กร",
  "ผู้ช่วยคณบดีฝ่ายวิจัยและนวัตกรรม",
  "ผู้ช่วยคณบดีฝ่ายบริการวิชาการและการประกอบการ",
  "ผู้ช่วยคณบดีฝ่ายพัฒนานิสิต สื่อสารองค์กร",
  "อื่น ๆ",
];

const OFFICER_POSITIONS = [
  "ฝ่ายบริหาร",
  "ฝ่ายวิชาการ",
  "ฝ่ายวิจัย",
  "ฝ่ายแผนงาน",
  "ฝ่ายประชาสัมพันธ์",
  "ฝ่ายเทคโนโลยีสารสนเทศ",
];

function getCurrentAcademicYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return currentMonth < 6 ? currentYear - 1 : currentYear;
}

function calculateYearOfStudy(admissionYearCE: number): number {
  const currentAcademicYear = getCurrentAcademicYear();
  let year = currentAcademicYear - admissionYearCE + 1;
  if (year < 1) year = 1;
  if (year > 6) year = 6;
  return year;
}

function toBuddhistYear(ce: number): number {
  return ce + 543;
}
function toChristianYear(be: number): number {
  return be - 543;
}

function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}
function isValidStudentId(id: string): boolean {
  return /^[0-9]+$/.test(id);
}

export default function StaffEditUserPage({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    studentId: "",
    program: "",
    major: "",
    year: "",
    phone: "",
    faculty: FACULTY,
    position: "",
    advisorUserIds: [] as string[],
    isExecutive: false,
    status: "active",
  });

  // ✅ เก็บปีที่เข้าเรียนเป็น พ.ศ. (เหมือน Add page)
  const [admissionYearBE, setAdmissionYearBE] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return toBuddhistYear(currentYear - 1);
  });

  const admissionYearCE = toChristianYear(admissionYearBE);
  const computedYear = admissionYearCE
    ? calculateYearOfStudy(admissionYearCE)
    : null;

  const [executivePosition, setExecutivePosition] = useState("");
  const [customExecutivePosition, setCustomExecutivePosition] = useState("");
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ---------- โหลดรายชื่ออาจารย์ ----------
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch(apiPath("/api/users/teachers"));
        if (res.ok) {
          const data = await res.json();
          setTeachers(data.teachers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  // ---------- โหลดข้อมูลผู้ใช้ ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiPath(`/api/users/${userId}`));
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้");
        const data = await res.json();
        const user = data.user;

        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          role: user.role || "student",
          studentId: user.studentId || "",
          program: user.program || "",
          major: user.major || "",
          year: user.year ? String(user.year) : "",
          phone: user.phone || "",
          faculty: user.faculty || FACULTY,
          position: user.position || "",
          advisorUserIds: user.advisorUserIds || [],
          isExecutive: Boolean(user.isExecutive),
          status: user.status || "active",
        });

        // ตั้งปีที่เข้าเรียน (BE)
        if (user.admissionYear) {
          setAdmissionYearBE(Number(user.admissionYear));
        }

        // ตั้งตำแหน่งบริหารถ้าเป็นผู้บริหาร
        if (user.role === "teacher" && user.isExecutive && user.position) {
          if (EXECUTIVE_POSITIONS.includes(user.position)) {
            setExecutivePosition(user.position);
          } else {
            setExecutivePosition("อื่น ๆ");
            setCustomExecutivePosition(user.position);
          }
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  // ---------- คำนวณชั้นปีอัตโนมัติ ----------
  useEffect(() => {
    if (computedYear !== null) {
      setFormData((prev) => ({ ...prev, year: String(computedYear) }));
    } else {
      setFormData((prev) => ({ ...prev, year: "" }));
    }
  }, [computedYear]);

  const displayTeachers = useMemo(() => {
    return teachers.map((teacher) => ({
      ...teacher,
      displayName: `${teacher.name} (${teacher.program || "ไม่ระบุหลักสูตร"})`,
    }));
  }, [teachers]);

  const majorOptions = formData.program
    ? MAJOR_OPTIONS_BY_PROGRAM[formData.program] || []
    : [];

  // ---------- ฟอร์มเปลี่ยนค่า ----------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    let newValue = value;
    if (name === "studentId") {
      newValue = value.replace(/\D/g, "");
    }
    if (name === "phone") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "isExecutive" && !checked) {
      setExecutivePosition("");
      setCustomExecutivePosition("");
      setFormErrors((prev) => ({
        ...prev,
        executivePosition: "",
        customExecutivePosition: "",
      }));
    }

    if (name === "program") {
      setFormData((prev) => ({ ...prev, major: "" }));
    }
  };

  const handleAdmissionYearChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      const minBE = 2500;
      const maxBE = new Date().getFullYear() + 543 + 10;
      if (value >= minBE && value <= maxBE) {
        setAdmissionYearBE(value);
        setFormErrors((prev) => ({ ...prev, admissionYear: "" }));
        return;
      }
    }
    setAdmissionYearBE(0);
  };

  const addAdvisor = () => {
    if (!selectedAdvisorId) return;
    if (formData.advisorUserIds.includes(selectedAdvisorId)) {
      alert("อาจารย์ท่านนี้ถูกเลือกแล้ว");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      advisorUserIds: [...prev.advisorUserIds, selectedAdvisorId],
    }));
    setSelectedAdvisorId("");
  };

  const removeAdvisor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      advisorUserIds: prev.advisorUserIds.filter((x) => x !== id),
    }));
  };

  const getTeacherDisplay = (id: string) => {
    const t = teachers.find((x) => x.userId === id);
    return t
      ? `${t.name} (${t.program || "ไม่ระบุหลักสูตร"})`
      : id;
  };

  // ---------- validate ----------
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "กรุณากรอกชื่อ";
    if (!formData.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
    if (!formData.email.trim()) errors.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@tsu\.ac\.th$/.test(formData.email)) {
      errors.email = "อีเมลต้องลงท้ายด้วย @tsu.ac.th เท่านั้น";
    }

    if (formData.role === "student") {
      if (!formData.studentId.trim()) errors.studentId = "กรุณากรอกรหัสนิสิต";
      else if (!isValidStudentId(formData.studentId))
        errors.studentId = "รหัสนิสิตต้องเป็นตัวเลขเท่านั้น";

      if (!formData.program) errors.program = "กรุณาเลือกหลักสูตร";

      if (majorOptions.length > 0 && !formData.major) {
        errors.major = "กรุณาเลือกวิชาเอก";
      }

      if (!admissionYearBE || admissionYearBE < 2500) {
        errors.admissionYear = "กรุณากรอกปีที่เข้าเรียน (พ.ศ.)";
      }

      if (formData.phone && !isValidPhone(formData.phone)) {
        errors.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
      }
    }

    if (formData.role === "teacher" && formData.isExecutive) {
      if (!executivePosition) {
        errors.executivePosition = "กรุณาเลือกตำแหน่งบริหาร";
      } else if (
        executivePosition === "อื่น ๆ" &&
        !customExecutivePosition.trim()
      ) {
        errors.customExecutivePosition = "กรุณาระบุตำแหน่งบริหาร";
      }
      if (!formData.program) errors.program = "กรุณาเลือกโปรแกรม/สาขา";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let positionValue = "";
    if (formData.role === "teacher" && formData.isExecutive) {
      positionValue =
        executivePosition === "อื่น ๆ"
          ? customExecutivePosition.trim()
          : executivePosition;
    }

    const payload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role:
        formData.role === "student"
          ? "student"
          : formData.role === "officer"
          ? "officer"
          : "teacher",
      studentId: formData.studentId || undefined,
      major: formData.major || formData.program || undefined,
      program: formData.program || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      phone: formData.phone || undefined,
      faculty: formData.faculty || undefined,
      position: positionValue,
      isExecutive:
        formData.role === "teacher" ? formData.isExecutive : false,
      advisorUserIds:
        formData.advisorUserIds.length > 0
          ? formData.advisorUserIds
          : undefined,
      status: formData.status || "active",
    };

    if (formData.role === "student" && admissionYearBE) {
      payload.admissionYear = admissionYearBE;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiPath(`/api/users/${userId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "อัปเดตผู้ใช้ไม่สำเร็จ");

      alert("อัปเดตผู้ใช้สำเร็จ");
      router.push("/staff/users");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: "student", label: "นิสิต", icon: GraduationCap },
    { value: "teacher", label: "อาจารย์", icon: Users },
    { value: "officer", label: "เจ้าหน้าที่", icon: Briefcase },
  ];

  if (loading) {
    return (
      <StaffShell activePath="/staff/users">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-2 text-slate-500">กำลังโหลดข้อมูล...</span>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell activePath="/staff/users">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="group mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-blue-50 hover:text-[#1565C0]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            กลับ
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1565C0] shadow-sm ring-1 ring-blue-100">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                แก้ไขผู้ใช้
              </h1>
              <div className="mt-1 h-0.5 w-16 rounded-full bg-[#FFC107]" />
              <p className="mt-2 text-sm text-slate-500">
                แก้ไขข้อมูลผู้ใช้ในระบบ
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* ข้อมูลส่วนตัว */}
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <User className="h-5 w-5 text-[#1565C0]" />
                <h2 className="text-sm font-semibold text-slate-800">
                  ข้อมูลส่วนตัว
                </h2>
                <div className="flex-1 border-b border-blue-50" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-slate-700"
                  >
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className={`mt-1.5 h-11 w-full rounded-xl border ${
                      formErrors.firstName ? "border-red-300" : "border-blue-200"
                    } bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    placeholder="ชื่อ"
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-slate-700"
                  >
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className={`mt-1.5 h-11 w-full rounded-xl border ${
                      formErrors.lastName ? "border-red-300" : "border-blue-200"
                    } bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    placeholder="นามสกุล"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  อีเมล <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-slate-400">
                    (ต้องลงท้าย @tsu.ac.th)
                  </span>
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`h-11 w-full rounded-xl border ${
                      formErrors.email ? "border-red-300" : "border-blue-200"
                    } bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    placeholder="example@tsu.ac.th"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* บทบาท */}
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-[#1565C0]" />
                <h2 className="text-sm font-semibold text-slate-800">บทบาท</h2>
                <div className="flex-1 border-b border-blue-50" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-slate-700"
                  >
                    บทบาท <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === "teacher" && (
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isExecutive"
                      name="isExecutive"
                      checked={formData.isExecutive}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-blue-300 text-[#1565C0] focus:ring-[#1565C0]"
                    />
                    <label
                      htmlFor="isExecutive"
                      className="text-sm font-medium text-slate-700"
                    >
                      เป็นผู้บริหาร{" "}
                      <span className="text-xs text-slate-400">
                        (ตำแหน่งจะเปลี่ยนตามผู้บริหาร)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ข้อมูลนิสิต */}
            {formData.role === "student" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[#1565C0]" />
                  <h2 className="text-sm font-semibold text-slate-800">
                    ข้อมูลนิสิต
                  </h2>
                  <div className="flex-1 border-b border-blue-100" />
                </div>

                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-medium text-slate-700"
                  >
                    รหัสนิสิต <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-slate-400">
                      (ตัวเลขเท่านั้น)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className={`mt-1.5 h-11 w-full rounded-xl border ${
                      formErrors.studentId ? "border-red-300" : "border-blue-200"
                    } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    placeholder="662021085"
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.studentId}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="program"
                    className="block text-sm font-medium text-slate-700"
                  >
                    หลักสูตร <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    required
                    className={`mt-1.5 h-11 w-full rounded-xl border ${
                      formErrors.program ? "border-red-300" : "border-blue-200"
                    } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                  >
                    <option value="">-- เลือกหลักสูตร --</option>
                    {PROGRAM_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {formErrors.program && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.program}
                    </p>
                  )}
                </div>

                {majorOptions.length > 0 && (
                  <div className="mt-4">
                    <label
                      htmlFor="major"
                      className="block text-sm font-medium text-slate-700"
                    >
                      วิชาเอก <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="major"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      required
                      className={`mt-1.5 h-11 w-full rounded-xl border ${
                        formErrors.major ? "border-red-300" : "border-blue-200"
                      } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    >
                      <option value="">-- เลือกวิชาเอก --</option>
                      {majorOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    {formErrors.major && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.major}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admissionYear"
                      className="block text-sm font-medium text-slate-700"
                    >
                      ปีที่เข้าเรียน (พ.ศ.){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="admissionYear"
                      name="admissionYear"
                      value={admissionYearBE || ""}
                      onChange={handleAdmissionYearChange}
                      required
                      min={2500}
                      max={new Date().getFullYear() + 543 + 10}
                      className={`mt-1.5 h-11 w-full rounded-xl border ${
                        formErrors.admissionYear
                          ? "border-red-300"
                          : "border-blue-200"
                      } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                      placeholder="2565"
                    />
                    {formErrors.admissionYear && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.admissionYear}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="yearDisplay"
                      className="block text-sm font-medium text-slate-700"
                    >
                      ชั้นปีปัจจุบัน{" "}
                      <span className="text-xs text-slate-400">
                        (คำนวณอัตโนมัติ)
                      </span>
                    </label>
                    <input
                      id="yearDisplay"
                      type="text"
                      value={computedYear ? `ชั้นปีที่ ${computedYear}` : "-"}
                      readOnly
                      disabled
                      className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 text-sm text-slate-700 outline-none cursor-not-allowed"
                    />
                    <input type="hidden" name="year" value={formData.year} />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700"
                  >
                    เบอร์โทร{" "}
                    <span className="text-xs text-slate-400">
                      (10 หลัก ตัวเลขเท่านั้น)
                    </span>
                  </label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={`h-11 w-full rounded-xl border ${
                        formErrors.phone ? "border-red-300" : "border-blue-200"
                      } bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                      placeholder="0812345678"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700">
                    อาจารย์ที่ปรึกษา{" "}
                    <span className="text-xs text-slate-400">
                      (เลือกได้หลายคน)
                    </span>
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <select
                      value={selectedAdvisorId}
                      onChange={(e) => setSelectedAdvisorId(e.target.value)}
                      className="flex-1 h-11 rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                      disabled={loadingTeachers}
                    >
                      <option value="">
                        {loadingTeachers
                          ? "กำลังโหลด..."
                          : "-- เลือกอาจารย์ที่ปรึกษา --"}
                      </option>
                      {displayTeachers.map((t) => (
                        <option key={t.userId} value={t.userId}>
                          {t.displayName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addAdvisor}
                      disabled={!selectedAdvisorId || loadingTeachers}
                      className="h-11 w-11 rounded-xl bg-[#1565C0] text-white shadow-md transition hover:bg-[#0D47A1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    * เลือกอาจารย์ที่ปรึกษาได้จากทุกหลักสูตร
                  </p>

                  {formData.advisorUserIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.advisorUserIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-700"
                        >
                          {getTeacherDisplay(id)}
                          <button
                            type="button"
                            onClick={() => removeAdvisor(id)}
                            className="ml-1 rounded-full hover:bg-blue-200 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ข้อมูลอาจารย์/เจ้าหน้าที่ */}
            {(formData.role === "teacher" || formData.role === "officer") && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <Building className="h-5 w-5 text-[#1565C0]" />
                  <h2 className="text-sm font-semibold text-slate-800">
                    ข้อมูลบุคลากร
                  </h2>
                  <div className="flex-1 border-b border-blue-100" />
                </div>

                {formData.role === "teacher" && formData.isExecutive ? (
                  <div>
                    <label
                      htmlFor="executivePosition"
                      className="block text-sm font-medium text-slate-700"
                    >
                      ตำแหน่งบริหาร <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="executivePosition"
                      value={executivePosition}
                      onChange={(e) => {
                        setExecutivePosition(e.target.value);
                        if (e.target.value !== "อื่น ๆ") {
                          setCustomExecutivePosition("");
                          setFormErrors((prev) => ({
                            ...prev,
                            customExecutivePosition: "",
                          }));
                        }
                      }}
                      required
                      className={`mt-1.5 h-11 w-full rounded-xl border ${
                        formErrors.executivePosition
                          ? "border-red-300"
                          : "border-blue-200"
                      } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    >
                      <option value="">-- เลือกตำแหน่งบริหาร --</option>
                      {EXECUTIVE_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                    {formErrors.executivePosition && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.executivePosition}
                      </p>
                    )}

                    {executivePosition === "อื่น ๆ" && (
                      <div className="mt-4">
                        <label
                          htmlFor="customExecutivePosition"
                          className="block text-sm font-medium text-slate-700"
                        >
                          ระบุตำแหน่งบริหาร{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="customExecutivePosition"
                          value={customExecutivePosition}
                          onChange={(e) => {
                            setCustomExecutivePosition(e.target.value);
                            if (formErrors.customExecutivePosition) {
                              setFormErrors((prev) => ({
                                ...prev,
                                customExecutivePosition: "",
                              }));
                            }
                          }}
                          required
                          className={`mt-1.5 h-11 w-full rounded-xl border ${
                            formErrors.customExecutivePosition
                              ? "border-red-300"
                              : "border-blue-200"
                          } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                          placeholder="พิมพ์ตำแหน่งบริหาร"
                        />
                        {formErrors.customExecutivePosition && (
                          <p className="mt-1 text-xs text-red-500">
                            {formErrors.customExecutivePosition}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500">
                      ตำแหน่ง{" "}
                      <span className="text-slate-400">
                        (ไม่จำเป็นต้องระบุ)
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      กรณีเจ้าหน้าที่และอาจารย์ที่ไม่ได้เป็นผู้บริหาร
                      ไม่ต้องระบุตำแหน่ง
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <label
                    htmlFor="faculty"
                    className="block text-sm font-medium text-slate-700"
                  >
                    คณะ
                  </label>
                  <input
                    type="text"
                    id="faculty"
                    name="faculty"
                    value={FACULTY}
                    readOnly
                    className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 text-sm text-slate-600 outline-none cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    * คณะถูกกำหนดให้เป็น {FACULTY} อัตโนมัติ
                  </p>
                </div>

                {formData.role === "teacher" && (
                  <div className="mt-4">
                    <label
                      htmlFor="program"
                      className="block text-sm font-medium text-slate-700"
                    >
                      โปรแกรม / สาขา
                      {formData.isExecutive && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      id="program"
                      name="program"
                      value={formData.program}
                      onChange={handleChange}
                      required={formData.isExecutive}
                      className={`mt-1.5 h-11 w-full rounded-xl border ${
                        formErrors.program ? "border-red-300" : "border-blue-200"
                      } bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100`}
                    >
                      <option value="">-- เลือกโปรแกรม/สาขา --</option>
                      {PROGRAM_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {formErrors.program && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.program}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-12 rounded-xl border border-slate-300 bg-white px-8 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-8 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    บันทึกผู้ใช้
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </StaffShell>
  );
}