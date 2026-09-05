"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("ไม่พบข้อมูลสำหรับรีเซ็ตรหัสผ่าน กรุณาขอใหม่");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setMessage(data.message);
      setSuccess(true);
      // รอ 3 วินาทีแล้วไปหน้า login
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          <p>{error || "ไม่พบข้อมูลสำหรับรีเซ็ตรหัสผ่าน"}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-[#1565C0] underline">
            กลับไปหน้าขอลืมรหัสผ่าน
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="mt-4 text-xl font-semibold text-emerald-700">รีเซ็ตรหัสผ่านสำเร็จ</h2>
          <p className="mt-2 text-sm text-emerald-600">{message}</p>
          <p className="mt-4 text-sm text-slate-500">กำลังนำคุณไปหน้าเข้าสู่ระบบ...</p>
          <Link href="/login" className="mt-4 inline-block text-[#1565C0] underline">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-xl border border-blue-100 bg-white p-6 shadow-md sm:p-8">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>

          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#1565C0]">ตั้งรหัสผ่านใหม่</h2>
            <p className="mt-2 text-sm text-blue-500">กรอกรหัสผ่านใหม่ของคุณ</p>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#1565C0]">
                รหัสผ่านใหม่
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1565C0]">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
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
              {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}