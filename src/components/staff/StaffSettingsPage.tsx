"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Camera,
  Mail,
  Save,
  User,
  Briefcase,
  Building,
  Loader2,
} from "lucide-react";
import StaffShell from "@/components/staff/StaffShell";

type StaffProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position: string;
  faculty: string;
  profileImageUrl: string | null;
};

export default function StaffSettingsPage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/staff/profile");
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลโปรไฟล์");
      const data = await res.json();
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
      });
      if (data.profileImageUrl) setPreviewUrl(data.profileImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileImage) {
      const url = URL.createObjectURL(profileImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [profileImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      setProfileImage(file);
      setMessage("");
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const formDataToSend = new FormData();
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    if (profileImage) {
      formDataToSend.append("profileImage", profileImage);
    }

    try {
      const res = await fetch("/api/staff/profile", {
        method: "PUT",
        body: formDataToSend,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");
      setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
      setProfileImage(null);
      // อัปเดต session เพื่อให้ header แสดงรูปใหม่
      await update();
      // อัปเดตข้อมูลในหน้า
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StaffShell activePath="/staff/settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
          <span className="ml-2 text-slate-500">กำลังโหลด...</span>
        </div>
      </StaffShell>
    );
  }

  if (error && !profile) {
    return (
      <StaffShell activePath="/staff/settings">
        <div className="p-6 text-red-600">เกิดข้อผิดพลาด: {error}</div>
      </StaffShell>
    );
  }

  const displayName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "เจ้าหน้าที่";

  return (
    <StaffShell activePath="/staff/settings">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                ตั้งค่าโปรไฟล์
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 text-sm text-slate-500">
                จัดการข้อมูลส่วนตัวและรูปประจำตัวของคุณ
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
            {/* Left: Profile Image */}
            <aside className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
              <div className="flex flex-col items-center text-center">
                <label className="group relative block h-36 w-36 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-md ring-1 ring-blue-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#1565C0]">
                      <User className="h-16 w-16" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-950/60 py-2 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-3.5 w-3.5" />
                    เปลี่ยนรูป
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {profile?.position || "เจ้าหน้าที่"}
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <InfoLine icon={Mail} label="อีเมล" value={profile?.email || "-"} />
                <InfoLine icon={Briefcase} label="ตำแหน่ง" value={profile?.position || "-"} />
                <InfoLine icon={Building} label="คณะ" value={profile?.faculty || "-"} />
              </div>
            </aside>

            {/* Right: Editable fields */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      ข้อมูลส่วนตัว
                    </h2>
                    <p className="text-xs text-slate-500">
                      อัปเดตข้อมูลที่สามารถแก้ไขได้
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ProfileInput
                    label="ชื่อ"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <ProfileInput
                    label="นามสกุล"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Read-only info */}
              <div className="rounded-2xl border border-blue-100 bg-[#F8FCFF] p-5">
                <h2 className="text-base font-semibold text-slate-900">
                  ข้อมูลจากระบบ
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  อีเมลและตำแหน่งไม่สามารถแก้ไขจากหน้านี้ได้
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <ReadOnlyField label="อีเมล" value={profile?.email || "-"} />
                  <ReadOnlyField label="ตำแหน่ง" value={profile?.position || "-"} />
                  <ReadOnlyField label="คณะ" value={profile?.faculty || "-"} />
                </div>
              </div>

              {message && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                >
                  <Save className="h-5 w-5" aria-hidden="true" />
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </StaffShell>
  );
}

// Helper components
function InfoLine({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/80 px-3 py-3 text-left ring-1 ring-blue-50">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1565C0]" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-[#1565C0]">{label}</p>
      <div className="mt-1.5 min-h-11 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600">
        {value}
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[#1565C0]">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1.5 h-11 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}