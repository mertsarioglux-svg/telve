"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { CheckoutResult, CustomerCard, KasaLogItem } from "@/lib/loyalty";
import { Logo } from "../Logo";
import { ArrowRight, Check, Gift, Minus, Plus } from "../icons";
import { Scanner } from "./Scanner";

type Today = { coffees: number; rewards: number; items: KasaLogItem[] };
type Mode = { mode: "scan" } | { mode: "customer"; card: CustomerCard } | { mode: "done"; result: CheckoutResult };

// Okutma sesi ("bip"). Ses dosyası gerekmez, tarayıcı üretir.
function beep(ok = true) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 1320 : 220;
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.12 : 0.3));
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {
    /* ses yoksa sorun değil */
  }
}

export function KasaApp({ cashierName }: { cashierName: string }) {
  const router = useRouter();
  const [state, setState] = useState<Mode>({ mode: "scan" });
  const [today, setToday] = useState<Today | null>(null);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const loadToday = useCallback(() => {
    api<Today>("/api/kasa/today").then(setToday).catch(() => {});
  }, []);
  useEffect(loadToday, [loadToday]);

  const lookup = useCallback(async (text: string) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      const card = await api<CustomerCard>("/api/kasa/lookup", { body: { code: text } });
      beep();
      setState({ mode: "customer", card });
    } catch (err) {
      beep(false);
      setError(err instanceof ApiError ? err.message : "Kod okunamadı.");
    } finally {
      // Aynı kodu art arda okuyup hatayı tekrarlamasın diye kısa bekleme.
      setTimeout(() => (busy.current = false), 1200);
    }
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/");
  }

  const reset = useCallback(() => {
    setError("");
    setState({ mode: "scan" });
  }, []);

  return (
    <main className="frame">
      <header className="topbar">
        <div className="brand" style={{ fontSize: 18 }}>
          <Logo size={26} />
          TELVE
          <span style={{ fontSize: 9, letterSpacing: ".2em", border: "1px solid rgba(255,255,255,.4)", padding: "4px 6px" }}>KASA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="muted-light" style={{ fontSize: 11, fontWeight: 600 }}>
            {cashierName.split(" ")[0]}
          </span>
          <button className="back" onClick={logout}>
            ÇIKIŞ
          </button>
        </div>
      </header>

      <div className="scroll">
        {state.mode === "scan" && <ScanView error={error} onCode={lookup} today={today} />}
        {state.mode === "customer" && (
          <CustomerView
            card={state.card}
            onCancel={reset}
            onDone={(result) => {
              beep();
              navigator.vibrate?.(80);
              setState({ mode: "done", result });
              loadToday();
            }}
          />
        )}
        {state.mode === "done" && <DoneView result={state.result} onNext={reset} />}
      </div>
    </main>
  );
}

// ── 1. Okutma ────────────────────────────────────────────────────────────────

