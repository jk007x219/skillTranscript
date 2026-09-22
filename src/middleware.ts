// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPagePrefixes = ["/student", "/teacher", "/staff", "/executive"];
const publicPaths = [
  "/api/auth",
  "/api/health",
  "/api/users/teachers",
  "/api/certificate-settings/signature",
  "/api/activity-requests/evidence",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/change-password",
];

function isApiRequest(pathname: string) {
  return pathname.startsWith("/api/");
}

function isProtectedPage(pathname: string) {
  return protectedPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function canAccessPath(pathname: string, token: Record<string, unknown>) {
  const role = String(token.role || "");
  const isExecutive = Boolean(token.isExecutive);

  if (pathname.startsWith("/student")) return role === "student";
  if (pathname.startsWith("/teacher")) return role === "teacher" || role === "executive";
  if (pathname.startsWith("/staff")) return role === "officer";
  if (pathname.startsWith("/executive")) return role === "executive" || isExecutive;

  if (pathname.startsWith("/api/staff/templates")) {
    return role === "teacher" || role === "officer" || isExecutive;
  }

  if (pathname.startsWith("/api/students/")) {
    if (role === "student") {
      const studentId = pathname.split("/")[3];
      return studentId && studentId === token.studentId;
    }
    return role === "teacher" || role === "officer" || role === "executive" || isExecutive;
  }

  if (pathname.startsWith("/api/advisor")) return role === "teacher" || role === "executive" || isExecutive;
  if (pathname.startsWith("/api/staff")) return role === "officer";
  if (pathname.startsWith("/api/executive")) return role === "executive" || isExecutive;
  if (pathname.startsWith("/api/users")) return role === "officer";
  if (pathname.startsWith("/api/activities")) return Boolean(role);
  if (pathname.startsWith("/api/activity-requests")) return Boolean(role);
  if (pathname.startsWith("/api/skills")) return Boolean(role);

  return true;
}

// `new URL("/login", request.url)` resolves as an absolute path and drops
// the "/662021086" basePath entirely (standard URL resolution semantics,
// same as how "/x" always resolves from the domain root). request.nextUrl
// is a Next.js NextURL, which re-adds the basePath when read back via
// clone()/redirect(), so build redirect targets from a clone instead.
function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

function forbidden(request: NextRequest) {
  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" }, { status: 403 });
  }
  return NextResponse.redirect(redirectTo(request, "/"));
}

function unauthorized(request: NextRequest) {
  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const loginUrl = redirectTo(request, "/login");
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/change-password" || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const needsAuth = isProtectedPage(pathname) || (isApiRequest(pathname) && !isPublicPath(pathname));
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  if (!token) return unauthorized(request);

  if (token.mustChangePassword && token.role) {
    return NextResponse.redirect(redirectTo(request, "/change-password"));
  }

  if (!canAccessPath(pathname, token)) return forbidden(request);

  // The student activities page uses /api/activities with studentId.
  // Send that request to the workflow endpoint so registered/confirmed
  // states are kept visible while completed activities stay in history.
  if (pathname === "/api/activities" && token.role === "student") {
    const studentId = request.nextUrl.searchParams.get("studentId");
    const visible = request.nextUrl.searchParams.get("visible");
    if (studentId && visible === "true" && studentId === token.studentId) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/api/students/${encodeURIComponent(studentId)}/activities`;
      rewriteUrl.search = "";
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/staff/:path*", "/executive/:path*", "/api/:path*", "/change-password"],
};
