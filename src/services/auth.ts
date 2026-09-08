// src/services/auth.ts
import type { AuthResponse, RegisterPayload, StudentProfilePayload } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const requestBody = options.body
    ? isFormData
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : {
          "Content-Type": "application/json",
          ...options.headers,
        },
    credentials: "include",
    body: requestBody as BodyInit | undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาด");
  }

  return data as T;
}

export const authAPI = {
  register: (userData: RegisterPayload) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: userData,
    }),

  getStudent: (studentId: string) =>
    apiFetch<{ user: AuthResponse["user"] }>(`/students/${studentId}`),

  updateStudentProfile: (studentId: string, profile: StudentProfilePayload | FormData) =>
    apiFetch<AuthResponse>(`/students/${studentId}`, {
      method: "PUT",
      body: profile,
    }),
};