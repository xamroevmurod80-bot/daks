import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getProfile } from "./profiles";
import type { ApiResult, Employee } from "../types";

export async function saveCategoryProgress(
  uid: string,
  category: string,
  score: number
): Promise<ApiResult<Employee>> {
  try {
    const profile = await getProfile(uid);
    if (!profile) return { data: null, error: "Профиль не найден" };
    const progress = { ...profile.progress, [category]: score };
    await updateDoc(doc(db, "profiles", uid), {
      progress,
      updatedAt: serverTimestamp(),
    });
    return { data: { ...profile, progress }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка сохранения прогресса" };
  }
}
