import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ScriptItem, ApiResult } from "../types";

export async function listScripts(): Promise<ScriptItem[]> {
  const snap = await getDocs(collection(db, "scripts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScriptItem));
}

export async function createScript(item: Omit<ScriptItem, "id">): Promise<ApiResult<ScriptItem>> {
  try {
    const ref = await addDoc(collection(db, "scripts"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...item }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateScript(id: string, item: Partial<ScriptItem>): Promise<ApiResult<ScriptItem>> {
  try {
    const { id: _id, ...rest } = item;
    await updateDoc(doc(db, "scripts", id), rest);
    return { data: { id, ...item } as ScriptItem, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteScript(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "scripts", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
