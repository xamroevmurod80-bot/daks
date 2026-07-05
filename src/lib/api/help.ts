import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { HelpReq, ApiResult } from "../types";

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return new Date().toISOString().split("T")[0];
  return ts.toDate().toISOString().split("T")[0];
}

export async function listHelpRequests(): Promise<HelpReq[]> {
  const q = query(collection(db, "help_requests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      phone: data.phone ?? "",
      description: data.description ?? "",
      submittedBy: data.submittedBy,
      date: formatDate(data.createdAt),
      status: data.status ?? "new",
    };
  });
}

export async function createHelpRequest(
  data: Omit<HelpReq, "id" | "date" | "status">
): Promise<ApiResult<HelpReq>> {
  try {
    const ref = await addDoc(collection(db, "help_requests"), {
      ...data,
      status: "new",
      createdAt: serverTimestamp(),
    });
    return {
      data: {
        id: ref.id,
        ...data,
        date: new Date().toISOString().split("T")[0],
        status: "new",
      },
      error: null,
    };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateHelpStatus(
  id: string,
  status: HelpReq["status"]
): Promise<ApiResult<null>> {
  try {
    await updateDoc(doc(db, "help_requests", id), { status });
    return { data: null, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
