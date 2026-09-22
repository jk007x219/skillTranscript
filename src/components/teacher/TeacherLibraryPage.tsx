// components/teacher/TeacherLibraryPage.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  X,
  Trash2,
  Image as ImageIcon,
  FileImage,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Edit,
} from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { useAuth } from "@/context/auth-context";
import { apiPath, withBasePath } from "@/lib/api-path";

type Template = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  fileType: string;
  status: "active" | "inactive";
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function TeacherLibraryPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ฟอร์มเพิ่ม
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ฟอร์มแก้ไข
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // ส่ง userId เพื่อกรองเฉพาะแม่แบบที่ผู้ใช้คนนี้สร้าง
      const url = user?.id
        ? apiPath(`/api/staff/templates?userId=${encodeURIComponent(String(user.id))}`)
        : apiPath("/api/staff/templates");
      const res = await fetch(url);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลแม่แบบ");
      const data = await res.json();
      setTemplates(data.templates || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", status: "active" });
    setSelectedFile(null);
    setFilePreview(null);
  };

// components/teacher/TeacherLibraryPage.tsx (ส่วน handleSubmit)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.name.trim()) {
    alert("กรุณากรอกชื่อแม่แบบ");
    return;
  }
  if (!selectedFile) {
    alert("กรุณาเลือกไฟล์แม่แบบ");
    return;
  }
  if (!user?.id) {
    alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    return;
  }

  setIsSubmitting(true);
  try {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("status", form.status);
    formData.append("file", selectedFile);
    formData.append("uploadedBy", String(user.id)); // ✅ ส่ง userId

    const res = await fetch(apiPath("/api/staff/templates"), {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "อัปโหลดไม่สำเร็จ");
    }

    await fetchTemplates();
    resetForm();
    setIsModalOpen(false);
    alert("อัปโหลดแม่แบบสำเร็จ");
  } catch (err) {
    alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบแม่แบบนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(apiPath(`/api/staff/templates?id=${id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "ลบไม่สำเร็จ");
      }
      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      status: template.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    if (!editForm.name.trim()) {
      alert("กรุณากรอกชื่อแม่แบบ");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(apiPath(`/api/staff/templates?id=${selectedTemplate.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "อัปเดตไม่สำเร็จ");
      }

      await fetchTemplates();
      setIsEditModalOpen(false);
      setSelectedTemplate(null);
      alert("อัปเดตแม่แบบสำเร็จ");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TeacherShell activePath="/teacher/library">
      <section className="p-4 sm:p-6 lg:p-7">
        <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                คลังข้อมูลและแม่แบบของฉัน
              </h1>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-[#FFC107]" />
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                จัดการแม่แบบเกียรติบัตรที่คุณสร้างขึ้น (เห็นเฉพาะของตัวเอง)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1565C0] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0D47A1]"
            >
              <Plus className="h-4 w-4" />
              เพิ่มแม่แบบ
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1565C0]" />
              <span className="ml-3 text-slate-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white py-16 text-center text-slate-400 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <FileImage className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-lg font-medium text-slate-500">ยังไม่มีแม่แบบที่คุณสร้าง</p>
              <p className="mt-1 text-sm text-slate-400">คลิก "เพิ่มแม่แบบ" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="group rounded-xl border border-blue-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-slate-100">
                    <img
                      src={withBasePath(template.imageUrl)}
                      alt={template.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(template.imageUrl)}
                        className="rounded-lg bg-white/90 p-1.5 text-slate-700 shadow-md transition hover:bg-white hover:text-[#1565C0]"
                        aria-label="ดูภาพ"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(template)}
                        className="rounded-lg bg-white/90 p-1.5 text-slate-700 shadow-md transition hover:bg-white hover:text-[#1565C0]"
                        aria-label="แก้ไข"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id)}
                        className="rounded-lg bg-white/90 p-1.5 text-slate-700 shadow-md transition hover:bg-white hover:text-red-600"
                        aria-label="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {template.status === "inactive" && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        ระงับ
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {new Date(template.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          template.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {template.status === "active" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {template.status === "active" ? "ใช้งาน" : "ระงับ"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="mt-4 text-xs text-slate-400">
              แม่แบบทั้งหมด {templates.length} รายการ
            </div>
          )}
        </div>
      </section>

      {/* Modal เพิ่มแม่แบบ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">เพิ่มแม่แบบใหม่</h2>
              <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
              <p className="mt-2 text-sm text-slate-500">
                อัปโหลดไฟล์แม่แบบเกียรติบัตรหรือใบเซอร์
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  ชื่อแม่แบบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                  placeholder="เช่น เกียรติบัตรกิจกรรมพัฒนาทักษะ"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  คำอธิบาย
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับแม่แบบนี้"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  สถานะ
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ระงับ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  ไฟล์แม่แบบ <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-slate-400">(ไฟล์รูปภาพ PNG, JPG, GIF)</span>
                </label>
                <label
                  htmlFor="file-upload"
                  className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition ${
                    filePreview ? "border-[#1565C0] bg-blue-50" : "border-blue-200 hover:border-[#1565C0]"
                  }`}
                >
                  {filePreview ? (
                    <div className="relative w-full">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        คลิกเพื่อเลือกไฟล์ หรือลากมาวางที่นี่
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        รองรับ .png, .jpg, .jpeg, .gif
                      </p>
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4598D0] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      อัปโหลด
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไข */}
      {isEditModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTemplate(null);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">แก้ไขแม่แบบ</h2>
              <div className="mt-2 h-0.5 w-20 rounded-full bg-[#FFC107]" />
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700">
                  ชื่อแม่แบบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700">
                  คำอธิบาย
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  สถานะ
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none transition focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ระงับ</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTemplate(null);
                  }}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4598D0] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1565C0] disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="relative max-h-full w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="max-h-[calc(100vh-4rem)] overflow-auto p-4">
              <img
                src={previewImage}
                alt="Preview"
                className="mx-auto max-h-[calc(100vh-6rem)] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </TeacherShell>
  );
}