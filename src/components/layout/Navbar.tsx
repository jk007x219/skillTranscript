"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, QrCode, UserPlus, X } from "lucide-react";
import { useState } from "react";

// Navbar หลักของระบบ รองรับมือถือและ Desktop พร้อมปุ่ม สแกน QR / เข้าสู่ระบบ / สมัครสมาชิก
export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-3 py-2 sm:h-20 sm:px-6 lg:px-8">
        <Link href="#" onClick={closeMenu} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Image
            src="/tsu-logo.png"
            alt="TSU Logo"
            width={260}
            height={84}
            priority
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="truncate text-sm font-semibold text-slate-900 md:text-base">
              คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
            </p>
            <p className="truncate text-xs text-slate-500">มหาวิทยาลัยทักษิณ</p>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/staff/scan-qr"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#1565C0] px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            สแกน QR
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#1565C0] px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-medium text-slate-950 shadow-md transition hover:bg-amber-300"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            สมัครสมาชิก
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[#1565C0] transition hover:bg-blue-50 md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile navigation: แสดงฟังก์ชันเดียวกับ Desktop ให้ครบ */}
      <div
        className={`border-t border-slate-100 bg-white px-3 pb-3 pt-3 shadow-lg md:hidden ${open ? "block" : "hidden"}`}
      >
        <div className="mx-auto grid max-w-7xl gap-2">
          <Link
            href="/staff/scan-qr"
            onClick={closeMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#1565C0] transition hover:bg-blue-100"
          >
            <QrCode className="h-5 w-5 shrink-0" aria-hidden="true" />
            สแกน QR
          </Link>
          <Link
            href="/login"
            onClick={closeMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 text-sm font-semibold text-[#1565C0] transition hover:bg-blue-50"
          >
            <LogIn className="h-5 w-5 shrink-0" aria-hidden="true" />
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            onClick={closeMenu}
            className="flex min-h-11 items-center gap-3 rounded-xl bg-[#FFC107] px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-300"
          >
            <UserPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </header>
  );
}
