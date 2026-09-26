"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Summary } from "@/lib/loyalty";
import { AuthFlow } from "../auth/AuthFlow";
import { Logo } from "../Logo";
import { KvkkSheet } from "../Sheet";
import { CardIcon, Gift, Person, Pin } from "../icons";
import { Celebrate, DeleteDialog, NotifSheet } from "./overlays";
import { QrPass } from "./QrPass";
import { KartTab, ProfileTab, RewardsTab, StoreTab } from "./tabs";

type Tab = "kart" | "rewards" | "store" | "profile";

const TABS: { id: Tab; name: string; Icon: typeof CardIcon }[] = [
  { id: "kart", name: "KART", Icon: CardIcon },
  { id: "rewards", name: "ÖDÜLLER", Icon: Gift },
  { id: "store", name: "ŞUBE", Icon: Pin },
  { id: "profile", name: "PROFİL", Icon: Person },
];

export function CustomerApp({ initial }: { initial: Summary | null }) {
  const router = useRouter();
  const [me, setMe] = useState(initial);
  const [tab, setTab] = useState<Tab>("kart");
  const [qrOpen, setQrOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [sheet, setSheet] = useState<"notif" | "kvkk" | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  };

  const reload = useCallback(async () => {
    try {
      setMe(await api<Summary>("/api/me"));
    } catch {
      setMe(null); // oturum düşmüş → giriş ekranı
    }
  }, []);

  // Uygulamaya geri dönülünce (ör. başka sekmeden) verileri tazele.
  useEffect(() => {
    const onVisible = () => !document.hidden && me && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [me, reload]);

  // Kasiyer QR'ı okuttu: pasoyu kapat, ne olduğunu göster.
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  const onScanned = useCallback((next: Summary) => {
    const prev = meRef.current;
    setQrOpen(false);
    setMe(next);
    if (!prev) return;
    const earned = next.totalEarned - prev.totalEarned;
    const added = next.totalCoffees - prev.totalCoffees;
    const used = prev.freeDrinks + earned - next.freeDrinks;
    if (earned > 0) setCelebrate(true);
    else if (added > 0) showToast(`+${added} damga eklendi · ${next.stamps}/${next.goal}${used > 0 ? " · hediyen kullanıldı" : ""}`);
    else if (used > 0) showToast("Hediye kahven kullanıldı. Afiyet olsun!");
    navigator.vibrate?.(earned > 0 ? [60, 60, 120] : 60);
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
    setTab("kart");
  }

  async function onAuthed(role: string) {
    if (role === "kasiyer") {
      router.replace("/kasa");
      return;
    }
    setTab("kart");
    await reload();
  }

  return (
    <main className="frame">
      {me && (
        <>
          <header className="topbar">
            <div className="brand" style={{ fontSize: 20 }}>
              <Logo size={30} />
              TELVE
            </div>
          </header>

          <div className="scroll" key={tab}>
            {tab === "kart" && <KartTab me={me} openQr={() => setQrOpen(true)} goRewards={() => setTab("rewards")} />}
            {tab === "rewards" && <RewardsTab me={me} openQr={() => setQrOpen(true)} />}
            {tab === "store" && <StoreTab />}
            {tab === "profile" && (
              <ProfileTab me={me} openSheet={setSheet} goKart={() => setTab("kart")} logout={logout} openDelete={() => setDelOpen(true)} />
            )}
          </div>

          <nav className="tabs">
            {TABS.map(({ id, name, Icon }) => (
              <button key={id} className="tab" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
                <Icon />
                {name}
              </button>
            ))}
          </nav>

          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}
          {qrOpen && <QrPass me={me} onClose={() => setQrOpen(false)} onScanned={onScanned} />}
          {celebrate && (
            <Celebrate
              goal={me.goal}
              onClose={() => {
                setCelebrate(false);
                setTab("rewards");
              }}
            />
          )}
          {sheet === "notif" && <NotifSheet notif={me.notif} onChange={(notif) => setMe({ ...me, notif })} onBack={() => setSheet(null)} />}
          {sheet === "kvkk" && <KvkkSheet onBack={() => setSheet(null)} />}
          {delOpen && (
            <DeleteDialog
              me={me}
              onClose={() => setDelOpen(false)}
              onDeleted={() => {
                setDelOpen(false);
                setMe(null);
              }}
            />
          )}
        </>
      )}
      {!me && <AuthFlow onAuthed={onAuthed} />}
    </main>
  );
}
