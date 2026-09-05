import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type RequestRow = RowDataPacket & {
  requestId: string;
  studentId: string;
  activityName: string;
  organizer: string;
  activityDate: string;
  activityEndDate: string | null;
  description: string;
  evidenceFiles: string | null;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  approvedActivityId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  firstname: string | null;
  lastname: string | null;
  major: string | null;
};

type MappedRequest = {
  id: string;
  studentId: string;
  studentName: string;
  major: string;
  activityName: string;
  organizer: string;
  activityDate: string;
  activityEndDate: string | null;
  submittedAt: string;
  evidenceFiles: EvidenceFile[];
  description: string;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  approvedActivityId: string | null;
  reviewedAt: string | null;
  skills: { skill: string; level: string }[];
};

type EvidenceFile = {
  name: string;
  url: string | null;
  type: string | null;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-ก-๙]/g, "_");
}

function parseEvidenceFiles(value: string | null): EvidenceFile[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return { name: item, url: null, type: null };
        }
        if (item && typeof item === "object") {
          return {
            name: String(item.name || "ไฟล์หลักฐาน"),
            url: item.url ? String(item.url) : null,
            type: item.type ? String(item.type) : null,
          };
        }
        return null;
      })
      .filter((item): item is EvidenceFile => item !== null);
  } catch {
    return [];
  }
}

function mapRequest(row: RequestRow): MappedRequest {
  return {
    id: row.requestId,
    studentId: row.studentId,
    studentName: `${row.firstname || ""} ${row.lastname || ""}`.trim() || row.studentId,
    major: row.major || "-",
    activityName: row.activityName,
    organizer: row.organizer,
    activityDate: row.activityDate,
    activityEndDate: row.activityEndDate,
    submittedAt: row.createdAt,
    evidenceFiles: parseEvidenceFiles(row.evidenceFiles),
    description: row.description,
    status: row.status,
    reason: row.reason,
    approvedActivityId: row.approvedActivityId,
    reviewedAt: row.reviewedAt,
    skills: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const values: string[] = [];
    const conditions: string[] = [];

    if (studentId) {
      conditions.push("r.studentId = ?");
      values.push(studentId);
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push("r.status = ?");
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query<RequestRow[]>(
      `SELECT
         r.requestId,
         r.studentId,
         r.activityName,
         r.organizer,
         r.activityDate,
         r.activityEndDate,
         r.description,
         r.evidenceFiles,
         r.status,
         r.reason,
         r.approvedActivityId,
         r.reviewedAt,
         r.createdAt,
         s.firstname,
         s.lastname,
         s.major
       FROM activity_request r
       LEFT JOIN students s ON s.studentId = r.studentId
       ${where}
       ORDER BY r.createdAt DESC`,
      values,
    );

    const mapped: MappedRequest[] = rows.map(mapRequest);
    const requestIds = mapped.map((item) => item.id);

    if (requestIds.length > 0) {
      const [skillRows] = await pool.query<RowDataPacket[]>(
        `SELECT requestId, skillname, level
         FROM activity_request_skill
         WHERE requestId IN (${requestIds.map(() => "?").join(",")})
         ORDER BY createdAt ASC`,
        requestIds,
      );
      const skillsByRequest = new Map<string, { skill: string; level: string }[]>();
      skillRows.forEach((row) => {
        const requestId = String(row.requestId);
        const items = skillsByRequest.get(requestId) || [];
        items.push({ skill: String(row.skillname), level: String(row.level) });
        skillsByRequest.set(requestId, items);
      });

      mapped.forEach((item) => {
        item.skills = skillsByRequest.get(item.id) || [];
      });
    }

    return NextResponse.json(mapped);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let studentId = "";
    let activityName = "";
    let organizer = "";
    let activityDate = "";
    let activityEndDate = "";
    let description = "";
    let evidenceFiles: EvidenceFile[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      studentId = String(formData.get("studentId") || "");
      activityName = String(formData.get("activityName") || "");
      organizer = String(formData.get("organizer") || "");
      activityDate = String(formData.get("activityDate") || "");
      activityEndDate = String(formData.get("activityEndDate") || "");
      description = String(formData.get("description") || "");

      const files = formData
        .getAll("evidenceFiles")
        .filter((file): file is File => file instanceof File)
        .slice(0, 5);

      const requestUploadId = nanoid(10);
      const uploadDir = path.join(process.cwd(), "public", "uploads", "activity-requests", requestUploadId);
      await mkdir(uploadDir, { recursive: true });

      evidenceFiles = await Promise.all(
        files.map(async (file) => {
          const fileName = `${nanoid(8)}-${sanitizeFileName(file.name)}`;
          const bytes = Buffer.from(await file.arrayBuffer());
          await writeFile(path.join(uploadDir, fileName), bytes);
          return {
            name: file.name,
            url: `/uploads/activity-requests/${requestUploadId}/${fileName}`,
            type: file.type || null,
          };
        }),
      );
    } else {
      const body = await request.json();
      studentId = String(body.studentId || "");
      activityName = String(body.activityName || "");
      organizer = String(body.organizer || "");
      activityDate = String(body.activityDate || "");
      activityEndDate = String(body.activityEndDate || "");
      description = String(body.description || "");
      evidenceFiles = Array.isArray(body.evidenceFiles)
        ? body.evidenceFiles.map((file: any) =>
            typeof file === "string"
              ? { name: file, url: null, type: null }
              : {
                  name: String(file.name || "ไฟล์หลักฐาน"),
                  url: file.url ? String(file.url) : null,
                  type: file.type ? String(file.type) : null,
                },
          )
        : [];
    }

    if (!studentId || !activityName || !organizer || !activityDate || !activityEndDate || !description) {
      throw httpError(400, "กรุณากรอกข้อมูลคำขอให้ครบถ้วน");
    }
    if (new Date(activityEndDate) < new Date(activityDate)) {
      throw httpError(400, "วันที่สิ้นสุดกิจกรรมต้องไม่ก่อนวันที่เริ่มกิจกรรม");
    }

    const [studentRows] = await pool.query<RowDataPacket[]>(
      "SELECT studentId FROM students WHERE studentId = ?",
      [studentId],
    );
    if (studentRows.length === 0) {
      throw httpError(404, "ไม่พบข้อมูลนิสิต");
    }

    const requestId = nanoid(20);
    await pool.query(
      `INSERT INTO activity_request
        (requestId, studentId, activityName, organizer, activityDate, activityEndDate, description, evidenceFiles, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        requestId,
        studentId,
        activityName,
        organizer,
        activityDate,
        activityEndDate,
        description,
        JSON.stringify(evidenceFiles.slice(0, 5)),
      ],
    );

    return NextResponse.json(
      { message: "ส่งคำขอเพิ่มกิจกรรมเรียบร้อยแล้ว", requestId },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
