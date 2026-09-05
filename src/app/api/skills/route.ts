import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT skillId, skillname, level FROM skill ORDER BY skillname"
    );
    return NextResponse.json(rows);
  } catch (error) {
    return jsonError(error);
  }
}