import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [rows] = await pool.query(
      `SELECT 
         s.studentId, 
         s.firstname, 
         s.lastname, 
         s.major,
         s.program,
         p.status,
         CASE
           WHEN COALESCE(SUM(ps.maxScore), 0) > 0
             THEN ROUND(COALESCE(SUM(ps.earnedScore), 0), 2)
           WHEN p.score IS NOT NULL
             THEN ROUND(LEAST(GREATEST(p.score, 0), 1) * 10, 2)
           ELSE NULL
         END AS earnedScore,
         CASE
           WHEN COALESCE(SUM(ps.maxScore), 0) > 0
             THEN ROUND(SUM(ps.maxScore), 2)
           WHEN p.score IS NOT NULL
             THEN 10
           ELSE NULL
         END AS maxScore
       FROM participation p
       JOIN students s ON p.studentId = s.studentId
       LEFT JOIN participation_skill ps ON ps.participationId = p.ParticipationId
       WHERE p.activityId = ?
         AND p.status IN ('confirmed', 'completed')
       GROUP BY
         p.ParticipationId,
         s.studentId,
         s.firstname,
         s.lastname,
         s.major,
         s.program,
         p.status,
         p.score,
         p.joinDate,
         p.created_at
       ORDER BY p.joinDate DESC, p.created_at DESC`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return jsonError(error);
  }
}
