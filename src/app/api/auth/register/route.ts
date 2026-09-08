// app/api/auth/register/route.ts
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

// ✅ ฟังก์ชันตรวจสอบรหัสผ่าน
function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);
}

// ✅ ตรวจสอบเบอร์โทร (10 หลัก ตัวเลขเท่านั้น)
function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

// ✅ ตรวจสอบรหัสนิสิต (ตัวเลขเท่านั้น)
function isValidStudentId(id: string): boolean {
  return /^[0-9]+$/.test(id);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      studentId,
      email,
      major,              // ✅ วิชาเอก
      program,            // ✅ หลักสูตร
      admissionYear,
      year,
      phone,
      password,
      advisorUserIds,
    } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!firstName || !lastName || !email || !password) {
      throw httpError(400, "กรุณากรอกชื่อ นามสกุล อีเมล และรหัสผ่าน");
    }
    if (!/^[^\s@]+@tsu\.ac\.th$/i.test(email)) {
      throw httpError(400, "อีเมลต้องลงท้ายด้วย @tsu.ac.th เท่านั้น");
    }
    if (!isValidPassword(password)) {
      throw httpError(400, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว และประกอบด้วยตัวพิมพ์เล็กและตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว");
    }
    if (!program) {
      throw httpError(400, "กรุณาเลือกหลักสูตร");
    }
    if (!admissionYear) {
      throw httpError(400, "กรุณาเลือกปีที่เข้าเรียน");
    }

    // ✅ ตรวจสอบรหัสนิสิต (ถ้ามี)
    if (studentId && !isValidStudentId(studentId)) {
      throw httpError(400, "รหัสนิสิตต้องเป็นตัวเลขเท่านั้น");
    }

    // ✅ ตรวจสอบเบอร์โทร (ถ้ามี)
    if (phone && !isValidPhone(phone)) {
      throw httpError(400, "เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น");
    }

    // 2. ตรวจสอบอีเมลซ้ำ
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT userId FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      throw httpError(409, "อีเมลนี้ถูกใช้งานแล้ว");
    }

    // 3. ตรวจสอบรหัสนิสิตซ้ำ
    if (studentId) {
      const [existingStudent] = await pool.query<RowDataPacket[]>(
        "SELECT studentId FROM students WHERE studentId = ?",
        [studentId]
      );
      if (existingStudent.length > 0) {
        throw httpError(409, "รหัสนิสิตนี้ถูกใช้งานแล้ว");
      }
    }

    // 4. จัดการอาจารย์ที่ปรึกษา
    const selectedAdvisorUserIds = Array.isArray(advisorUserIds)
      ? [...new Set(advisorUserIds.map((id: unknown) => String(id)).filter(Boolean))]
      : [];

    if (selectedAdvisorUserIds.length > 0) {
      const [advisorRows] = await pool.query<RowDataPacket[]>(
        `SELECT userId FROM teacher
         WHERE userId IN (${selectedAdvisorUserIds.map(() => "?").join(",")})`,
        selectedAdvisorUserIds
      );

      if (advisorRows.length !== selectedAdvisorUserIds.length) {
        throw httpError(400, "ไม่พบอาจารย์ที่ปรึกษาที่เลือกบางท่าน");
      }
    }

    // 5. สร้างผู้ใช้
    const userId = nanoid(20);
    const passwordHash = await bcrypt.hash(password, 10);
    const faculty = "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล";

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 5.1 สร้าง users
      await connection.query(
        `INSERT INTO users (userId, email, password, role, status)
         VALUES (?, ?, ?, 'student', 'active')`,
        [userId, email, passwordHash]
      );

      // 5.2 สร้าง students (✅ เพิ่ม program และ major)
      const newStudentId = studentId || nanoid(10);
      await connection.query(
        `INSERT INTO students 
          (studentId, userId, firstname, lastname, faculty, program, major, admissionYear, year, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newStudentId,
          userId,
          firstName,
          lastName,
          faculty,
          program,              // ✅ หลักสูตร
          major || null,        // ✅ วิชาเอก (ถ้าไม่มีให้เป็น null)
          admissionYear,
          year || null,
          phone || null,
        ]
      );

      // 5.3 บันทึกอาจารย์ที่ปรึกษา
      if (selectedAdvisorUserIds.length > 0) {
        const advisorValues = selectedAdvisorUserIds.map((advisorUserId) => [
          nanoid(20),
          newStudentId,
          advisorUserId,
        ]);
        await connection.query(
          `INSERT INTO advisor (AdvisorId, studentId, advisorUserId) VALUES ?`,
          [advisorValues]
        );
      }

      await connection.commit();
      connection.release();

      // 6. ดึงข้อมูลที่สร้างกลับมา
      const [newUser] = await pool.query<RowDataPacket[]>(
        "SELECT userId, email, role, status FROM users WHERE userId = ?",
        [userId]
      );
      const [newStudent] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM students WHERE userId = ?",
        [userId]
      );

      return NextResponse.json(
        {
          message: "สมัครสมาชิกสำเร็จ",
          user: {
            id: newUser[0].userId,
            firstName: newStudent[0].firstname,
            lastName: newStudent[0].lastname,
            studentId: newStudent[0].studentId,
            email: newUser[0].email,
            role: newUser[0].role,
            faculty: newStudent[0].faculty,
            program: newStudent[0].program,   // ✅ หลักสูตร
            major: newStudent[0].major,       // ✅ วิชาเอก
            admissionYear: newStudent[0].admissionYear,
            year: newStudent[0].year,
            phone: newStudent[0].phone,
            status: newUser[0].status,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    return jsonError(error);
  }
}