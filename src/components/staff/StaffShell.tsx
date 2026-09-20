// components/staff/StaffShell.tsx (ลบปุ่มกระดิ่ง)
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Home,
  ClipboardCheck,
  CalendarDays,
  UsersRound,
  Database,
  User,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Lock,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

type SidebarLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const sidebarLinks: SidebarLink[] = [
  { href: "/staff/dashboard", label: "แดชบอร์ดภาพรวม", icon: Home },
  { href: "/staff/users", label: "จัดการผู้ใช้งาน", icon: UsersRound },
  {
    href: "/staff/activities",
    label: "จัดการกิจกรรมและการอบรม",
    icon: CalendarDays,
  },
  { href: "/staff/scan-qr", label: "สแกน QR", icon: QrCode },
  {
    href: "/staff/requests",
    label: "อนุมัติคำขอเพิ่มทักษะ",
    icon: ClipboardCheck,
  },
  { href: "/staff/library", label: "คลังข้อมูลและแม่แบบ", icon: Database },
];

function SidebarNav({
  activePath,
  onNavigate,
}: {
  activePath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-2">
      {sidebarLinks.map((item) => {
        const isActive = item.href === activePath;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={
              isActive
                ? "flex items-center gap-3 rounded-xl bg-[#FFC107] px-4 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-yellow-500/20"
                : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:pl-5"
            }
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function StaffShell({
  activePath,
  children,
}: {
  activePath: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "เจ้าหน้าที่";
  const subtitle =
    user?.position || user?.faculty || "เจ้าหน้าที่คณะวิทยาศาสตร์";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,193,7,0.16),transparent_28%),linear-gradient(135deg,#F8FAFC_0%,#EEF6FF_48%,#F8FAFC_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="เปิดเมนู"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#1565C0] shadow-sm transition hover:bg-blue-50 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Image
              src="/tsu-logo.png"
              alt="TSU Logo"
              width={260}
              height={84}
              priority
              className="h-10 w-auto"
            />
            <div className="hidden min-w-0 border-l border-slate-200 pl-3 md:block">
              <p className="truncate text-sm font-semibold text-slate-950">
                คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
              </p>
              <p className="truncate text-xs text-slate-500">
                มหาวิทยาลัยทักษิณ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* ❌ ลบปุ่ม Bell ออกแล้ว */}

            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-blue-100 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600 shadow-sm">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold text-slate-800">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500">{subtitle}</p>
                </div>
                <ChevronDown
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
              </button>

              <div className="absolute right-0 top-full hidden w-44 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg group-hover:block">
                <Link href="/staff/settings" className="block bg-[#FFC107] px-4 py-3 text-sm font-semibold text-slate-950">
                  ตั้งค่าโปรไฟล์
                </Link>
                <Link
                  href="/change-password"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-blue-50"
                >
                  <Lock className="h-4 w-4" />
                  เปลี่ยนรหัสผ่าน
                </Link>
                <Link
                  href="/"
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-blue-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  ออกจากระบบ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner แจ้งเตือนเปลี่ยนรหัสผ่าน */}
      {user?.mustChangePassword && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-sm text-amber-700">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <span>
                <span className="font-medium">
                  ⚠️ คุณจำเป็นต้องเปลี่ยนรหัสผ่าน
                </span>
                <span className="hidden sm:inline">
                  {" "}
                  เพื่อความปลอดภัยของบัญชีของคุณ
                </span>
              </span>
            </div>
            <Link
              href="/change-password"
              className="shrink-0 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600"
            >
              เปลี่ยนรหัสผ่าน
            </Link>
          </div>
        </div>
      )}

      <div
        className={`fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-[82vw] max-w-[320px] bg-gradient-to-b from-[#0D47A1] via-[#1565C0] to-[#0A3A83] p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="เมนูหลัก"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              ระบบบริหารจัดการ
            </p>
            <p className="truncate text-xs text-blue-100">เจ้าหน้าที่</p>
          </div>
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-blue-100">{subtitle}</p>
          </div>
        </div>
        <SidebarNav
          activePath={activePath}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      </aside>

      <div className="grid lg:grid-cols-[214px_1fr]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] bg-gradient-to-b from-[#0D47A1] via-[#1565C0] to-[#0A3A83] p-4 shadow-[12px_0_40px_rgba(13,71,161,0.12)] lg:block">
          <SidebarNav activePath={activePath} />
        </aside>
        {children}
      </div>
    </main>
  );
}