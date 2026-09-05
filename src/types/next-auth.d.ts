// next-auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      studentId?: string | null;
      faculty?: string | null;
      major?: string | null;
      program?: string | null;
      year?: number | null;
      phone?: string | null;
      status?: string;
      profileImageUrl?: string | null;
      advisorNames?: string[];
      isExecutive?: boolean;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    firstName: string;
    lastName: string;
    role: string;
    studentId?: string | null;
    faculty?: string | null;
    major?: string | null;
    program?: string | null;
    year?: number | null;
    phone?: string | null;
    status?: string;
    profileImageUrl?: string | null;
    advisorNames?: string[];
    isExecutive?: boolean;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    studentId?: string | null;
    faculty?: string | null;
    major?: string | null;
    program?: string | null;
    year?: number | null;
    phone?: string | null;
    status?: string;
    profileImageUrl?: string | null;
    advisorNames?: string[];
    isExecutive?: boolean;
    mustChangePassword?: boolean;
  }
}