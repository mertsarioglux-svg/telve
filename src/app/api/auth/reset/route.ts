import { z } from "zod";
import { startSession } from "@/lib/auth";
import { hashPassword, sha256 } from "@/lib/crypto";
import { db } from "@/lib/db";
import { fail, handle, parseBody } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const { token, password } = await parseBody(req, z.object({ token: z.string().min(10).max(200), password: passwordSchema }));
  const hash = await hashPassword(password);
  const q = await db();

  const role = await q.tx(async (t) => {
    const [reset] = await t.query<{ user_id: string }>(
      `update password_resets set used_at = now()
        where token_hash = $1 and used_at is null and expires_at > now()
        returning user_id`,
      [sha256(token)],
    );
    if (!reset) fail("Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bağlantı iste.", 410);

    await t.query("update users set password_hash = $2 where id = $1", [reset.user_id, hash]);
    // Şifre değişince diğer cihazlardaki oturumlar kapanır.
    await t.query("delete from sessions where user_id = $1", [reset.user_id]);
    await startSession(reset.user_id, t);
    const [u] = await t.query<{ role: string }>("select role from users where id = $1", [reset.user_id]);
    return u.role;
  });
  return { role };
});
