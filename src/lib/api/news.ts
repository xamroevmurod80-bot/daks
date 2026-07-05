import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { NewsItem, ApiResult } from "../types";

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return new Date().toISOString().split("T")[0];
  return ts.toDate().toISOString().split("T")[0];
}

export async function listNews(): Promise<NewsItem[]> {
  const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? "",
      content: data.content ?? "",
      date: formatDate(data.createdAt),
      authorName: data.authorName ?? "",
      authorDept: data.authorDept ?? "",
      authorId: data.authorId,
    };
  });
}

export async function createNews(
  title: string,
  content: string,
  author: { id: string; name: string; dept: string }
): Promise<ApiResult<NewsItem>> {
  try {
    const ref = await addDoc(collection(db, "news"), {
      title,
      content,
      authorId: author.id,
      authorName: author.name,
      authorDept: author.dept,
      createdAt: serverTimestamp(),
    });
    return {
      data: {
        id: ref.id,
        title,
        content,
        date: new Date().toISOString().split("T")[0],
        authorName: author.name,
        authorDept: author.dept,
        authorId: author.id,
      },
      error: null,
    };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteNews(id: string): Promise<ApiResult<null>> {
  try {
    await deleteDoc(doc(db, "news", id));
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
