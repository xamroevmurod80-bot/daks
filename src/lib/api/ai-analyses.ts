import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AiAnalysis, ApiResult } from "../types";
import { callFunction } from "./callable";

function firestorePayload(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export async function listAiAnalyses(): Promise<AiAnalysis[]> {
  const q = query(collection(db, "ai_analyses"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AiAnalysis));
}

export async function createAiAnalysis(data: Omit<AiAnalysis, "id">): Promise<ApiResult<AiAnalysis>> {
  try {
    const payload = firestorePayload({ ...data, source: data.source ?? "manual" });
    const ref = await addDoc(collection(db, "ai_analyses"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...data, source: data.source ?? "manual" }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function analyzeCallRecording(data: {
  employeeName: string;
  storagePath: string;
}): Promise<ApiResult<AiAnalysis>> {
  const res = await callFunction<typeof data, AiAnalysis>("analyzeCall", data);
  if (res.error) return { data: null, error: res.error };
  if (!res.data) return { data: null, error: "Пустой ответ от сервера" };
  return { data: { ...res.data, source: "gemini" }, error: null };
}

export async function updateAiAnalysis(id: string, data: Partial<AiAnalysis>): Promise<ApiResult<AiAnalysis>> {
  try {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, "ai_analyses", id), rest);
    return { data: { id, ...data } as AiAnalysis, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteAiAnalysis(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "ai_analyses", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
