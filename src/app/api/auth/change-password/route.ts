// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { httpError, jsonError } from "@/lib/api-error";
import type { RowDataPacket } from "mysql2";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw httpError(401, "กรุณาเข้าสู่ระบบ");
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      throw httpError(400, "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่");
    }

    if (newPassword.length < 6) {
      throw httpError(400, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT userId, password FROM users WHERE userId = ?",
      [session.user.id]
    );

    if (users.length === 0) {
      throw httpError(404, "ไม่พบผู้ใช้");
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw httpError(400, "รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }

    // อัปเดตรหัสผ่านใหม่
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = ?, must_change_password = 0 WHERE userId = ?",
      [newPasswordHash, session.user.id]
    );

    return NextResponse.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    return jsonError(error);
  }
}