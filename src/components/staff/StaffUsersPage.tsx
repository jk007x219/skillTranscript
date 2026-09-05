// components/staff/StaffUsersPage.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  studentId: string | null;
  major: string | null;
  year: number | null;
  phone: string | null;
  faculty: string | null;
  position: string | null;
  program: string | null;
  status: string;
  isExecutive: boolean;
  advisorUserId: string | null;
  advisorName: string | null; // ชื่อที่ปรึกษา (ถ้ามีหลายคนจะคั่นด้วย ", ")
};

const roleLabels: Record<string, string> = {
  student: "นิสิต",
  teacher: "อาจารย์",
  officer: "เจ้าหน้าที่",
  executive: "ผู้บริหาร",
};

const roleColors: Record<string, string> = {
  student: "bg-blue-50 text-blue-700",
  teacher: "bg-green-50 text-green-700",
  officer: "bg-purple-50 text-purple-700",
  executive: "bg-red-50 text-red-700",
};

export default function StaffUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ทั้งหมด" | "student" | "teacher" | "officer" | "executive"
  >("ทั้งหมด");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้");
      const data = await res.json();
      setUsers(data.users || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // แปลงบทบาทที่แสดง: ถ้า isExecutive=true และ role=teacher → executive
  const getDisplayRole = (user: User): string => {
    if (user.isExecutive && user.role === "teacher") return "executive";
    return user.role;
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const displayRole = getDisplayRole(user);
    const matchRole = roleFilter === "ทั้งหมด" || displayRole === roleFilter;
    return matchSearch && matchRole;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบผู้ใช้ไม่สำเร็จ");
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  // แสดงคอลัมน์ที่ปรึกษาเฉพาะเมื่อกรองเป็นนิสิต
  const showAdvisorColumn = roleFilter === "student";

  return (
    <StaffShell activePath="/staff/users">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                จัดการผู้ใช้งาน
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 text-sm text-slate-500">
                จัดการผู้ใช้ทั้งหมด (นิสิต อาจารย์ เจ้าหน้าที่ ผู้บริหาร)
              </p>
            </div>
            <Link
              href="/staff/users/add"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]"
            >
              <UserPlus className="h-4 w-4" />
              เพิ่มผู้ใช้
            </Link>
          </div>

          {/* ตัวกรอง */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {["ทั้งหมด", "student", "teacher", "officer", "executive"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setRoleFilter(tab as typeof roleFilter)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      roleFilter === tab
                        ? "bg-[#1565C0] text-white shadow-sm"
                        : "border border-blue-100 bg-white text-slate-600 hover:bg-blue-50"
                    }`}
                  >
                    {tab === "ทั้งหมด" ? "ทั้งหมด" : roleLabels[tab] || tab}
                  </button>
                ),
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อหรืออีเมล"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1565C0] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ตาราง */}
          <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100 bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#1565C0]" />
                <span className="ml-2 text-slate-500">กำลังโหลด...</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-600">{error}</div>
            ) : (
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50/50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      อีเมล
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      บทบาท
                    </th>
                    {showAdvisorColumn && (
                      <th className="px-4 py-3 text-left font-medium text-slate-500">
                        ที่ปรึกษา
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-medium text-slate-500">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={showAdvisorColumn ? 6 : 5}
                        className="py-12 text-center text-slate-400"
                      >
                        ไม่พบผู้ใช้
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const displayRole = getDisplayRole(user);
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-blue-50/50 transition hover:bg-blue-50/30"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {user.name}
                            {user.studentId && (
                              <span className="ml-2 text-xs text-slate-400">
                                ({user.studentId})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${roleColors[displayRole] || "bg-slate-50 text-slate-700"}`}
                            >
                              {roleLabels[displayRole] || displayRole}
                            </span>
                            {user.position && (
                              <span className="ml-1 text-xs text-slate-400">
                                ({user.position})
                              </span>
                            )}
                          </td>
                          {showAdvisorColumn && (
                            <td className="px-4 py-3 text-slate-500">
                              {user.advisorName || "-"}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                user.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {user.status === "active" ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {user.status === "active" ? "ใช้งาน" : "ระงับ"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={`/staff/users/${user.id}/edit`}
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-[#1565C0]"
                                aria-label="แก้ไข"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label="ลบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <p>
              แสดง {filteredUsers.length} จาก {users.length} รายการ
            </p>
          </div>
        </div>
      </section>
    </StaffShell>
  );
}
