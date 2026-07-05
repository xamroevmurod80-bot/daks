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
import type { Location, ApiResult } from "../types";

export async function listLocations(): Promise<Location[]> {
  const snap = await getDocs(collection(db, "locations"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Location));
}

export async function createLocation(data: Omit<Location, "id">): Promise<ApiResult<Location>> {
  try {
    const ref = await addDoc(collection(db, "locations"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...data }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<ApiResult<Location>> {
  try {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, "locations", id), rest);
    return { data: { id, ...data } as Location, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteLocation(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "locations", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
