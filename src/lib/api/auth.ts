import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp, query, where, limit, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getProfile } from "./profiles";
import type { Employee, RegisterData, ApiResult } from "../types";

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

async function hasAdminProfile(): Promise<boolean> {
  const snap = await getDocs(query(collection(db, "profiles"), where("role", "==", "admin"), limit(1)));
  return !snap.empty;
}

export async function login(email: string, password: string): Promise<ApiResult<Employee>> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getProfile(cred.user.uid);
    if (!profile) return { data: null, error: "Профиль не найден" };
    return { data: profile, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка входа" };
  }
}

export async function register(data: RegisterData): Promise<ApiResult<Employee>> {
  try {
    const role: Employee["role"] = (await hasAdminProfile()) ? "user" : "admin";
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, "profiles", cred.user.uid), {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role,
      department: "daksdrive",
      progress: {},
      joinDate: new Date().toISOString().split("T")[0],
      treeLevel: 3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      data: {
        id: cred.user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role,
        department: "daksdrive",
        progress: {},
        joinDate: new Date().toISOString().split("T")[0],
        treeLevel: 3,
      },
      error: null,
    };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка регистрации" };
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getCurrentUser(): Promise<Employee | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return getProfile(user.uid);
}

export async function resetPassword(email: string): Promise<ApiResult<null>> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка отправки письма" };
  }
}
