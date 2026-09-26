import { startSession } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { fail, handle, parseBody } from "@/lib/http";
import { signupSchema } from "@/lib/validation";

const TAKEN = "Bu e-posta ile zaten bir hesap var.";

export const POST = handle(async (req: Request) => {
  const input = await parseBody(req, signupSchema);
  const q = await db();

  const [exists] = await q.query("select 1 from users where email = $1", [input.email]);
  if (exists) fail(TAKEN, 409, "email");

  const hash = await hashPassword(input.password);
  await q.tx(async (t) => {
    const rows = await t.query<{ id: string }>(
      `insert into users (name, phone, email, password_hash, marketing, notif_promo)
       values ($1, $2, $3, $4, $5, $5)
       on conflict (email) do nothing
       returning id`,
      [input.name, input.phone, input.email, hash, input.marketing],
    );
    if (!rows[0]) fail(TAKEN, 409, "email");
    await startSession(rows[0].id, t);
  });
  return { role: "musteri" };
});
