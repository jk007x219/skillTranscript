import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, QrCode, UserPlus } from "lucide-react";

// Navbar หลักของระบบ แสดงตรามหาวิทยาลัย เมนูนำทาง และปุ่มเข้าสู่ระบบ/สมัครสมาชิก/สแกน QR
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="#" className="flex min-w-0 items-center gap-3">
          <Image
            src="/tsu-logo.png"
            alt="TSU Logo"
            width={260}
            height={84}
            priority
            className="h-10 w-auto shrink-0"
          />
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="truncate text-sm font-semibold text-slate-900 md:text-base">
              คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
            </p>
            <p className="truncate text-xs text-slate-500">มหาวิทยาลัยทักษิณ</p>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/staff/scan-qr"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1565C0] px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            สแกน QR
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1565C0] px-4 py-2 text-sm font-medium text-[#1565C0] transition hover:bg-blue-50"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-medium text-slate-950 shadow-md transition hover:bg-amber-300"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            สมัครสมาชิก
          </Link>
        </div>

        <button
          type="button"
          aria-label="เปิดเมนู"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#1565C0] md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
