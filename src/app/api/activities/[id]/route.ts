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



// ============================================================
// Helper: แปลง Date / String เป็นส่วนวันที่ YYYY-MM-DD
// ============================================================

function normalizeDatePart(value: unknown): string | null {
  if (!value) return null;

  // MySQL DATE / JS Date
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value || "";

    const year = get("year");
    const month = get("month");
    const day = get("day");

    if (!year || !month || !day) {
      return null;
    }

    return `${year}-${month}-${day}`;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  // YYYY-MM-DD
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return raw;
  }

  // YYYY-MM-DD HH:mm:ss
  // YYYY-MM-DDTHH:mm:ss
  const dateTimeMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T]\d{2}:\d{2}(?::\d{2})?/,
  );

  if (dateTimeMatch) {
    return `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`;
  }

  return null;
}

// ============================================================
// Helper: แปลง Date / String เป็นส่วนเวลา HH:mm:ss
// ============================================================

function normalizeTimePart(value: unknown): string | null {
  if (!value) {
    return null;
  }

  // MySQL TIME บางกรณี mysql2 อาจส่งเป็น string
  // แต่รองรับ Date ไว้ด้วย
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(value);

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value || "00";

    return `${get("hour")}:${get("minute")}:${get("second")}`;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  // HH:mm
  const shortTimeMatch = raw.match(/^(\d{2}):(\d{2})$/);

  if (shortTimeMatch) {
    return `${shortTimeMatch[1]}:${shortTimeMatch[2]}:00`;
  }

  // HH:mm:ss
  const timeMatch = raw.match(/^(\d{2}):(\d{2}):(\d{2})/);

  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;
  }

  // ถ้าเป็น Date string เช่น
  // 2026-09-15T10:30:00
  const dateTimeMatch = raw.match(
    /T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (dateTimeMatch) {
    return `${dateTimeMatch[1]}:${dateTimeMatch[2]}:${dateTimeMatch[3] || "00"}`;
  }

  return null;
}

// ============================================================
// Helper: แยก dateTime จากหน้า Staff
// ============================================================

function splitDateTime(value: string) {
  const [date, time] = value.split("T");

  return {
    date,
    time: time
      ? time.length === 5
        ? `${time}:00`
        : time.slice(0, 8)
      : null,
  };
}

// ============================================================
// Helper: Parse Bangkok DateTime
// ============================================================

function parseBangkokDateTime(
  value: unknown,
): Date | null {
  if (!value) {
    return null;
  }

  // Date object
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  let normalized = raw;

  // YYYY-MM-DD HH:mm:ss
  normalized = normalized.replace(" ", "T");

  // YYYY-MM-DDTHH:mm
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    normalized += ":00";
  }

  // YYYY-MM-DDTHH:mm:ss
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    normalized += BANGKOK_OFFSET;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// ============================================================
// Helper: Parse MySQL DATETIME เป็นเวลาไทย
// ============================================================

function parseMySqlBangkokDateTime(
  value: unknown,
): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  let normalized = raw.replace(" ", "T");

  // YYYY-MM-DDTHH:mm
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    normalized += ":00";
  }

  // MySQL DATETIME ไม่มี timezone
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    normalized += BANGKOK_OFFSET;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// ============================================================
// Helper: เวลาเริ่มกิจกรรม
// ============================================================

function getActivityEndDateTime(
  dateValue: unknown,
  timeValue: unknown,
): Date | null {
  const date = normalizeDatePart(dateValue);
  if (!date) return null;
  const time = normalizeTimePart(timeValue) || "00:00:00";
  const result = new Date(`${date}T${time}${BANGKOK_OFFSET}`);
  return Number.isNaN(result.getTime()) ? null : result;
}

function getActivityStartDateTime(
  dateValue: unknown,
  timeValue: unknown,
): Date | null {
  const date = normalizeDatePart(dateValue);

  if (!date) {
    return null;
  }

  const time =
    normalizeTimePart(timeValue) ||
    "00:00:00";

  const result = new Date(
    `${date}T${time}${BANGKOK_OFFSET}`,
  );

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result;
}

// ============================================================
// Helper: Registration Status
// ============================================================

