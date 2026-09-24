"use client";

import { apiPath } from "@/lib/api-path";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  QrCode,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";

type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

type JsQrResult = { data: string };

type JsQrFunction = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" },
) => JsQrResult | null;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
    jsQR?: JsQrFunction;
  }
}

type Activity = {
  activityId: string;
  title: string;
  date?: string;
  time?: string;
  endDate?: string | null;
  endTime?: string | null;
  status?: string;
  registrationEnabled?: boolean;
  applicationEnabled?: boolean;
};

type ScanResult = {
  student?: {
    studentId: string;
    firstname?: string;
    lastname?: string;
    program?: string;
    major?: string;
  };
  activityName?: string;
  message?: string;
};

function loadJsQr() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.jsQR) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-skilltranscript-jsqr="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.jsQR)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    script.dataset.skilltranscriptJsqr = "true";
    script.onload = () => resolve(Boolean(window.jsQR));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function requestCameraStream(constraints: MediaStreamConstraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  return Promise.reject(
    new DOMException("getUserMedia is unavailable", "NotSupportedError"),
  );
}

function formatDate(date?: string, time?: string) {
  if (!date) return "-";
  const d = String(date).slice(0, 10);
  const t = String(time || "").slice(0, 5);
  return t ? `${d} ${t}` : d;
}

