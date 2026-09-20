import { auth } from "@/auth";
import { httpError, jsonError } from "@/lib/api-error";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.studentId || session.user.role !== "student") {
      throw httpError(403, "เฉพาะนิสิตเท่านั้นที่ลงทะเบียนกิจกรรมได้");
    }

    await params;
    throw httpError(403, "การลงทะเบียนต้องให้เจ้าหน้าที่สแกน QR ที่หน้างาน");
  } catch (error) {
    return jsonError(error);
  }
}
