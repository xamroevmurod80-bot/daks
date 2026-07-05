import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  Employee,
  KBItem,
  ScriptItem,
  TestQ,
  HelpReq,
  NewsItem,
  Department,
  Location,
  AboutContent,
  ContactContent,
  TrainingVideo,
  AiAnalysis,
} from "../types";

function mapProfile(id: string, d: Record<string, unknown>): Employee {
  return {
    id,
    firstName: (d.firstName as string) ?? "",
    lastName: (d.lastName as string) ?? "",
    email: (d.email as string) ?? "",
    phone: (d.phone as string) ?? "",
    role: (d.role as Employee["role"]) ?? "user",
    department: (d.department as string) ?? "daksdrive",
    progress: (d.progress as Record<string, number>) ?? {},
    birthday: d.birthday as string | undefined,
    photoUrl: d.photoUrl as string | undefined,
    joinDate: d.joinDate as string | undefined,
    position: d.position as string | undefined,
    treeLevel: d.treeLevel as number | undefined,
    parentId: d.parentId as string | undefined,
    telegram: d.telegram as string | undefined,
    instagram: d.instagram as string | undefined,
    quote: d.quote as string | undefined,
  };
}

export type AppDataCallbacks = {
  onEmployees: (v: Employee[]) => void;
  onKbItems: (v: KBItem[]) => void;
  onScriptItems: (v: ScriptItem[]) => void;
  onTestQs: (v: TestQ[]) => void;
  onNews: (v: NewsItem[]) => void;
  onHelpReqs: (v: HelpReq[]) => void;
  onDepartments: (v: Department[]) => void;
  onLocations: (v: Location[]) => void;
  onAbout: (v: AboutContent | null) => void;
  onContacts: (v: ContactContent | null) => void;
  onTrainingVideos: (v: TrainingVideo[]) => void;
  onAiAnalyses: (v: AiAnalysis[]) => void;
};

export function subscribeAppData(isAdmin: boolean, cb: AppDataCallbacks): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(onSnapshot(collection(db, "profiles"), snap => {
    cb.onEmployees(snap.docs.map(d => mapProfile(d.id, d.data() as Record<string, unknown>)));
  }));

  unsubs.push(onSnapshot(collection(db, "kb_items"), snap => {
    cb.onKbItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as KBItem)));
  }));

  unsubs.push(onSnapshot(collection(db, "scripts"), snap => {
    cb.onScriptItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScriptItem)));
  }));

  unsubs.push(onSnapshot(collection(db, "test_questions"), snap => {
    cb.onTestQs(snap.docs.map(d => ({ id: d.id, ...d.data() } as TestQ)));
  }));

  unsubs.push(onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), snap => {
    cb.onNews(snap.docs.map(d => {
      const data = d.data();
      const ts = data.createdAt as { toDate?: () => Date } | undefined;
      return {
        id: d.id,
        title: data.title ?? "",
        content: data.content ?? "",
        date: ts?.toDate ? ts.toDate().toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        authorName: data.authorName ?? "",
        authorDept: data.authorDept ?? "",
        authorId: data.authorId,
      };
    }));
  }));

  unsubs.push(onSnapshot(collection(db, "departments"), snap => {
    cb.onDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
  }));

  unsubs.push(onSnapshot(collection(db, "locations"), snap => {
    cb.onLocations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Location)));
  }));

  unsubs.push(onSnapshot(doc(db, "site_content", "about"), snap => {
    cb.onAbout(snap.exists() ? (snap.data() as AboutContent) : null);
  }));

  unsubs.push(onSnapshot(doc(db, "site_content", "contacts"), snap => {
    cb.onContacts(snap.exists() ? (snap.data() as ContactContent) : null);
  }));

  unsubs.push(onSnapshot(query(collection(db, "training_videos"), orderBy("order", "asc")), snap => {
    cb.onTrainingVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingVideo)));
  }));

  if (isAdmin) {
    unsubs.push(onSnapshot(query(collection(db, "help_requests"), orderBy("createdAt", "desc")), snap => {
      cb.onHelpReqs(snap.docs.map(d => {
        const data = d.data();
        const ts = data.createdAt as { toDate?: () => Date } | undefined;
        return {
          id: d.id,
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          phone: data.phone ?? "",
          description: data.description ?? "",
          submittedBy: data.submittedBy,
          date: ts?.toDate ? ts.toDate().toISOString().split("T")[0] : "",
          status: data.status ?? "new",
        };
      }));
    }));

    unsubs.push(onSnapshot(query(collection(db, "ai_analyses"), orderBy("date", "desc")), snap => {
      cb.onAiAnalyses(snap.docs.map(d => ({ id: d.id, ...d.data() } as AiAnalysis)));
    }));
  } else {
    cb.onHelpReqs([]);
    cb.onAiAnalyses([]);
  }

  return () => unsubs.forEach(u => u());
}
