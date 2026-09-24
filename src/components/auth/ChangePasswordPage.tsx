
// components/auth/ChangePasswordPage.tsx
"use client";

import { apiPath } from "@/lib/api-path";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Shield, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(apiPath("/api/auth/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ"
        );
      }

      // เปลี่ยนรหัสผ่านสำเร็จ
      setMessage(data.message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setSuccess(true);

      // อัปเดต session แต่ห้ามให้การ refresh session ที่อาจใช้เวลานาน
      // ขัดขวางการ redirect หลังเปลี่ยนรหัสผ่านสำเร็จ
      try {
        await Promise.race([
          refreshUser(),
          new Promise<void>((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch {
        // ไม่ต้องหยุดการ redirect หาก session refresh มีปัญหา
      }

      // ใช้เส้นทางเดียวกับหลังเข้าสู่ระบบสำเร็จ
      const destination =
        user?.role === "teacher"
          ? user.isExecutive
            ? "/executive/dashboard"
            : "/teacher/students"
          : user?.role === "student"
          ? "/student/dashboard"
          : user?.role === "officer"
          ? "/staff/dashboard"
          : user?.role === "executive"
          ? "/executive/dashboard"
          : "/login";

      // ให้ผู้ใช้เห็นข้อความสำเร็จสั้น ๆ แล้วเปลี่ยนหน้า
      setTimeout(() => {
        window.location.replace(apiPath(destination));
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาด"
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4">
        <div className="max-w-md w-full rounded-xl border border-emerald-100 bg-emerald-50 p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />

          <h2 className="mt-4 text-2xl font-semibold text-emerald-700">
            เปลี่ยนรหัสผ่านสำเร็จ
          </h2>

          <p className="mt-2 text-sm text-emerald-600">
            {message}
          </p>

          <p className="mt-4 text-sm text-slate-500">
            กำลังนำคุณไปยังหน้าแดชบอร์ด...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC107]/20 text-[#FFC107]">
            <Shield className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-2xl font-semibold text-[#1565C0]">
            เปลี่ยนรหัสผ่าน
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            คุณจำเป็นต้องเปลี่ยนรหัสผ่านก่อนใช้งานระบบ
          </p>

          <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-[#FFC107]" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* Current password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-[#1565C0]"
            >
              รหัสผ่านปัจจุบัน
            </label>

            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />

              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                required
                className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                placeholder="กรอกรหัสผ่านเริ่มต้นหรือรหัสปัจจุบัน"
              />
            </div>
          </div>

          {/* New password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-[#1565C0]"
            >
              รหัสผ่านใหม่
            </label>

            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
                minLength={6}
                className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#1565C0]"
            >
              ยืนยันรหัสผ่านใหม่
            </label>

            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                minLength={6}
                className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50"
          >
            {loading
              ? "กำลังบันทึก..."
              : "เปลี่ยนรหัสผ่าน"}
          </button>

        </form>
      </div>
    </div>
  );
}