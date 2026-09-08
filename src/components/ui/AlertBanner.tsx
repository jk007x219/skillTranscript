// components/ui/AlertBanner.tsx
"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

type AlertBannerProps = {
  variant: "success" | "error";
  message: string;
  onDismiss?: () => void;
  className?: string;
};

// ✅ Alert แบบเดียวกันใช้ทั้ง Register / Login / Logout
// role="alert" + aria-live="assertive" สำหรับ error (ต้องอ่านทันที)
// role="status" + aria-live="polite" สำหรับ success (อ่านแบบไม่รบกวน)
export function AlertBanner({ variant, message, onDismiss, className = "" }: AlertBannerProps) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`flex items-start gap-3 rounded-xl border p-3 pr-2 shadow-sm animate-[fadeSlideIn_0.25s_ease-out] ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      } ${className}`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isError ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
        }`}
        aria-hidden="true"
      >
        {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </span>
      <p className="flex-1 text-sm leading-5">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="ปิดข้อความแจ้งเตือน"
          className={`shrink-0 rounded-full p-1 transition ${
            isError ? "hover:bg-red-100" : "hover:bg-emerald-100"
          }`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ✅ ข้อความ error ใต้ฟิลด์ฟอร์ม (ใช้แทน browser validation tooltip)
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}