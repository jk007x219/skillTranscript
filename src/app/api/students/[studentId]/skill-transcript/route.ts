    const skills =
      skillRows.map((row) => {
        const earnedScore =
          toNumber(
            row.earnedScore
          );

        const maxPossibleScore =
          toNumber(
            row.maxPossibleScore
          );

        const percent =
          maxPossibleScore > 0
            ? Math.round(
                (earnedScore /
                  maxPossibleScore) *
                  10000
              ) / 100
            : 0;

        return {
          skillId:
            row.skillId,

          name:
            normalizeSkillName(
              row.skillName ||
                row.skillId
            ),

          level:
            row.level ||
            "กลาง",

          earnedScore,

          maxPossibleScore,

          percent:
            Math.min(
              100,
              Math.max(
                0,
                percent
              )
            ),
        };
      });
\n    // ========================================================
    // 5. ดึงกิจกรรมที่นิสิตเข้าร่วม
    //
    // พร้อม:
    // - ชื่อกิจกรรม
    // - รายละเอียด
    // - ผู้จัด
    // - สถานที่
    // - วันที่
    // - คะแนนรวมเดิม
    // - คะแนนแยกตามทักษะ
    // ========================================================

    const [activityRows] =
      await pool.query<ActivityRow[]>(
        `
        SELECT

          a.activityId,

          a.activityName,

          a.description,

          a.date,

          a.location,

          a.organizer,

          p.joinDate,

          p.score,

          GROUP_CONCAT(
            DISTINCT CONCAT(
              acs.skillname,
              ': ',
              COALESCE(
                acs.level,
                'กลาง'
              )
            )
            ORDER BY acs.skillname
            SEPARATOR '||'
          ) AS skills,

          GROUP_CONCAT(
            DISTINCT CONCAT(
              ps.skillName,
              '|',
              COALESCE(
                ps.earnedScore,
                0
              ),
              '|',
              COALESCE(
                ps.maxScore,
                0
              )
            )
            ORDER BY ps.skillName
            SEPARATOR '||'
          ) AS skillScores

        FROM participation p

        INNER JOIN activity a
          ON a.activityId =
             p.activityId

        LEFT JOIN activityskill acs
          ON acs.activityId =
             a.activityId

        LEFT JOIN participation_skill ps
          ON ps.participationId =
             p.ParticipationId

          AND ps.skillName =
              acs.skillname

        WHERE
          p.studentId = ?

          AND p.status =
              'completed'

        GROUP BY

          a.activityId,

          a.activityName,

          a.description,

          a.date,

          a.location,

          a.organizer,

          p.joinDate,

          p.score

        ORDER BY

          COALESCE(
            p.joinDate,
            a.date
          ) DESC,

          a.activityName ASC

        LIMIT 9
        `,
        [studentId]
      );

    // ========================================================
    // 6. ส่งข้อมูลกลับ
    // ========================================================

    const response = NextResponse.json({
      // ======================================================
      // Profile
      // ======================================================

      profile: {
        name:
          `${student.firstname || ""} ${
            student.lastname || ""
          }`.trim() ||
          student.studentId,

        nameEn: "",

        studentId:
          student.studentId,

        faculty:
          cleanThaiText(
            student.faculty
          ) || "-",

        major:
          cleanThaiText(
            student.major
          ) || "-",

        email:
          student.email || "-",

        phone:
          student.phone || "-",

        profileImageUrl:
          student.profileImageUrl ||
          null,
      },

      // ======================================================
      // Skills
      // ======================================================

      skills,

      // ======================================================
      // Activities
      // ======================================================

      activities:
        activityRows.map(
          (row) => {
            const activitySkills =
              row.skills
                ? String(
                    row.skills
                  ).split("||")
                : [];

            const skillScores =
              parseActivitySkillScores(
                row.skillScores
              );

            return {
              id:
                row.activityId,

              name:
                row.activityName ||
                "-",

              detail:
                row.description ||
                "",

              detail2:
                activitySkills[0] ||
                "",

              date:
                formatThaiDate(
                  row.joinDate ||
                    row.date
                ),

              score:
                row.score !== null &&
                row.score !== undefined
                  ? toNumber(
                      row.score
                    )
                  : null,

              organizer:
                row.organizer ||
                null,

              location:
                row.location ||
                null,

              skillScores,
            };
          }
        ),

      // ======================================================
      // วันที่ออกเอกสาร
      // ======================================================

      dateIssued:
        formatThaiDate(
          new Date()
        ),

      // ======================================================
      // ข้อมูลคณบดี
      //
      // สำคัญ:
      // ส่งให้ SkillTranscriptPage โดยตรง
      // ======================================================

      deanName:
        deanSettings.deanName ||
        "",

      deanSignatureUrl:
        deanSettings.deanSignatureUrl ||
        null,
    });

    // ป้องกันข้อมูลเก่าจาก cache
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
