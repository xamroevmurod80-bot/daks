export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  department: string;
  progress: Record<string, number>;
  birthday?: string;
  photoUrl?: string;
  joinDate?: string;
  position?: string;
  treeLevel?: number;
  parentId?: string;
  telegram?: string;
  instagram?: string;
  quote?: string;
}

export interface KBItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ScriptItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface TestQ {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
}

export interface HelpReq {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  description: string;
  submittedBy?: string;
  date: string;
  status: "new" | "in-progress" | "resolved";
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  authorDept: string;
  authorId?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  warning?: string | null;
}

export interface Department {
  id: string;
  name: string;
  iconKey: string;
  color: string;
  description: string;
  headcount: number;
  kpis: string[];
  detail: string;
}

export interface Location {
  id: string;
  city: string;
  sub: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  isHQ: boolean;
}

export interface AboutContent {
  badge: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  timeline: { year: string; title: string; description: string }[];
  values: { emoji: string; title: string; description: string }[];
}

export interface ContactItem {
  type: "phone" | "email" | "address";
  label: string;
  href?: string;
}

export interface SocialLink {
  label: string;
  color: string;
  href: string;
}

export interface ContactContent {
  officeTitle: string;
  items: ContactItem[];
  socials: SocialLink[];
}

export interface TrainingVideo {
  id: string;
  category: string;
  title: string;
  durationMin: number;
  order: number;
  videoUrl?: string;
}

export interface AiAnalysis {
  id: string;
  employeeName: string;
  date: string;
  score: number;
  feedback: string;
  status: "pass" | "fail";
  source?: "manual" | "gemini";
  audioPath?: string;
}
