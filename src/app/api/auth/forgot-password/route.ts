// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { pool } from "@/lib/db";
import { httpError, jsonError } from "@/lib/api-error";
import type { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      throw httpError(400, "กรุณากรอกอีเมล");
    }

    // ตรวจสอบว่ามีผู้ใช้อยู่ในระบบ
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT userId, email FROM users WHERE email = ?",
      [email]
    );

    // ไม่ว่ามีหรือไม่มี ให้ตอบเหมือนกัน (ป้องกันการเดาอีเมล)
    if (users.length === 0) {
      return NextResponse.json({
        message: "หากมีอีเมลนี้ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่าน",
      });
    }

    // สร้าง token และกำหนดวันหมดอายุ (1 ชั่วโมง)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // บันทึกหรืออัปเดต token
    await pool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [email, token, expiresAt]
    );

    // สร้างลิงก์รีเซ็ต
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // ส่งอีเมลผ่าน Gmail SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"ระบบ Skill Transcript" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "รีเซ็ตรหัสผ่านของคุณ",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1565C0;">รีเซ็ตรหัสผ่าน</h2>
            <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณที่ระบบ Skill Transcript</p>
            <p>คลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง):</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="background-color: #1565C0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                ตั้งรหัสผ่านใหม่
              </a>
            </p>
            <p>หรือคัดลอกลิงก์นี้ไปยังเบราว์เซอร์:</p>
            <p style="word-break: break-all; color: #1565C0;">${resetLink}</p>
            <p style="margin-top: 32px; color: #666; font-size: 14px;">
              หากคุณมิได้เป็นผู้ขอ กรุณาละเว้นอีเมลนี้
            </p>
            <p style="color: #999; font-size: 12px;">
              ระบบ Skill Transcript คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล มหาวิทยาลัยทักษิณ
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("ไม่สามารถส่งอีเมลได้:", emailError);
      throw httpError(500, "ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่ภายหลัง");
    }

    return NextResponse.json({
      message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว",
    });
  } catch (error) {
    return jsonError(error);
  }
}