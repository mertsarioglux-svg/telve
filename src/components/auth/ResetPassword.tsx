"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { check } from "@/lib/validation";
import { Logo } from "../Logo";
import { LineField, SubmitButton } from "./fields";

/** E-postadaki bağlantıyla açılan "yeni şifre belirle" ekranı. */
export function ResetPassword({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? "" : "Bağlantı eksik. E-postadaki bağlantıyı yeniden aç.");
  const local = check.password(password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (local || !token) return;
    setBusy(true);
    try {
      const { role } = await api<{ role: string }>("/api/auth/reset", { body: { token, password } });
      router.replace(role === "kasiyer" ? "/kasa" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Şifre değiştirilemedi.");
      setBusy(false);
    }
  }

  return (
    <main className="frame">
      <form
        noValidate
        onSubmit={submit}
        className="overlay night rise"
        style={{ gap: 28, padding: "calc(var(--safe-top) + 30px) 24px calc(var(--safe-bottom) + 32px)", overflow: "auto" }}
      >
        <Logo size={300} style={{ position: "absolute", right: -80, top: 140, opacity: 0.05, pointerEvents: "none" }} />
        <Logo size={26} style={{ opacity: 0.92, alignSelf: "flex-end" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="kicker-sm" style={{ letterSpacing: ".3em" }}>
            ŞİFRE SIFIRLAMA
          </span>
          <h1 className="display" style={{ margin: 0 }}>
            Yeni şifreni belirle.
          </h1>
        </div>
        <LineField label="YENİ ŞİFRE · EN AZ 8 KARAKTER" type="password" autoComplete="new-password" value={password} onChange={setPassword} error={tried ? local : ""} autoFocus />
        <div style={{ flex: 1 }} />
        {error && (
          <span className="err-light" role="alert">
            {error}
          </span>
        )}
        <SubmitButton label="ŞİFREYİ KAYDET" busy={busy} />
        <Link href="/" className="muted-light" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em" }}>
          GİRİŞE DÖN
        </Link>
      </form>
    </main>
  );
}
