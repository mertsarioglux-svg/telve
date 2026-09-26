import type { z } from "zod";
import { currentUser, type Role, type SessionUser } from "./auth";

/** İstemciye gösterilecek, beklenen hatalar (ör. "QR süresi doldu"). */
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public field?: string,
  ) {
    super(message);
  }
}

export function fail(message: string, status = 400, field?: string): never {
  throw new AppError(message, status, field);
}

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) fail("Oturum açman gerekiyor.", 401);
  if (role && user.role !== role) fail("Bu işlem için yetkin yok.", 403);
  return user;
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  const body = await req.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    fail(issue?.message ?? "Geçersiz istek.", 400, issue?.path[0]?.toString());
  }
  return result.data;
}

/** Route handler'ı sarar: AppError'ı düzgün JSON'a çevirir, beklenmeyen hataları loglar. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A): Promise<Response> => {
    try {
      const data = await fn(...args);
      return Response.json(data ?? { ok: true });
    } catch (err) {
      if (err instanceof AppError) {
        return Response.json({ error: err.message, field: err.field }, { status: err.status });
      }
      console.error(err);
      return Response.json({ error: "Beklenmeyen bir hata oldu. Tekrar dene." }, { status: 500 });
    }
  };
}
