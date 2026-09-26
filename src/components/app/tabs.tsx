"use client";

import type { HistoryItem, Summary } from "@/lib/loyalty";
import { STORE } from "@/lib/store";
import { Logo } from "../Logo";
import { ArrowRight, Scan } from "../icons";
import { CardRing } from "./CardRing";

const firstName = (name: string) => name.trim().split(/\s+/)[0].toLocaleUpperCase("tr-TR");

function HistoryRow({ row }: { row: HistoryItem }) {
  return (
    <div className="row">
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="row-label">{row.label}</span>
        <span className="row-meta">{row.meta}</span>
      </div>
      <span className={row.free ? "badge badge-fill" : "badge"}>{row.badge}</span>
    </div>
  );
}

// ── KART ────────────────────────────────────────────────────────────────────

export function KartTab({ me, openQr, goRewards }: { me: Summary; openQr: () => void; goRewards: () => void }) {
  const rem = me.goal - me.stamps;
  return (
    <div>
      <div style={{ background: "var(--telve)", color: "#fff", padding: "22px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="muted-light" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em" }}>
            MERHABA, {firstName(me.name)}
          </span>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-.035em" }}>{rem} kahve kaldı</span>
          <span className="muted-light" style={{ fontSize: 12, fontWeight: 500 }}>
            Sıradaki hediye kahven için {rem} damga daha yeter.
          </span>
        </div>
        <CardRing stamps={me.stamps} goal={me.goal} round={me.totalEarned + 1} />
        <button className="btn btn-white" onClick={openQr} style={{ padding: "16px 18px" }}>
          QR KODUMU GÖSTER
          <ArrowRight />
        </button>
      </div>

      {me.freeDrinks > 0 && (
        <div className="rule-b" style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="kicker">KULLANILABİLİR</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{me.freeDrinks} hediye kahve</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={goRewards} style={{ padding: "10px 14px" }}>
            KULLAN
          </button>
        </div>
      )}

      <div style={{ padding: "20px 20px 10px" }}>
        <span className="kicker">SON HAREKETLER</span>
      </div>
      <div className="rule">
        {me.history.map((row, i) => (
          <HistoryRow key={i} row={row} />
        ))}
        {me.history.length === 0 && (
          <div style={{ padding: "22px 20px", display: "flex", alignItems: "flex-start", gap: 14, borderBottom: "1px solid var(--line)" }}>
            <div style={{ flex: "none", width: 40, height: 40, border: "2px solid var(--telve)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scan />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>İlk kahveni okut</span>
              <span className="body-sm muted">Siparişini verirken QR kodunu baristaya göster; ilk damgan buraya düşer.</span>
              <button className="link" onClick={openQr} style={{ alignSelf: "flex-start", marginTop: 6, fontSize: 11, fontWeight: 800, letterSpacing: ".14em" }}>
                QR KODUMU AÇ
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "22px 20px 34px" }}>
        <span className="muted" style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.5 }}>
          Damgalar 12 ay geçerlidir. Hediye kahve espresso bazlı içeceklerde geçerli, sürpriz kahveler hariç.
        </span>
      </div>
    </div>
  );
}

// ── ÖDÜLLER ─────────────────────────────────────────────────────────────────

