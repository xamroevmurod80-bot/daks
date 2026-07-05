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
import type { TrainingVideo, ApiResult } from "../types";

function firestorePayload(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export async function listTrainingVideos(): Promise<TrainingVideo[]> {
  const q = query(collection(db, "training_videos"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingVideo));
}

export async function createTrainingVideo(data: Omit<TrainingVideo, "id">): Promise<ApiResult<TrainingVideo>> {
  try {
    const payload = firestorePayload({ ...data });
    const ref = await addDoc(collection(db, "training_videos"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { data: { id: ref.id, ...data, videoUrl: data.videoUrl || undefined }, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateTrainingVideo(id: string, data: Partial<TrainingVideo>): Promise<ApiResult<TrainingVideo>> {
  try {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, "training_videos", id), firestorePayload(rest as Record<string, unknown>));
    return { data: { id, ...data } as TrainingVideo, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteTrainingVideo(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "training_videos", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
