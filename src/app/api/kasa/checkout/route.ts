import { z } from "zod";
import { handle, parseBody, requireUser } from "@/lib/http";
import { checkout } from "@/lib/loyalty";

export const POST = handle(async (req: Request) => {
  const cashier = await requireUser("kasiyer");
  const body = await parseBody(
    req,
    z.object({
      code: z.string().regex(/^\d{7}$/, "Geçersiz kod."),
      coffees: z.number().int().min(0).max(20, "Tek seferde en fazla 20 kahve."),
      redeem: z.boolean(),
    }),
  );
  return checkout(body.code, cashier.id, body.coffees, body.redeem);
});
