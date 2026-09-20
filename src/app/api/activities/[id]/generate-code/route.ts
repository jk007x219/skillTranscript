// app/api/activities/[id]/generate-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";

// app/api/activities/[id]/generate-code/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user?.id || !(["teacher", "officer", "executive"].includes(role || "") || session.user.isExecutive)) {
      throw httpError(403, "ไม่มีสิทธิ์สร้างรหัสยืนยันการเข้าร่วม");
    }

    const [activities] = await pool.query<any[]>(
      `SELECT activityId, createdBy, status, applicationEnabled, registrationEnabled, hasEvaluation
       FROM activity WHERE activityId = ? LIMIT 1`,
      [id]
    );
    const activity = activities[0];
    if (!activity) {
      throw httpError(404, "ไม่พบกิจกรรม");
    }
    if (role === "teacher" && !session.user.isExecutive && activity.createdBy !== session.user.id) {
      throw httpError(403, "คุณจัดการได้เฉพาะกิจกรรมที่สร้างเอง");
    }
    if (activity.status !== "active" || !activity.hasEvaluation) {
      throw httpError(400, "ต้องสร้างแบบประเมินก่อน");
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
