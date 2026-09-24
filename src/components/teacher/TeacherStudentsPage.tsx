// components/teacher/TeacherStudentsPage.tsx
"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Loader2, UserRound } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { useAuth } from "@/context/auth-context";

type Student = {
  studentId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  faculty: string | null;
  major: string | null;
  program: string | null;   // ✅ เพิ่มหลักสูตร
  year: number | null;
};

export default function TeacherStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      setError("ไม่พบข้อมูลอาจารย์ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          apiPath(`/api/advisor/students?advisorUserId=${encodeURIComponent(user.id)}`)
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "ไม่สามารถโหลดข้อมูลนิสิต");
        }
        const data = await res.json();
        // ✅ เพิ่ม program ในการแมป
        setStudents(data.students.map((s: any) => ({
          ...s,
          program: s.program || null,   // รับจาก API
        })) || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user, authLoading]);

  // เรียงลำดับนิสิตตามชั้นปี: ปี 1 → ปี 2 → ปี 3 → ปี 4
  // หากชั้นปีเท่ากัน ให้เรียงต่อด้วยรหัสนิสิต
  const filteredStudents = students
    .filter((student) => {
      const search = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const yearA = a.year ?? Number.MAX_SAFE_INTEGER;
      const yearB = b.year ?? Number.MAX_SAFE_INTEGER;

      if (yearA !== yearB) {
        return yearA - yearB;
      }

      return a.studentId.localeCompare(b.studentId, "th");
    });

  const handleViewSkills = (studentId: string) => {
    router.push(`/teacher/students/${studentId}/skills`);
  };

  return (
    <TeacherShell activePath="/teacher/students">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          {/* หัวข้อ */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                ตรวจสอบข้อมูลทักษะนิสิตที่ปรึกษา
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                แสดงรายชื่อนิสิตที่อยู่ในความดูแลของอาจารย์ที่ปรึกษา
              </p>
            </div>
            <div className="w-full sm:w-[280px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="ค้นหานิสิต..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          {/* ตาราง */}
          {authLoading || loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
              <span className="ml-3 text-slate-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white py-12 text-center text-slate-400 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <UserRound className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm">
                {searchTerm ? "ไม่พบนิสิตที่ค้นหา" : "ยังไม่มีนิสิตในความดูแล"}
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50/50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">รหัสนิสิต</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">ชั้นปี</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">หลักสูตร</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">วิชาเอก</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">อีเมล</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">เบอร์โทร</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-blue-50/50 transition hover:bg-blue-50/30"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {student.year || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {student.program || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {student.major || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{student.email}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {student.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewSkills(student.studentId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1565C0] bg-white px-3 py-1.5 text-xs font-medium text-[#1565C0] transition hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ตรวจสอบทักษะ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* สรุปจำนวน */}
          {!authLoading && !loading && !error && (
            <div className="mt-4 text-xs text-slate-400">
              แสดง {filteredStudents.length} จาก {students.length} รายการ
            </div>
          )}
        </div>
      </section>
    </TeacherShell>
  );
}