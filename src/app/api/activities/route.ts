
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError, httpError } from "@/lib/api-error";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import {
  ensureActivityRegistrationColumns,
  toMySqlDateTime,
} from "@/lib/activity-registration";

const BANGKOK_OFFSET = "+07:00";

async function ensureActivityCapacityColumn() {
  const [rows] = await pool.query<any[]>(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'activity'
       AND COLUMN_NAME = 'capacity'`,
  );
  if (!Number(rows[0]?.count)) {
    await pool.query(`ALTER TABLE activity ADD COLUMN capacity INT NOT NULL DEFAULT 30`);
  }
}



/**
 * แยก datetime-local
 *
 * เช่น
 * 2026-09-15T09:00
 *
 * ได้
 * date = 2026-09-15
 * time = 09:00:00
 */
function splitDateTime(value: string) {
  const [date, time] = value.split("T");

  return {
    date,
    time: time ? `${time}:00` : null,
  };
}

/**
 * คำนวณจำนวนชั่วโมงของกิจกรรม
 */
function calculateHours(start: Date, end: Date) {
  return (
    Math.round(
      ((end.getTime() - start.getTime()) / 3_600_000) * 100,
    ) / 100
  );
}

/**
 * แปลง datetime จากหน้าเว็บ
 *
 * datetime-local เช่น
 * 2026-09-15T09:00
 *
 * ให้ถือว่าเป็นเวลาไทย GMT+7
 */
function parseBangkokDateTime(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();

  if (!raw) {
    return null;
  }

  let date: Date;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    date = new Date(`${raw}:00${BANGKOK_OFFSET}`);
  } else if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)
  ) {
    date = new Date(`${raw}${BANGKOK_OFFSET}`);
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * แปลง MySQL DATETIME
 *
 * MySQL DATETIME ไม่มี timezone
 * ระบบนี้ถือว่าเป็นเวลาไทย GMT+7
 *
 * รองรับทั้ง
 * 2026-09-15 09:00:00
 * และ
 * Date object
 */
function parseMySqlBangkokDateTime(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const normalized = raw.replace(" ", "T");

  let date: Date;

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    date = new Date(
      `${normalized}${BANGKOK_OFFSET}`,
    );
  } else if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    date = new Date(
      `${normalized}:00${BANGKOK_OFFSET}`,
    );
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * ดึงส่วนวันที่จากค่าที่มาจาก MySQL
 *
 * รองรับทั้ง
 * - string
 * - Date object
 */
function normalizeDatePart(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * ดึงส่วนเวลาจากค่าที่มาจาก MySQL
 *
 * รองรับทั้ง
 * - string
 * - Date object
 */
function normalizeTimePart(value: unknown): string {
  if (!value) {
    return "00:00:00";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "00:00:00";
    }

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(value);
  }

  const raw = String(value).trim();

  if (!raw) {
    return "00:00:00";
  }

  const match = raw.match(
    /(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!match) {
    return "00:00:00";
  }

  const hour = match[1];
  const minute = match[2];
  const second = match[3] || "00";

  return `${hour}:${minute}:${second}`;
}

/**
 * สร้างวันเวลาเริ่มกิจกรรม
 *
 * date + time ใน DB ถือเป็นเวลาไทย GMT+7
 */
function getActivityStartDateTime(
  dateValue: unknown,
  timeValue: unknown,
): Date | null {
  const date = normalizeDatePart(dateValue);

  if (!date) {
    return null;
  }

  const time = normalizeTimePart(timeValue);

  const parsed = new Date(
    `${date}T${time}${BANGKOK_OFFSET}`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/**
 * คำนวณสถานะการลงทะเบียน
 *
 * Normal Registration:
 *
 * registrationStart <= now < registrationEnd
 *
 * และ
 *
 * now < activityStart
 *
 * Emergency Override:
 *
 * registrationEnabled = 1
 *
 * และ
 *
 * now < activityStart
 *
 * ดังนั้นเมื่อกิจกรรมเริ่มแล้ว
 * จะไม่สามารถเปิดรับสมัครได้อีกไม่ว่ากรณีใด
 */
function getRegistrationStatus(activity: {
  date: unknown;
  time: unknown;
  registrationStart: unknown;
  registrationEnd: unknown;
  registrationEnabled: unknown;
}) {
  const now = new Date();

  const activityStart = getActivityStartDateTime(
    activity.date,
    activity.time,
  );

  const registrationStart =
    parseMySqlBangkokDateTime(
      activity.registrationStart,
    );

  const registrationEnd =
    parseMySqlBangkokDateTime(
      activity.registrationEnd,
    );

  const activityStarted = Boolean(
    activityStart &&
      now.getTime() >= activityStart.getTime(),
  );

  /**
   * Normal Registration
   */
  const normalRegistrationOpen = Boolean(
    registrationStart &&
      registrationEnd &&
      activityStart &&
      now.getTime() >=
        registrationStart.getTime() &&
      now.getTime() <
        registrationEnd.getTime() &&
      now.getTime() <
        activityStart.getTime(),
  );

  /**
   * Emergency Override
   *
   * ใช้ได้เฉพาะก่อนกิจกรรมเริ่ม
   */
  const emergencyRegistrationOpen = Boolean(
    activity.registrationEnabled &&
      activityStart &&
      now.getTime() <
        activityStart.getTime(),
  );

  /**
   * หลังเริ่มกิจกรรมแล้ว
   * registrationOpen ต้องเป็น false เสมอ
   */
  const registrationOpen =
    !activityStarted &&
    (normalRegistrationOpen ||
      emergencyRegistrationOpen);

  return {
    registrationOpen,
    normalRegistrationOpen:
      !activityStarted &&
      normalRegistrationOpen,
    emergencyRegistrationOpen:
      !activityStarted &&
      emergencyRegistrationOpen,
    activityStarted,
  };
}

/**
 * GET /api/activities
 */
export async function GET(request: NextRequest) {
  try {
    await ensureActivityRegistrationColumns();
    await ensureActivityCapacityColumn();

    const { searchParams } =
      new URL(request.url);

    const visible =
      searchParams.get("visible") === "true";

    const studentId =
      searchParams.get("studentId");

    const session = await auth();

    const role = session?.user?.role;

    const isExecutive = Boolean(
      session?.user?.isExecutive,
    );

    let query = `
      SELECT
        a.activityId,
        a.activityName,
        a.description,
        a.date,
        a.time,
        a.endDate,
        a.endTime,
        a.hours,
        a.location,
        a.organizer,
        a.term,
        a.status,
        a.confirmationEnabled,
        a.hasEvaluation,
        a.evaluation,
        a.verification_code,
        a.code_expires_at,
        a.createdBy,
        a.templateId,
        a.registrationStart,
        a.registrationEnd,
        a.registrationEnabled,
        a.applicationEnabled,
        a.capacity,

        COUNT(p.ParticipationId) AS attendeeCount,

        MAX(
          CASE
            WHEN p.status = 'completed'
            THEN 1
            ELSE 0
          END
        ) AS hasConfirmedParticipants,

        MAX(sp.status) AS participationStatus,

        MAX(sp.score) AS participationScore

      FROM activity a

      LEFT JOIN participation p
        ON a.activityId = p.activityId

      ${
        studentId
          ? `
            LEFT JOIN participation sp
              ON a.activityId = sp.activityId
             AND sp.studentId = ?
          `
          : `
            LEFT JOIN participation sp
              ON 1 = 0
          `
      }
    `;

    const values: any[] = [];

    if (studentId) {
      values.push(studentId);
    }

    const conditions: string[] = [];

    /**
     * Teacher เห็นเฉพาะกิจกรรมของตัวเอง
     * ยกเว้น Executive
     */
    if (
      role === "teacher" &&
      !isExecutive &&
      session?.user?.id
    ) {
      conditions.push(
        `a.createdBy = ?`,
      );

      values.push(
        session.user.id,
      );
    }

    if (visible) {
      if (studentId) {
        /**
         * =====================================================
         * STUDENT
         * =====================================================
         *
         * ดึง active activities มาก่อน
         *
         * ห้าม filter ด้วย registrationEnabled
         * เพราะ Normal Registration ไม่จำเป็นต้องเปิด switch
         */
        conditions.push(
          `a.status = 'active'`,
        );

        /**
         * นิสิตที่ลงทะเบียนแล้ว
         * ต้องยังเห็นกิจกรรม แม้ช่วงลงทะเบียนปิดแล้ว
         */
        conditions.push(`
          (
            sp.status = 'registered'
            OR sp.status = 'completed'
            OR sp.ParticipationId IS NULL
          )
        `);

        /**
         * ไม่แสดงกิจกรรมที่ยืนยันเสร็จแล้ว
         */
        conditions.push(`
          (
            sp.ParticipationId IS NULL
            OR sp.status <> 'completed'
            OR sp.score IS NULL
          )
        `);
      } else {
        /**
         * สำหรับ public/หน้าที่ไม่ได้ส่ง studentId
         */
        conditions.push(
          `a.confirmationEnabled = 1`,
        );

        conditions.push(
          `a.hasEvaluation = 1`,
        );

        conditions.push(
          `a.status = 'active'`,
        );
      }
    }

    if (conditions.length > 0) {
      query += `
        WHERE ${conditions.join(" AND ")}
      `;
    }

    query += `
      GROUP BY a.activityId
      ORDER BY a.date DESC, a.time DESC
    `;

    const [activities] =
      await pool.query(
        query,
        values,
      );

    /**
     * =====================================================
     * ACTIVITY SKILLS
     * =====================================================
     */
    const [skills] =
      await pool.query(`
        SELECT
          activityId,
          skillId,
          skillname,
          level
        FROM activityskill
      `);

    const skillMap: Record<
      string,
      any[]
    > = {};

    (skills as any[]).forEach(
      (skill) => {
        if (
          !skillMap[skill.activityId]
        ) {
          skillMap[skill.activityId] =
            [];
        }

        skillMap[
          skill.activityId
        ].push({
          skillId:
            skill.skillId,
          name:
            skill.skillname,
          level:
            skill.level ||
            "กลาง",
        });
      },
    );

    /**
     * =====================================================
     * RESULT
     * =====================================================
     */
    const result = (
      activities as any[]
    )
      .map((act) => {
        const registrationStatus =
          getRegistrationStatus({
            date: act.date,
            time: act.time,
            registrationStart:
              act.registrationStart,
            registrationEnd:
              act.registrationEnd,
            registrationEnabled:
              Boolean(
                act.registrationEnabled,
              ),
          });

        let evaluation:
          | any
          | undefined;

        if (act.evaluation) {
          try {
            evaluation =
              typeof act.evaluation ===
              "string"
                ? JSON.parse(
                    act.evaluation,
                  )
                : act.evaluation;
          } catch {
            evaluation = undefined;
          }
        }

        return {
          id: act.activityId,

          title:
            act.activityName,

          description:
            act.description,

          date:
            act.date,

          time:
            act.time,

          endDate:
            act.endDate,

          endTime:
            act.endTime,

          hours:
            act.hours === null
              ? null
              : Number(act.hours),

          location:
            act.location,

          organizer:
            act.organizer,

          term:
            act.term,

          status:
            act.status ||
            "active",

          attendeeCount:
            Number(
              act.attendeeCount ||
                0,
            ),

          hasConfirmedParticipants:
            Boolean(
              act.hasConfirmedParticipants,
            ),

          confirmationEnabled:
            Boolean(
              act.confirmationEnabled,
            ),

          applicationEnabled:
            Boolean(
              act.applicationEnabled,
            ),

          /**
           * Emergency Override
           */
          registrationEnabled:
            Boolean(
              act.registrationEnabled,
            ),

          /**
           * Normal Registration
           */
          registrationStart:
            act.registrationStart,

          registrationEnd:
            act.registrationEnd,

          /**
           * สถานะการลงทะเบียนจริง
           */
          registrationOpen:
            registrationStatus.registrationOpen,

          normalRegistrationOpen:
            registrationStatus.normalRegistrationOpen,

          emergencyRegistrationOpen:
            registrationStatus.emergencyRegistrationOpen,

          activityStarted:
            registrationStatus.activityStarted,

          hasEvaluation:
            Boolean(
              act.hasEvaluation,
            ),

          participationStatus:
            act.participationStatus ||
            null,

          participationScore:
            act.participationScore ===
            null
              ? null
              : Number(
                  act.participationScore,
                ),

          evaluation,

          skills:
            skillMap[
              act.activityId
            ] || [],

          verificationCode:
            act.verification_code,

          codeExpiresAt:
            act.code_expires_at,

          createdBy:
            act.createdBy,

          templateId:
            act.templateId,
        };
      })
      .filter((activity) => {
        /**
         * =====================================================
         * STUDENT FILTER
         * =====================================================
         *
         * แสดงกิจกรรมเมื่อ
         *
         * 1. Normal Registration เปิด
         * หรือ
         * 2. Emergency Override เปิด
         * หรือ
         * 3. นิสิตลงทะเบียนไว้แล้ว
         *
         * แต่ไม่แสดงกิจกรรมที่ completed แล้ว
         */
        if (
          visible &&
          studentId
        ) {
          const registered =
            activity.participationStatus ===
            "registered";

          const completed =
            activity.participationStatus ===
            "completed";

          /**
           * ยืนยันเสร็จแล้ว
           * ไม่ต้องแสดงในรายการกิจกรรมที่เปิดให้เข้าร่วม
           */
          if (completed) {
            return false;
          }

          /**
           * ถ้าลงทะเบียนไว้แล้ว
           * ยังต้องเห็น
           */
          if (registered) {
            return true;
          }

          /**
           * ถ้ายังไม่ได้ลงทะเบียน
           * ต้องเปิดรับสมัครอยู่เท่านั้น
           */
          return Boolean(
            activity.registrationOpen,
          );
        }

        return true;
      });

    return NextResponse.json(
      result,
    );
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/activities
 *
 * สร้างกิจกรรมใหม่
 */
export async function POST(
  request: NextRequest,
) {
  try {
    await ensureActivityRegistrationColumns();

    const session = await auth();

    const role =
      session?.user?.role;

    const isExecutive =
      Boolean(
        session?.user?.isExecutive,
      );

    /**
     * ตรวจสอบสิทธิ์
     */
    if (
      !session?.user?.id ||
      (
        ![
          "teacher",
          "officer",
          "executive",
        ].includes(
          role || "",
        ) &&
        !isExecutive
      )
    ) {
      throw httpError(
        403,
        "ไม่มีสิทธิ์สร้างกิจกรรม",
      );
    }

    const body =
      await request.json();

    const {
      title,
      description,
      dateTime,
      endDateTime,
      term,
      location,
      selectedSkills,
      organizer,
      templateId,
      registrationStart,
      registrationEnd,
      capacity,
    } = body;

    const activityCapacity = Number(capacity);
    if (!Number.isInteger(activityCapacity) || activityCapacity < 1) {
      throw httpError(400, "จำนวนที่รับนิสิตต้องเป็นจำนวนเต็มอย่างน้อย 1 คน");
    }

    /**
     * ตรวจข้อมูลพื้นฐาน
     */
    if (
      !title ||
      !dateTime ||
      !endDateTime
    ) {
      throw httpError(
        400,
        "กรุณากรอกชื่อกิจกรรม วันที่เวลาเริ่มต้น และวันที่เวลาสิ้นสุด",
      );
    }

    /**
     * =====================================================
     * TEMPLATE
     * =====================================================
     */
    const requestedTemplate =
      typeof templateId === "string"
        ? templateId.trim()
        : "";

    let finalTemplateId:
      | string
      | null = null;

    if (requestedTemplate) {
      const [templateRows] =
        await pool.query(
          `
            SELECT
              templateId,
              status
            FROM template
            WHERE
              (
                templateId = ?
                OR name = ?
              )
              AND status = 'active'
            LIMIT 1
          `,
          [
            requestedTemplate,
            requestedTemplate,
          ],
        );

      if (
        (templateRows as any[])
          .length === 0
      ) {
        throw httpError(
          400,
          "แม่แบบที่เลือกไม่ถูกต้องหรือไม่พร้อมใช้งาน",
        );
      }

      finalTemplateId =
        (templateRows as any[])[0]
          .templateId;
    }

    /**
     * =====================================================
     * ACTIVITY DATETIME
     * =====================================================
     */
    const startDateTime =
      parseBangkokDateTime(
        dateTime,
      );

    const finishDateTime =
      parseBangkokDateTime(
        endDateTime,
      );

    if (
      !startDateTime ||
      !finishDateTime
    ) {
      throw httpError(
        400,
        "รูปแบบวันที่เวลาไม่ถูกต้อง",
      );
    }

    /**
     * ไม่อนุญาตให้สร้างกิจกรรมย้อนหลัง
     */
    if (
      startDateTime.getTime() <
      Date.now() - 60_000
    ) {
      throw httpError(
        400,
        "ไม่สามารถเลือกวันที่หรือเวลาย้อนหลังได้",
      );
    }

    /**
     * เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม
     */
    if (
      finishDateTime <=
      startDateTime
    ) {
      throw httpError(
        400,
        "วันที่เวลาสิ้นสุดต้องมากกว่าวันที่เวลาเริ่มต้น",
      );
    }

    /**
     * =====================================================
     * REGISTRATION DATETIME
     * =====================================================
     */
    if (
      (registrationStart &&
        !registrationEnd) ||
      (!registrationStart &&
        registrationEnd)
    ) {
      throw httpError(
        400,
        "กรุณาระบุเวลาเริ่มและสิ้นสุดลงทะเบียนให้ครบ",
      );
    }

    let registrationStartDate:
      | Date
      | null = null;

    let registrationEndDate:
      | Date
      | null = null;

    if (
      registrationStart &&
      registrationEnd
    ) {
      registrationStartDate =
        parseBangkokDateTime(
          registrationStart,
        );

      registrationEndDate =
        parseBangkokDateTime(
          registrationEnd,
        );

      if (
        !registrationStartDate ||
        !registrationEndDate
      ) {
        throw httpError(
          400,
          "รูปแบบเวลาลงทะเบียนไม่ถูกต้อง",
        );
      }

      /**
       * เริ่มต้องก่อนจบ
       */
      if (
        registrationStartDate >=
        registrationEndDate
      ) {
        throw httpError(
          400,
          "เวลาเริ่มลงทะเบียนต้องมาก่อนเวลาสิ้นสุดลงทะเบียน",
        );
      }

      /**
       * ช่วงเวลาลงทะเบียนต้องอยู่ภายในช่วงเวลาของกิจกรรม
       * สามารถเปิดรับลงทะเบียนก่อนกิจกรรมเริ่ม หรือระหว่างกิจกรรมได้
       * แต่ห้ามเกินเวลาสิ้นสุดกิจกรรม
       */
      if (
        registrationStartDate > finishDateTime ||
        registrationEndDate > finishDateTime
      ) {
        throw httpError(
          400,
          "ช่วงเวลาลงทะเบียนต้องอยู่ภายในช่วงเวลาของกิจกรรม และห้ามเกินเวลาสิ้นสุดกิจกรรม",
        );
      }
    }

    /**
     * =====================================================
     * CREATE ACTIVITY
     * =====================================================
     */
    const activityId =
      nanoid(20);

    const start =
      splitDateTime(
        dateTime,
      );

    const finish =
      splitDateTime(
        endDateTime,
      );

    const hours =
      calculateHours(
        startDateTime,
        finishDateTime,
      );

    await pool.query(
      `
        INSERT INTO activity
        (
          activityId,
          activityName,
          description,
          date,
          time,
          endDate,
          endTime,
          hours,
          location,
          organizer,
          term,
          status,
          confirmationEnabled,
          hasEvaluation,
          createdBy,
          templateId,
          registrationStart,
          registrationEnd,
          registrationEnabled,
          capacity
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'active',
          0,
          0,
          ?,
          ?,
          ?,
          ?,
          0
        )
      `,
      [
        activityId,

        title,

        description || "",

        start.date,

        start.time,

        finish.date,

        finish.time,

        hours,

        location || "",

        organizer ||
          "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล",

        term || "1",

        session.user.id,

        finalTemplateId,

        toMySqlDateTime(
          registrationStart,
        ),

        toMySqlDateTime(
          registrationEnd,
        ),
        activityCapacity,
      ],
    );

    /**
     * =====================================================
     * ACTIVITY SKILLS
     * =====================================================
     */
    if (
      selectedSkills &&
      selectedSkills.length > 0
    ) {
      const skillValues =
        selectedSkills.map(
          (skill: any) => [
            nanoid(20),
            activityId,
            skill.skillId || null,
            skill.name,
            skill.level ||
              "กลาง",
          ],
        );

      await pool.query(
        `
          INSERT INTO activityskill
          (
            ActivitySkillId,
            activityId,
            skillId,
            skillname,
            level
          )
          VALUES ?
        `,
        [skillValues],
      );
    }

    return NextResponse.json(
      {
        message:
          "เพิ่มกิจกรรมสำเร็จ",

        activityId,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return jsonError(error);
  }
}