function getRegistrationStatus(
  activity: {
    date: unknown;
    time: unknown;
    registrationStart: unknown;
    registrationEnd: unknown;
    registrationEnabled: unknown;
  },
) {
  const now = new Date();

  const activityStart =
    getActivityStartDateTime(
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

  // เปิดตามช่วงเวลาที่กำหนด
  // ลงทะเบียนได้ทั้งก่อนเริ่มกิจกรรมและระหว่างกิจกรรม
  // แต่ต้องไม่เกินเวลาสิ้นสุดการลงทะเบียน
  const normalRegistrationOpen =
    Boolean(
      registrationStart &&
        registrationEnd &&
        now >= registrationStart &&
        now < registrationEnd,
    );

  // Emergency Override
  // เปิดได้เฉพาะก่อนเริ่มกิจกรรม
  const emergencyRegistrationOpen =
    Boolean(
      activity.registrationEnabled &&
        activityStart &&
        now < activityStart,
    );

  return {
    registrationOpen:
      normalRegistrationOpen ||
      emergencyRegistrationOpen,

    normalRegistrationOpen,

    emergencyRegistrationOpen,

    activityStarted:
      Boolean(
        activityStart &&
          now >= activityStart,
      ),

    activityStart,
  };
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    await ensureActivityRegistrationColumns();
    await ensureActivityCapacityColumn();

    const { searchParams } =
      new URL(request.url);

    const studentId =
      searchParams.get("studentId");

    const [activities] =
      await pool.query(
        `
          SELECT
            a.*,
            a.verification_code,
            a.code_expires_at,

            t.templateId
              AS certificateTemplateId,

            t.name
              AS certificateTemplateName,

            t.imageUrl
              AS certificateTemplateImageUrl,

            t.fileType
              AS certificateTemplateFileType

          FROM activity a

          LEFT JOIN template t
            ON t.templateId =
               a.templateId

          WHERE
            a.activityId = ?
        `,
        [id],
      );

    if (
      (activities as any[]).length === 0
    ) {
      throw httpError(
        404,
        "ไม่พบกิจกรรม",
      );
    }

    const act =
      (activities as any[])[0];

    const [skills] =
      await pool.query(
        `
          SELECT
            skillId,
            skillname,
            level
          FROM activityskill
          WHERE activityId = ?
        `,
        [id],
      );

    let alreadySubmitted = false;

    let participationStatus:
      | string
      | null = null;

    let participationScore:
      | number
      | null = null;

    if (studentId) {
      const [existing] =
        await pool.query(
          `
            SELECT
              status,
              score
            FROM participation
            WHERE
              studentId = ?
              AND activityId = ?
            LIMIT 1
          `,
          [
            studentId,
            id,
          ],
        );

      const participation =
        (existing as any[])[0];

      alreadySubmitted =
        participation?.status ===
          "completed" &&
        participation.score !==
          null &&
        participation.score !==
          undefined;

      participationStatus =
        participation?.status ||
        null;

      participationScore =
        participation?.score === null ||
        participation?.score === undefined
          ? null
          : Number(
              participation.score,
            );
    }

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

    return NextResponse.json({
      id: act.activityId,

      title: act.activityName,

      description:
        act.description,

      date: act.date,

      time: act.time,

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
        act.status,

      attendeeCount:
        act.attendeeCount || 0,

      confirmationEnabled:
        Boolean(
          act.confirmationEnabled,
        ),

      hasEvaluation:
        Boolean(
          act.hasEvaluation,
        ),

      evaluation:
        act.evaluation
          ? JSON.parse(
              act.evaluation,
            )
          : null,

      skills: (
        skills as any[]
      ).map((s) => ({
        skillId:
          s.skillId,

        name:
          s.skillname,

        level:
          s.level || "กลาง",
      })),

      verificationCode:
        act.verification_code,

      codeExpiresAt:
        act.code_expires_at,

      createdBy:
        act.createdBy,

      templateId:
        act.templateId,

      registrationStart:
        act.registrationStart,

      registrationEnd:
        act.registrationEnd,

      registrationEnabled:
        Boolean(
          act.registrationEnabled,
        ),

      registrationOpen:
        registrationStatus.registrationOpen,

      normalRegistrationOpen:
        registrationStatus.normalRegistrationOpen,

      emergencyRegistrationOpen:
        registrationStatus.emergencyRegistrationOpen,

      activityStarted:
        registrationStatus.activityStarted,

      template:
        act.certificateTemplateId
          ? {
              id:
                act.certificateTemplateId,

              templateId:
                act.certificateTemplateId,

              name:
                act.certificateTemplateName,

              imageUrl:
                act.certificateTemplateImageUrl,

              fileType:
                act.certificateTemplateFileType,
            }
          : null,

      participationStatus,

      participationScore,

      alreadySubmitted,
    });
  } catch (error) {
    return jsonError(error);
  }
}

