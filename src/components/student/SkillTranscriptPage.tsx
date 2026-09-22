
// components/student/SkillTranscriptPage.tsx
"use client";

import { apiPath, withBasePath } from "@/lib/api-path";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  GraduationCap,
  Home,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

type TranscriptSkill = {
  skillId: string;
  name: string;
  level: string | null;
  earnedScore: number;
  maxPossibleScore: number;
  assessmentCorrectCount: number;
  assessmentTotalCount: number;
  percent: number;
};

type ActivitySkillScore = {
  skillName: string;
  earnedScore: number;
  maxScore: number;
};

type TranscriptData = {
  profile: {
    name: string;
    nameEn: string;
    studentId: string;
    faculty: string;
    major: string;
    email: string;
    phone: string;
    profileImageUrl: string | null;
  };

  skills: TranscriptSkill[];

  activities: {
    id: string;
    name: string;
    detail: string;
    detail2: string;
    date: string;
    score: number | null;
    organizer: string | null;
    location: string | null;

    // คะแนนแยกตามทักษะของกิจกรรมนั้น
    skillScores: ActivitySkillScore[];
  }[];

  dateIssued: string;

  // ข้อมูลคณบดีจาก Skill Transcript API โดยตรง
  deanName: string;
  deanSignatureUrl: string | null;
};

// ============================================================
// รายชื่อทักษะที่นิสิตคณะวิทยาศาสตร์ต้องมี
// ============================================================

const FACULTY_SKILL_NAMES = [
  "การสร้างนวัตกรรมสังคม",
  "การคิดเชิงออกแบบนวัตกรรม",
  "การใช้ปัญญาประดิษฐ์",
  "ความปลอดภัยไซเบอร์",
  "การใช้เครื่องมือวิทยาศาสตร์",
  "การใช้ห้องปฏิบัติการ",
];

// ============================================================
// รายชื่อทักษะที่จำเป็น
// ============================================================

const ESSENTIAL_SKILL_NAMES = [
  "การสื่อสาร",
  "การเป็นผู้ประกอบการ",
  "การทำงานเป็นทีม",
  "การคิดและการแก้ปัญหา",
  "ดิจิทัล",
];

