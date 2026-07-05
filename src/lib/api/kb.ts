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
import type { KBItem, ApiResult } from "../types";

export async function listKbItems(): Promise<KBItem[]> {
  const snap = await getDocs(collection(db, "kb_items"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KBItem));
}

export async function createKbItem(item: Omit<KBItem, "id">): Promise<ApiResult<KBItem>> {
  try {
    const ref = await addDoc(collection(db, "kb_items"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...item }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateKbItem(id: string, item: Partial<KBItem>): Promise<ApiResult<KBItem>> {
  try {
    const { id: _id, ...rest } = item;
    await updateDoc(doc(db, "kb_items", id), rest);
    return { data: { id, ...item } as KBItem, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteKbItem(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "kb_items", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
