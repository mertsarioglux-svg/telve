import { z } from "zod";
import { fail, handle, parseBody, requireUser } from "@/lib/http";
import { extractCode, lookupCode } from "@/lib/loyalty";

export const POST = handle(async (req: Request) => {
  await requireUser("kasiyer");
  const { code } = await parseBody(req, z.object({ code: z.string().max(100) }));
  const clean = extractCode(code);
  if (!clean) fail("Bu bir Telve QR'ı değil. Kod 7 haneli olmalı.");
  return lookupCode(clean);
});
