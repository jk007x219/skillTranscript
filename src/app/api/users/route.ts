// app/api/users/route.ts
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const DEFAULT_PASSWORD = "SkillSciDI";

// GET: ดึงข้อมูลผู้ใช้ทั้งหมด
export async function GET() {
  try {
    const query = `
      SELECT 
        u.userId,
        u.email,
        u.role,
        u.status,
        u.created_at,
        u.updated_at,
        u.must_change_password,

        COALESCE(s.firstname, t.firstname, o.firstname) AS firstname,
        COALESCE(s.lastname, t.lastname, o.lastname) AS lastname,

        s.studentId,
        s.major,
        s.program AS student_program,
        s.year,
        s.phone AS student_phone,
        s.faculty AS student_faculty,

        t.teacherId,
        t.position,
        t.faculty AS teacher_faculty,
        t.program AS teacher_program,
        t.isExecutive,

        o.officerId,
        o.position AS officer_position,
        o.faculty AS officer_faculty,

        GROUP_CONCAT(DISTINCT a.advisorUserId) AS advisorUserIds,
        GROUP_CONCAT(
          DISTINCT CONCAT(ta.firstname, ' ', ta.lastname)
          ORDER BY ta.firstname
          SEPARATOR ', '
        ) AS advisorNames

      FROM users u

      LEFT JOIN students s
        ON u.userId = s.userId

      LEFT JOIN teacher t
        ON u.userId = t.userId

      LEFT JOIN officer o
        ON u.userId = o.userId

      LEFT JOIN advisor a
        ON a.studentId = s.studentId

      LEFT JOIN teacher ta
        ON ta.userId = a.advisorUserId

      GROUP BY
        u.userId,
        u.email,
        u.role,
        u.status,
        u.created_at,
        u.updated_at,
        u.must_change_password,

        s.firstname,
        s.lastname,
        s.studentId,
        s.major,
        s.program,
        s.year,
        s.phone,
        s.faculty,

        t.teacherId,
        t.position,
        t.faculty,
        t.program,
        t.isExecutive,

        o.officerId,
        o.position,
        o.faculty

      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);

    const users = rows.map((row) => {
      const firstName = row.firstname || "";
      const lastName = row.lastname || "";

      const advisorNames = row.advisorNames
        ? String(row.advisorNames).split(", ").filter(Boolean)
        : [];

      return {
        id: row.userId,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: row.email,
        role: row.role,

        studentId: row.studentId || null,

        major: row.major || null,

        // ✅ นิสิตใช้ students.program
        // อาจารย์ใช้ teacher.program
        program:
          row.student_program ||
          row.teacher_program ||
          null,

        year: row.year || null,
        phone: row.student_phone || null,

        faculty:
          row.student_faculty ||
          row.teacher_faculty ||
          row.officer_faculty ||
          null,

        position:
          row.position ||
          row.officer_position ||
          null,

        isExecutive: Boolean(row.isExecutive),
        status: row.status,
        mustChangePassword: Boolean(row.must_change_password),

        advisorUserIds: row.advisorUserIds
          ? String(row.advisorUserIds).split(",").filter(Boolean)
          : [],

        advisorName:
          advisorNames.length > 0
            ? advisorNames.join(", ")
            : null,

        advisorNames,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}

// POST: เพิ่มผู้ใช้ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      role,
      studentId,
      major,
      year,
      phone,
      faculty,
      position,
      program,
      isExecutive = false,
      advisorUserIds,
      status = "active",
    } = body;

    if (!firstName || !lastName || !email || !role) {
      throw httpError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    // ตรวจสอบอีเมลซ้ำ
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT userId FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      throw httpError(409, "อีเมลนี้ถูกใช้งานแล้ว");
    }

    const userId = nanoid(20);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const connection = await pool.getConnection();

    await connection.beginTransaction();

    try {
      // --------------------------------------------------
      // users
      // --------------------------------------------------
      await connection.query(
        `INSERT INTO users
          (
            userId,
            email,
            password,
            role,
            status,
            must_change_password
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email,
          passwordHash,
          role,
          status,
          1,
        ]
      );

      // --------------------------------------------------
      // STUDENT
      // --------------------------------------------------
      if (role === "student") {
        if (!studentId) {
          throw httpError(400, "กรุณากรอกรหัสนิสิต");
        }

        if (!program) {
          throw httpError(400, "กรุณาเลือกหลักสูตร");
        }

        if (!major) {
          throw httpError(400, "กรุณาเลือก/กรอกวิชาเอก");
        }

        // ✅ สำคัญ:
        // เพิ่ม program เข้าไปใน students
        await connection.query(
          `INSERT INTO students
            (
              studentId,
              userId,
              firstname,
              lastname,
              faculty,
              program,
              major,
              year,
              phone
            )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            userId,
            firstName,
            lastName,
            faculty || null,
            program || null,
            major || null,
            year ? Number(year) : null,
            phone || null,
          ]
        );

        // อาจารย์ที่ปรึกษา
        if (
          advisorUserIds &&
          Array.isArray(advisorUserIds) &&
          advisorUserIds.length > 0
        ) {
          const advisorValues = advisorUserIds.map(
            (advisorUserId: string) => [
              nanoid(20),
              studentId,
              advisorUserId,
            ]
          );

          await connection.query(
            `INSERT INTO advisor
              (
                AdvisorId,
                studentId,
                advisorUserId
              )
             VALUES ?`,
            [advisorValues]
          );
        }

      // --------------------------------------------------
      // TEACHER
      // --------------------------------------------------
      } else if (role === "teacher") {
        const isExec = isExecutive ? 1 : 0;

        await connection.query(
          `INSERT INTO teacher
            (
              teacherId,
              userId,
              firstname,
              lastname,
              position,
              faculty,
              program,
              isExecutive
            )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nanoid(20),
            userId,
            firstName,
            lastName,
            position || null,
            faculty || null,
            program || null,
            isExec,
          ]
        );

      // --------------------------------------------------
      // OFFICER
      // --------------------------------------------------
      } else if (role === "officer") {
        await connection.query(
          `INSERT INTO officer
            (
              officerId,
              userId,
              firstname,
              lastname,
              position,
              faculty
            )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            nanoid(20),
            userId,
            firstName,
            lastName,
            position || null,
            faculty || null,
          ]
        );

      } else {
        throw httpError(
          400,
          "บทบาทไม่ถูกต้อง (รองรับเฉพาะ student, teacher, officer)"
        );
      }

      await connection.commit();
      connection.release();

      // --------------------------------------------------
      // ดึงข้อมูลที่สร้างกลับมา
      // --------------------------------------------------
      const [newUser] = await pool.query<RowDataPacket[]>(
        `
        SELECT
          u.userId,
          u.email,
          u.role,
          u.status,
          u.must_change_password,

          COALESCE(s.firstname, t.firstname, o.firstname) AS firstname,
          COALESCE(s.lastname, t.lastname, o.lastname) AS lastname,

          s.studentId,
          s.major,
          s.program AS student_program,
          s.year,
          s.phone AS student_phone,
          s.faculty AS student_faculty,

          t.teacherId,
          t.position,
          t.faculty AS teacher_faculty,
          t.program AS teacher_program,
          t.isExecutive,

          o.officerId,
          o.position AS officer_position,
          o.faculty AS officer_faculty,

          GROUP_CONCAT(DISTINCT a.advisorUserId) AS advisorUserIds,

          GROUP_CONCAT(
            DISTINCT CONCAT(ta.firstname, ' ', ta.lastname)
            ORDER BY ta.firstname
            SEPARATOR ', '
          ) AS advisorNames

        FROM users u

        LEFT JOIN students s
          ON u.userId = s.userId

        LEFT JOIN teacher t
          ON u.userId = t.userId

        LEFT JOIN officer o
          ON u.userId = o.userId

        LEFT JOIN advisor a
          ON a.studentId = s.studentId

        LEFT JOIN teacher ta
          ON ta.userId = a.advisorUserId

        WHERE u.userId = ?

        GROUP BY
          u.userId,
          u.email,
          u.role,
          u.status,
          u.must_change_password,

          s.firstname,
          s.lastname,
          s.studentId,
          s.major,
          s.program,
          s.year,
          s.phone,
          s.faculty,

          t.teacherId,
          t.position,
          t.faculty,
          t.program,
          t.isExecutive,

          o.officerId,
          o.position,
          o.faculty
        `,
        [userId]
      );

      const row = newUser[0];

      const advisorNames = row.advisorNames
        ? String(row.advisorNames).split(", ").filter(Boolean)
        : [];

      return NextResponse.json(
        {
          message: "เพิ่มผู้ใช้สำเร็จ",

          user: {
            id: row.userId,

            firstName: row.firstname,
            lastName: row.lastname,

            name: `${row.firstname || ""} ${row.lastname || ""}`.trim(),

            email: row.email,
            role: row.role,

            studentId: row.studentId || null,

            major: row.major || null,

            // ✅ นิสิตดึงจาก students.program
            // อาจารย์ดึงจาก teacher.program
            program:
              row.student_program ||
              row.teacher_program ||
              null,

            year: row.year || null,

            phone: row.student_phone || null,

            faculty:
              row.student_faculty ||
              row.teacher_faculty ||
              row.officer_faculty ||
              null,

            position:
              row.position ||
              row.officer_position ||
              null,

            isExecutive: Boolean(row.isExecutive),

            status: row.status,

            mustChangePassword: Boolean(
              row.must_change_password
            ),

            advisorUserIds: row.advisorUserIds
              ? String(row.advisorUserIds)
                  .split(",")
                  .filter(Boolean)
              : [],

            advisorName:
              advisorNames.length > 0
                ? advisorNames.join(", ")
                : null,

            advisorNames,
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
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return jsonError(
        httpError(
          409,
          "ข้อมูลซ้ำ (อาจจะรหัสนิสิตหรืออีเมลซ้ำ)"
        )
      );
    }

    return jsonError(error);
  }
}