function ScanView({ error, onCode, today }: { error: string; onCode: (t: string) => void; today: Today | null }) {
  const [manual, setManual] = useState("");
  const digits = manual.replace(/\D/g, "");
  return (
    <div className="rise">
      <div className="rule-b" style={{ padding: "22px 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="kicker">KASA · OKUTMA</span>
        <span className="title">Müşterinin QR&apos;ını okut.</span>
      </div>

      <Scanner onCode={onCode} />

      {error && (
        <div role="alert" style={{ background: "var(--danger)", color: "#fff", padding: "14px 20px", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
          {error}
        </div>
      )}

      <form
        className="rule-b"
        onSubmit={(e) => {
          e.preventDefault();
          if (digits.length === 7) onCode(digits);
        }}
        style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        <span className="kicker">KAMERA OLMADAN · KODU ELLE GİR</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input-box tabular"
            inputMode="numeric"
            placeholder="TV 0000 · 000"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            aria-label="Müşteri kodu"
            style={{ letterSpacing: ".12em" }}
          />
          <button type="submit" className="btn btn-green" disabled={digits.length !== 7} style={{ width: "auto", padding: "0 18px" }}>
            BUL
          </button>
        </div>
      </form>

      <div style={{ padding: "20px 20px 10px", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span className="kicker">BUGÜN</span>
        {today && (
          <span className="kicker tabular" style={{ letterSpacing: ".14em" }}>
            {today.coffees} KAHVE · {today.rewards} HEDİYE
          </span>
        )}
      </div>
      <div className="rule">
        {today?.items.map((r, i) => (
          <div key={i} className="row">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span className="row-label">{r.name}</span>
              <span className="row-meta">
                {r.label} · {r.time}
              </span>
            </div>
            <span className={r.free ? "badge badge-fill" : "badge"}>{r.badge}</span>
          </div>
        ))}
        {today && today.items.length === 0 && (
          <div style={{ padding: "18px 20px 34px" }}>
            <span className="body-sm muted">Bugün henüz işlem yok. İlk okutmadan sonra burada listelenir.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. Müşteri kartı: adet seç, hediye kullan, onayla ─────────────────────────

function CustomerView({ card, onCancel, onDone }: { card: CustomerCard; onCancel: () => void; onDone: (r: CheckoutResult) => void }) {
  const [coffees, setCoffees] = useState(1);
  const [redeem, setRedeem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.ceil((Date.parse(card.expiresAt) - now) / 1000));

  const total = card.stamps + coffees;
  const earned = Math.floor(total / card.goal);
  const after = total % card.goal;

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      onDone(await api<CheckoutResult>("/api/kasa/checkout", { body: { code: card.code, coffees, redeem } }));
    } catch (err) {
      beep(false);
      setError(err instanceof ApiError ? err.message : "İşlem yapılamadı.");
      setBusy(false);
    }
  }

  return (
    <div className="rise">
      <div style={{ background: "var(--telve)", color: "#fff", padding: "22px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span className="muted-light" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em" }}>
              ÜYE NO {card.memberNo}
            </span>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{card.name}</span>
          </div>
          <span className="tabular" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: secs < 15 ? "var(--danger-light)" : "var(--telve-300)", whiteSpace: "nowrap" }}>
            QR {secs} SN
          </span>
        </div>
        <StampGrid stamps={card.stamps} adding={coffees} goal={card.goal} />
        <div className="muted-light" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, letterSpacing: ".16em" }}>
          <span>ŞU AN {card.stamps}/{card.goal}</span>
          <span>{card.freeDrinks} HEDİYE HAKKI</span>
        </div>
      </div>

      <div className="row" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span className="kicker">KAHVE ADEDİ</span>
          <span className="row-meta">Ücretli içecekler damga kazanır.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid var(--telve)" }}>
          <button className="stepper" onClick={() => setCoffees((n) => Math.max(0, n - 1))} disabled={coffees === 0} aria-label="Azalt" style={stepBtn}>
            <Minus />
          </button>
          <span className="tabular" style={{ width: 44, textAlign: "center", fontSize: 22, fontWeight: 800 }} aria-live="polite">
            {coffees}
          </span>
          <button className="stepper" onClick={() => setCoffees((n) => Math.min(20, n + 1))} disabled={coffees === 20} aria-label="Artır" style={stepBtn}>
            <Plus />
          </button>
        </div>
      </div>

      {card.freeDrinks > 0 && (
        <button className="row row-btn" onClick={() => setRedeem((v) => !v)} role="checkbox" aria-checked={redeem} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gift />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span className="row-label">Hediye kahve kullan</span>
              <span className="row-meta">1 espresso bazlı içecek ücretsiz</span>
            </div>
          </div>
          <span className="checkbox" style={{ borderColor: "var(--telve)", borderWidth: 2, background: redeem ? "var(--telve)" : "#fff" }}>
            {redeem && <Check size={12} width={3.2} color="#fff" />}
          </span>
        </button>
      )}

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid var(--line)" }}>
        <span className="kicker">SONUÇ</span>
        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
          {coffees === 0 && !redeem
            ? "Kahve ekle ya da hediye kullan."
            : [
                redeem && "1 hediye kullanılacak",
                coffees > 0 && `+${coffees} damga`,
                earned > 0 && `kart tamamlanıyor → +${earned} hediye`,
                coffees > 0 && `yeni durum ${after}/${card.goal}`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </span>
      </div>

      {error && (
        <div role="alert" style={{ background: "var(--danger)", color: "#fff", padding: "14px 20px", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
          {error}
        </div>
      )}

      <div style={{ padding: "20px 20px 34px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-green" onClick={confirm} disabled={busy || (coffees === 0 && !redeem) || secs === 0}>
          {secs === 0 ? "QR SÜRESİ DOLDU" : "ONAYLA"}
          {busy ? <span className="spinner" /> : <ArrowRight />}
        </button>
        <button className="btn btn-outline" onClick={onCancel}>
          {secs === 0 ? "YENİDEN OKUT" : "VAZGEÇ"}
        </button>
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = { width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--telve)" };

/** Tasarımdaki "Damga ızgarası": dolu kareler mevcut damgalar, çizgili kareler bu satışta eklenecekler. */
function StampGrid({ stamps, adding, goal }: { stamps: number; adding: number; goal: number }) {
  const willFill = Math.min(goal, stamps + adding);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(goal, 10)}, 1fr)`, gap: 5 }}>
      {Array.from({ length: goal }, (_, i) => {
        const filled = i < stamps;
        const incoming = !filled && i < willFill;
        return (
          <div
            key={i}
            style={{
              aspectRatio: "1/1",
              border: "1.5px solid #fff",
              background: filled ? "#fff" : incoming ? "repeating-linear-gradient(135deg, rgba(255,255,255,.55) 0 3px, transparent 3px 6px)" : "transparent",
              transition: "background .25s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {i === goal - 1 && !filled && !incoming && <Gift size={13} width={1.8} color="#fff" />}
          </div>
        );
      })}
    </div>
  );
}

// ── 3. İşlem tamam ────────────────────────────────────────────────────────────

const AUTO_NEXT_MS = 6000;

function DoneView({ result, onNext }: { result: CheckoutResult; onNext: () => void }) {
  useEffect(() => {
    const t = setTimeout(onNext, AUTO_NEXT_MS);
    return () => clearTimeout(t);
  }, [onNext]);

  const headline =
    result.earned > 0 ? "Kart tamamlandı!" : result.added > 0 ? `+${result.added} damga işlendi.` : "Hediye kahve verildi.";
  const detail = [
    result.redeemed && "1 hediye kullanıldı",
    result.earned > 0 && `+${result.earned} hediye kazandı`,
    `kart ${result.stamps}/${result.goal}`,
    `${result.freeDrinks} hediye hakkı`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rise" style={{ minHeight: "100%", background: "var(--telve)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, padding: "40px 20px" }}>
      <div className="pop" style={{ width: 64, height: 64, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={30} width={2.4} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="muted-light" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em" }}>
          İŞLEM TAMAM · {result.name.toLocaleUpperCase("tr-TR")}
        </span>
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 0.92 }}>{headline}</span>
        <span className="muted-light" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
          {detail}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-white" onClick={onNext} autoFocus>
          YENİ OKUTMA
          <ArrowRight />
        </button>
        <div style={{ height: 1, background: "rgba(255,255,255,.22)" }}>
          <div style={{ height: 1, background: "#fff", animation: `kasaCountdown ${AUTO_NEXT_MS}ms linear forwards` }} />
        </div>
      </div>
    </div>
  );
}
