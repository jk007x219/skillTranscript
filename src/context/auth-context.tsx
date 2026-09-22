// context/auth-context.tsx
"use client";

import { SessionProvider, getSession, signIn, signOut, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useMemo } from "react";
import { authAPI } from "@/services/auth";
import { apiPath } from "@/lib/api-path";
import type { AuthUser, RegisterPayload, StudentProfilePayload } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  register: (userData: RegisterPayload) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  updateStudentProfile: (profile: StudentProfilePayload | FormData) => Promise<AuthUser>;
  updateProfile: (profile: { firstName?: string; lastName?: string; profileImageUrl?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapSessionUser(user: NonNullable<ReturnType<typeof useSession>["data"]>["user"]): AuthUser {
  return {
    id: user?.id || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role as AuthUser["role"] || "student",
    studentId: user?.studentId || null,
    faculty: user?.faculty || null,
    major: user?.major || null,
    program: user?.program || null,
    year: user?.year || null,
    phone: user?.phone || null,
    status: user?.status,
    profileImageUrl: user?.profileImageUrl || null,
    admissionYear: user?.admissionYear || null,
    advisorNames: user?.advisorNames || [],
    isExecutive: Boolean(user?.isExecutive),

    mustChangePassword: Boolean(user?.mustChangePassword),
  };
}

function AuthContextProvider({ children }: AuthProviderProps) {
  const { data: session, status, update } = useSession();
  const user = session?.user ? mapSessionUser(session.user) : null;
  const loading = status === "loading";

const refreshUser = async () => {
  await update({
    user: {
      mustChangePassword: false,
    },
  });
};

  // ✅ ฟังก์ชันอัปเดตโปรไฟล์และ refresh session
  const updateProfile = async (profile: { firstName?: string; lastName?: string; profileImageUrl?: string }) => {
    await update({ user: profile });
  };

  const register = async (userData: RegisterPayload) => {
    const response = await authAPI.register(userData);
    const signInResult = await signIn("credentials", {
      email: userData.email,
      password: userData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      throw new Error("สมัครสมาชิกสำเร็จ แต่ไม่สามารถเข้าสู่ระบบอัตโนมัติได้");
    }

    const nextSession = await getSession();
    return nextSession?.user ? mapSessionUser(nextSession.user) : response.user;
  };

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const nextSession = await getSession();
    if (!nextSession?.user) {
      throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    }

    return mapSessionUser(nextSession.user);
  };

  const updateStudentProfile = async (profile: StudentProfilePayload | FormData) => {
    if (!user?.studentId) {
      throw new Error("ไม่พบข้อมูลนิสิตที่เข้าสู่ระบบ");
    }

    const response = await authAPI.updateStudentProfile(user.studentId, profile);
    await update({ user: response.user });
    return response.user;
  };

  const logout = () => {
    void signOut({ callbackUrl: "/" });
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      updateStudentProfile,
      updateProfile,
      logout,
      refreshUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    // next-auth's client ignores next.config.ts's `basePath` and defaults its
    // own fetches (csrf/providers/callback) to "/api/auth", so under the
    // "/662021086" basePath it hits the wrong absolute path and falls back to
    // "<origin>/api/auth/error". Point it at the prefixed path explicitly.
    <SessionProvider refetchOnWindowFocus={false} basePath={apiPath("/api/auth")}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}