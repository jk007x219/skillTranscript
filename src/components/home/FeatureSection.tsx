import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  FileBadge,
  FileCheck2,
  GraduationCap,
  MonitorCheck,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: UsersRound,
    title: "การสื่อสาร",
  },
  {
    icon: GraduationCap,
    title: "การทำงานเป็นทีม",
  },
  {
    icon: Brain,
    title: "การคิดและแก้ปัญหา",
  },
  {
    icon: MonitorCheck,
    title: "ดิจิทัล",
  },
  {
    icon: BookOpenCheck,
    title: "ภาวะผู้นำ",
  },
  {
    icon: FileCheck2,
    title: "การเป็นผู้ประกอบการ",
  },
  {
    icon: CalendarCheck,
    title: "การใช้ห้องปฏิบัติการและความปลอดภัย",
  },
  {
    icon: FileBadge,
    title: "การคิดเชิงออกแบบนวัตกรรม",
  },
  {
    icon: BadgeCheck,
    title: "ความปลอดภัยไซเบอร์",
  },
  {
    icon: Award,
    title: "การใช้ปัญญาประดิษฐ์",
  },
];

// FeatureSection แสดงความสามารถของระบบในรูปแบบการ์ด Grid ที่รองรับทุกขนาดหน้าจอ
export default function FeatureSection() {
  return (
    <section id="features" className="bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">ทักษะที่ระบบรับรอง</h2>
          <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-blue-100 bg-white p-5 text-center shadow-md transition hover:-translate-y-1 hover:border-[#1565C0]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-950">{feature.title}</h3>

            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
