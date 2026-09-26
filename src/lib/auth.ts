import { cookies } from "next/headers";
import { newToken, sha256 } from "./crypto";
import { db, type Queryable } from "./db";

export const SESSION_COOKIE = "telve_session";
const SESSION_DAYS = 30;

export type Role = "musteri" | "kasiyer";
export type SessionUser = { id: string; name: string; email: string; role: Role };

export async function startSession(userId: string, q?: Queryable): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await (q ?? (await db())).query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
    sha256(token),
    userId,
    expires,
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await (await db()).query("delete from sessions where token_hash = $1", [sha256(token)]);
  store.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await (await db()).query<SessionUser>(
    `select u.id, u.name, u.email, u.role
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}
