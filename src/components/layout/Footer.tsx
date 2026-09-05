import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

const footerMenus = ["หน้าแรก", "เกี่ยวกับระบบ", "คำถามที่พบบ่อย"];
const supportMenus = ["คู่มือการใช้งาน", "คำถามที่พบบ่อย"];

// Footer รวบรวมข้อมูลหน่วยงาน เมนูลัด ช่องทางติดต่อ และ Social Media
export default function Footer() {
  return (
    <footer id="footer" className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Image src="/tsu-logo.png" alt="TSU Logo" width={260} height={84} className="h-12 w-auto" />
          <div>
            <p className="font-semibold text-slate-900">คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล</p>
            <p className="text-sm text-slate-600">มหาวิทยาลัยทักษิณ</p>
          </div>
          <div className="flex gap-2 text-sm text-slate-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#1565C0]" aria-hidden="true" />
            <p>222 หมู่ 2 ต.บ้านพร้าว อ.ป่าพะยอม จ.พัทลุง 93210</p>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-950">เมนูหลัก</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {footerMenus.map((item) => (
              <li key={item}>
                <Link href="#" className="transition hover:text-[#1565C0]">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-950">ช่วยเหลือ</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {supportMenus.map((item) => (
              <li key={item}>
                <Link href="#" className="transition hover:text-[#1565C0]">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-950">ติดต่อเรา</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#1565C0]" aria-hidden="true" />
              074 609607
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#1565C0]" aria-hidden="true" />
              science@tsu.ac.th
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-950">ติดตามข่าวสาร</h3>
          <div className="flex items-center gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, index) => (
              <Link
                key={index}
                href="#"
                aria-label="Social Media"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1565C0] text-white shadow-md transition hover:bg-blue-700"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