function formatScore(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

// ============================================================
// Radar Chart — SVG
// ============================================================

type RadarItem = {
  skill: string;
  score: number;
};

function wrapRadarLabel(
  label: string,
  maxCharsPerLine = 12
): string[] {
  if (label.length <= maxCharsPerLine) {
    return [label];
  }

  const words = label.split(" ");

  if (words.length > 1) {
    const lines: string[] = [];
    let current = "";

    for (const w of words) {
      const next = current ? `${current} ${w}` : w;

      if (next.length > maxCharsPerLine && current) {
        lines.push(current);
        current = w;
      } else {
        current = next;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines.slice(0, 3);
  }

  const lines: string[] = [];

  for (
    let i = 0;
    i < label.length;
    i += maxCharsPerLine
  ) {
    lines.push(label.slice(i, i + maxCharsPerLine));
  }

  return lines.slice(0, 3);
}

function RadarChartSVG({
  data,
  color,
  id,
}: {
  data: RadarItem[];
  color: string;
  id: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[190px] items-center justify-center text-center text-[9px] leading-4 text-slate-400">
        ยังไม่มีข้อมูลทักษะในหมวดนี้
      </div>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = 54;
  const levels = [20, 40, 60, 80, 100];
  const angleStep = (Math.PI * 2) / data.length;
  const startAngle = -Math.PI / 2;

  const point = (
    value: number,
    index: number,
    extra = 0
  ) => {
    const angle =
      startAngle + angleStep * index;

    const r =
      (value / 100) * radius + extra;

    return {
      x:
        center +
        r * Math.cos(angle),
      y:
        center +
        r * Math.sin(angle),
      angle,
    };
  };

  const polygon = (value: number) =>
    data
      .map((_, i) => {
        const p = point(value, i);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  const dataPolygon = data
    .map((item, i) => {
      const p = point(item.score, i);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[186px] w-full"
        aria-label="Radar chart"
      >
        <defs>
          <linearGradient
            id={`fill-${id}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={color}
              stopOpacity="0.55"
            />
            <stop
              offset="100%"
              stopColor={color}
              stopOpacity="0.2"
            />
          </linearGradient>
        </defs>

        {levels.map((level) => (
          <polygon
            key={level}
            points={polygon(level)}
            fill="none"
            stroke="#dde2ea"
            strokeWidth="0.6"
          />
        ))}

        {data.map((_, i) => {
          const p = point(100, i);

          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#dde2ea"
              strokeWidth="0.6"
            />
          );
        })}

        <polygon
          points={dataPolygon}
          fill={`url(#fill-${id})`}
          stroke={color}
          strokeWidth="1.4"
        />

        {data.map((item, i) => {
          const p = point(100, i, 10);

          return (
            <text
              key={`val-${item.skill}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8a8f98"
              fontSize="6.4"
              fontFamily="Arial, sans-serif"
            >
              {item.score}
            </text>
          );
        })}

        {data.map((item, i) => {
          const p = point(100, i, 35);
          const lines = wrapRadarLabel(
            item.skill,
            34
          );

          return (
            <text
              key={item.skill}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#5a6472"
              fontSize="6.2"
              fontFamily="Sarabun, Arial, sans-serif"
            >
              {lines.map((line, li) => (
                <tspan
                  key={li}
                  x={p.x}
                  dy={
                    li === 0
                      ? -(
                          (lines.length - 1) *
                          7
                        ) / 2
                      : 7
                  }
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Small progress row
// ============================================================

function SkillProgress({
  name,
  percent,
  type,
}: {
  name: string;
  percent: number;
  type: "yellow" | "blue";
}) {
  const gradient =
    type === "yellow"
      ? "linear-gradient(90deg, #f5960e 0%, #ffd400 100%)"
      : "linear-gradient(90deg, #1e4fa0 0%, #4f9cf0 100%)";

  return (
    <div className="flex items-center gap-2 min-h-[15px]">
      <span className="text-[7.6px] text-[#555] leading-none flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {name}
      </span>

      <div className="w-[49px] h-[7px] bg-[#e3e3e3] shrink-0 rounded-[1px] overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${percent}%`,
            background: gradient,
          }}
        />
      </div>

      <span className="w-[18px] text-[7.5px] text-[#444] text-right">
        {percent}
      </span>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function SkillTranscriptPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    transcript,
    setTranscript,
  ] = useState<TranscriptData | null>(null);

  const [
    isLoadingTranscript,
    setIsLoadingTranscript,
  ] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // โหลด Skill Transcript
  //
  // ข้อมูลคณบดีจะถูกโหลดมาพร้อมกับ API นี้
  // ไม่ต้องเรียก /api/staff/certificate-settings ซ้ำ
  // ==========================================================

  useEffect(() => {
    if (!user?.studentId) {
      setTranscript(null);
      setIsLoadingTranscript(false);
      return;
    }

    const controller =
      new AbortController();

    setIsLoadingTranscript(true);
    setError("");

    fetch(
      apiPath(`/api/students/${user.studentId}/skill-transcript`),
      {
        signal: controller.signal,
        cache: "no-store",
      }
    )
      .then(async (response) => {
        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "ไม่สามารถโหลดข้อมูล Skill Transcript ได้"
          );
        }

        setTranscript(data);
      })
      .catch((fetchError) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "ไม่สามารถโหลดข้อมูล Skill Transcript ได้"
        );

        setTranscript(null);
      })
      .finally(() => {
        setIsLoadingTranscript(false);
      });

    return () => controller.abort();
  }, [user?.studentId]);

  // ==========================================================
  // เตรียมข้อมูลสำหรับแสดงผล
  // ==========================================================

  const data = useMemo(() => {
    if (!transcript) return null;

    const skillMap = new Map(
      transcript.skills.map((skill) => [
        skill.name,
        skill,
      ])
    );

    const radarDigital =
      FACULTY_SKILL_NAMES.map((name) => {
        const skill =
          skillMap.get(name);

        return {
          skill: name,
          score: skill?.percent ?? 0,
        };
      });

    const radarPersonal =
      ESSENTIAL_SKILL_NAMES.map((name) => {
        const skill =
          skillMap.get(name);

        return {
          skill: name,
          score: skill?.percent ?? 0,
        };
      });

    const facultySkills =
      transcript.skills.filter((skill) =>
        FACULTY_SKILL_NAMES.some(
          (name) =>
            skill.name.includes(name)
        )
      );

    const personalSkills =
      transcript.skills.filter((skill) =>
        ESSENTIAL_SKILL_NAMES.some(
          (name) =>
            skill.name.includes(name)
        )
      );

    return {
      ...transcript,

      radarDigital,

      radarPersonal,

      skillsBars:
        facultySkills.map((skill) => ({
          name: skill.name,
          percent: skill.percent,
        })),

      skillsBars2:
        personalSkills.map((skill) => ({
          name: skill.name,
          percent: skill.percent,
        })),

      skillsScores:
        transcript.skills.map(
          (skill) => ({
            name: skill.name,
            score: `${formatScore(
              skill.assessmentCorrectCount
            )}/${formatScore(
              skill.assessmentTotalCount
            )} ข้อ`,
          })
        ),
    };
  }, [transcript]);

  // ==========================================================
  // Download PDF
  // ==========================================================

  const handleDownloadPdf = () => {
    window.print();
  };

  // ==========================================================
  // Loading
  // ==========================================================

  if (
    authLoading ||
    isLoadingTranscript
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // ==========================================================
  // ไม่พบ user
  // ==========================================================

  if (!user?.studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-red-600">
        ไม่พบข้อมูลนิสิต
        กรุณาเข้าสู่ระบบอีกครั้ง
      </div>
    );
  }

  // ==========================================================
  // Error
  // ==========================================================

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center text-sm text-red-600">
        {error ||
          "ไม่พบข้อมูล Skill Transcript"}
      </div>
    );
  }

  // ==========================================================
  // ข้อมูลคณบดี
  //
  // อ่านจาก response ของ Skill Transcript API โดยตรง
  // ==========================================================

  const deanName =
    data.deanName || "";

  const deanSignatureUrl =
    data.deanSignatureUrl || null;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap");

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #eef1f5;
        }

        body {
          font-family: "Sarabun", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
        }

        .download-bar {
          width: min(
            210mm,
            calc(100vw - 32px)
          );
          margin: 18px auto 0;
          display: flex;
          justify-content: flex-end;
        }

        .transcript-page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 8mm 9mm 7mm;
          background: white;
          box-shadow:
            0 18px 45px
            rgba(15, 23, 42, 0.16);
          overflow: hidden;
          color: #26364d;
        }

        .transcript-header {
          min-height: 25mm;
        }

        .transcript-card {
          border: 1px solid #d7dce4;
          border-radius: 10px;
          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #fbfcff 100%
            );
          box-shadow:
            0 2px 10px
            rgba(32, 60, 99, 0.08);
          overflow: hidden;
        }

        .profile-card {
          padding: 8px;
        }

        .radar-card {
          padding: 8px 10px 6px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid #e3e6eb;
          padding-bottom: 5px;
          color: #173b69;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
        }

        .top-grid {
          display: grid;
          grid-template-columns:
            152px 1fr 1fr;
          gap: 9px;
          min-height: 218px;
        }

        .skills-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 9px;
          margin-top: 9px;
        }

        .skills-card {
          min-height: 292px;
          padding: 9px 11px;
        }

        .activity-card {
          margin-top: 9px;
          min-height: 294px;
          padding: 9px 11px 11px;
        }

        .activity-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          border-top: 1px solid #d7dce4;
          border-left: 1px solid #d7dce4;
          margin-top: 7px;
        }

        .activity-item {
          min-height: 76px;
          border-right: 1px solid #d7dce4;
          border-bottom: 1px solid #d7dce4;
          padding: 6px 7px 18px;
          position: relative;
          overflow: hidden;
          background: white;
        }

        .activity-detail {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
        }

        .activity-title {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .skill-score-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 8px;
        }

        /*
         * คะแนนแยกตามทักษะในกิจกรรม
         */
        .activity-skill-scores {
          margin-top: 3px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          max-height: 30px;
          overflow: hidden;
        }

        .activity-skill-score {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          min-width: 0;
          color: #173b69;
          font-size: 6.3px;
          line-height: 8px;
          font-weight: 600;
        }

        .activity-skill-score-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-skill-score-value {
          flex-shrink: 0;
          white-space: nowrap;
        }

        @media print {
          html,
          body {
            background: white !important;
            width: 210mm;
            min-height: 297mm;
          }

          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }

          .min-h-screen {
            min-height: 297mm !important;
            width: 210mm !important;
            background: white !important;
          }

          .mobile-wrap {
            width: 210mm !important;
            overflow: visible !important;
            display: flex;
            justify-content: center;
          }

          .transcript-page {
            margin: 0 auto;
            padding: 8mm 9mm 7mm;
            box-shadow: none;
            width: 210mm;
            min-height: 297mm;
            transform: none !important;
          }

          .download-bar {
            display: none;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }

        @media screen and (max-width: 820px) {
          .transcript-page {
            transform-origin: top left;
            margin: 0;
            box-shadow: none;
          }

          .mobile-wrap {
            width: 210mm;
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#eef1f5]">

        {/* DOWNLOAD */}
        <div className="download-bar">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-md bg-[#173b69] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f2d52]"
          >
            <Download
              size={16}
              aria-hidden="true"
            />
            ดาวน์โหลด PDF
          </button>
        </div>

        <div className="mobile-wrap">
          <main className="transcript-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="transcript-header relative flex items-center justify-between border-b border-[#6d84a4]">

              <div className="w-[92px] flex items-center">
                <img
                  src={apiPath("/tsu-logo.png")}
                  alt="TSU"
                  className="w-[90px] h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-[0px] text-center">
                <h1 className="text-[#203c63] text-[30px] font-bold leading-[36px] tracking-wide">
                  SKILLS TRANSCRIPT
                </h1>

                <p className="text-[16px] font-medium text-[#587596] leading-[22px]">
                  Faculty of Science and Digital Innovation
                </p>
              </div>

              <div className="w-[110px] flex items-center justify-end">
                <img
                  src={apiPath("/faculty-logo.png")}
                  alt="คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล"
                  className="h-[42px] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>
            </header>

            <div className="h-[10px] flex items-center justify-center relative">
              <div className="absolute w-[130px] h-px bg-[#6d84a4]" />
              <div className="relative z-10 w-[7px] h-[7px] bg-[#203c63] rotate-45 border border-white" />
            </div>

            {/* ==================================================
                TOP SECTION
            ================================================== */}

            <section className="top-grid">

              {/* PROFILE */}
              <div className="transcript-card profile-card">
                <div className="flex flex-col items-center">

                  <div className="w-[76px] h-[76px] rounded-full bg-[#d9dee7] border border-[#bfc6d1] relative overflow-hidden mt-[2px]">

                    {data.profile.profileImageUrl ? (
                      <img
                        src={withBasePath(
                          data.profile
                            .profileImageUrl
                        )}
                        alt={
                          data.profile.name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[29px] h-[29px] rounded-full bg-white border border-[#c5cbd4]" />

                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-[64px] h-[50px] rounded-t-full bg-white border border-[#c5cbd4]" />
                      </>
                    )}

                  </div>

                  <h2 className="text-[#173b69] font-bold text-[9px] mt-[6px] text-center leading-[12px]">
                    {data.profile.name}
                  </h2>

                  <p className="text-[#173b69] font-bold text-[6.4px] leading-[8px] tracking-wide">
                    {data.profile.nameEn}
                  </p>

                  <div className="w-full h-px bg-[#e3e6eb] mt-[7px]" />

                  <div className="w-full mt-[7px] space-y-[5px]">

                    <InfoRow
                      icon={
                        <GraduationCap
                          size={9}
                          fill="#173b69"
                          strokeWidth={1}
                        />
                      }
                      label="รหัสนิสิต"
                      value={
                        data.profile
                          .studentId
                      }
                      inline
                    />

                    <InfoRow
                      icon={
                        <Home
                          size={9}
                          fill="#173b69"
                          strokeWidth={1}
                        />
                      }
                      label="คณะ"
                      value={
                        data.profile.faculty
                      }
                    />

                    <InfoRow
                      icon={
                        <BookOpen
                          size={9}
                          fill="#173b69"
                          strokeWidth={1}
                        />
                      }
                      label="สาขาวิชา"
                      value={
                        data.profile.major
                      }
                    />

                    <InfoRow
                      icon={
                        <Mail
                          size={9}
                          fill="#173b69"
                          strokeWidth={1}
                        />
                      }
                      label="อีเมล"
                      value={
                        data.profile.email
                      }
                    />

                    <InfoRow
                      icon={
                        <Phone
                          size={9}
                          fill="#173b69"
                          strokeWidth={1}
                        />
                      }
                      label="โทรศัพท์"
                      value={
                        data.profile.phone
                      }
                    />

                  </div>
                </div>
              </div>

              {/* RADAR 1 */}
              <div className="transcript-card radar-card relative">
                <h3 className="text-[8.5px] text-[#26364d] font-semibold leading-[11px] text-center min-h-[23px]">
                  ทักษะที่จำเป็นของนิสิตคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
                </h3>

                <RadarChartSVG
                  data={data.radarDigital}
                  color="#ffb329"
                  id="digital"
                />
              </div>

              {/* RADAR 2 */}
              <div className="transcript-card radar-card">
                <h3 className="text-[8.5px] text-[#26364d] font-semibold leading-[11px] text-center min-h-[23px]">
                  ทักษะที่จำเป็นต้องมี
                </h3>

                <RadarChartSVG
                  data={data.radarPersonal}
                  color="#4592ee"
                  id="personal"
                />
              </div>

            </section>

            {/* ==================================================
                SKILLS
            ================================================== */}

            <section className="skills-grid">

              {/* คะแนนรวมทักษะ */}
              <div className="transcript-card skills-card">

                <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-[5px]">

                  <div className="flex items-center gap-[5px]">

                    <BarChart3
                      size={14}
                      strokeWidth={2.2}
                      className="text-[#173b69]"
                    />

                    <h2 className="text-[10px] font-bold text-[#173b69]">
                      คะแนนรวมทักษะ
                    </h2>

                  </div>

                  <span className="text-[8px] font-bold text-[#173b69]">
                    %
                  </span>

                </div>

                <div className="mt-[8px] space-y-[5px]">

                  {data.skillsBars.map(
                    (skill) => (
                      <SkillProgress
                        key={skill.name}
                        name={skill.name}
                        percent={
                          skill.percent
                        }
                        type="yellow"
                      />
                    )
                  )}

                </div>

                <div className="border-t border-[#dedede] mt-[10px] pt-[8px] space-y-[5px]">

                  {data.skillsBars2.map(
                    (skill) => (
                      <SkillProgress
                        key={skill.name}
                        name={skill.name}
                        percent={
                          skill.percent
                        }
                        type="blue"
                      />
                    )
                  )}

                </div>

              </div>

              {/* คะแนนประเมิน */}
              <div className="transcript-card skills-card">

                <div className="flex items-center justify-between border-b border-[#e3e6eb] pb-[5px]">

                  <div className="flex items-center gap-[5px]">

                    <BarChart3
                      size={14}
                      strokeWidth={2.2}
                      className="text-[#173b69]"
                    />

                    <h2 className="text-[10px] font-bold text-[#173b69]">
                      ทักษะ
                    </h2>

                  </div>

                  <span className="text-[9px] font-bold text-[#173b69]">
                    คะแนนประเมิน
                  </span>

                </div>

                <div className="mt-[7px] space-y-[5px]">

                  {data.skillsScores.map(
                    (skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between min-h-[17px]"
                      >
                        <span className="skill-score-name text-[8.2px] text-[#555] leading-none">
                          {skill.name}
                        </span>

                        <span className="shrink-0 text-[8.2px] font-semibold text-[#173b69]">
                          {skill.score}
                        </span>
                      </div>
                    )
                  )}

                </div>

              </div>

            </section>

            {/* ==================================================
                ACTIVITIES
            ================================================== */}

            <section className="transcript-card activity-card">

              <div className="section-title">

                <CalendarDays
                  size={14}
                  strokeWidth={2.1}
                  className="text-[#173b69]"
                  fill="#dce6f4"
                />

                <h2 className="text-[10px] font-bold text-[#173b69]">
                  กิจกรรมที่เข้าร่วม
                </h2>

              </div>

              <div className="activity-grid">

                {data.activities.length >
                0 ? (

                  data.activities.map(
                    (activity) => (

                      <div
                        key={activity.id}
                        className="activity-item"
                      >

                        {/* ชื่อกิจกรรม */}
                        <h3 className="activity-title text-[#173b69] font-bold text-[8.2px] leading-[10px]">
                          {activity.name}
                        </h3>

                        {/* ผู้จัด */}
                        {activity.organizer && (
                          <p className="text-[#555] text-[6.8px] leading-[8px] mt-[2px] flex items-center gap-1">

                            <Building2 className="h-[8px] w-[8px] text-[#777]" />

                            {activity.organizer}

                          </p>
                        )}

                        {/* สถานที่ */}
                        {activity.location && (
                          <p className="text-[#555] text-[6.8px] leading-[8px] flex items-center gap-1">

                            <MapPin className="h-[8px] w-[8px] text-[#777]" />

                            {activity.location}

                          </p>
                        )}

                        {/* รายละเอียดกิจกรรม */}
                        <p className="activity-detail text-[#555] text-[7.2px] leading-[9px] mt-[2px]">

                          {activity.detail ||
                            "-"}

                          {activity.detail2 && (
                            <>
                              <br />
                              {
                                activity.detail2
                              }
                            </>
                          )}

                        </p>

                        {/* ==================================================
                            คะแนนแยกตามทักษะ
                        ================================================== */}

                        {activity.skillScores &&
                          activity.skillScores
                            .length > 0 && (

                            <div className="activity-skill-scores">

                              {activity.skillScores.map(
                                (skill) => (

                                  <div
                                    key={`${activity.id}-${skill.skillName}`}
                                    className="activity-skill-score"
                                  >

                                    <span className="activity-skill-score-name">
                                      {skill.skillName}
                                    </span>

                                    <span className="activity-skill-score-value">
                                      คะแนน:{" "}
                                      {formatScore(
                                        skill.earnedScore
                                      )}
                                      /
                                      {formatScore(
                                        skill.maxScore
                                      )}
                                    </span>

                                  </div>
                                )
                              )}

                            </div>
                          )}

                        {/* วันที่ */}
                        <p className="absolute bottom-[5px] right-[7px] text-[#777] text-[6.5px]">
                          {activity.date}
                        </p>

                      </div>
                    )
                  )

                ) : (

                  <div className="col-span-3 flex min-h-[228px] items-center justify-center text-[9px] text-slate-400">
                    ยังไม่มีกิจกรรมที่เข้าร่วม
                  </div>

                )}

              </div>

            </section>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer className="mt-[7px] border-t-2 border-[#587596] pt-[5px] text-center">

              <div className="flex justify-center items-center gap-[6px]">

                <CalendarDays
                  size={12}
                  className="text-[#173b69]"
                />

                <p className="text-[7.5px] text-[#173b69]">
                  วันที่ออกเอกสาร :{" "}
                  {data.dateIssued}
                </p>

              </div>

              {/* ==================================================
                  ลายเซ็น + ชื่อคณบดี
              ================================================== */}

              <div className="mt-[23px]">

                {deanName ||
                deanSignatureUrl ? (
                  <>

                    {deanSignatureUrl && (
                      <div className="flex justify-center mb-1">

                        <img
                          src={withBasePath(deanSignatureUrl)}
                          alt="ลายเซ็นคณบดี"
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            console.warn(
                              "ไม่สามารถโหลดลายเซ็นคณบดี:",
                              deanSignatureUrl
                            );

                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      </div>
                    )}

                    <p className="text-[6.5px] text-[#173b69]">
                      {deanName
                        ? `(${deanName})`
                        : "(ยังไม่ระบุชื่อคณบดี)"}
                    </p>

                    <p className="text-[6.5px] text-[#173b69] mt-[2px]">
                      คณบดีคณะวิทยาศาสตร์และนวัตกรรมดิจิทัล
                    </p>

                  </>
                ) : (

                  <p className="text-[6.5px] text-slate-400">
                    (ยังไม่มีการตั้งค่าข้อมูลคณบดี)
                  </p>

                )}

              </div>

            </footer>

          </main>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Profile info row
// ============================================================

function InfoRow({
  icon,
  label,
  value,
  inline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  inline?: boolean;
}) {
  return (
    <div className="flex items-start gap-[5px] text-[#555]">

      <span className="text-[#173b69] shrink-0 mt-[1px]">
        {icon}
      </span>

      {inline ? (

        <div className="flex items-baseline gap-[4px]">

          <span className="text-[#3f6ea8] text-[6px] leading-[7px]">
            {label}
          </span>

          <span className="text-[#444] text-[6px] leading-[7px]">
            {value}
          </span>

        </div>

      ) : (

        <div className="flex flex-col">

          <span className="text-[#3f6ea8] text-[6px] leading-[7px]">
            {label}
          </span>

          <span className="text-[#444] text-[6px] leading-[7px] break-words">
            {value}
          </span>

        </div>

      )}

    </div>
  );
}
