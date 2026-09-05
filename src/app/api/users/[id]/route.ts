// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { httpError, jsonError } from "@/lib/api-error";
import { pool } from "@/lib/db";
import { nanoid } from "nanoid";

// GET: ดึงข้อมูลผู้ใช้ตาม id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         u.userId, u.email, u.role, u.status, u.must_change_password,
         COALESCE(s.firstname, t.firstname, o.firstname) AS firstname,
         COALESCE(s.lastname, t.lastname, o.lastname) AS lastname,
         s.studentId, s.major, s.year, s.phone AS student_phone, s.faculty AS student_faculty,
         t.teacherId, t.position, t.faculty AS teacher_faculty, t.program, t.isExecutive,
         o.officerId, o.position AS officer_position, o.faculty AS officer_faculty,
         GROUP_CONCAT(DISTINCT a.advisorUserId) AS advisorUserIds,
         GROUP_CONCAT(DISTINCT CONCAT(ta.firstname, ' ', ta.lastname) ORDER BY ta.firstname SEPARATOR ', ') AS advisorNames
       FROM users u
       LEFT JOIN students s ON u.userId = s.userId
       LEFT JOIN teacher t ON u.userId = t.userId
       LEFT JOIN officer o ON u.userId = o.userId
       LEFT JOIN advisor a ON a.studentId = s.studentId
       LEFT JOIN teacher ta ON ta.userId = a.advisorUserId
       WHERE u.userId = ?
       GROUP BY u.userId, u.email, u.role, u.status, u.must_change_password,
                s.firstname, s.lastname, s.studentId, s.major, s.year, s.phone, s.faculty,
                t.teacherId, t.position, t.faculty, t.program, t.isExecutive,
                o.officerId, o.position, o.faculty`,
      [id]
    );

    if (rows.length === 0) {
      throw httpError(404, "ไม่พบผู้ใช้");
    }

    const row = rows[0];
    const advisorNames = row.advisorNames ? String(row.advisorNames).split(", ").filter(Boolean) : [];

    const user = {
      id: row.userId,
      firstName: row.firstname || "",
      lastName: row.lastname || "",
      name: `${row.firstname || ""} ${row.lastname || ""}`.trim(),
      email: row.email,
      role: row.role,
      studentId: row.studentId || null,
      major: row.major || null,
      year: row.year || null,
      phone: row.student_phone || null,
      faculty: row.student_faculty || row.teacher_faculty || row.officer_faculty || null,
      position: row.position || row.officer_position || null,
      program: row.program || null,
      isExecutive: Boolean(row.isExecutive),
      status: row.status,
      mustChangePassword: Boolean(row.must_change_password),
      advisorUserIds: row.advisorUserIds ? String(row.advisorUserIds).split(",") : [],
      advisorNames: advisorNames,
    };

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}

// PUT: อัปเดตผู้ใช้ (อนุญาตให้แก้ไขรหัสนิสิตได้)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      status,
      isExecutive,
      advisorUserIds,
    } = body;

    // 1. ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT userId, role FROM users WHERE userId = ?",
      [id]
    );
    if (userRows.length === 0) {
      throw httpError(404, "ไม่พบผู้ใช้");
    }
    const currentRole = userRows[0].role;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 2. อัปเดต users
      const userUpdates: string[] = [];
      const userValues: any[] = [];
      if (email !== undefined) {
        userUpdates.push("email = ?");
        userValues.push(email);
      }
      if (role !== undefined) {
        userUpdates.push("role = ?");
        userValues.push(role);
      }
      if (status !== undefined) {
        userUpdates.push("status = ?");
        userValues.push(status);
      }
      if (userUpdates.length > 0) {
        userValues.push(id);
        await connection.query(
          `UPDATE users SET ${userUpdates.join(", ")} WHERE userId = ?`,
          userValues
        );
      }

      // 3. อัปเดต role-specific
      if (currentRole === "student") {
        // เก็บ studentId เดิมไว้ก่อน
        const [oldStudentRow] = await connection.query<RowDataPacket[]>(
          "SELECT studentId FROM students WHERE userId = ?",
          [id]
        );
        const oldStudentId = oldStudentRow.length > 0 ? oldStudentRow[0].studentId : null;

        // เตรียมอัปเดต students
        const updates: string[] = [];
        const values: any[] = [];

        if (firstName !== undefined) {
          updates.push("firstname = ?");
          values.push(firstName);
        }
        if (lastName !== undefined) {
          updates.push("lastname = ?");
          values.push(lastName);
        }
        if (faculty !== undefined) {
          updates.push("faculty = ?");
          values.push(faculty);
        }
        if (major !== undefined) {
          updates.push("major = ?");
          values.push(major);
        }
        // ❌ ไม่มี program ใน students
        // if (program !== undefined) {
        //   updates.push("program = ?");
        //   values.push(program);
        // }
        if (year !== undefined) {
          updates.push("year = ?");
          values.push(year ? Number(year) : null);
        }
        if (phone !== undefined) {
          updates.push("phone = ?");
          values.push(phone);
        }

        // ✅ อนุญาตให้แก้ไข studentId
        let newStudentId = studentId;
        if (newStudentId !== undefined) {
          // ตรวจสอบว่า studentId ใหม่ไม่ซ้ำ
          if (newStudentId !== oldStudentId) {
            const [dupCheck] = await connection.query<RowDataPacket[]>(
              "SELECT studentId FROM students WHERE studentId = ? AND userId != ?",
              [newStudentId, id]
            );
            if (dupCheck.length > 0) {
              throw httpError(409, "รหัสนิสิตนี้ถูกใช้งานแล้ว");
            }
            updates.push("studentId = ?");
            values.push(newStudentId);
          }
        }

        // อัปเดต students (ใช้ studentId ใหม่ในการอัปเดต advisor ด้วย)
        if (updates.length > 0) {
          values.push(id);
          await connection.query(
            `UPDATE students SET ${updates.join(", ")} WHERE userId = ?`,
            values
          );
        }

        // 4. อัปเดต advisor
        // ใช้ studentId ใหม่ถ้ามีการแก้ไข
        const finalStudentId = newStudentId || oldStudentId;
        if (!finalStudentId) {
          throw httpError(404, "ไม่พบรหัสนิสิต");
        }

        if (advisorUserIds !== undefined) {
          // ลบ advisor ทั้งหมด
          await connection.query(
            "DELETE FROM advisor WHERE studentId = ?",
            [finalStudentId]
          );

          // เพิ่ม advisor ใหม่
          if (Array.isArray(advisorUserIds) && advisorUserIds.length > 0) {
            const advisorValues = advisorUserIds.map((advisorUserId: string) => [
              nanoid(20),
              finalStudentId,
              advisorUserId,
            ]);
            await connection.query(
              `INSERT INTO advisor (AdvisorId, studentId, advisorUserId) VALUES ?`,
              [advisorValues]
            );
          }
        }

      } else if (currentRole === "teacher") {
        const updates: string[] = [];
        const values: any[] = [];

        if (firstName !== undefined) {
          updates.push("firstname = ?");
          values.push(firstName);
        }
        if (lastName !== undefined) {
          updates.push("lastname = ?");
          values.push(lastName);
        }
        if (faculty !== undefined) {
          updates.push("faculty = ?");
          values.push(faculty);
        }
        if (position !== undefined) {
          updates.push("position = ?");
          values.push(position);
        }
        if (program !== undefined) {
          updates.push("program = ?");
          values.push(program);
        }
        if (isExecutive !== undefined) {
          updates.push("isExecutive = ?");
          values.push(isExecutive ? 1 : 0);
        }

        if (updates.length > 0) {
          values.push(id);
          await connection.query(
            `UPDATE teacher SET ${updates.join(", ")} WHERE userId = ?`,
            values
          );
        }
      } else if (currentRole === "officer") {
        const updates: string[] = [];
        const values: any[] = [];

        if (firstName !== undefined) {
          updates.push("firstname = ?");
          values.push(firstName);
        }
        if (lastName !== undefined) {
          updates.push("lastname = ?");
          values.push(lastName);
        }
        if (faculty !== undefined) {
          updates.push("faculty = ?");
          values.push(faculty);
        }
        if (position !== undefined) {
          updates.push("position = ?");
          values.push(position);
        }

        if (updates.length > 0) {
          values.push(id);
          await connection.query(
            `UPDATE officer SET ${updates.join(", ")} WHERE userId = ?`,
            values
          );
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: "อัปเดตผู้ใช้สำเร็จ" });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    return jsonError(error);
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM users WHERE userId = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      throw httpError(404, "ไม่พบผู้ใช้");
    }

    return NextResponse.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    return jsonError(error);
  }
}