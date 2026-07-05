import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as functions from "firebase-functions/v1";
import { analyzeCallAudio } from "./gemini";

setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

const geminiApiKey = defineSecret("GEMINI_API_KEY");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

async function assertAdmin(uid: string) {
  const user = await auth.getUser(uid);
  if (user.customClaims?.admin) return;
  const profile = await db.collection("profiles").doc(uid).get();
  if (profile.data()?.role === "admin") return;
  throw new HttpsError("permission-denied", "Admin access required");
}

export const onAuthUserCreate = functions.auth.user().onCreate(async (user) => {
  if (!user.uid || !user.email) return;

  const existing = await db.collection("profiles").doc(user.uid).get();
  if (existing.exists) return;

  await db.collection("profiles").doc(user.uid).set({
    firstName: user.displayName?.split(" ")[0] ?? "",
    lastName: user.displayName?.split(" ").slice(1).join(" ") ?? "",
    email: user.email,
    phone: "",
    role: "user",
    department: "daksdrive",
    progress: {},
    joinDate: new Date().toISOString().split("T")[0],
    treeLevel: 3,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

export const createEmployee = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
  await assertAdmin(request.auth.uid);

  const data = request.data as Record<string, unknown>;
  const email = data.email as string;
  const password = data.password as string;
  if (!email || !password) {
    throw new HttpsError("invalid-argument", "Email and password required");
  }
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters");
  }

  let userRecord: admin.auth.UserRecord | undefined;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
    });

    await db.collection("profiles").doc(userRecord.uid).set({
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email,
      phone: data.phone ?? "",
      role: data.role ?? "user",
      department: data.department ?? "daksdrive",
      progress: data.progress ?? {},
      birthday: data.birthday ?? null,
      photoUrl: data.photoUrl ?? null,
      joinDate: data.joinDate ?? new Date().toISOString().split("T")[0],
      position: data.position ?? null,
      treeLevel: data.treeLevel ?? 3,
      parentId: data.parentId ?? null,
      telegram: data.telegram ?? null,
      instagram: data.instagram ?? null,
      quote: data.quote ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e: unknown) {
    if (userRecord) {
      await auth.deleteUser(userRecord.uid).catch(() => undefined);
    }
    const err = e as { code?: string; message?: string };
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Пользователь с таким email уже существует");
    }
    throw new HttpsError("internal", err.message ?? "Failed to create employee");
  }

  return { uid: userRecord!.uid };
});

export const deleteEmployee = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
  await assertAdmin(request.auth.uid);

  const uid = (request.data as { uid?: string }).uid;
  if (!uid) throw new HttpsError("invalid-argument", "UID required");
  if (uid === request.auth.uid) {
    throw new HttpsError("invalid-argument", "Нельзя удалить свой аккаунт");
  }

  await db.collection("profiles").doc(uid).delete();
  try {
    await auth.deleteUser(uid);
  } catch {
    // profile without auth user
  }

  return { success: true };
});

export const analyzeCall = onCall(
  { secrets: [geminiApiKey], timeoutSeconds: 300, memory: "1GiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
    await assertAdmin(request.auth.uid);

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "GEMINI_API_KEY не настроен. Выполните: firebase functions:secrets:set GEMINI_API_KEY",
      );
    }

    const { employeeName, storagePath } = request.data as {
      employeeName?: string;
      storagePath?: string;
    };
    if (!employeeName?.trim() || !storagePath?.trim()) {
      throw new HttpsError("invalid-argument", "employeeName and storagePath required");
    }

    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) throw new HttpsError("not-found", "Audio file not found in Storage");

    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size ?? 0);
    if (size > 25 * 1024 * 1024) {
      throw new HttpsError("invalid-argument", "Audio file too large (max 25 MB)");
    }

    const [buffer] = await file.download();
    const mimeType = metadata.contentType ?? "audio/mpeg";

    let analysis;
    try {
      analysis = await analyzeCallAudio(apiKey, buffer.toString("base64"), mimeType);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gemini analysis failed";
      throw new HttpsError("internal", msg);
    }

    const date = new Date().toISOString().split("T")[0];
    const docRef = await db.collection("ai_analyses").add({
      employeeName: employeeName.trim(),
      date,
      score: analysis.score,
      feedback: analysis.feedback,
      status: analysis.status,
      source: "gemini",
      audioPath: storagePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      id: docRef.id,
      employeeName: employeeName.trim(),
      date,
      score: analysis.score,
      feedback: analysis.feedback,
      status: analysis.status,
      source: "gemini" as const,
    };
  },
);

export const setAdminRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

  const email = (request.data as { email?: string }).email;
  if (!email) throw new HttpsError("invalid-argument", "Email required");

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  await db.collection("profiles").doc(user.uid).set(
    { role: "admin", updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );

  return { uid: user.uid, admin: true };
});

export const seedDatabase = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
  await assertAdmin(request.auth.uid);

  const data = request.data as {
    kb?: Array<{ category: string; question: string; answer: string }>;
    scripts?: Array<{ category: string; title: string; content: string }>;
    tests?: Array<{ category: string; question: string; options: string[]; correct: number }>;
    news?: Array<{ title: string; content: string; authorName: string; authorDept: string }>;
  };

  const batch = db.batch();
  let count = 0;

  for (const item of data.kb ?? []) {
    const ref = db.collection("kb_items").doc();
    batch.set(ref, { ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    count++;
  }
  for (const item of data.scripts ?? []) {
    const ref = db.collection("scripts").doc();
    batch.set(ref, { ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    count++;
  }
  for (const item of data.tests ?? []) {
    const ref = db.collection("test_questions").doc();
    batch.set(ref, { ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    count++;
  }
  for (const item of data.news ?? []) {
    const ref = db.collection("news").doc();
    batch.set(ref, {
      ...item,
      authorId: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  }

  await batch.commit();
  return { seeded: count };
});
