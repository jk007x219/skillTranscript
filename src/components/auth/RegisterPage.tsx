// components/auth/RegisterPage.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Plus, UserRound, X } from "lucide-react";

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

const textFields = [
  { id: "firstName", label: "ชื่อ", type: "text", autoComplete: "given-name" },
  { id: "lastName", label: "นามสกุล", type: "text", autoComplete: "family-name" },
  { id: "studentId", label: "รหัสนิสิต", type: "text", autoComplete: "off" },
  { id: "email", label: "อีเมล", type: "email", autoComplete: "email" },
  { id: "year", label: "ชั้นปี", type: "number", autoComplete: "off", wide: true, placeholder: "4" },
  { id: "phone", label: "เบอร์โทร", type: "tel", autoComplete: "tel", wide: true },
  { id: "password", label: "รหัสผ่าน", type: "password", autoComplete: "new-password" },
  {
    id: "confirmPassword",
    label: "ยืนยันรหัสผ่าน",
    type: "password",
    autoComplete: "new-password",
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // state สำหรับหลักสูตรและวิชาเอก
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [advisorUserIds, setAdvisorUserIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch("/api/users/teachers");
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

  // ✅ แสดงอาจารย์ทั้งหมด (ไม่ต้องกรองตามหลักสูตร)
  // แสดงชื่ออาจารย์พร้อมหลักกำกับ
  const displayTeachers = useMemo(() => {
    return teachers.map((teacher) => ({
      ...teacher,
      displayName: `${teacher.name} (${teacher.program || "ไม่ระบุหลักสูตร"})`,
    }));
  }, [teachers]);

  // เมื่อเลือกหลักสูตร ให้ reset วิชาเอก
  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
    setSelectedMajor("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const email = String(formData.get("email") || "").trim();

    // ตรวจสอบรหัสผ่าน
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@tsu\.ac\.th$/i.test(email)) {
      setError("อีเมลต้องเป็นอีเมลมหาวิทยาลัยที่ลงท้ายด้วย @tsu.ac.th เท่านั้น");
      setLoading(false);
      return;
    }

    // ตรวจสอบหลักสูตร
    if (!selectedProgram) {
      setError("กรุณาเลือกหลักสูตร");
      setLoading(false);
      return;
    }

    // ตรวจสอบวิชาเอก: ถ้าหลักสูตรมีเอกและยังไม่ได้เลือก ให้แจ้ง
    const program = PROGRAMS.find((p) => p.name === selectedProgram);
    if (program && program.majors.length > 0 && !selectedMajor) {
      setError("กรุณาเลือกวิชาเอก");
      setLoading(false);
      return;
    }

    // ส่ง major ที่เลือก: ถ้าไม่มีเอก ให้ใช้ชื่อหลักสูตร
    const majorValue = selectedMajor || selectedProgram;

    const userData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      studentId: formData.get("studentId") as string,
      email,
      major: majorValue,
      program: selectedProgram,
      year: parseInt(formData.get("year") as string) || null,
      phone: formData.get("phone") as string,
      password: password,
      role: "student",
      advisorUserIds,
    };

    try {
      await register(userData);
      router.push("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบว่าหลักสูตรที่เลือกมีเอกหรือไม่
  const selectedProgramObj = PROGRAMS.find((p) => p.name === selectedProgram);
  const hasMajors = selectedProgramObj && selectedProgramObj.majors.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md lg:grid-cols-[0.95fr_1.05fr]">
          {/* Sidebar - เหมือนเดิม */}
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

          {/* Form ด้านขวา */}
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

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
                {textFields.map((field) => (
                  <label key={field.id} htmlFor={field.id} className={`block ${field.wide ? "sm:col-span-2" : ""}`}>
                    <span className="text-sm font-medium text-[#1565C0]">{field.label}</span>
                    <span className="relative mt-1.5 block">
                      <input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        pattern={field.id === "email" ? "^[^\\s@]+@tsu\\.ac\\.th$" : undefined}
                        title={field.id === "email" ? "อีเมลต้องลงท้ายด้วย @tsu.ac.th" : undefined}
                        required={field.id !== "year" && field.id !== "phone" && field.id !== "studentId"}
                        className="h-10 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                      />
                    </span>
                  </label>
                ))}

                {/* หลักสูตร */}
                <label htmlFor="program" className="block sm:col-span-2">
                  <span className="text-sm font-medium text-[#1565C0]">หลักสูตร</span>
                  <span className="relative mt-1.5 block">
                    <select
                      id="program"
                      value={selectedProgram}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      required
                      className="h-10 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">-- เลือกหลักสูตร --</option>
                      {PROGRAMS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                {/* วิชาเอก (แสดงเฉพาะหลักสูตรที่มีเอก) */}
                {hasMajors && (
                  <label htmlFor="major" className="block sm:col-span-2">
                    <span className="text-sm font-medium text-[#1565C0]">วิชาเอก</span>
                    <span className="relative mt-1.5 block">
                      <select
                        id="major"
                        value={selectedMajor}
                        onChange={(e) => setSelectedMajor(e.target.value)}
                        required
                        className="h-10 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">-- เลือกวิชาเอก --</option>
                        {selectedProgramObj?.majors.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                )}

                {/* ✅ อาจารย์ที่ปรึกษา - แสดงอาจารย์ทั้งหมด พร้อมหลักกำกับ */}
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