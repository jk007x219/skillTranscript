import ScanQrPage from "@/components/scan/ScanQrPage";
import StaffShell from "@/components/staff/StaffShell";

export default function StaffScanQrRoute() {
  return <ScanQrPage Shell={StaffShell} activePath="/staff/scan-qr" />;
}