// ============================================================
// PUT
// ============================================================

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const connection =
    await pool.getConnection();

  try {
    const { id } =
      await params;

    await ensureActivityCapacityColumn();

    await ensureActivityRegistrationColumns();

    const session =
      await auth();

    const role =
      session?.user?.role;

    const isExecutive =
      Boolean(
        session?.user?.isExecutive,
      );

    if (
      !session?.user?.id ||
      (
        ![
          "teacher",
          "officer",
          "executive",
        ].includes(role || "") &&
        !isExecutive
      )
    ) {
      throw httpError(
        403,
        "ไม่มีสิทธิ์แก้ไขกิจกรรม",
      );
    }

    if (
      role === "teacher" &&
      !isExecutive
    ) {
      const [rows] =
        await connection.query<any[]>(
          `
            SELECT
              createdBy
            FROM activity
            WHERE activityId = ?
            LIMIT 1
          `,
          [id],
        );

      if (rows.length === 0) {
        throw httpError(
          404,
          "ไม่พบกิจกรรม",
        );
      }

      if (
        rows[0].createdBy !==
        session.user.id
      ) {
        throw httpError(
          403,
          "คุณแก้ไขได้เฉพาะกิจกรรมที่สร้างเอง",
        );
      }
    }

    const body =
      await request.json();

    const [activityRows] =
      await connection.query<any[]>(
        `
          SELECT
            a.date,
            a.time,
            a.endDate,
            a.endTime,
            a.registrationStart,
            a.registrationEnd,
            a.registrationEnabled,
            a.capacity,

            EXISTS(
              SELECT 1
              FROM participation p
              WHERE
                p.activityId =
                  a.activityId
                AND p.status =
                  'completed'
            ) AS hasCompleted

          FROM activity a

          WHERE
            a.activityId = ?

          LIMIT 1
        `,
        [id],
      );

    if (
      activityRows.length === 0
    ) {
      throw httpError(
        404,
        "ไม่พบกิจกรรม",
      );
    }

    if (
      activityRows[0]
        .hasCompleted
    ) {
      throw httpError(
        409,
        "กิจกรรมนี้มีนิสิตยืนยันการเข้าร่วมแล้ว จึงไม่สามารถแก้ไขได้",
      );
    }

    // เมื่อมีนิสิตส่งแบบประเมินแล้ว ห้ามแก้ไขแบบประเมินอีก
    const [evaluationSubmissionRows] = await connection.query<any[]>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM participation p
          WHERE
            p.activityId = ?
            AND (
              p.score IS NOT NULL
              OR p.status = 'completed'
            )
        ) AS hasEvaluationSubmission
      `,
      [id],
    );

    const hasEvaluationSubmission = Boolean(
      evaluationSubmissionRows[0]?.hasEvaluationSubmission,
    );

    const {
      title,
      description,
      dateTime,
      endDateTime,
      term,
      location,
      organizer,
      status,
      selectedSkills,
      confirmationEnabled,
      hasEvaluation,
      evaluation,
      verificationCode,
      codeExpiresAt,
      registrationStart,
      registrationEnd,
      registrationEnabled,
      capacity,
    } = body;

    // ========================================================
    // เวลาเริ่มกิจกรรม
    // ========================================================

    const activityStart =
      dateTime !== undefined
        ? parseBangkokDateTime(
            dateTime,
          )
        : getActivityStartDateTime(
            activityRows[0].date,
            activityRows[0].time,
          );

    if (!activityStart) {
      throw httpError(
        400,
        "ไม่สามารถอ่านเวลาเริ่มกิจกรรมได้",
      );
    }

    // ========================================================
    // Registration Start / End
    // ========================================================

    // ตรวจสอบช่วงเวลาลงทะเบียนเฉพาะเมื่อมีการแก้ไข
    // กิจกรรมหรือข้อมูลช่วงเวลาลงทะเบียนเท่านั้น
    // การบันทึกแบบประเมินส่งมาเฉพาะ evaluation/hasEvaluation
    // จึงไม่ควรนำช่วงเวลาลงทะเบียนเดิมมาตรวจซ้ำ
    const shouldValidateRegistration =
      registrationStart !== undefined ||
      registrationEnd !== undefined ||
      dateTime !== undefined ||
      endDateTime !== undefined;

    if (shouldValidateRegistration) {
      const finalRegistrationStart =
        registrationStart !== undefined
          ? registrationStart
          : activityRows[0].registrationStart;

      const finalRegistrationEnd =
        registrationEnd !== undefined
          ? registrationEnd
          : activityRows[0].registrationEnd;

      if (
        (finalRegistrationStart && !finalRegistrationEnd) ||
        (!finalRegistrationStart && finalRegistrationEnd)
      ) {
        throw httpError(
          400,
          "กรุณาระบุเวลาเริ่มและสิ้นสุดลงทะเบียนให้ครบ",
        );
      }

      if (finalRegistrationStart && finalRegistrationEnd) {
        const finalRegistrationStartDate =
          parseMySqlBangkokDateTime(finalRegistrationStart);

        const finalRegistrationEndDate =
          parseMySqlBangkokDateTime(finalRegistrationEnd);

        if (
          !finalRegistrationStartDate ||
          !finalRegistrationEndDate
        ) {
          throw httpError(
            400,
            "รูปแบบเวลาลงทะเบียนไม่ถูกต้อง",
          );
        }

        if (finalRegistrationStartDate >= finalRegistrationEndDate) {
          throw httpError(
            400,
            "เวลาเริ่มลงทะเบียนต้องมาก่อนเวลาสิ้นสุดลงทะเบียน",
          );
        }

        const activityEnd =
          endDateTime !== undefined
            ? parseBangkokDateTime(endDateTime)
            : getActivityEndDateTime(
                activityRows[0].endDate,
                activityRows[0].endTime,
              );

        if (!activityEnd) {
          throw httpError(
            400,
            "ไม่สามารถอ่านเวลาสิ้นสุดกิจกรรมได้",
          );
        }

        // ลงทะเบียนก่อนเริ่มกิจกรรมได้ หรือเริ่มพร้อมกิจกรรม/ระหว่างกิจกรรมได้
        // แต่ห้ามเกินเวลาสิ้นสุดกิจกรรม
        if (
          finalRegistrationStartDate > activityEnd ||
          finalRegistrationEndDate > activityEnd
        ) {
          throw httpError(
            400,
            "ช่วงเวลาลงทะเบียนต้องไม่เกินเวลาสิ้นสุดกิจกรรม",
          );
        }
      }
    }

    // ========================================================
    // Emergency Override
    // เปิดได้เฉพาะก่อนกิจกรรมเริ่ม
    // ========================================================

    if (
      registrationEnabled === true &&
      new Date() >= activityStart
    ) {
      throw httpError(
        400,
        "ไม่สามารถเปิด Emergency Override หลังเริ่มกิจกรรมแล้ว",
      );
    }

    // ========================================================
    // UPDATE fields
    // ========================================================

    const updates: string[] = [];

    const values: any[] = [];

    const addUpdate = (
      field: string,
      value: any,
      transform?: (
        v: any,
      ) => any,
    ) => {
      if (
        value !== undefined &&
        value !== null
      ) {
        updates.push(
          `${field} = ?`,
        );

        values.push(
          transform
            ? transform(value)
            : value,
        );
      } else if (
        value === null
      ) {
        updates.push(
          `${field} = ?`,
        );

        values.push(null);
      }
    };

    // ========================================================
    // Basic fields
    // ========================================================
    if (capacity !== undefined) {
      const activityCapacity = Number(capacity);
      if (!Number.isInteger(activityCapacity) || activityCapacity < 1) {
        throw httpError(400, "จำนวนที่รับนิสิตต้องเป็นจำนวนเต็มอย่างน้อย 1 คน");
      }
      addUpdate("capacity", activityCapacity);
    }


    addUpdate(
      "activityName",
      title,
    );

    addUpdate(
      "description",
      description,
    );

    addUpdate(
      "term",
      term,
    );

    addUpdate(
      "location",
      location,
    );

    addUpdate(
      "organizer",
      organizer,
    );

    addUpdate(
      "status",
      status,
    );

    // ========================================================
    // Registration
    // ========================================================

    if (
      registrationStart !==
      undefined
    ) {
      addUpdate(
        "registrationStart",
        registrationStart === null ||
          registrationStart === ""
          ? null
          : toMySqlDateTime(
              registrationStart,
            ),
      );
    }

    if (
      registrationEnd !==
      undefined
    ) {
      addUpdate(
        "registrationEnd",
        registrationEnd === null ||
          registrationEnd === ""
          ? null
          : toMySqlDateTime(
              registrationEnd,
            ),
      );
    }

    if (
      registrationEnabled !==
      undefined
    ) {
      addUpdate(
        "registrationEnabled",
        registrationEnabled,
        (value: boolean) =>
          value ? 1 : 0,
      );
    }

    // ========================================================
    // วันที่เริ่มกิจกรรม
    // ========================================================

    if (
      dateTime !== undefined
    ) {
      const start =
        splitDateTime(
          dateTime,
        );

      addUpdate(
        "date",
        start.date,
      );

      addUpdate(
        "time",
        start.time,
      );
    }

    // ========================================================
    // วันที่สิ้นสุดกิจกรรม
    // ========================================================

    if (
      endDateTime !== undefined
    ) {
      const finish =
        splitDateTime(
          endDateTime,
        );

      addUpdate(
        "endDate",
        finish.date,
      );

      addUpdate(
        "endTime",
        finish.time,
      );
    }

    // ========================================================
    // ชั่วโมงกิจกรรม
    // ========================================================

    if (
      dateTime !== undefined &&
      endDateTime !== undefined
    ) {
      const startDate =
        parseBangkokDateTime(
          dateTime,
        );

      const endDate =
        parseBangkokDateTime(
          endDateTime,
        );

      if (
        startDate &&
        endDate &&
        endDate > startDate
      ) {
        const hours =
          calculateActivityHours(
            dateTime,
            endDateTime,
          );

        addUpdate(
          "hours",
          hours,
        );
      }
    }

    // ========================================================
    // Confirmation
    // ========================================================

    addUpdate(
      "confirmationEnabled",
      confirmationEnabled,
      (v: boolean) =>
        v ? 1 : 0,
    );

    // ========================================================
    // Evaluation
    // ========================================================

    if (
      hasEvaluation !== undefined ||
      evaluation !== undefined
    ) {
      if (hasEvaluationSubmission) {
        throw httpError(
          409,
          "มีนิสิตทำแบบประเมินกิจกรรมนี้แล้ว จึงไม่สามารถแก้ไขแบบประเมินได้",
        );
      }

      if (hasEvaluation === true) {
        const questionCount = Array.isArray(evaluation)
          ? evaluation.length
          : 0;

        if (questionCount < 5) {
          throw httpError(
            400,
            "แบบประเมินต้องมีคำถามอย่างน้อย 5 ข้อ",
          );
        }

        const [requiredSkillRows] = await connection.query<any[]>(
          `
            SELECT skillname
            FROM activityskill
            WHERE activityId = ?
          `,
          [id],
        );

        const requiredSkills = requiredSkillRows
          .map((row) => String(row.skillname || "").trim())
          .filter(Boolean);

        const selectedSkills = new Set(
          (evaluation || []).flatMap((question: any) =>
            Array.isArray(question?.skillNames)
              ? question.skillNames
                  .map((name: any) => String(name || "").trim())
                  .filter(Boolean)
              : [],
          ),
        );

        const missingSkills = requiredSkills.filter(
          (skill) => !selectedSkills.has(skill),
        );

        if (missingSkills.length > 0) {
          throw httpError(
            400,
            `กรุณาเลือกทักษะให้ครบทุกทักษะที่กำหนดไว้: ${missingSkills.join(", ")}`,
          );
        }
      }
    }

    addUpdate(
      "hasEvaluation",
      hasEvaluation,
      (v: boolean) =>
        v ? 1 : 0,
    );

    if (
      evaluation !== undefined
    ) {
      const evalData =
        Array.isArray(evaluation)
          ? evaluation.map(
              (q: any) => ({
                id: q.id,

                question:
                  q.question,

                options:
                  q.options,

                correctAnswer:
                  q.correctAnswer,

                skillNames:
                  q.skillNames ||
                  [],
              }),
            )
          : [];

      addUpdate(
        "evaluation",
        JSON.stringify(
          evalData,
        ),
      );
    }

    // ========================================================
    // Verification code
    // ========================================================

    addUpdate(
      "verification_code",
      verificationCode,
    );

    if (
      codeExpiresAt !==
      undefined
    ) {
      const mysqlDate =
        codeExpiresAt === null ||
        codeExpiresAt === ""
          ? null
          : toMySqlDateTime(
              codeExpiresAt,
            );

      addUpdate(
        "code_expires_at",
        mysqlDate,
      );
    }

    // ========================================================
    // ตรวจว่ามีอะไรให้ update หรือไม่
    // ========================================================

    if (
      updates.length === 0 &&
      selectedSkills ===
        undefined
    ) {
      throw httpError(
        400,
        "ไม่มีข้อมูลที่จะอัปเดต",
      );
    }

    await connection.beginTransaction();

    // ========================================================
    // UPDATE activity
    // ========================================================

    if (updates.length > 0) {
      values.push(id);

      const query = `
        UPDATE activity
        SET ${updates.join(", ")}
        WHERE activityId = ?
      `;

      await connection.query(
        query,
        values,
      );
    }

    // ========================================================
    // UPDATE skills
    // ========================================================

    if (
      selectedSkills !==
        undefined &&
      Array.isArray(
        selectedSkills,
      )
    ) {
      await connection.query(
        `
          DELETE FROM activityskill
          WHERE activityId = ?
        `,
        [id],
      );

      if (
        selectedSkills.length > 0
      ) {
        const skillValues =
          selectedSkills.map(
            (skill: any) => [
              nanoid(20),

              id,

              skill.skillId ||
                null,

              skill.name,

              skill.level ||
                "กลาง",
            ],
          );

        await connection.query(
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
    }

    await connection.commit();

    // ========================================================
    // อ่านข้อมูลหลัง update
    // ========================================================

    const [updated] =
      await pool.query(
        `
          SELECT *
          FROM activity
          WHERE activityId = ?
        `,
        [id],
      );

    const act =
      (updated as any[])[0];

    if (!act) {
      throw httpError(
        404,
        "ไม่พบกิจกรรมหลังจากอัปเดต",
      );
    }

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

    return NextResponse.json({
      message:
        "อัปเดตกิจกรรมสำเร็จ",

      activity: {
        id:
          act.activityId,

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
          act.status,

        confirmationEnabled:
          Boolean(
            act.confirmationEnabled,
          ),

        hasEvaluation:
          Boolean(
            act.hasEvaluation,
          ),

        registrationStart:
          act.registrationStart,

        registrationEnd:
          act.registrationEnd,

        registrationEnabled:
          Boolean(
            act.registrationEnabled,
          ),

        registrationOpen:
          registrationStatus.registrationOpen,

        normalRegistrationOpen:
          registrationStatus.normalRegistrationOpen,

        emergencyRegistrationOpen:
          registrationStatus.emergencyRegistrationOpen,

        activityStarted:
          registrationStatus.activityStarted,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "PUT Error:",
      error,
    );

    return jsonError(error);
  } finally {
    connection.release();
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const connection =
    await pool.getConnection();

  try {
    const { id } =
      await params;

    const session =
      await auth();

    const role =
      session?.user?.role;

    const isExecutive =
      Boolean(
        session?.user?.isExecutive,
      );

    if (
      !session?.user?.id ||
      (
        ![
          "teacher",
          "officer",
          "executive",
        ].includes(role || "") &&
        !isExecutive
      )
    ) {
      throw httpError(
        403,
        "ไม่มีสิทธิ์ลบกิจกรรม",
      );
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            activityId,
            createdBy
          FROM activity
          WHERE activityId = ?
        `,
        [id],
      );

    if (
      (rows as any[]).length === 0
    ) {
      throw httpError(
        404,
        "ไม่พบกิจกรรม",
      );
    }

    if (
      role === "teacher" &&
      !isExecutive &&
      (rows as any[])[0]
        .createdBy !==
        session.user.id
    ) {
      throw httpError(
        403,
        "คุณลบได้เฉพาะกิจกรรมที่สร้างเอง",
      );
    }

    await connection.beginTransaction();

    await connection.query(
      `
        DELETE FROM activityskill
        WHERE activityId = ?
      `,
      [id],
    );

    await connection.query(
      `
        DELETE FROM participation
        WHERE activityId = ?
      `,
      [id],
    );

    await connection.query(
      `
        DELETE FROM activity
        WHERE activityId = ?
      `,
      [id],
    );

    await connection.commit();

    return NextResponse.json({
      message:
        "ลบกิจกรรมสำเร็จ",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    return jsonError(error);
  } finally {
    connection.release();
  }
}

// ============================================================
// Helper: คำนวณชั่วโมงกิจกรรม
// ============================================================

function calculateActivityHours(
  start: string,
  end: string,
) {
  if (!start || !end) {
    return 0;
  }

  const startTime =
    parseBangkokDateTime(
      start,
    )?.getTime();

  const endTime =
    parseBangkokDateTime(
      end,
    )?.getTime();

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime! <= startTime!
  ) {
    return 0;
  }

  return (
    Math.round(
      (
        (endTime! - startTime!) /
        3_600_000
      ) * 100,
    ) / 100
  );
}