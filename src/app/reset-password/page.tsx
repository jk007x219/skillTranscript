// app/reset-password/page.tsx
import { Suspense } from "react";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}