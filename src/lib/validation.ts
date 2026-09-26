import { z } from "zod";

// Tasarımdaki hata metinleri. Aynı kurallar hem formda (anında) hem sunucuda (güvenlik için) çalışır.
export const MSG = {
  name: "Adını ve soyadını yaz.",
  phone: "Telefonu 05xx xxx xx xx biçiminde yaz.",
  email: "Geçerli bir e-posta adresi yaz.",
  password: "Şifre en az 8 karakter olmalı.",
  loginPassword: "Şifreni yaz.",
  kvkk: "Devam etmek için onay gerekli.",
};

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const phoneDigits = (v: string) => v.replace(/\D/g, "");

/** "05371234567" → "0537 123 45 67" (yazarken biçimlendirir). */
export function formatPhone(v: string): string {
  const d = phoneDigits(v).slice(0, 11);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean).join(" ");
}

export const nameSchema = z
  .string()
  .trim()
  .refine((v) => v.split(/\s+/).length >= 2 && v.length <= 80, MSG.name)
  .transform((v) => v.replace(/\s+/g, " "));
export const phoneSchema = z
  .string()
  .transform(phoneDigits)
  .refine((d) => /^05\d{9}$/.test(d), MSG.phone);
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => MAIL.test(v) && v.length <= 200, MSG.email);
export const passwordSchema = z.string().min(8, MSG.password).max(200, MSG.password);

export const signupSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  kvkk: z.literal(true, MSG.kvkk),
  marketing: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, MSG.loginPassword).max(200),
});

// Formlarda kullanılan hafif kontroller (sunucuya gitmeden hata göstermek için).
export const check = {
  name: (v: string) => (nameSchema.safeParse(v).success ? "" : MSG.name),
  phone: (v: string) => (phoneSchema.safeParse(v).success ? "" : MSG.phone),
  email: (v: string) => (emailSchema.safeParse(v).success ? "" : MSG.email),
  password: (v: string) => (v.length >= 8 ? "" : MSG.password),
  loginPassword: (v: string) => (v ? "" : MSG.loginPassword),
};
