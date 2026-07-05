import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export function parseFunctionsError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  const code = err?.code ?? "";
  const msg = err?.message ?? "";

  if (
    code === "functions/not-found" ||
    code === "functions/unavailable" ||
    code === "functions/deadline-exceeded" ||
    msg.includes("CORS") ||
    msg.toLowerCase().includes("failed to fetch")
  ) {
    return "Cloud Functions не задеплоены. Выполните: npm run firebase:deploy:functions (требуется Blaze plan)";
  }
  if (code === "functions/permission-denied") return "Недостаточно прав (нужен admin)";
  if (code === "functions/unauthenticated") return "Войдите в систему заново";
  if (code === "functions/already-exists") return "Пользователь с таким email уже существует";
  if (code === "functions/failed-precondition") return msg || "Сервис не настроен";
  if (code === "functions/invalid-argument") return msg || "Неверные данные";
  return msg || "Ошибка сервера";
}

export async function callFunction<TReq, TRes>(
  name: string,
  data: TReq,
): Promise<{ data: TRes | null; error: string | null }> {
  try {
    const fn = httpsCallable<TReq, TRes>(functions, name);
    const result = await fn(data);
    return { data: result.data, error: null };
  } catch (e: unknown) {
    return { data: null, error: parseFunctionsError(e) };
  }
}