export function RewardsTab({ me, openQr }: { me: Summary; openQr: () => void }) {
  const rem = me.goal - me.stamps;
  return (
    <div>
      <div className="rule-b" style={{ padding: "22px 20px 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <span className="title">Ödüller</span>
        <span className="kicker" style={{ letterSpacing: ".16em" }}>
          TOPLAM {me.totalEarned} HEDİYE
        </span>
      </div>

      {me.freeDrinks > 0 ? (
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: me.freeDrinks }, (_, i) => (
            <div key={i} style={{ background: "var(--telve)", color: "#fff", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="muted-light" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em" }}>
                    HEDİYE KAHVE
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.05 }}>Seçtiğin espresso bazlı içecek</span>
                </div>
                <Logo size={24} />
              </div>
              <div style={{ borderTop: "1px solid var(--telve-600)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span className="muted-light" style={{ fontSize: 11, fontWeight: 500 }}>
                  Kasada QR&apos;ını okut
                </span>
                <button className="btn btn-white btn-sm" onClick={openQr}>
                  QR İLE KULLAN
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rule-b" style={{ padding: "26px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Henüz kullanılabilir hediyen yok</span>
          <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
            Sıradaki hediye kahven için {rem} damga daha yeter.
          </span>
        </div>
      )}

      <div style={{ padding: "18px 20px 10px" }}>
        <span className="kicker">GEÇMİŞ</span>
      </div>
      <div className="rule">
        {me.rewardLog.map((r, i) => (
          <div key={i} className="row">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span className="row-label">{r.label}</span>
              <span className="row-meta">{r.meta}</span>
            </div>
            <span className="muted" style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em" }}>
              {r.badge}
            </span>
          </div>
        ))}
        {me.rewardLog.length === 0 && (
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
            <span className="body-sm muted">Kullandığın hediye kahveler burada listelenir.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ŞUBE ────────────────────────────────────────────────────────────────────

export function StoreTab() {
  const q = encodeURIComponent(STORE.mapsQuery);
  return (
    <div>
      <div className="rule-b" style={{ padding: "22px 20px 16px" }}>
        <span className="title">Şube</span>
      </div>
      <div className="rule-b" style={{ height: 230, background: "#EFEEE9" }}>
        <iframe
          src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
          title="Telve şube haritası"
          loading="lazy"
          style={{ width: "100%", height: "100%", border: 0, display: "block", filter: "grayscale(.6) contrast(1.05)" }}
        />
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--line)" }}>
        <span className="kicker">{STORE.name}</span>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>{STORE.address}</span>
        <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
          {STORE.district}
        </span>
      </div>
      {STORE.hours.map((h) => (
        <div key={h.day} className="row" style={{ padding: "13px 20px" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{h.day}</span>
          <span className="muted tabular" style={{ fontSize: 13, fontWeight: 500 }}>
            {h.time}
          </span>
        </div>
      ))}
      <div style={{ padding: 20, display: "flex", gap: 10 }}>
        <a
          className="btn btn-green"
          href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
          target="_blank"
          rel="noreferrer"
          style={{ flex: 1, padding: 14, fontSize: 11, letterSpacing: ".14em" }}
        >
          YOL TARİFİ
        </a>
        {STORE.phone && (
          <a className="btn btn-outline" href={`tel:${STORE.phone}`} style={{ flex: 1 }}>
            ARA
          </a>
        )}
      </div>
    </div>
  );
}

// ── PROFİL ──────────────────────────────────────────────────────────────────

export function ProfileTab({
  me,
  openSheet,
  goKart,
  logout,
  openDelete,
}: {
  me: Summary;
  openSheet: (s: "notif" | "kvkk") => void;
  goKart: () => void;
  logout: () => void;
  openDelete: () => void;
}) {
  const parts = me.name.trim().split(/\s+/);
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toLocaleUpperCase("tr-TR");
  const anyNotif = me.notif.stamp || me.notif.gift || me.notif.promo;
  const settings = [
    { label: "Bildirimler", value: anyNotif ? "AÇIK" : "KAPALI", act: () => openSheet("notif") },
    { label: "KVKK Aydınlatma Metni", value: "OKU", act: () => openSheet("kvkk") },
    { label: "Telefon", value: me.phone },
    { label: "Damga kurallarım", value: "GÖRÜNTÜLE", act: goKart },
  ];
  return (
    <div>
      <div className="rule-b" style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, flex: "none", border: "2px solid var(--telve)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{me.name}</span>
          <span className="muted" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em" }}>
            ÜYE NO {me.memberNo} · {me.since}
          </span>
        </div>
      </div>
      <div className="rule-b" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { value: me.totalEarned, label: "KAZANILAN HEDİYE" },
          { value: me.totalCoffees, label: "TOPLAM KAHVE" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 20px", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{s.value}</span>
            <span className="kicker" style={{ letterSpacing: ".16em" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      {settings.map((s) => {
        const inner = (
          <>
            <span className="row-label">{s.label}</span>
            <span className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em" }}>
              {s.value}
            </span>
          </>
        );
        return s.act ? (
          <button key={s.label} className="row row-btn" onClick={s.act}>
            {inner}
          </button>
        ) : (
          <div key={s.label} className="row" style={{ padding: "16px 20px" }}>
            {inner}
          </div>
        );
      })}
      <div style={{ padding: "20px 20px 34px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}>
        <button className="muted" onClick={logout} style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em" }}>
          ÇIKIŞ YAP
        </button>
        <button onClick={openDelete} style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "var(--danger)" }}>
          HESABI SİL
        </button>
      </div>
    </div>
  );
}
