// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { httpError, jsonError } from "@/lib/api-error";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      throw httpError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    if (newPassword.length < 6) {
      throw httpError(400, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    // ตรวจสอบ token
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT email, expires_at FROM password_reset_tokens WHERE token = ?`,
      [token]
    );

    if (rows.length === 0) {
      throw httpError(400, "ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว");
    }

    const { email, expires_at } = rows[0];
    if (new Date() > new Date(expires_at)) {
      throw httpError(400, "ลิงก์รีเซ็ตหมดอายุแล้ว กรุณาขอใหม่");
    }

    // อัปเดตรหัสผ่าน
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    // ลบ token ที่ใช้แล้ว
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE token = ?",
      [token]
    );

    return NextResponse.json({
      message: "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบ",
    });
  } catch (error) {
    return jsonError(error);
  }
}