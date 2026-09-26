"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Summary } from "@/lib/loyalty";
import { Sheet } from "../Sheet";

/** 10/10 olunca çıkan tam ekran kutlama. */
export function Celebrate({ goal, onClose }: { goal: number; onClose: () => void }) {
  return (
    <button
      className="overlay rise"
      onClick={onClose}
      style={{ zIndex: 80, background: "var(--telve)", color: "#fff", justifyContent: "center", gap: 26, padding: "0 20px", width: "100%" }}
    >
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} className="pop" style={{ flex: 1, aspectRatio: "1/1", border: "1.5px solid #fff", background: "#fff", animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="muted-light" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em" }}>
          {goal} / {goal} TAMAMLANDI
        </span>
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 0.92 }}>
          Bir kahve
          <br />
          bizden.
        </span>
        <span className="muted-light" style={{ fontSize: 13, fontWeight: 500 }}>
          Hediyen Ödüller sekmesinde. Kart sıfırlandı, yeni tur başladı.
        </span>
      </div>
      <span className="muted-light" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em" }}>
        DEVAM ETMEK İÇİN DOKUN
      </span>
    </button>
  );
}

const NOTIF_ROWS: [keyof Summary["notif"], string, string][] = [
  ["stamp", "Damga bildirimleri", "Kahven okutulduğunda anında haber ver."],
  ["gift", "Hediye kahve hatırlatması", "Hediyen hazır olduğunda ve süresi dolmadan önce."],
  ["promo", "Kampanyalar", "Yeni ürünler ve şubeye özel fırsatlar."],
];

export function NotifSheet({ notif, onChange, onBack }: { notif: Summary["notif"]; onChange: (n: Summary["notif"]) => void; onBack: () => void }) {
  function toggle(k: keyof Summary["notif"]) {
    const next = { ...notif, [k]: !notif[k] };
    onChange(next); // anında göster, arkada kaydet
    api("/api/me", { method: "PATCH", body: next }).catch(() => onChange(notif));
  }
  return (
    <Sheet onBack={onBack}>
      <div className="rule-b" style={{ padding: "22px 20px 16px" }}>
        <span className="title">Bildirimler</span>
      </div>
      {NOTIF_ROWS.map(([k, label, desc]) => (
        <button key={k} className="row row-btn" role="switch" aria-checked={notif[k]} onClick={() => toggle(k)} style={{ gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="row-label">{label}</span>
            <span className="row-meta" style={{ lineHeight: 1.4 }}>
              {desc}
            </span>
          </div>
          <span className="switch" aria-checked={notif[k]} />
        </button>
      ))}
      <div style={{ padding: "18px 20px 34px" }}>
        <span className="muted" style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.5 }}>
          Bildirimleri telefonunun ayarlarından da tamamen kapatabilirsin.
        </span>
      </div>
    </Sheet>
  );
}

export function DeleteDialog({ me, onClose, onDeleted }: { me: Summary; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    try {
      await api("/api/me", { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Silinemedi.");
      setBusy(false);
    }
  }

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{ zIndex: 96, background: "rgba(10,22,15,.62)", justifyContent: "flex-end", padding: "0 12px calc(var(--safe-bottom) + 24px)" }}
    >
      <div
        role="alertdialog"
        aria-label="Hesabı sil"
        className="rise"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--paper)", borderTop: "4px solid var(--danger)", padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", color: "var(--danger)" }}>HESABI SİL</span>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.05 }}>Hesabın kalıcı olarak silinsin mi?</span>
        <span className="muted" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
          Üyelik bilgilerin, biriken {me.stamps} damgan ve {me.freeDrinks} hediye kahven silinir. Bu işlem geri alınamaz.
        </span>
        {error && <span className="err">{error}</span>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 6 }}>
          <button className="btn btn-outline" onClick={onClose}>
            VAZGEÇ
          </button>
          <button className="btn btn-danger" onClick={confirm} disabled={busy}>
            HESABI SİL
            {busy && <span className="spinner" style={{ width: 12, height: 12 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
