import { ArrowDown, ArrowRight, ClipboardCheck, Download, FileBadge, FilePlus2, PenLine } from "lucide-react";

const steps = [
  {
    icon: FilePlus2,
    title: "สมัครกิจกรรม",
    description: "เข้าร่วมกิจกรรมและโครงการที่สนใจ",
  },
  {
    icon: ClipboardCheck,
    title: "ทำแบบประเมิน",
    description: "ทำแบบประเมินที่กำหนด",
  },
  {
    icon: PenLine,
    title: "บันทึกทักษะ",
    description: "ระบบบันทึกทักษะที่ได้รับจากกิจกรรม",
  },
  {
    icon: FileBadge,
    title: "ออกใบรับรอง",
    description: "ระบบออกใบรับรองทักษะอัตโนมัติ",
  },
  {
    icon: Download,
    title: "ดาวน์โหลด Skill Transcript",
    description: "ดาวน์โหลดเอกสารสรุปทักษะของคุณ",
  },
];

// StepSection แสดงลำดับการใช้งานระบบในรูปแบบ Timeline แนวตั้งบนมือถือและแนวนอนบน Desktop
export default function StepSection() {
  return (
    <section className="bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl border-t border-blue-100 pt-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">ขั้นตอนการใช้งานระบบ</h2>
          <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#FFC107]" />
        </div>

        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col lg:flex-1 lg:flex-row lg:items-start">
              <article className="flex gap-4 rounded-xl bg-white p-4 shadow-md lg:min-h-36 lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-[#1565C0] shadow-md">
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFC107] text-xs font-semibold text-slate-950">
                    {index + 1}
                  </span>
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1565C0]">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </article>

              {index < steps.length - 1 && (
                <div className="flex h-8 items-center justify-center text-[#1565C0] lg:h-36 lg:w-10">
                  <ArrowDown className="h-5 w-5 lg:hidden" aria-hidden="true" />
                  <ArrowRight className="hidden h-5 w-5 lg:block" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
