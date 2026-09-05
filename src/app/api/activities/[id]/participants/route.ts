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
         p.score
       FROM participation p
       JOIN students s ON p.studentId = s.studentId
       WHERE p.activityId = ?
         AND p.status = 'completed'
       ORDER BY p.joinDate DESC`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return jsonError(error);
  }
}