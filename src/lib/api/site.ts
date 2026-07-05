import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { AboutContent, ContactContent, ApiResult } from "../types";

const aboutRef = () => doc(db, "site_content", "about");
const contactsRef = () => doc(db, "site_content", "contacts");

export async function getAboutContent(): Promise<AboutContent | null> {
  const snap = await getDoc(aboutRef());
  if (!snap.exists()) return null;
  return snap.data() as AboutContent;
}

export async function updateAboutContent(data: AboutContent): Promise<ApiResult<AboutContent>> {
  try {
    await setDoc(aboutRef(), { ...data, updatedAt: serverTimestamp() });
    return { data, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function getContactContent(): Promise<ContactContent | null> {
  const snap = await getDoc(contactsRef());
  if (!snap.exists()) return null;
  return snap.data() as ContactContent;
}

export async function updateContactContent(data: ContactContent): Promise<ApiResult<ContactContent>> {
  try {
    await setDoc(contactsRef(), { ...data, updatedAt: serverTimestamp() });
    return { data, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
