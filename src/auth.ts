// auth.ts
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { apiPath } from "@/lib/api-path";

type LoginUserRow = RowDataPacket & {
  userId: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "officer" | "executive";
  status: string;
  mustChangePassword: number;
  studentId: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentFaculty: string | null;
  studentMajor: string | null;
  year: number | null;
  studentPhone: string | null;
  profileImageUrl: string | null;
  admissionYear: number | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  teacherFaculty: string | null;
  teacherProgram: string | null;
  isExecutive: number | null;
  officerFirstName: string | null;
  officerLastName: string | null;
  officerFaculty: string | null;
  advisorNames: string | null;
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Next.js strips the "/662021086" basePath before this route handler ever
  // sees the request, so Auth.js's own action-parsing must match against the
  // *unprefixed* path. Without this, Auth.js falls back to inferring
  // basePath from AUTH_URL/NEXTAUTH_URL's pathname, which (if that env var
  // includes "/662021086") no longer matches the stripped path and makes
  // every request 400 with a bare "Bad request." response.
  basePath: "/api/auth",

  pages: {
    signIn: apiPath("/login"),
  },

  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");

        if (!email || !password) {
          return null;
        }

        const [users] = await pool.query<LoginUserRow[]>(
          `SELECT
             u.userId,
             u.email,
             u.password,
             u.role,
             u.status,
             u.must_change_password AS mustChangePassword,
             s.studentId,
             s.firstname AS studentFirstName,
             s.lastname AS studentLastName,
             s.faculty AS studentFaculty,
             s.major AS studentMajor,
             s.year,
             s.phone AS studentPhone,
             s.profileImageUrl,
             s.admissionYear,
             t.firstname AS teacherFirstName,
             t.lastname AS teacherLastName,
             t.faculty AS teacherFaculty,
             t.program AS teacherProgram,
             t.isExecutive,
             o.firstname AS officerFirstName,
             o.lastname AS officerLastName,
             o.faculty AS officerFaculty,
             GROUP_CONCAT(DISTINCT CONCAT(ta.firstname, ' ', ta.lastname) ORDER BY ta.firstname SEPARATOR '||') AS advisorNames
           FROM users u
           LEFT JOIN students s ON s.userId = u.userId
           LEFT JOIN teacher t ON t.userId = u.userId
           LEFT JOIN officer o ON o.userId = u.userId
           LEFT JOIN advisor a ON a.studentId = s.studentId
           LEFT JOIN teacher ta ON ta.userId = a.advisorUserId
           WHERE LOWER(u.email) = ?
           GROUP BY u.userId, u.email, u.password, u.role, u.status, u.must_change_password,
                    s.studentId, s.firstname, s.lastname, s.faculty, s.major, s.year, s.phone, s.profileImageUrl, s.admissionYear,
                    t.firstname, t.lastname, t.faculty, t.program, t.isExecutive,
                    o.firstname, o.lastname, o.faculty`,
          [email]
        );

        if (users.length === 0) {
          return null;
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid || user.status !== "active") {
          return null;
        }

        const firstName =
          user.studentFirstName ||
          user.teacherFirstName ||
          user.officerFirstName ||
          "";
        const lastName =
          user.studentLastName ||
          user.teacherLastName ||
          user.officerLastName ||
          "";
        const faculty =
          user.studentFaculty || user.teacherFaculty || user.officerFaculty || null;
        const advisorNames = user.advisorNames
          ? String(user.advisorNames).split("||")
          : [];

        return {
          id: user.userId,
          name: `${firstName} ${lastName}`.trim() || user.email,
          email: user.email,
          firstName,
          lastName,
          role: user.role,
          studentId: user.studentId,
          faculty,
          major: user.studentMajor,
          program: user.teacherProgram || user.studentMajor,
          year: user.year,
          admissionYear: user.admissionYear,
          phone: user.studentPhone,
          status: user.status,
          profileImageUrl: user.profileImageUrl,
          isExecutive: user.role === "executive" || user.isExecutive === 1,
          advisorNames,
          mustChangePassword: Boolean(user.mustChangePassword),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.studentId = user.studentId;
        token.faculty = user.faculty;
        token.major = user.major;
        token.program = user.program;
        token.year = user.year;
        token.admissionYear = user.admissionYear;
        token.phone = user.phone;
        token.status = user.status;
        token.profileImageUrl = user.profileImageUrl;
        token.isExecutive = user.isExecutive;
        token.advisorNames = user.advisorNames;
        token.mustChangePassword = user.mustChangePassword;
      }

      if (trigger === "update" && session?.user) {
        token.firstName = session.user.firstName ?? token.firstName;
        token.lastName = session.user.lastName ?? token.lastName;
        token.faculty = session.user.faculty ?? token.faculty;
        token.major = session.user.major ?? token.major;
        token.program = session.user.program ?? token.program;
        token.year = session.user.year ?? token.year;
        token.admissionYear = session.user.admissionYear ?? token.admissionYear;
        token.phone = session.user.phone ?? token.phone;
        token.profileImageUrl = session.user.profileImageUrl ?? token.profileImageUrl;
        token.advisorNames = session.user.advisorNames ?? token.advisorNames;
        token.mustChangePassword =
          session.user.mustChangePassword ?? token.mustChangePassword;

          if (session.user.mustChangePassword !== undefined) {
    token.mustChangePassword = session.user.mustChangePassword;
  }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.id || ""),
        firstName: String(token.firstName || ""),
        lastName: String(token.lastName || ""),
        email: String(token.email || session.user.email || ""),
        role: String(token.role || ""),
        studentId: token.studentId ? String(token.studentId) : null,
        faculty: token.faculty ? String(token.faculty) : null,
        major: token.major ? String(token.major) : null,
        program: token.program ? String(token.program) : null,
        year: typeof token.year === "number" ? token.year : null,
        admissionYear:
          typeof token.admissionYear === "number" ? token.admissionYear : null,
        phone: token.phone ? String(token.phone) : null,
        status: token.status ? String(token.status) : undefined,
        profileImageUrl: token.profileImageUrl
          ? String(token.profileImageUrl)
          : null,
        isExecutive: Boolean(token.isExecutive),
        advisorNames: Array.isArray(token.advisorNames)
          ? token.advisorNames
          : [],
        mustChangePassword: Boolean(token.mustChangePassword),
      };

      return session;
    },
  },
});
