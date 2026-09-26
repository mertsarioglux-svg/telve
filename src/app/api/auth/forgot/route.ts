import { z } from "zod";
import { newToken, sha256 } from "@/lib/crypto";
import { db } from "@/lib/db";
import { handle, parseBody } from "@/lib/http";
import { sendResetMail } from "@/lib/mail";
import { emailSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const { email } = await parseBody(req, z.object({ email: emailSchema }));
  const q = await db();
  const [user] = await q.query<{ id: string }>("select id from users where email = $1", [email]);

  // Hesap olsun olmasın aynı cevabı veriyoruz; böylece kimin üye olduğu anlaşılmaz.
  if (user) {
    const token = newToken();
    await q.query("insert into password_resets (token_hash, user_id, expires_at) values ($1, $2, now() + interval '1 hour')", [
      sha256(token),
      user.id,
    ]);
    await sendResetMail(email, `${new URL(req.url).origin}/sifre-yenile?token=${token}`);
  }
});
