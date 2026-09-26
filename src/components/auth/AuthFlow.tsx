"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { check, formatPhone } from "@/lib/validation";
import { KvkkSheet } from "../Sheet";
import { Logo } from "../Logo";
import { ArrowLeft, ArrowRight, Check } from "../icons";
import { LineField, SubmitButton } from "./fields";

type Screen = "welcome" | "login" | "signup" | "forgot";
type Errors = Record<string, string>;

/** Giriş akışı — tasarımdaki "A · Gece pasosu" yönü. */
export function AuthFlow({ onAuthed }: { onAuthed: (role: string) => void }) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [email, setEmail] = useState(""); // giriş ↔ şifremi unuttum arasında taşınır
  const go = (s: Screen) => setScreen(s);

  return (
    <div className="overlay night" style={{ zIndex: 90 }}>
      <Logo size={340} style={{ position: "absolute", right: -90, top: 120, opacity: 0.05, pointerEvents: "none" }} />
      {screen === "welcome" && <Welcome go={go} />}
      {screen === "login" && <Login go={go} email={email} setEmail={setEmail} onAuthed={onAuthed} />}
      {screen === "signup" && <Signup go={go} onAuthed={onAuthed} />}
      {screen === "forgot" && <Forgot go={go} email={email} setEmail={setEmail} />}
    </div>
  );
}

function Welcome({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="rise" style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: 28, padding: "calc(var(--safe-top) + 40px) 24px calc(var(--safe-bottom) + 32px)" }}>
      <div className="brand" style={{ gap: 12, fontSize: 24 }}>
        <Logo size={40} />
        TELVE
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 46, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 0.95, textWrap: "balance" }}>
          Fincanın dibinde bir hikâye var.
        </h1>
        <p className="muted-light" style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.5, maxWidth: 300 }}>
          Her 10 kahvede 1 kahve bizden. Hesabını oluştur, damgaların telefonunda biriksin.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-white" onClick={() => go("signup")}>
          HESAP OLUŞTUR
          <ArrowRight />
        </button>
        <button className="btn btn-ghost" onClick={() => go("login")}>
          GİRİŞ YAP
        </button>
      </div>
    </div>
  );
}

