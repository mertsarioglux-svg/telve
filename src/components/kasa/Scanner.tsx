"use client";

import type QrScannerType from "qr-scanner";
import { useEffect, useRef, useState } from "react";

const EDGE = "3px solid #fff";
const CORNERS: React.CSSProperties[] = [
  { top: 14, left: 14, borderTop: EDGE, borderLeft: EDGE },
  { top: 14, right: 14, borderTop: EDGE, borderRight: EDGE },
  { bottom: 14, left: 14, borderBottom: EDGE, borderLeft: EDGE },
  { bottom: 14, right: 14, borderBottom: EDGE, borderRight: EDGE },
];

/**
 * Kamerayı açıp QR arar. Tarayıcının kendi BarcodeDetector'ı varsa onu,
 * yoksa arka planda (web worker) çalışan bir çözücüyü kullanır.
 */
export function Scanner({ onCode }: { onCode: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const handler = useRef(onCode);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    handler.current = onCode;
  }, [onCode]);

  useEffect(() => {
    let scanner: QrScannerType | undefined;
    let cancelled = false;

    import("qr-scanner").then(({ default: QrScanner }) => {
      if (cancelled || !video.current) return;
      if (!window.isSecureContext) {
        setError("Kamera sadece güvenli bağlantıda (HTTPS) açılır. Kodu aşağıya elle girebilirsin.");
        return;
      }
      scanner = new QrScanner(video.current, (r) => handler.current(r.data), {
        preferredCamera: "environment",
        maxScansPerSecond: 12,
        returnDetailedScanResult: true,
        // Görüntünün tamamında ara: telefon ekranı çerçevenin kenarında olsa da bulunsun.
        calculateScanRegion: (v) => ({ x: 0, y: 0, width: v.videoWidth, height: v.videoHeight, downScaledWidth: 640, downScaledHeight: 640 }),
      });
      scanner
        .start()
        .then(() => !cancelled && setReady(true))
        .catch(() => !cancelled && setError("Kamera açılamadı. Tarayıcıya kamera izni ver ya da kodu aşağıya elle gir."));
    });

    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--night)", overflow: "hidden" }}>
      <video ref={video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: ready ? 1 : 0, transition: "opacity .3s" }} />
      {CORNERS.map((c, i) => (
        <div key={i} style={{ position: "absolute", width: 34, height: 34, ...c }} />
      ))}
      {(!ready || error) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40, color: "#fff", textAlign: "center" }}>
          {error ? (
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{error}</span>
          ) : (
            <>
              <span className="spinner" style={{ width: 22, height: 22 }} />
              <span className="kicker-sm">KAMERA AÇILIYOR</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
