// app/api/activities/[id]/generate-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ตรวจสอบว่ากิจกรรมมีอยู่จริง
    const [activities] = await pool.query(
      `SELECT activityId FROM activity WHERE activityId = ?`,
      [id]
    );
    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    // สร้างรหัส 6 หลัก
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง

    // 🔥 สำคัญ: อัปเดตทั้งรหัส, เวลาหมดอายุ และเปิดใช้งานการยืนยัน (confirmationEnabled = 1)
    await pool.query(
      `UPDATE activity SET verification_code = ?, code_expires_at = ?, confirmationEnabled = 1 WHERE activityId = ?`,
      [code, expiresAt, id]
    );

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
