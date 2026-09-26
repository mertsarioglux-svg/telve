import { z } from "zod";
import { endSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { handle, parseBody, requireUser } from "@/lib/http";
import { getSummary } from "@/lib/loyalty";

export const GET = handle(async () => {
  const user = await requireUser("musteri");
  return getSummary(user.id);
});

// Bildirim tercihleri
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser("musteri");
  const notif = await parseBody(req, z.object({ stamp: z.boolean(), gift: z.boolean(), promo: z.boolean() }));
  await (await db()).query("update users set notif_stamp = $2, notif_gift = $3, notif_promo = $4 where id = $1", [
    user.id,
    notif.stamp,
    notif.gift,
    notif.promo,
  ]);
});

// Hesabı sil (KVKK). Damgalar, geçmiş ve oturumlar da silinir (on delete cascade).
export const DELETE = handle(async () => {
  const user = await requireUser("musteri");
  await endSession();
  await (await db()).query("delete from users where id = $1", [user.id]);
});
