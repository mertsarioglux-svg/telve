"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Summary } from "@/lib/loyalty";
import { Logo } from "../Logo";
import { Close } from "../icons";

const TTL = 60;
const POLL_MS = 2000;

/** Kasadaki okuyucunun bulacağı metin. Sadece rastgele kod içerir, müşteri kimliği içermez. */
export const qrPayload = (code: string) => `TELVE:${code}`;
const pretty = (code: string) => `TV ${code.slice(0, 4)} · ${code.slice(4)}`;

// QR'ın etrafındaki vizör köşeleri.
const EDGE = "1.5px solid var(--telve)";
const CORNERS: React.CSSProperties[] = [
  { top: 0, left: 0, borderTop: EDGE, borderLeft: EDGE },
  { top: 0, right: 0, borderTop: EDGE, borderRight: EDGE },
  { bottom: 0, left: 0, borderBottom: EDGE, borderLeft: EDGE },
  { bottom: 0, right: 0, borderBottom: EDGE, borderRight: EDGE },
];

/**
 * Üye pasosu. Açıkken:
 *  - sunucudan tek kullanımlık kod alır, süresi bitince yenisini ister,
 *  - 2 sn'de bir hesabı yoklar; kasiyer okutunca değişikliği görüp kapanır.
 */
export function QrPass({ me, onClose, onScanned }: { me: Summary; onClose: () => void; onScanned: (next: Summary) => void }) {
  const [qr, setQr] = useState<{ code: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const snapshot = useRef(me);
  const fetching = useRef(false);

  const qrRef = useRef(qr);

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const r = await api<{ code: string; expiresAt: string }>("/api/qr", { method: "POST" });
      const next = { code: r.code, expiresAt: Date.parse(r.expiresAt) };
      qrRef.current = next;
      setQr(next);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kod alınamadı.");
    } finally {
      fetching.current = false;
    }
  }, []);

  // Her saniye: sayacı ilerlet; kod yoksa ya da süresi dolduysa yenisini iste.
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const cur = qrRef.current;
      if (!cur || cur.expiresAt <= t) refresh();
    };
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [refresh]);

  const secs = qr ? Math.max(0, Math.ceil((qr.expiresAt - now) / 1000)) : TTL;

  // Kasiyer okuttu mu? Damga/hediye sayıları değiştiyse evet.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const next = await api<Summary>("/api/me");
        const s = snapshot.current;
        if (next.totalCoffees !== s.totalCoffees || next.freeDrinks !== s.freeDrinks || next.totalEarned !== s.totalEarned) {
          onScanned(next);
        }
      } catch {
        /* bir sonraki denemede tekrar bakılır */
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [onScanned]);

  const matrix = useMemo(() => {
    if (!qr) return null;
    const m = QRCode.create(qrPayload(qr.code), { errorCorrectionLevel: "M" }).modules;
    const cells: string[] = [];
    for (let r = 0; r < m.size; r++) for (let c = 0; c < m.size; c++) if (m.get(r, c)) cells.push(`M${c} ${r}h1v1h-1z`);
    return { size: m.size, d: cells.join("") };
  }, [qr]);

  return (
    <div className="overlay night rise" style={{ zIndex: 70 }} role="dialog" aria-label="Üye pasosu">
      <Logo size={300} style={{ position: "absolute", right: -70, bottom: -60, opacity: 0.05, pointerEvents: "none" }} />

      <div style={{ position: "relative", padding: "calc(var(--safe-top) + 30px) 22px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Logo size={26} style={{ opacity: 0.92 }} />
          <span className="kicker-sm" style={{ letterSpacing: ".3em" }}>
            ÜYE PASOSU
          </span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Kapat">
          <Close color="#fff" />
        </button>
      </div>

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, padding: "0 22px" }}>
        <div className="pop" style={{ background: "linear-gradient(168deg,#FBFAF8 0%,#EFEDE7 100%)", color: "var(--telve)", padding: 15, boxShadow: "0 26px 60px -28px rgba(0,0,0,.65)" }}>
          <div style={{ border: "1px solid rgba(24,47,32,.22)", padding: "22px 20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span className="muted" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".28em" }}>
                BARİSTAYA OKUTUN
              </span>
              <span className="muted tabular" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em" }}>
                {secs} SN
              </span>
            </div>
            <div style={{ position: "relative", alignSelf: "center", padding: 6 }}>
              {CORNERS.map((c, i) => (
                <div key={i} style={{ position: "absolute", width: 14, height: 14, ...c }} />
              ))}
              <div style={{ width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {matrix ? (
                  // 2 modül sessiz alan: okuyucular kodun kenarını böyle daha kolay bulur.
                  <svg width="210" height="210" viewBox={`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`} shapeRendering="crispEdges" role="img" aria-label="QR kodu">
                    <path d={matrix.d} fill="#1B3226" />
                  </svg>
                ) : error ? (
                  <button className="link" onClick={refresh} style={{ fontSize: 12, textAlign: "center", padding: 20 }}>
                    {error}
                    <br />
                    TEKRAR DENE
                  </button>
                ) : (
                  <span className="spinner" style={{ width: 24, height: 24 }} />
                )}
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(24,47,32,.22)" }} />
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span className="muted" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em" }}>
                  ÜYE
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>{me.name}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                <span className="muted" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em" }}>
                  {me.freeDrinks > 0 ? "HEDİYE" : "DAMGA"}
                </span>
                <span className="tabular" style={{ fontSize: 15, fontWeight: 700 }}>
                  {me.freeDrinks > 0 ? `${me.freeDrinks} · ${me.stamps}/${me.goal}` : `${me.stamps} / ${me.goal}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span className="tabular" style={{ fontSize: 20, fontWeight: 600, letterSpacing: ".16em" }}>
              {qr ? pretty(qr.code) : "TV •••• · •••"}
            </span>
            <span className="kicker-sm" style={{ letterSpacing: ".2em" }}>
              TEK KULLANIM
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,.22)" }}>
            <div style={{ height: 1, background: "#fff", width: `${(secs / TTL) * 100}%`, transition: "width 1s linear" }} />
          </div>
        </div>
      </div>

      <div style={{ position: "relative", padding: "22px 22px calc(var(--safe-bottom) + 34px)" }}>
        <span className="muted-light" style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.5, letterSpacing: ".04em" }}>
          Kasadaki tarayıcı kodu okuyunca damgan otomatik düşer. Kod {TTL} saniyede bir yenilenir; ekran görüntüsüyle kullanılamaz.
        </span>
      </div>
    </div>
  );
}
