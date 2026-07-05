import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, firebaseConfig } from "../firebase";
import type { Employee, ApiResult } from "../types";
import { callFunction } from "./callable";

const SECONDARY_APP = "admin-create-user";
const FUNCTIONS_HINT = "npm run firebase:deploy:functions (Blaze plan)";

function docToEmployee(id: string, data: DocumentData): Employee {
  return {
    id,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role ?? "user",
    department: data.department ?? "daksdrive",
    progress: data.progress ?? {},
    birthday: data.birthday,
    photoUrl: data.photoUrl,
    joinDate: data.joinDate,
    position: data.position,
    treeLevel: data.treeLevel,
    parentId: data.parentId,
    telegram: data.telegram,
    instagram: data.instagram,
    quote: data.quote,
  };
}

function isFunctionsUnavailable(error: string): boolean {
  return error.includes("не задеплоены") || error.includes("Blaze");
}

export async function getProfile(uid: string): Promise<Employee | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;
  return docToEmployee(snap.id, snap.data());
}

export async function listProfiles(): Promise<Employee[]> {
  const snap = await getDocs(collection(db, "profiles"));
  return snap.docs.map(d => docToEmployee(d.id, d.data()));
}

export async function updateProfile(uid: string, data: Partial<Employee>): Promise<ApiResult<Employee>> {
  try {
    const { id: _id, ...rest } = data;
    await updateDoc(doc(db, "profiles", uid), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
    const updated = await getProfile(uid);
    return { data: updated, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка обновления" };
  }
}

export async function setUserRole(uid: string, role: Employee["role"]): Promise<ApiResult<Employee>> {
  return updateProfile(uid, { role });
}

async function createAuthUser(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

async function createEmployeeLocal(
  data: Partial<Employee> & { email: string; password: string },
): Promise<ApiResult<Employee>> {
  try {
    const uid = await createAuthUser(data.email, data.password);
    const profile = {
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email: data.email,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "profiles", uid), profile);
    return {
      data: docToEmployee(uid, profile),
      error: null,
      warning: `Создано без Cloud Functions. Для production: ${FUNCTIONS_HINT}`,
    };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка создания сотрудника" };
  }
}

export async function createEmployee(
  data: Partial<Employee> & { email: string; password: string },
): Promise<ApiResult<Employee>> {
  const res = await callFunction<typeof data, { uid: string }>("createEmployee", data);
  if (!res.error) {
    if (!res.data?.uid) return { data: null, error: "Не удалось создать сотрудника" };
    const profile = await getProfile(res.data.uid);
    if (!profile) return { data: null, error: "Профиль не найден после создания" };
    return { data: profile, error: null };
  }
  if (isFunctionsUnavailable(res.error)) {
    return createEmployeeLocal(data);
  }
  return { data: null, error: res.error };
}

export async function deleteProfile(uid: string): Promise<ApiResult<null>> {
  const res = await callFunction<{ uid: string }, { success: boolean }>("deleteEmployee", { uid });
  if (!res.error) return { data: null, error: null };

  if (isFunctionsUnavailable(res.error)) {
    try {
      await deleteDoc(doc(db, "profiles", uid));
      return {
        data: null,
        error: null,
        warning: `Профиль удалён. Auth-аккаунт остался — нужен Blaze + ${FUNCTIONS_HINT}`,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : "Ошибка удаления" };
    }
  }
  return { data: null, error: res.error };
}

export async function upsertProfile(uid: string, data: Partial<Employee>): Promise<void> {
  const { id: _id, ...rest } = data;
  await setDoc(
    doc(db, "profiles", uid),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