function DefaultPageShell({
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


export default function ScanQrPage({
  Shell,
  activePath,
}: {
  Shell?: React.ComponentType<{
    activePath: string;
    children: React.ReactNode;
  }>;
  activePath?: string;
}) {
  const [activityCode, setActivityCode] = useState("");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanBusyRef = useRef(false);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const findActivity = async () => {
    const code = activityCode.trim();
    if (!code) {
      setScanError("กรุณาใส่รหัสกิจกรรม");
      return;
    }

    setLoadingActivity(true);
    setScanError("");
    setScanResult(null);
    stopCamera();

    try {
      const response = await fetch(apiPath("/api/activities/workflow"), { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "ไม่สามารถโหลดกิจกรรมได้");
      }

      const found = (Array.isArray(data) ? data : []).find(
        (item: Activity) => String(item.activityId).trim() === code,
      );

      if (!found) {
        throw new Error("ไม่พบกิจกรรมจากรหัสนี้");
      }

      if (found.status !== "active") {
        throw new Error("กิจกรรมนี้ไม่ได้เปิดใช้งาน");
      }

      setActivity(found);
    } catch (error) {
      setActivity(null);
      setScanError(error instanceof Error ? error.message : "ไม่สามารถค้นหากิจกรรมได้");
    } finally {
      setLoadingActivity(false);
    }
  };

  const submitScan = async (payload = qrPayload) => {
    if (!activity || !payload.trim()) {
      setScanError("กรุณาสแกน QR ของนิสิตก่อน");
      return;
    }

    setSubmitting(true);
    setScanError("");
    setScanResult(null);

    try {
      const response = await fetch(apiPath(`/api/activities/${encodeURIComponent(activity.activityId)}/scan-qr`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityCode: activity.activityId,
          qrPayload: payload.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "สแกน QR ไม่สำเร็จ");
      }

      setScanResult(data);
      setQrPayload("");
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "สแกน QR ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const detectQr = async () => {
    if (!videoRef.current || !canvasRef.current || scanBusyRef.current || !scanning) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      frameRef.current = requestAnimationFrame(detectQr);
      return;
    }

    scanBusyRef.current = true;

    try {
      let value = "";

      if (window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(video);
        value = codes[0]?.rawValue || "";
      } else if (window.jsQR) {
        const canvas = canvasRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx?.drawImage(video, 0, 0, width, height);
          const image = ctx?.getImageData(0, 0, width, height);
          if (image) {
            value = window.jsQR(image.data, image.width, image.height, {
              inversionAttempts: "attemptBoth",
            })?.data || "";
          }
        }
      }

      if (value) {
        setQrPayload(value);
        stopCamera();
        await submitScan(value);
        return;
      }
    } catch {
      // Keep scanning; individual camera frames may fail on some browsers.
    } finally {
      scanBusyRef.current = false;
    }

    if (scanning) {
      frameRef.current = requestAnimationFrame(detectQr);
    }
  };

  const startCamera = async () => {
    if (!activity) {
      setScanError("กรุณาใส่รหัสกิจกรรมและค้นหากิจกรรมก่อน");
      return;
    }

    setCameraStarting(true);
    setCameraError("");
    setScanError("");

    try {
      const stream = await requestCameraStream({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("ไม่พบกล้องสำหรับสแกน QR");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!window.BarcodeDetector) {
        await loadJsQr();
      }

      if (!window.BarcodeDetector && !window.jsQR) {
        throw new Error("เบราว์เซอร์นี้ไม่รองรับการสแกน QR จากกล้อง");
      }

      setScanning(true);
      setCameraStarting(false);
      frameRef.current = requestAnimationFrame(detectQr);
    } catch (error) {
      stopCamera();
      setCameraStarting(false);
      setCameraError(
        error instanceof Error
          ? `${error.message} หากเปิดผ่าน HTTP กรุณาใช้ปุ่ม “เลือกภาพ QR” หรือเปิดผ่าน HTTPS`
          : "ไม่สามารถเปิดกล้องได้",
      );
    }
  };

  const handleQrImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activity) return;

    setScanError("");
    setScanResult(null);

    try {
      await loadJsQr();
      if (!window.jsQR) throw new Error("ไม่สามารถโหลดตัวอ่าน QR ได้");

      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = async () => {
        try {
          const canvas = canvasRef.current || document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx?.drawImage(image, 0, 0);
          const data = ctx?.getImageData(0, 0, canvas.width, canvas.height);

          if (!data) throw new Error("ไม่สามารถอ่านรูป QR ได้");

          if (typeof window.jsQR !== "function") {
            throw new Error("ไม่สามารถโหลดตัวอ่าน QR ได้");
          }

          const jsQR = window.jsQR;
          const result = jsQR(data.data, data.width, data.height, {
            inversionAttempts: "attemptBoth",
          });

          if (!result?.data) throw new Error("ไม่พบ QR Code ในรูปภาพ");

          setQrPayload(result.data);
          await submitScan(result.data);
        } catch (error) {
          setScanError(error instanceof Error ? error.message : "ไม่สามารถอ่าน QR ได้");
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        setScanError("ไม่สามารถเปิดรูปภาพ QR ได้");
      };

      image.src = url;
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "ไม่สามารถอ่าน QR ได้");
    }
  };

  // ใช้ component ที่อยู่ระดับ module เพื่อไม่ให้ remount ทุกครั้งที่ state เปลี่ยน
  // ป้องกัน input รหัสกิจกรรมหลุด focus หลังพิมพ์แต่ละตัว
  const PageShell = Shell ?? DefaultPageShell;

  return (
    <PageShell activePath={activePath || ""}>
      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#2455A4]">QR Scanner</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">สแกน QR</h1>
            <p className="mt-2 text-sm text-slate-500">
              ใส่รหัสกิจกรรมก่อน จากนั้นใช้กล้องสแกน QR ของนิสิตเพื่อยืนยันการเข้าร่วมกิจกรรม
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">เลือกกิจกรรม</h2>
                  <p className="text-xs text-slate-500">กรอกรหัสกิจกรรมเพื่อเริ่มสแกน</p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">รหัสกิจกรรม</span>
                <div className="flex gap-2">
                  <input
                    value={activityCode}
                    onChange={(e) => setActivityCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") findActivity();
                    }}
                    placeholder="เช่น รหัสกิจกรรม"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-[#2455A4] focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={findActivity}
                    disabled={loadingActivity}
                    className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#1565C0] px-4 text-sm font-semibold text-white hover:bg-[#0D47A1] disabled:bg-slate-300"
                  >
                    {loadingActivity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    ค้นหา
                  </button>
                </div>
              </label>

              {activity && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="font-semibold text-emerald-900">{activity.title}</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        รหัส: <span className="font-mono">{activity.activityId}</span>
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {formatDate(activity.date, activity.time)} - {formatDate(activity.endDate || activity.date, activity.endTime || activity.time)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                <p className="font-semibold text-slate-700">ขั้นตอน</p>
                <p>1. ใส่รหัสกิจกรรม</p>
                <p>2. ตรวจสอบว่าชื่อกิจกรรมถูกต้อง</p>
                <p>3. เปิดกล้องแล้วสแกน QR ที่นิสิตแสดง</p>
                <p>4. ระบบจะยืนยันการเข้าร่วมให้อัตโนมัติ</p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">สแกน QR นิสิต</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity ? activity.title : "กรุณาเลือกกิจกรรมก่อน"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={scanning ? stopCamera : startCamera}
                  disabled={!activity || cameraStarting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#2455A4] bg-white px-4 text-sm font-semibold text-[#2455A4] hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                >
                  {scanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  {cameraStarting ? "กำลังเปิด..." : scanning ? "ปิดกล้อง" : "เปิดกล้อง"}
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${scanning ? "block" : "hidden"}`} />
                {!scanning && (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-400">
                    {activity ? "กดเปิดกล้องแล้วนำ QR ของนิสิตมาไว้ในกรอบ" : "เลือกกิจกรรมก่อนจึงจะเปิดกล้องได้"}
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={!activity || submitting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2455A4] px-4 text-sm font-semibold text-white hover:bg-[#1B3F80] disabled:bg-slate-300"
                >
                  <QrCode className="h-4 w-4" />
                  ถ่าย/เลือกภาพ QR
                </button>
                <input ref={qrInputRef} type="file" accept="image/*" capture="environment" onChange={handleQrImage} className="hidden" />
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">ข้อมูลจาก QR</span>
                  <textarea
                    value={qrPayload}
                    onChange={(e) => setQrPayload(e.target.value)}
                    placeholder="วางข้อมูล QR ที่นี่ได้ หากไม่ได้ใช้กล้อง"
                    className="min-h-[90px] w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#2455A4] focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => submitScan()}
                  disabled={!activity || !qrPayload.trim() || submitting}
                  className="mt-2 h-11 w-full rounded-xl bg-[#1565C0] text-sm font-semibold text-white hover:bg-[#0D47A1] disabled:bg-slate-300"
                >
                  {submitting ? "กำลังบันทึก..." : "ยืนยันการเข้าร่วม"}
                </button>
              </div>

              {cameraError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  <CameraOff className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {scanError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {scanResult?.student && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900">สแกนสำเร็จ</p>
                      <p className="mt-1 text-sm text-emerald-800">
                        {scanResult.student.firstname || ""} {scanResult.student.lastname || ""}
                      </p>
                      <p className="text-xs text-emerald-700">
                        รหัสนิสิต: {scanResult.student.studentId}
                      </p>
                      {scanResult.student.program && (
                        <p className="text-xs text-emerald-700">หลักสูตร: {scanResult.student.program}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
