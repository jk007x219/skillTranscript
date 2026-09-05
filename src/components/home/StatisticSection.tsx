import { Award, FileBadge, UsersRound } from "lucide-react";

const statistics = [
  {
    icon: UsersRound,
    value: "1,250 คน",
    label: "นิสิตที่ได้รับการประเมิน",
    iconClassName: "bg-[#1565C0] text-white",
  },
  {
    icon: FileBadge,
    value: "3,650 ใบ",
    label: "ใบรับรองที่ออกแล้ว",
    iconClassName: "bg-[#FFC107] text-slate-950",
  },
  {
    icon: Award,
    value: "11 ทักษะ",
    label: "ทักษะที่ระบบรับรอง",
    iconClassName: "bg-[#1565C0] text-white",
  },
];

// StatisticSection สรุปตัวเลขสำคัญของระบบด้วยการ์ด 3 ใบและพื้นหลังฟ้าอ่อน
export default function StatisticSection() {
  return (
    <section className="bg-[#F8FAFC] px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-blue-100/80 p-6 shadow-md sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:divide-x md:divide-white/80">
          {statistics.map((stat) => (
            <article key={stat.value} className="flex flex-1 items-center gap-5 md:justify-center md:px-8">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${stat.iconClassName}`}>
                <stat.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-semibold text-[#1565C0] sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-700">{stat.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
