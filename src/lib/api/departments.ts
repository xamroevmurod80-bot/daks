import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Department, ApiResult } from "../types";

export async function listDepartments(): Promise<Department[]> {
  const snap = await getDocs(collection(db, "departments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Department));
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<ApiResult<Department>> {
  try {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, "departments", id), { ...rest, updatedAt: serverTimestamp() });
    const snap = await getDoc(doc(db, "departments", id));
    return { data: { id, ...snap.data() } as Department, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function upsertDepartment(id: string, data: Omit<Department, "id">): Promise<void> {
  await setDoc(doc(db, "departments", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
