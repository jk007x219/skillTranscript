// app/api/activities/[id]/generate-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";

// app/api/activities/[id]/generate-code/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [activities] = await pool.query(
      `SELECT activityId FROM activity WHERE activityId = ?`,
      [id]
    );
    if ((activities as any[]).length === 0) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง

    // ✅ แปลงเป็น MySQL datetime format
    const mysqlExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `UPDATE activity SET verification_code = ?, code_expires_at = ?, confirmationEnabled = 1 WHERE activityId = ?`,
      [code, mysqlExpiresAt, id]
    );

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(), // ส่งกลับเป็น ISO string (เผื่อ client ใช้)
    });
  } catch (error) {
    return jsonError(error);
  }
}