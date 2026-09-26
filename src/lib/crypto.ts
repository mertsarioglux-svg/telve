import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pwd: string, salt: Buffer, len: number) => Promise<Buffer>;

// ── Şifreler ────────────────────────────────────────────────────────────────
// Şifrenin kendisi hiçbir yerde saklanmaz; rastgele tuz + scrypt özeti saklanır.

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

// ── Rastgele belirteçler ──────────────────────────────────────────────────────
// Çereze/bağlantıya belirtecin kendisi gider, veritabanına sadece özeti yazılır.
// Veritabanı sızsa bile kimse o özetle oturum açamaz.

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
