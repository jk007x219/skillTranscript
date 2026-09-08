import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

export type DeanSettings = {
  deanName: string;
  deanSignatureUrl: string | null;
};

export async function ensureCertificateSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_settings (
      settingId TINYINT NOT NULL PRIMARY KEY,
      deanName VARCHAR(255) NOT NULL DEFAULT '',
      deanSignatureUrl VARCHAR(500) NULL,
      updatedBy VARCHAR(64) NULL,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

export async function getDeanSettings(): Promise<DeanSettings> {
  await ensureCertificateSettingsTable();

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT deanName, deanSignatureUrl FROM certificate_settings WHERE settingId = 1 LIMIT 1",
  );
  const row = rows[0];

  return {
    deanName: row?.deanName || "",
    deanSignatureUrl: row?.deanSignatureUrl || null,
  };
}
