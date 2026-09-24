import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

export async function ensureActivityRegistrationColumns() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'activity'
       AND COLUMN_NAME IN ('registrationStart', 'registrationEnd', 'registrationEnabled', 'applicationEnabled')`,
  );
  const columns = new Set(rows.map((row) => row.COLUMN_NAME));
  if (!columns.has("registrationStart")) await pool.query("ALTER TABLE activity ADD COLUMN registrationStart DATETIME NULL");
  if (!columns.has("registrationEnd")) await pool.query("ALTER TABLE activity ADD COLUMN registrationEnd DATETIME NULL");
  if (!columns.has("registrationEnabled")) await pool.query("ALTER TABLE activity ADD COLUMN registrationEnabled TINYINT(1) NOT NULL DEFAULT 0");
  if (!columns.has("applicationEnabled")) await pool.query("ALTER TABLE activity ADD COLUMN applicationEnabled TINYINT(1) NOT NULL DEFAULT 0");

  // กิจกรรมที่สร้างใหม่ต้องรอเจ้าหน้าที่เปิดการมองเห็นก่อน
  if (columns.has("applicationEnabled")) {
    await pool.query("ALTER TABLE activity ALTER COLUMN applicationEnabled SET DEFAULT 0");
  }
}

export async function ensureParticipationStatusWorkflow() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participation' AND COLUMN_NAME = 'status' LIMIT 1`,
  );
  const type = String(rows[0]?.COLUMN_TYPE || "");
  if (type.startsWith("enum(") && !type.includes("'applied'")) {
    await pool.query(`ALTER TABLE participation MODIFY COLUMN status ENUM('applied','registered','confirmed','completed') NOT NULL DEFAULT 'applied'`);
  }

  const [columnRows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'participation'
       AND COLUMN_NAME IN ('registrationQrToken', 'registeredAt', 'confirmedAt')`,
  );
  const columns = new Set(columnRows.map((row) => row.COLUMN_NAME));
  if (!columns.has("registrationQrToken")) {
    await pool.query("ALTER TABLE participation ADD COLUMN registrationQrToken VARCHAR(80) NULL");
    await pool.query("ALTER TABLE participation ADD UNIQUE KEY unique_participation_qr_token (registrationQrToken)");
  }
  if (!columns.has("registeredAt")) await pool.query("ALTER TABLE participation ADD COLUMN registeredAt DATETIME NULL");
  if (!columns.has("confirmedAt")) await pool.query("ALTER TABLE participation ADD COLUMN confirmedAt DATETIME NULL");
}

export function buildRegistrationQrPayload(activityId: string, token: string, studentId?: string) {
  return studentId?.trim() || JSON.stringify({
    type: "skilltranscript.activity.registration",
    activityId,
    token,
  });
}

export function parseRegistrationQrPayload(value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed?.type === "skilltranscript.activity.registration" &&
      typeof parsed.activityId === "string" &&
      typeof parsed.token === "string"
    ) {
      return {
        activityId: parsed.activityId.trim(),
        token: parsed.token.trim(),
      };
    }
  } catch {}

  const match = raw.match(/^skilltranscript:activity:([^:]+):registration:([^:]+)$/);
  if (match) {
    return {
      activityId: match[1],
      token: match[2],
    };
  }

  return {
    activityId: "",
    token: raw,
  };
}

export function toMySqlDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${value.slice(0, 16).replace("T", " ")}:00`;
}
