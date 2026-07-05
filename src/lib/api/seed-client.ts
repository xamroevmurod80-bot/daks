import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  INIT_KB, INIT_SC, INIT_TQ, INIT_NEWS, INIT_EMP,
  INIT_DEPARTMENTS, INIT_DEPARTMENT_IDS, INIT_LOCATIONS,
  INIT_ABOUT, INIT_CONTACTS, INIT_VIDEOS, INIT_AI,
} from "../seed-data";
import type { ApiResult } from "../types";

async function collectionEmpty(name: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, name), limit(1)));
  return snap.empty;
}

async function needsDemoProfiles(): Promise<boolean> {
  const demo = await getDocs(query(collection(db, "profiles"), where("seedDemo", "==", true), limit(1)));
  return demo.empty;
}

async function needsSiteAbout(): Promise<boolean> {
  const snap = await getDoc(doc(db, "site_content", "about"));
  return !snap.exists();
}

async function seedDemoProfiles(batch: ReturnType<typeof writeBatch>): Promise<number> {
  const refs = INIT_EMP.map(() => doc(collection(db, "profiles")));
  const legacyToUid: Record<string, string> = {};
  refs.forEach((ref, i) => {
    legacyToUid[String(i + 1)] = ref.id;
  });

  INIT_EMP.forEach((emp, i) => {
    const { parentId: legacyParent, ...rest } = emp;
    batch.set(refs[i], {
      ...rest,
      parentId: legacyParent ? legacyToUid[legacyParent] : null,
      seedDemo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return INIT_EMP.length;
}

export async function isDatabaseEmpty(): Promise<boolean> {
  return collectionEmpty("kb_items");
}

export async function seedInitialData(): Promise<ApiResult<{ count: number }>> {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: null, error: "Требуется авторизация" };

    const batch = writeBatch(db);
    let count = 0;

    if (await collectionEmpty("kb_items")) {
      for (const item of INIT_KB) {
        batch.set(doc(collection(db, "kb_items")), { ...item, createdAt: serverTimestamp() });
        count++;
      }
      for (const item of INIT_SC) {
        batch.set(doc(collection(db, "scripts")), { ...item, createdAt: serverTimestamp() });
        count++;
      }
      for (const item of INIT_TQ) {
        batch.set(doc(collection(db, "test_questions")), { ...item, createdAt: serverTimestamp() });
        count++;
      }
      for (const item of INIT_NEWS) {
        batch.set(doc(collection(db, "news")), {
          ...item,
          authorId: uid,
          date: new Date().toISOString().split("T")[0],
          createdAt: serverTimestamp(),
        });
        count++;
      }
    }

    if (await needsDemoProfiles()) {
      count += await seedDemoProfiles(batch);
    }

    if (await collectionEmpty("departments")) {
      INIT_DEPARTMENTS.forEach((dept, i) => {
        batch.set(doc(db, "departments", INIT_DEPARTMENT_IDS[i]), {
          ...dept,
          createdAt: serverTimestamp(),
        });
        count++;
      });
    }

    if (await collectionEmpty("locations")) {
      for (const loc of INIT_LOCATIONS) {
        batch.set(doc(collection(db, "locations")), { ...loc, createdAt: serverTimestamp() });
        count++;
      }
    }

    if (await needsSiteAbout()) {
      batch.set(doc(db, "site_content", "about"), { ...INIT_ABOUT, updatedAt: serverTimestamp() });
      batch.set(doc(db, "site_content", "contacts"), { ...INIT_CONTACTS, updatedAt: serverTimestamp() });
      count += 2;
    }

    if (await collectionEmpty("training_videos")) {
      for (const video of INIT_VIDEOS) {
        batch.set(doc(collection(db, "training_videos")), { ...video, createdAt: serverTimestamp() });
        count++;
      }
    }

    if (await collectionEmpty("ai_analyses")) {
      for (const item of INIT_AI) {
        batch.set(doc(collection(db, "ai_analyses")), { ...item, createdAt: serverTimestamp() });
        count++;
      }
    }

    if (count === 0) return { data: { count: 0 }, error: null };

    batch.set(doc(db, "_meta", "seed"), {
      seededAt: serverTimestamp(),
      version: 2,
    });

    await batch.commit();
    return { data: { count }, error: null };
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Ошибка загрузки данных",
    };
  }
}
