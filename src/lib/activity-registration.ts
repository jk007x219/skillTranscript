import type { RowDataPacket } from "mysql2";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
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
  if (columns.has("applicationEnabled")) await pool.query("ALTER TABLE activity ALTER COLUMN applicationEnabled SET DEFAULT 0");
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

function getQrKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for activity QR encryption");
  return createHash("sha256").update(secret).digest();
}

/**
 * QR ภายนอกจะเห็นเป็นข้อมูลเข้ารหัสแบบ opaque เท่านั้น
 * จึงไม่สามารถอ่านรหัสกิจกรรมจากข้อความที่ได้จากการสแกนทั่วไปได้
 */
export function buildRegistrationQrPayload(activityId: string, token: string) {
  return encryptRegistrationQrPayload(activityId, token);
}

function encryptRegistrationQrPayload(activityId: string, token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getQrKey(), iv);
  const plaintext = JSON.stringify({
    type: "skilltranscript.activity.registration",
    activityId,
    token,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    "skilltranscript",
    "qr",
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function parseRegistrationQrPayload(value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const parts = raw.split(":");
  if (parts.length !== 6 || parts[0] !== "skilltranscript" || parts[1] !== "qr" || parts[2] !== "v1") {
    return null;
  }

  try {
    const [, , , ivPart, tagPart, cipherPart] = parts;
    const decipher = createDecipheriv("aes-256-gcm", getQrKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherPart, "base64url")),
      decipher.final(),
    ]);
    const parsed = JSON.parse(decrypted.toString("utf8"));

    if (
      parsed?.type !== "skilltranscript.activity.registration" ||
      typeof parsed.activityId !== "string" ||
      typeof parsed.token !== "string"
    ) return null;

    return {
      activityId: parsed.activityId.trim(),
      token: parsed.token.trim(),
    };
  } catch {
    return null;
  }
}

export function toMySqlDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${value.slice(0, 16).replace("T", " ")}:00`;
}