/** Form ekranlarının ortak iskeleti: geri düğmesi, küçük logo, başlık. */
function FormScreen({
  onBack,
  kicker,
  title,
  onSubmit,
  children,
  gap = 28,
}: {
  onBack: () => void;
  kicker: string;
  title: string;
  onSubmit: () => void;
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <form
      noValidate
      className="rise scroll"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap, padding: "calc(var(--safe-top) + 30px) 24px calc(var(--safe-bottom) + 32px)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Geri">
          <ArrowLeft color="#fff" />
        </button>
        <Logo size={26} style={{ opacity: 0.92 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="kicker-sm" style={{ letterSpacing: ".3em" }}>
          {kicker}
        </span>
        <h1 className="display" style={{ margin: 0 }}>
          {title}
        </h1>
      </div>
      {children}
    </form>
  );
}

function SwitchLine({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <div className="muted-light" style={{ display: "flex", gap: 6, fontSize: 12, fontWeight: 500 }}>
      <span>{text}</span>
      <button type="button" className="link" style={{ color: "#fff" }} onClick={onClick}>
        {action}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return message ? (
    <span className="err-light" role="alert">
      {message}
    </span>
  ) : null;
}

// Sunucudan gelen hatayı ilgili alanın altına ya da genel hata satırına yerleştirir.
function serverError(err: unknown, setErrors: (e: Errors) => void) {
  const e = err instanceof ApiError ? err : new ApiError("Bir şeyler ters gitti.", 500);
  setErrors(e.field ? { [e.field]: e.message } : { form: e.message });
}

// ── Giriş ───────────────────────────────────────────────────────────────────

function Login({
  go,
  email,
  setEmail,
  onAuthed,
}: {
  go: (s: Screen) => void;
  email: string;
  setEmail: (v: string) => void;
  onAuthed: (role: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<Errors>({});

  const local: Errors = { email: check.email(email), password: check.loginPassword(password) };
  const errors: Errors = { ...(tried ? local : {}), ...server };

  async function submit() {
    setTried(true);
    setServer({});
    if (local.email || local.password) return;
    setBusy(true);
    try {
      const { role } = await api<{ role: string }>("/api/auth/login", { body: { email, password } });
      onAuthed(role);
    } catch (err) {
      serverError(err, setServer);
      setBusy(false);
    }
  }

  return (
    <FormScreen onBack={() => go("welcome")} kicker="GİRİŞ" title="Tekrar hoş geldin." onSubmit={submit}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <LineField label="E-POSTA" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
        <LineField label="ŞİFRE" type="password" autoComplete="current-password" value={password} onChange={setPassword} error={errors.password} />
        <button type="button" className="muted-light" onClick={() => go("forgot")} style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 700, letterSpacing: ".18em" }}>
          ŞİFREMİ UNUTTUM
        </button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormError message={errors.form} />
        <SubmitButton label="GİRİŞ YAP" busy={busy} />
        <SwitchLine text="Hesabın yok mu?" action="Kayıt ol" onClick={() => go("signup")} />
      </div>
    </FormScreen>
  );
}

// ── Kayıt ───────────────────────────────────────────────────────────────────

function Signup({ go, onAuthed }: { go: (s: Screen) => void; onAuthed: (role: string) => void }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<Errors>({});

  const set = (k: keyof typeof f) => (v: string) => {
    setF((x) => ({ ...x, [k]: k === "phone" ? formatPhone(v) : v }));
    setServer((s) => ({ ...s, [k]: "" }));
  };

  const local: Errors = {
    name: check.name(f.name),
    phone: check.phone(f.phone),
    email: check.email(f.email),
    password: check.password(f.password),
    kvkk: kvkk ? "" : "Devam etmek için onay gerekli.",
  };
  const errors: Errors = { ...(tried ? local : {}), ...Object.fromEntries(Object.entries(server).filter(([, v]) => v)) };

  async function submit() {
    setTried(true);
    setServer({});
    if (Object.values(local).some(Boolean)) return;
    setBusy(true);
    try {
      const { role } = await api<{ role: string }>("/api/auth/signup", { body: { ...f, kvkk, marketing } });
      onAuthed(role);
    } catch (err) {
      serverError(err, setServer);
      setBusy(false);
    }
  }

  return (
    <>
      <FormScreen onBack={() => go("welcome")} kicker="YENİ ÜYELİK" title="Hesap oluştur." onSubmit={submit} gap={24}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <LineField label="AD SOYAD" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} />
          <LineField label="TELEFON" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} error={errors.phone} />
          <LineField label="E-POSTA" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
          <LineField label="ŞİFRE · EN AZ 8 KARAKTER" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid rgba(255,255,255,.22)", paddingTop: 18 }}>
          <Consent checked={kvkk} onToggle={() => setKvkk((v) => !v)} error={errors.kvkk}>
            <button type="button" className="link" style={{ color: "#fff" }} onClick={() => setKvkkOpen(true)}>
              KVKK Aydınlatma Metni&apos;ni
            </button>{" "}
            okudum, kabul ediyorum.
          </Consent>
          <Consent checked={marketing} onToggle={() => setMarketing((v) => !v)}>
            Kampanya ve hediye kahve fırsatlarından e-posta / SMS ile haberdar olmak istiyorum. (İsteğe bağlı)
          </Consent>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormError message={errors.form} />
          <SubmitButton label="HESABI OLUŞTUR" busy={busy} />
          <SwitchLine text="Zaten üye misin?" action="Giriş yap" onClick={() => go("login")} />
        </div>
      </FormScreen>
      {kvkkOpen && (
        <KvkkSheet
          onBack={() => setKvkkOpen(false)}
          onAccept={() => {
            setKvkk(true);
            setKvkkOpen(false);
          }}
        />
      )}
    </>
  );
}

function Consent({ checked, onToggle, error, children }: { checked: boolean; onToggle: () => void; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button type="button" role="checkbox" aria-checked={checked} className="checkbox" onClick={onToggle} style={{ background: checked ? "#fff" : "transparent" }}>
          {checked && <Check size={12} width={3.2} color="#182F20" />}
        </button>
        <span onClick={(e) => e.target === e.currentTarget && onToggle()} style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.45, color: "#E4E9E5", cursor: "pointer" }}>
          {children}
        </span>
      </div>
      {error && (
        <span className="err-light" style={{ paddingLeft: 32 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Şifremi unuttum ───────────────────────────────────────────────────────────

function Forgot({ go, email, setEmail }: { go: (s: Screen) => void; email: string; setEmail: (v: string) => void }) {
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState<Errors>({});
  const local = check.email(email);
  const error = (tried && local) || server.email || "";

  async function submit() {
    setTried(true);
    setServer({});
    if (local) return;
    setBusy(true);
    try {
      await api("/api/auth/forgot", { body: { email } });
      setSent(true);
    } catch (err) {
      serverError(err, setServer);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen onBack={() => go("login")} kicker="ŞİFRE SIFIRLAMA" title="Şifreni mi unuttun?" onSubmit={sent ? () => go("login") : submit}>
      {!sent ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <span className="muted-light" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
              Hesabına kayıtlı e-postayı yaz, yeni şifre belirleme bağlantısını gönderelim.
            </span>
            <LineField label="E-POSTA" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} error={error} />
          </div>
          <div style={{ flex: 1 }} />
          <FormError message={server.form ?? ""} />
          <SubmitButton label="BAĞLANTIYI GÖNDER" busy={busy} />
        </>
      ) : (
        <>
          <div style={{ border: "1px solid rgba(255,255,255,.28)", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="kicker-sm" style={{ letterSpacing: ".26em" }}>
              GÖNDERİLDİ
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, wordBreak: "break-all" }}>{email.trim()}</span>
            <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: "#E4E9E5" }}>
              Bu adrese kayıtlı bir hesap varsa, yeni şifre belirleme bağlantısı birkaç dakika içinde gelir. Gelmezse gereksiz klasörüne bak.
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SubmitButton label="GİRİŞE DÖN" />
            <button type="button" className="muted-light" onClick={() => setSent(false)} style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 700, letterSpacing: ".18em" }}>
              TEKRAR GÖNDER
            </button>
          </div>
        </>
      )}
    </FormScreen>
  );
}
