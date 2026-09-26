import { handle, requireUser } from "@/lib/http";
import { issueQr } from "@/lib/loyalty";

export const POST = handle(async () => {
  const user = await requireUser("musteri");
  return issueQr(user.id);
});
