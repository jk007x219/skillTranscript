// components/auth/LoginPage.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, LogIn, Mail, UserPlus } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // components/auth/LoginPage.tsx (เฉพาะส่วน handleSubmit)
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      // components/auth/LoginPage.tsx (เฉพาะ redirect)
      const user = await login(email, password);
      const callbackUrl = searchParams.get("callbackUrl");

      if (callbackUrl?.startsWith("/")) {
        router.push(callbackUrl);
      } else if (user.role === "teacher") {
        router.push(
          user.isExecutive ? "/executive/dashboard" : "/teacher/students",
        );
      } else if (user.role === "student") {
        router.push("/student/dashboard");
      } else if (user.role === "officer") {
        router.push("/staff/dashboard");
      } else if (user.role === "executive") {
        router.push("/executive/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-blue-50 to-sky-100 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden min-h-[500px] overflow-hidden bg-[#1F2B3D] p-6 text-white lg:flex lg:flex-col lg:justify-between">
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
              <h1 className="text-2xl font-semibold">ยินดีต้อนรับกลับ</h1>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                เข้าสู่ระบบเพื่อดูข้อมูลทักษะ ติดตามกิจกรรม
                และดาวน์โหลดใบรับรองของคุณ
              </p>
              <p className="mt-10 text-sm text-blue-100">
                ยังไม่มีบัญชีใช่ไหม?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-white transition hover:text-[#FFC107]"
                >
                  สมัครสมาชิก
                </Link>
              </p>
              <Link
                href="/register"
                className="mx-auto mt-4 inline-flex min-w-36 items-center justify-center rounded-xl bg-white px-7 py-2.5 text-sm font-medium text-[#1565C0] shadow-md transition hover:bg-blue-50"
              >
                สมัครสมาชิก
              </Link>
            </div>

            <p className="relative z-10 text-center text-xs text-blue-100">
              © Faculty of Science and Digital Innovation
            </p>

            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-sky-300/70 via-sky-500/25 to-transparent" />
            <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-300/40 blur-3xl" />
          </aside>

          <div className="flex items-center px-5 py-8 sm:px-8 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                กลับหน้าแรก
              </Link>

              <div className="text-center">
                <div className="mb-4 flex justify-center lg:hidden">
                  <Image
                    src="/tsu-logo.png"
                    alt="TSU Logo"
                    width={230}
                    height={74}
                    priority
                    className="h-11 w-auto"
                  />
                </div>
                <h2 className="text-2xl font-semibold text-[#1565C0]">
                  เข้าสู่ระบบ
                </h2>
                <p className="mt-2 text-xs leading-5 text-blue-500">
                  กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
                </p>
                <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label htmlFor="email" className="block">
                  <span className="text-sm font-medium text-[#1565C0]">
                    อีเมล
                  </span>
                  <span className="relative mt-1.5 block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="h-11 w-full rounded-xl border border-blue-300 bg-white px-11 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                    />
                  </span>
                </label>

                <label htmlFor="password" className="block">
                  <span className="text-sm font-medium text-[#1565C0]">
                    รหัสผ่าน
                  </span>
                  <span className="relative mt-1.5 block">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="h-11 w-full rounded-xl border border-blue-300 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      aria-label="แสดงรหัสผ่าน"
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-blue-300 transition hover:bg-blue-50 hover:text-[#1565C0]"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </label>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-blue-500 transition hover:text-[#1565C0]"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>

                {errorMessage && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50"
                >
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  เข้าสู่ระบบ
                </button>
              </form>

              <div className="mt-7 flex justify-center lg:hidden">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#1565C0] transition hover:text-blue-700"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  สมัครสมาชิก
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
