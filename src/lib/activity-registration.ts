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
}

export async function ensureParticipationStatusWorkflow() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participation' AND COLUMN_NAME = 'status' LIMIT 1`,
  );
  const type = String(rows[0]?.COLUMN_TYPE || "");
  if (type.startsWith("enum(") && !type.includes("'applied'")) {
    await pool.query(`ALTER TABLE participation MODIFY COLUMN status ENUM('applied','registered','confirmed','completed') NOT NULL DEFAULT 'applied'`);
  }
}

export function toMySqlDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${value.slice(0, 16).replace("T", " ")}:00`;
}
