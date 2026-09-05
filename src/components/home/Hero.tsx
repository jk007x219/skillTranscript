import Link from "next/link";
import { BadgeCheck, BarChart3, ShieldCheck } from "lucide-react";

const heroFeatures = [
  {
    icon: ShieldCheck,
    title: "น่าเชื่อถือ",
    description: "ข้อมูลผ่านการตรวจสอบได้",
  },
  {
    icon: BadgeCheck,
    title: "รวดเร็ว",
    description: "ออกใบรับรองทักษะได้ทันใจ",
  },
  {
    icon: BarChart3,
    title: "ครบถ้วน",
    description: "ครอบคลุมทักษะสำคัญ",
  },
];

// Hero แนะนำระบบด้วยพื้นหลัง Gradient น้ำเงิน พร้อม CTA และจุดเด่น 3 ข้อ
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1565C0] via-[#1976D2] to-[#0D47A1]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-[#FFC107] px-5 py-1.5 text-xs font-medium text-[#FFC107]">
            Skill Transcript System
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            ระบบออกใบรับรอง<span className="text-[#FFC107]">ทักษะนิสิต</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
            ระบบสำหรับจัดเก็บ ตรวจสอบ และออกใบรับรองทักษะของนิสิตในรูปแบบ Skill Transcript
            เพื่อสนับสนุนการเรียนรู้ การเข้าร่วมกิจกรรม และการพัฒนาสมรรถนะอย่างเป็นระบบ
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-[#FFC107] px-10 py-4 text-base font-semibold text-slate-950 shadow-md transition hover:bg-amber-300"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:max-w-3xl">
          {heroFeatures.map((feature) => (
            <div key={feature.title} className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">{feature.title}</p>
                <p className="text-xs text-blue-100">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
