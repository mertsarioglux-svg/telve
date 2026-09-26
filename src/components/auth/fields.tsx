"use client";

import { useId, useState } from "react";
import { ArrowRight } from "../icons";

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: "text" | "email" | "tel" | "password";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  autoFocus?: boolean;
};

/** Koyu zemin üzerinde alt çizgili alan (Gece pasosu yönü). Şifre alanında GÖSTER/GİZLE vardır. */
export function LineField({ label, value, onChange, error, type = "text", inputMode, autoComplete, autoFocus }: FieldProps) {
  const [show, setShow] = useState(false);
  const id = useId();
  const isPwd = type === "password";
  return (
    <div className="field">
      <div className="field-head">
        <span className="kicker-sm" id={id}>
          {label}
        </span>
        {isPwd && (
          <button type="button" className="field-toggle" onClick={() => setShow((s) => !s)}>
            {show ? "GİZLE" : "GÖSTER"}
          </button>
        )}
      </div>
      <input
        className="input-line"
        type={isPwd && show ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        autoCapitalize={type === "text" ? "words" : "none"}
        spellCheck={false}
        aria-labelledby={id}
        aria-invalid={!!error}
      />
      {error && <span className="err-light">{error}</span>}
    </div>
  );
}

/** Beyaz ana düğme; gönderilirken dönen çark gösterir. */
export function SubmitButton({ label, busy, variant = "white" }: { label: string; busy?: boolean; variant?: "white" | "green" }) {
  return (
    <button type="submit" className={`btn btn-${variant}`} disabled={busy}>
      {label}
      {busy ? <span className="spinner" /> : <ArrowRight />}
    </button>
  );
}
