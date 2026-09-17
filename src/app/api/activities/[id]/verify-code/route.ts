import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } =
      await params;

    const session =
      await auth();

    if (
      !session?.user?.studentId ||
      session.user.role !==
        "student"
    ) {
      throw httpError(
        403,
        "กรุณาเข้าสู่ระบบด้วยบัญชีนิสิต",
      );
    }

    const body =
      await request.json();

    const code =
      typeof body.code ===
      "string"
        ? body.code.trim()
        : "";

    if (
      !/^\d{6}$/.test(code)
    ) {
      throw httpError(
        400,
        "กรุณากรอกรหัส 6 หลัก",
      );
    }

    const [activities] =
      await pool.query(
        `
          SELECT
            activityId,
            verification_code,
            code_expires_at,
            date,
            time,
            status
          FROM activity
          WHERE activityId = ?
          LIMIT 1
        `,
        [id],
      );

    if (
      (activities as any[])
        .length === 0
    ) {
      throw httpError(
        404,
        "ไม่พบกิจกรรม",
      );
    }

    const activity =
      (activities as any[])[0];

    if (
      activity.status !==
      "active"
    ) {
      throw httpError(
        400,
        "กิจกรรมนี้ไม่อยู่ในสถานะที่สามารถยืนยันการเข้าร่วมได้",
      );
    }

    const storedCode =
      activity.verification_code;

    if (!storedCode) {
      throw httpError(
        400,
        "กิจกรรมนี้ยังไม่มีรหัสยืนยัน",
      );
    }

    const expiresAt =
      activity.code_expires_at
        ? new Date(
            activity.code_expires_at,
          )
        : null;

    if (
      expiresAt &&
      !Number.isNaN(
        expiresAt.getTime(),
      ) &&
      new Date() >
        expiresAt
    ) {
      throw httpError(
        400,
        "รหัสยืนยันหมดอายุแล้ว",
      );
    }

    if (
      String(storedCode) !==
      code
    ) {
      throw httpError(
        400,
        "รหัสยืนยันไม่ถูกต้อง",
      );
    }

    /**
     * ต้องลงทะเบียนกิจกรรมก่อน
     */
    const [registrations] =
      await pool.query<any[]>(
        `
          SELECT
            ParticipationId,
            status
          FROM participation
          WHERE
            studentId = ?
            AND activityId = ?
          LIMIT 1
        `,
        [
          session.user.studentId,
          id,
        ],
      );

    if (
      registrations.length === 0
    ) {
      throw httpError(
        403,
        "กรุณาลงทะเบียนกิจกรรมก่อนยืนยันการเข้าร่วม",
      );
    }

    const registration =
      registrations[0];

    if (
      registration.status !==
      "registered"
    ) {
      if (
        registration.status ===
        "completed"
      ) {
        throw httpError(
          400,
          "กิจกรรมนี้ยืนยันการเข้าร่วมไปแล้ว",
        );
      }

      throw httpError(
        403,
        "ไม่สามารถยืนยันการเข้าร่วมจากสถานะปัจจุบันได้",
      );
    }

    return NextResponse.json({
      valid: true,
      message:
        "รหัสยืนยันถูกต้อง",
    });
  } catch (error) {
    return jsonError(error);
  }
}