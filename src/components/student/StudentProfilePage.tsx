// components/student/StudentProfilePage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, GraduationCap, Mail, Phone, Save, UserRound, UsersRound } from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

type ProfileForm = {
  studentId: string;
  firstName: string;
  lastName: string;
  faculty: string;
  program: string;
  year: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  advisorNames: string[];
};

const emptyProfile: ProfileForm = {
  studentId: "",
  firstName: "",
  lastName: "",
  faculty: "",
  program: "",
  year: "",
  email: "",
  phone: "",
  profileImageUrl: "",
  advisorNames: [],
};

export default function StudentProfilePage() {
  const { user, loading, updateStudentProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    setProfile({
      studentId: user.studentId || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      faculty: user.faculty || "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
      program: user.program || user.major || "",
      year: user.year ? String(user.year) : "",
      email: user.email || "",
      phone: user.phone || "",
      profileImageUrl: user.profileImageUrl || "",
      advisorNames: user.advisorNames || [], // ✅ อาจารย์ที่ปรึกษาจาก session
    });
  }, [user]);

  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  const displayName = useMemo(
    () => `${profile.firstName} ${profile.lastName}`.trim() || "นิสิต",
    [profile.firstName, profile.lastName],
  );

  const imageSrc = previewUrl || profile.profileImageUrl;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfile((previous) => ({ ...previous, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setProfileImage(file);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("firstName", profile.firstName);
    formData.append("lastName", profile.lastName);
    formData.append("year", profile.year);
    formData.append("phone", profile.phone);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      await updateStudentProfile(formData);
      setProfileImage(null);
      setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StudentShell activePath="/student/profile">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                โปรไฟล์นิสิต
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 text-sm text-slate-500">
                จัดการข้อมูลติดต่อและรูปประจำตัวของคุณ
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1565C0]">
              กำลังโหลดข้อมูลนิสิต...
            </p>
          ) : !user ? (
            <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบอีกครั้ง
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
              <aside className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
                <div className="flex flex-col items-center text-center">
                  <label className="group relative block h-36 w-36 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-md ring-1 ring-blue-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[#1565C0]">
                        <UserRound className="h-16 w-16" />
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
                    รหัสนิสิต {profile.studentId || "-"}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <InfoLine icon={Mail} label="อีเมล" value={profile.email || "-"} />
                  <InfoLine icon={GraduationCap} label="หลักสูตร / สาขา" value={profile.program || "-"} />
                  {/* ✅ แสดงชื่ออาจารย์ที่ปรึกษา */}
                  <InfoLine
                    icon={UsersRound}
                    label="อาจารย์ที่ปรึกษา"
                    value={profile.advisorNames.length ? profile.advisorNames.join(", ") : "-"}
                  />
                </div>
              </aside>

              <div className="space-y-5">
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        ข้อมูลส่วนตัว
                      </h2>
                      <p className="text-xs text-slate-500">
                        อัปเดตได้เฉพาะข้อมูลที่อนุญาตให้แก้ไข
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <ProfileInput label="ชื่อ" name="firstName" value={profile.firstName} onChange={handleChange} />
                    <ProfileInput label="นามสกุล" name="lastName" value={profile.lastName} onChange={handleChange} />
                    <ProfileInput label="ชั้นปี" name="year" value={profile.year} type="number" min="1" max="6" onChange={handleChange} />
                    <ProfileInput label="เบอร์โทร" name="phone" value={profile.phone} type="tel" onChange={handleChange} />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-[#F8FCFF] p-5">
                  <h2 className="text-base font-semibold text-slate-900">
                    ข้อมูลจากระบบ
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    อีเมลและหลักสูตร / สาขาไม่สามารถแก้ไขจากหน้านี้ได้
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ReadOnlyField label="คณะ" value={profile.faculty || "-"} />
                    <ReadOnlyField label="หลักสูตร / สาขา" value={profile.program || "-"} />
                    <ReadOnlyField label="อีเมล" value={profile.email || "-"} />
                    <ReadOnlyField label="รหัสประจำตัว" value={profile.studentId || "-"} />
                  </div>
                </div>

                {message && (
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </p>
                )}
                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4598D0] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                  >
                    <Save className="h-5 w-5" aria-hidden="true" />
                    {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </StudentShell>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
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
  min,
  max,
}: {
  label: string;
  name: keyof ProfileForm;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: string;
  max?: string;
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
        min={min}
        max={max}
        onChange={onChange}
        className="mt-1.5 h-11 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}