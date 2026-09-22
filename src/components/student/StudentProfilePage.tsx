// components/student/StudentProfilePage.tsx
"use client";

import { apiPath, withBasePath } from "@/lib/api-path";
import { useEffect, useMemo, useState } from "react";
import { Camera, GraduationCap, Mail, Phone, Save, UserRound, UsersRound, BookOpen } from "lucide-react";
import StudentShell from "@/components/student/StudentShell";
import { useAuth } from "@/context/auth-context";

// ✅ ฟังก์ชันคำนวณปีการศึกษาและชั้นปี
function getCurrentAcademicYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return currentMonth < 6 ? currentYear - 1 : currentYear;
}

function calculateYearOfStudy(admissionYear: number): number {
  const currentAcademicYear = getCurrentAcademicYear();
  let year = currentAcademicYear - admissionYear + 1;
  if (year < 1) year = 1;
  if (year > 6) year = 6;
  return year;
}

// ✅ ฟังก์ชันตรวจสอบเบอร์โทร (10 หลัก)
function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

type ProfileForm = {
  studentId: string;
  firstName: string;
  lastName: string;
  faculty: string;
  program: string;      // หลักสูตร
  major: string;        // วิชาเอก
  admissionYear: number | null;
  year: number | null;
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
  major: "",
  admissionYear: null,
  year: null,
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
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchProfile = async () => {
    if (!user?.studentId) return;
    try {
      setLoadingProfile(true);
      const res = await fetch(apiPath(`/api/students/${user.studentId}`));
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      const data = await res.json();
      const userData = data.user || data;
      setProfile({
        studentId: userData.studentId || user.studentId || "",
        firstName: userData.firstName || user.firstName || "",
        lastName: userData.lastName || user.lastName || "",
        faculty: userData.faculty || "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
        program: userData.program || "",           // หลักสูตร
        major: userData.major || "",               // วิชาเอก
        admissionYear: userData.admissionYear ?? null,
        year: userData.year ?? null,
        email: userData.email || user.email || "",
        phone: userData.phone || "",
        profileImageUrl: userData.profileImageUrl || "",
        advisorNames: userData.advisorNames || [],
      });
    } catch (err) {
      console.error(err);
      if (user) {
        setProfile({
          studentId: user.studentId || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          faculty: user.faculty || "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",
          program: (user as any).program || "",
          major: (user as any).major || "",
          admissionYear: (user as any).admissionYear ?? null,
          year: (user as any).year ?? null,
          email: user.email || "",
          phone: user.phone || "",
          profileImageUrl: user.profileImageUrl || "",
          advisorNames: user.advisorNames || [],
        });
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user?.studentId) {
      fetchProfile();
    }
  }, [user?.studentId]);

  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(profileImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  const computedYear = useMemo(() => {
    if (profile.admissionYear) {
      return calculateYearOfStudy(profile.admissionYear);
    }
    return null;
  }, [profile.admissionYear]);

  const displayName = useMemo(
    () => `${profile.firstName} ${profile.lastName}`.trim() || "นิสิต",
    [profile.firstName, profile.lastName],
  );

  const imageSrc = previewUrl || profile.profileImageUrl;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setProfile((prev) => ({ ...prev, [name]: digitsOnly }));
      }
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
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
    setMessage("");
    setError("");

    if (profile.phone && !isValidPhone(profile.phone)) {
      setError("เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("firstName", profile.firstName);
    formData.append("lastName", profile.lastName);
    formData.append("phone", profile.phone);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      await updateStudentProfile(formData);
      setProfileImage(null);
      setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
      await fetchProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <StudentShell activePath="/student/profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-500">กำลังโหลดข้อมูล...</div>
        </div>
      </StudentShell>
    );
  }

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

          {!user ? (
            <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              ไม่พบข้อมูลนิสิต กรุณาเข้าสู่ระบบอีกครั้ง
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
              {/* Left: Profile Image */}
              <aside className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
                <div className="flex flex-col items-center text-center">
                  <label className="group relative block h-36 w-36 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-md ring-1 ring-blue-100">
                    {imageSrc ? (
                      <img
                        src={withBasePath(imageSrc)}
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
  <InfoLine icon={GraduationCap} label="หลักสูตร" value={profile.program || "-"} />
  <InfoLine icon={BookOpen} label="วิชาเอก" value={profile.major || "-"} />
                  <InfoLine
                    icon={UsersRound}
                    label="อาจารย์ที่ปรึกษา"
                    value={profile.advisorNames.length ? profile.advisorNames.join(", ") : "-"}
                  />
                </div>
              </aside>

              {/* Right: Editable fields */}
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
                    <ProfileInput
                      label="ชื่อ"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                    />
                    <ProfileInput
                      label="นามสกุล"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                    />
                    <ProfileInput
                      label="เบอร์โทร"
                      name="phone"
                      value={profile.phone}
                      type="tel"
                      onChange={handleChange}
                      placeholder="0812345678"
                      maxLength={10}
                    />
                  </div>
                  {profile.phone && !isValidPhone(profile.phone) && (
                    <p className="mt-2 text-xs text-red-500">เบอร์โทรต้องเป็นตัวเลข 10 หลัก</p>
                  )}
                </div>

                {/* ✅ ข้อมูลจากระบบ (สีทึบ อ่านอย่างเดียว) */}
                <div className="rounded-2xl border border-blue-100 bg-slate-100/70 p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-700">
                    ข้อมูลจากระบบ
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    อีเมล หลักสูตร วิชาเอก และชั้นปีไม่สามารถแก้ไขจากหน้านี้ได้
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ReadOnlyField label="คณะ" value={profile.faculty || "-"} />
  <ReadOnlyField label="หลักสูตร" value={profile.program || "-"} />
  <ReadOnlyField label="วิชาเอก" value={profile.major || "-"} />
                    <ReadOnlyField label="อีเมล" value={profile.email || "-"} />
                    <ReadOnlyField label="รหัสประจำตัว" value={profile.studentId || "-"} />
                    <ReadOnlyField
                      label="ชั้นปี (คำนวณอัตโนมัติ)"
                      value={computedYear ? `ชั้นปีที่ ${computedYear}` : "-"}
                    />
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

// Helper components
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
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1.5 min-h-11 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 cursor-not-allowed">
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
  placeholder = "",
  maxLength,
}: {
  label: string;
  name: keyof ProfileForm;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
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
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1.5 h-11 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-blue-300 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}