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
import type { TestQ, ApiResult } from "../types";

export async function listTestQuestions(): Promise<TestQ[]> {
  const snap = await getDocs(collection(db, "test_questions"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TestQ));
}

export async function createQuestion(item: Omit<TestQ, "id">): Promise<ApiResult<TestQ>> {
  try {
    const ref = await addDoc(collection(db, "test_questions"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...item }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateQuestion(id: string, item: Partial<TestQ>): Promise<ApiResult<TestQ>> {
  try {
    const { id: _id, ...rest } = item;
    await updateDoc(doc(db, "test_questions", id), rest);
    return { data: { id, ...item } as TestQ, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteQuestion(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "test_questions", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
