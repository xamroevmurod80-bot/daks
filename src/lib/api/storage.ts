import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "../firebase";
import type { ApiResult } from "../types";

const VIDEO_MAX_MB = 100;
const UPLOAD_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function formatStorageError(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("Таймаут") || msg.includes("timeout")) {
    return "Таймаут загрузки. Включите Storage в Firebase Console (Storage → Get started) и выполните npm run firebase:rules:storage";
  }
  if (code === "storage/unauthorized" || msg.includes("403") || msg.includes("permission")) {
    return "Доступ запрещён. Задеплойте правила: npm run firebase:rules:storage";
  }
  if (code === "storage/unauthenticated") {
    return "Войдите в систему заново";
  }
  if (code === "storage/unknown" || msg.includes("404") || msg.includes("bucket") || msg.includes("Network")) {
    return "Firebase Storage не настроен. Проверьте VITE_FIREBASE_STORAGE_BUCKET в .env и включите Storage в Console";
  }
  return msg || "Ошибка загрузки";
}

async function persistPhotoUrl(uid: string, url: string): Promise<void> {
  await updateDoc(doc(db, "profiles", uid), {
    photoUrl: url,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadProfilePhoto(uid: string, file: File): Promise<ApiResult<string>> {
  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.${ext}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await persistPhotoUrl(uid, url);
    return { data: url, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка загрузки" };
  }
}

export async function uploadProfilePhotoBase64(
  uid: string,
  dataUrl: string
): Promise<ApiResult<string>> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await persistPhotoUrl(uid, url);
    return { data: url, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка загрузки" };
  }
}

export async function uploadTrainingVideo(file: File): Promise<ApiResult<string>> {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (!bucket || bucket.includes("your_project")) {
    return { data: null, error: "Storage не настроен: укажите VITE_FIREBASE_STORAGE_BUCKET в .env.local" };
  }
  if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
    return { data: null, error: `Файл слишком большой (макс. ${VIDEO_MAX_MB} МБ). Вставьте ссылку на YouTube или облако.` };
  }
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const storageRef = ref(storage, `videos/${Date.now()}.${ext}`);
    await withTimeout(
      uploadBytes(storageRef, file),
      UPLOAD_TIMEOUT_MS,
      "Таймаут загрузки видео",
    );
    const url = await getDownloadURL(storageRef);
    return { data: url, error: null };
  } catch (e: unknown) {
    return { data: null, error: formatStorageError(e) };
  }
}

const CALL_AUDIO_MAX_MB = 25;

export async function uploadCallRecording(file: File): Promise<ApiResult<{ path: string; url: string }>> {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (!bucket || bucket.includes("your_project")) {
    return { data: null, error: "Storage не настроен: укажите VITE_FIREBASE_STORAGE_BUCKET в .env.local" };
  }
  if (file.size > CALL_AUDIO_MAX_MB * 1024 * 1024) {
    return { data: null, error: `Аудио слишком большое (макс. ${CALL_AUDIO_MAX_MB} МБ)` };
  }
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const path = `call-recordings/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await withTimeout(
      uploadBytes(storageRef, file, { contentType: file.type || "audio/mpeg" }),
      UPLOAD_TIMEOUT_MS,
      "Таймаут загрузки аудио",
    );
    const url = await getDownloadURL(storageRef);
    return { data: { path, url }, error: null };
  } catch (e: unknown) {
    return { data: null, error: formatStorageError(e) };
  }
}
