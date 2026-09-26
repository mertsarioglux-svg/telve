// Tarayıcıdan API çağrıları için küçük yardımcı.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
  }
}

export async function api<T = { ok: true }>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Bağlantı kurulamadı. İnternetini kontrol et.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Bir şeyler ters gitti.", res.status, data.field);
  return data as T;
}
