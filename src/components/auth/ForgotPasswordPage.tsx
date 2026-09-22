"use client";

import { apiPath } from "@/lib/api-path";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(apiPath("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-2xl font-semibold text-[#1565C0]">ลืมรหัสผ่าน?</h2>
            <p className="mt-2 text-sm text-blue-500">
              กรอกอีเมลที่ลงทะเบียนไว้ <span className="font-semibold">(@tsu.ac.th)</span>
              <br />
              เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
            </p>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1565C0]">
                อีเมล
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-blue-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                  placeholder="example@tsu.ac.th"
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
              <Send className="h-5 w-5" />
              {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}