import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    return jsonError(error);
  }
}

