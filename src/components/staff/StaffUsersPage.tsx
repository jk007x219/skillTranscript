// components/staff/StaffUsersPage.tsx
// ปรับให้ responsive: มือถือแสดงเป็นการ์ดรายคน, จอกว้างแสดงเป็นตารางเหมือนเดิม
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
  GraduationCap,
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

// ---------- ป้ายสถานะ ใช้ร่วมกันทั้งมุมมองมือถือและตาราง ----------
function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? "ใช้งาน" : "ระงับ"}
    </span>
  );
}

function RoleBadge({ role, position }: { role: string; position: string | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[role] || "bg-slate-50 text-slate-700"}`}
      >
        {roleLabels[role] || role}
      </span>
      {position && <span className="text-xs text-slate-400">({position})</span>}
    </span>
  );
}

// ---------- แถวคำสั่งแก้ไข/ลบ ใช้ร่วมกัน ----------
function RowActions({
  userId,
  onDelete,
}: {
  userId: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/staff/users/${userId}/edit`}
        className="rounded-full p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#2455A4]"
        aria-label="แก้ไข"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button
        onClick={() => onDelete(userId)}
        className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="ลบ"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

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

  // แสดงคอลัมน์/ข้อมูลที่ปรึกษาเฉพาะเมื่อกรองเป็นนิสิต
  const showAdvisorColumn = roleFilter === "student";
  const filterTabs: Array<{ key: typeof roleFilter; label: string }> = [
    { key: "ทั้งหมด", label: "ทั้งหมด" },
    { key: "student", label: roleLabels.student },
    { key: "teacher", label: roleLabels.teacher },
    { key: "officer", label: roleLabels.officer },
    { key: "executive", label: roleLabels.executive },
  ];

  return (
    <StaffShell activePath="/staff/users">
      <section className="bg-[#F5F6F8] p-3 sm:p-6 lg:p-7">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
            {/* หัวเรื่อง */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl lg:text-[28px]">
                  จัดการผู้ใช้งาน
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  นิสิต อาจารย์ เจ้าหน้าที่ และผู้บริหารทั้งหมดในระบบ
                </p>
              </div>
              <Link
                href="/staff/users/add"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2455A4] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B3F80] sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                เพิ่มผู้ใช้
              </Link>
            </div>

            {/* ค้นหา */}
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อหรืออีเมล"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2455A4] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* ตัวกรองบทบาท: เลื่อนแนวนอนได้บนมือถือ ไม่ตัดบรรทัด */}
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRoleFilter(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    roleFilter === tab.key
                      ? "bg-[#2455A4] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* จำนวนผลลัพธ์ */}
            <p className="mt-4 text-xs text-slate-400">
              แสดง {filteredUsers.length} จาก {users.length} รายการ
            </p>

            {/* สถานะโหลด / error ใช้ร่วมกันทั้งสองมุมมอง */}
            {loading ? (
              <div className="flex items-center justify-center py-14 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#2455A4]" />
                <span className="ml-2 text-sm">กำลังโหลด...</span>
              </div>
            ) : error ? (
              <div className="py-14 text-center text-sm text-red-600">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
                ไม่พบผู้ใช้
              </div>
            ) : (
              <>
                {/* ===== มุมมองมือถือ/แท็บเล็ตแคบ: การ์ดรายคน ===== */}
                <ul className="mt-3 space-y-3 sm:hidden">
                  {filteredUsers.map((user) => {
                    const displayRole = getDisplayRole(user);
                    return (
                      <li
                        key={user.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {user.name}
                            </p>
                            {user.studentId && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                รหัสนิสิต {user.studentId}
                              </p>
                            )}
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                          <RowActions userId={user.id} onDelete={handleDelete} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <RoleBadge role={displayRole} position={user.position} />
                          <StatusBadge status={user.status} />
                        </div>

                        {showAdvisorColumn && user.advisorName && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                            ที่ปรึกษา: {user.advisorName}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* ===== มุมมองจอกว้าง: ตาราง ===== */}
                <div className="mt-3 hidden overflow-x-auto rounded-xl border border-slate-100 sm:block">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
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
                      {filteredUsers.map((user) => {
                        const displayRole = getDisplayRole(user);
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-50 transition hover:bg-slate-50/60"
                          >
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {user.name}
                              {user.studentId && (
                                <span className="ml-2 text-xs text-slate-400">
                                  ({user.studentId})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{user.email}</td>
                            <td className="px-4 py-3">
                              <RoleBadge role={displayRole} position={user.position} />
                            </td>
                            {showAdvisorColumn && (
                              <td className="px-4 py-3 text-slate-500">
                                {user.advisorName || "-"}
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <StatusBadge status={user.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center">
                                <RowActions userId={user.id} onDelete={handleDelete} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </StaffShell>
  );
}
