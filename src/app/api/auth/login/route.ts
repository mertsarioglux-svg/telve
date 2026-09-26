import { startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { fail, handle, parseBody } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const { email, password } = await parseBody(req, loginSchema);
  const [user] = await (await db()).query<{ id: string; role: string; password_hash: string }>(
    "select id, role, password_hash from users where email = $1",
    [email],
  );
  // Hangisinin yanlış olduğunu söylemiyoruz; yoksa kayıtlı e-postalar tahmin edilebilir.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    fail("E-posta ya da şifre hatalı.", 401, "password");
  }
  await startSession(user.id);
  return { role: user.role };
});
