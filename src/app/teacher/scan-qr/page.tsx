import ScanQrPage from "@/components/scan/ScanQrPage";
import TeacherShell from "@/components/teacher/TeacherShell";

export default function TeacherScanQrRoute() {
  return <ScanQrPage Shell={TeacherShell} activePath="/teacher/scan-qr" />;
}
