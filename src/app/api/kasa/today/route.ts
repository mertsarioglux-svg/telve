import { handle, requireUser } from "@/lib/http";
import { cashierToday } from "@/lib/loyalty";

export const GET = handle(async () => {
  const cashier = await requireUser("kasiyer");
  return cashierToday(cashier.id);
});
