import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Play, FileText, CheckSquare, Users, BarChart2, Brain,
  LogOut, Menu, Search, ChevronDown, Copy, Check,
  Phone, Mail, MapPin, Send, Gift, Newspaper, Calculator, Award,
  Shield, Wrench, Car, Cpu, Unlock, TrendingUp,
  Home, Layers, HelpCircle, Globe, Building2,
  AlertCircle, ChevronLeft, Plus, Edit2, Trash2,
  Bell, Settings, ArrowRight, Zap, Target, Clock, X,
  UserPlus, CheckCircle, Upload, Save, Star, Info, Instagram
} from "lucide-react";
import { register, addNews, getNews, deleteNews, getUser, login, logout, getLessons, addProgress } from "../lib/suoerbase";




// ─── LocalStorage Hook ────────────────────────────────────────────────────────
function useLS<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage?.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal(prev => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { }
      return next;
    });
  }, [key]);
  return [val, set];
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "login" | "register" | "home" | "about" | "training" | "knowledge" | "scripts"
  | "team" | "departments" | "contacts" | "help" | "news" | "kpi" | "certificates" | "locations" | "admin";

interface Employee {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  role: "user" | "admin"; department: string; progress: Record<string, number>;
  birthday?: string; photoUrl?: string; joinDate?: string; position?: string;
  treeLevel?: number; parentId?: string;
  telegram?: string; instagram?: string; quote?: string; emailPassword?: string;
}
interface KBItem { id: string; category: string; question: string; answer: string; }
interface ScriptItem { id: string; category: string; title: string; content: string; }
interface TestQ { id: string; category: string; question: string; options: string[]; correct: number; }
interface HelpReq { id: string; firstName: string; lastName: string; phone: string; description: string; submittedBy?: string; date: string; status: "new" | "in-progress" | "resolved"; }
interface NewsItem { id: string; title: string; content: string; date: string; authorName: string; authorDept: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CATS = [
  { id: "daksdrive", label: "DaksDrive", icon: Car, color: "#00c2ff" },
  { id: "imoped", label: "iMoped", icon: Zap, color: "#a855f7" },
  { id: "support", label: "Тех-поддержка", icon: Cpu, color: "#10b981" },
  { id: "security", label: "СБ", icon: Shield, color: "#f59e0b" },
  { id: "mechanic", label: "Механик", icon: Wrench, color: "#ef4444" },
];
const CAT_MAP = Object.fromEntries(CATS.map(c => [c.id, c]));
const TREE_LEVELS = ["Основатель", "Директор / Руководитель", "Менеджер", "Сотрудник"];

const INIT_EMP: Employee[] = [
  { id: "1", firstName: "Мурoддилло", lastName: "Хамроев", email: "m.khamroev@daksdrive.uz", phone: "+998 90 000-00-01", role: "user", department: "daksdrive", progress: {}, birthday: "1990-04-10", position: "CEO & Основатель", treeLevel: 0, telegram: "@muroddillo", instagram: "@muroddillo_k", quote: "Движение — это жизнь. DaksDrive — это движение.", joinDate: "2022-01-01" },
  { id: "2", firstName: "Диёра", lastName: "Юсупова", email: "d.yusupova@daksdrive.uz", phone: "+998 91 000-00-02", role: "user", department: "daksdrive", progress: {}, birthday: "1993-08-22", position: "HR Director", treeLevel: 1, parentId: "1", telegram: "@diyora_hr", joinDate: "2022-03-15" },
  { id: "3", firstName: "Тимур", lastName: "Рашидов", email: "t.rashidov@daksdrive.uz", phone: "+998 93 000-00-03", role: "user", department: "support", progress: { support: 95 }, birthday: "1988-11-05", position: "CTO", treeLevel: 1, parentId: "1", telegram: "@timur_cto", joinDate: "2022-02-01" },
  { id: "4", firstName: "Алексей", lastName: "Петров", email: "a.petrov@daksdrive.uz", phone: "+998 90 123-45-67", role: "user", department: "daksdrive", progress: { daksdrive: 92 }, birthday: "1996-03-15", position: "Fleet Manager", treeLevel: 2, parentId: "2", emailPassword: "Petrov@2024", joinDate: "2023-01-10" },
  { id: "5", firstName: "Мария", lastName: "Иванова", email: "m.ivanova@imoped.uz", phone: "+998 91 234-56-78", role: "user", department: "imoped", progress: { imoped: 78 }, birthday: "1992-07-12", position: "iMoped Lead", treeLevel: 2, parentId: "2", joinDate: "2023-06-20" },
  { id: "6", firstName: "Анна", lastName: "Сидорова", email: "a.sidorova@daksdrive.uz", phone: "+998 94 456-78-90", role: "user", department: "security", progress: { security: 88 }, birthday: "1988-05-22", position: "Инспектор СБ", treeLevel: 3, parentId: "3", joinDate: "2023-12-01" },
  { id: "7", firstName: "Сергей", lastName: "Новиков", email: "s.novikov@daksdrive.uz", phone: "+998 95 567-89-01", role: "user", department: "mechanic", progress: { mechanic: 62 }, birthday: "2001-07-18", position: "Механик", treeLevel: 3, parentId: "3", joinDate: "2024-05-15" },
];

const INIT_KB: KBItem[] = [
  { id: "k1", category: "daksdrive", question: "Как зарегистрировать новое ТС?", answer: "Перейдите «Транспорт» → «Добавить ТС». Введите VIN, марку, модель, год. Прикрепите СТС и ОСАГО. Нажмите «Сохранить»." },
  { id: "k2", category: "daksdrive", question: "Что делать при отказе GPS-трекера?", answer: "1. Перезагрузите трекер (10 сек).\n2. Проверьте SIM.\n3. Убедитесь в покрытии.\n4. Создайте заявку в Тех-поддержку с ID устройства." },
  { id: "k3", category: "imoped", question: "Как провести предрейсовый осмотр самоката?", answer: "Заряд АКБ ≥40%, давление шин 2.5–3 bar, тормоза (ход ≤20мм), фары, руль и дека. Зафиксируйте в журнале." },
  { id: "k4", category: "imoped", question: "Какие тарифы доступны?", answer: "«Старт» — 5 мин бесплатно + 9 руб/мин.\n«Дневной» — 290 руб/4 ч.\n«Безлимит» — 990 руб/мес." },
  { id: "k5", category: "support", question: "Как сбросить пароль пользователя?", answer: "Панель → Пользователи → учётная запись → «Сбросить пароль». Система отправит на email. Все сбросы — в журнал ИБ." },
  { id: "k6", category: "security", question: "Порядок при обнаружении постороннего", answer: "1. Уточните цель и документы.\n2. Без документов — уведомите руководителя.\n3. Отказ — вызовите охрану.\n4. Зафиксируйте в журнале." },
  { id: "k7", category: "mechanic", question: "Периодичность ТО электромотора", answer: "ТО-1 каждые 500 мч: смазка подшипников.\nТО-2 каждые 2000 мч: полная диагностика, замер обмоток, очистка вентиляции." },
];

const INIT_SC: ScriptItem[] = [
  { id: "s1", category: "daksdrive", title: "Приём входящего звонка", content: "— Добрый [день/вечер], DaksDrive, меня зовут [Имя]. Чем могу помочь?\n\n[Клиент по доставке]\n— Уточните номер заказа.\n— Ваш заказ сейчас [статус]. Ориентировочно — [время].\n\n— Спасибо, что обратились! Хорошего дня." },
  { id: "s2", category: "imoped", title: "Консультация по аренде самоката", content: "— Здравствуйте, iMoped. Меня зовут [Имя].\n\n[По тарифам]\n• «Старт» — 5 мин бесплатно + 9 руб/мин\n• «Дневной» — 290 руб/4 ч\n• «Безлимит» — 990 руб/мес\n\n— Как часто планируете использовать? Подберу вариант." },
  { id: "s3", category: "support", title: "Обработка технической заявки", content: "— Тех-поддержка, [Имя] слушает.\n\n— Опишите проблему. Когда первый раз появилась ошибка?\n\n— Попробуйте [решение]. Если нет — создам заявку.\n— Номер заявки: [ID]." },
  { id: "s4", category: "security", title: "Инструктаж при входе на объект", content: "— Добрый день. Назовите цель визита и предъявите документ.\n\n[Если пропуск есть]\n— Следуйте к ресепшн.\n\n[Если нет]\n— Заполните гостевой журнал." },
  { id: "s5", category: "mechanic", title: "Приём ТС на ремонт", content: "— Принимаю ТС на ремонт. Госномер [номер], пробег [показание].\n— Фиксирую повреждения: [перечислить]. Подтверждаете?\n— Срок диагностики — до 4 часов.\n— Акт приёма № [номер]. Подпишите." },
];

const INIT_TQ: TestQ[] = [
  { id: "t1", category: "daksdrive", question: "Стандартное максимальное время доставки DaksDrive:", options: ["20 минут", "40 минут", "60 минут", "90 минут"], correct: 1 },
  { id: "t2", category: "daksdrive", question: "Минимальный NPS для DaksDrive:", options: ["3.5", "4.0", "4.7", "5.0"], correct: 2 },
  { id: "t3", category: "daksdrive", question: "При задержке свыше скольких минут водитель уведомляет диспетчера:", options: ["20", "30", "35", "40"], correct: 2 },
  { id: "t4", category: "imoped", question: "Минимальный заряд АКБ перед рейсом:", options: ["20%", "30%", "40%", "50%"], correct: 2 },
  { id: "t5", category: "imoped", question: "Нормативное давление шин iMoped:", options: ["1.5–2 bar", "2.5–3 bar", "3.5–4 bar", "4–5 bar"], correct: 1 },
  { id: "t6", category: "support", question: "Целевое время первого ответа на заявку:", options: ["5 минут", "2 минуты", "10 минут", "15 минут"], correct: 1 },
  { id: "t7", category: "security", question: "Периодичность планового аудита безопасности:", options: ["Ежемесячно", "60 дней", "90 дней", "Ежегодно"], correct: 2 },
  { id: "t8", category: "mechanic", question: "Периодичность ТО-1 электромотора:", options: ["250 мч", "500 мч", "1000 мч", "2000 мч"], correct: 1 },
];

const INIT_NEWS: NewsItem[] = [
  { id: "n1", title: "Запуск новой линейки iMoped Pro", content: "Флагманская модель с автономностью 120 км и навигацией. Продажи — 15 июля.", date: "2026-07-01", authorName: "Мурoддилло Хамроев", authorDept: "Руководство" },
  { id: "n2", title: "DaksDrive расширяет географию", content: "С 1 июля начинаем работу в Самарканде и Бухаре. Охват — 200+ новых точек выдачи.", date: "2026-06-28", authorName: "Мурoддилло Хамроев", authorDept: "Руководство" },
];

const OFFICES = [
  { city: "Ташкент", sub: "Штаб-квартира", address: "ул. Амира Темура, 107Б, офис 412", phone: "+998 71 200-10-00", email: "tashkent@daksdrive.uz", hours: "Пн–Пт: 09:00–18:00", isHQ: true },
  { city: "Самарканд", sub: "Региональный офис", address: "ул. Регистан, 15, 2-й этаж", phone: "+998 66 230-50-70", email: "samarkand@daksdrive.uz", hours: "Пн–Пт: 09:00–17:00", isHQ: false },
  { city: "Бухара", sub: "Региональный офис", address: "ул. Советская, 88", phone: "+998 65 224-30-80", email: "buxara@daksdrive.uz", hours: "Пн–Пт: 09:00–17:00", isHQ: false },
];

const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayStr = () => new Date().toISOString().split("T")[0];

// ─── UI primitives ────────────────────────────────────────────────────────────
function GC({ children, className = "", style = {}, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} className={cn("rounded-xl border border-white/8 bg-card overflow-hidden", onClick && "cursor-pointer", className)} style={style}>{children}</div>;
}
function Badge({ children, color = "#00c2ff" }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: color + "22", color }}>{children}</span>;
}
function Bar({ value, color = "#00c2ff" }: { value: number; color?: string }) {
  return <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.7, ease: "easeOut" }} /></div>;
}
function Inp({ label, textarea = false, rows = 3, ...p }: { label?: string; textarea?: boolean; rows?: number } & any) {
  const cls = "w-full px-3 py-2.5 rounded-lg border border-white/8 bg-white/5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all text-sm";
  return <div className="flex flex-col gap-1.5">{label && <label className="text-xs text-muted-foreground font-medium">{label}</label>}{textarea ? <textarea className={cn(cls, "resize-none")} rows={rows} {...p} /> : <input className={cls} {...p} />}</div>;
}
function Sel({ label, children, ...p }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="flex flex-col gap-1.5">{label && <label className="text-xs text-muted-foreground font-medium">{label}</label>}<select className="w-full px-3 py-2.5 rounded-lg border border-white/8 bg-[#0d1117] text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" {...p}>{children}</select></div>;
}
function Btn({ children, variant = "primary", sm = false, icon, className = "", ...p }: { children?: React.ReactNode; variant?: "primary" | "ghost" | "outline" | "danger" | "green"; sm?: boolean; icon?: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const vs = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", ghost: "text-muted-foreground hover:text-foreground hover:bg-white/5", outline: "border border-white/15 text-foreground hover:border-white/30 hover:bg-white/5", danger: "bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25", green: "bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25" };
  return <button className={cn("inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50", sm ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm", vs[variant], className)} {...p}>{icon}{children}</button>;
}
function Acc({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false), [cp, setCp] = useState(false);
  return <GC><button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/3 transition-all" onClick={() => setOpen(!open)}><span className="text-sm font-medium text-foreground">{q}</span><ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", open && "rotate-180")} /></button><AnimatePresence>{open && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-5 pb-5 border-t border-white/7"><p className="text-sm text-muted-foreground leading-relaxed mt-4 whitespace-pre-line">{a}</p><button onClick={() => { navigator.clipboard.writeText(a); setCp(true); setTimeout(() => setCp(false), 2000); }} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">{cp ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}{cp ? "Скопировано" : "Копировать"}</button></div></motion.div>}</AnimatePresence></GC>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="w-full max-w-lg bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}><div className="flex items-center justify-between px-6 py-4 border-b border-white/7"><h3 className="font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{title}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button></div><div className="px-6 py-5">{children}</div></motion.div></motion.div>;
}
function PhotoUpload({ value, onChange }: { value: string; onChange: (b: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return <div className="flex flex-col gap-1.5"><label className="text-xs text-muted-foreground font-medium">Фото сотрудника</label><div className="flex items-center gap-3"><div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">{value ? <img src={value} className="w-full h-full object-cover" alt="" /> : <Upload className="w-5 h-5 text-muted-foreground" />}</div><Btn variant="outline" sm icon={<Upload className="w-3.5 h-3.5" />} onClick={() => ref.current?.click()}>Выбрать файл</Btn>{value && <Btn variant="danger" sm onClick={() => onChange("")}><X className="w-3.5 h-3.5" /></Btn>}<input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(f); }} /></div></div>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [{ id: "home", label: "Главная", icon: Home }, { id: "about", label: "О компании", icon: Info }, { id: "training", label: "Обучение", icon: BookOpen }, { id: "knowledge", label: "База знаний", icon: Layers }, { id: "scripts", label: "Скрипты", icon: FileText }, { id: "team", label: "Наша команда", icon: Users }, { id: "departments", label: "Отделы", icon: Building2 }, { id: "news", label: "Новости", icon: Newspaper }, { id: "kpi", label: "KPI Калькулятор", icon: Calculator }, { id: "certificates", label: "Сертификаты", icon: Award }, { id: "locations", label: "Локации", icon: MapPin }, { id: "contacts", label: "Контакты", icon: Phone }, { id: "help", label: "Нужна помощь?", icon: HelpCircle }];

function Sidebar({ page, setPage, user, onLogout, open, setOpen, badge }: { page: Page; setPage: (p: Page) => void; user: Employee; onLogout: () => void; open: boolean; setOpen: (v: boolean) => void; badge: number }) {
  const cat = CAT_MAP[user.department];
  return <>
    <AnimatePresence>{open && <motion.div className="fixed inset-0 bg-black/60 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}</AnimatePresence>
    <aside className={cn("fixed top-0 left-0 h-full w-64 bg-card border-r border-white/7 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="px-5 py-4 border-b border-white/7 flex-shrink-0"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div><div><div className="text-sm font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>DaksDrive</div><div className="text-xs text-muted-foreground">Training Platform</div></div></div></div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setPage(id as Page); setOpen(false); }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all", page === id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}><Icon className="w-4 h-4 flex-shrink-0" /><span className="font-medium">{label}</span></button>)}
        {user.role === "admin" && <button onClick={() => { setPage("admin"); setOpen(false); }} className={cn("relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mt-2 border", page === "admin" ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/25" : "text-yellow-400/80 hover:text-yellow-400 hover:bg-yellow-400/8 border-yellow-400/15")}><Settings className="w-4 h-4" /><span className="font-medium">Администратор</span>{badge > 0 && <span className="absolute top-1.5 right-2 w-4 h-4 bg-destructive rounded-full text-white text-[10px] flex items-center justify-center font-bold">{badge}</span>}</button>}
      </nav>
      <div className="border-t border-white/7 px-4 py-4 flex-shrink-0"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">{user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: (cat?.color ?? "#00c2ff") + "22", color: cat?.color ?? "#00c2ff" }}>{user.firstName[0]}{user.lastName[0]}</div>}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium text-foreground truncate">{user.firstName} {user.lastName}</div><div className="text-xs truncate" style={{ color: cat?.color ?? "#6b7a99" }}>{user.position ?? cat?.label ?? user.department}</div></div><button onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1"><LogOut className="w-4 h-4" /></button></div></div>
    </aside>
  </>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthPage({ mode, employees, onAuth, switchMode, onRegister }: { mode: "login" | "register"; employees: Employee[]; onAuth: (u: Employee) => void; switchMode: () => void; onRegister: (u: Employee) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (form.email === "admin@daksdrive.uz" && form.password === "admin123") { onAuth({ id: "admin", firstName: "Мурoддилло", lastName: "Хамроев", email: form.email, phone: "", role: "admin", department: "all", progress: {}, position: "Администратор" }); return; }
    if (mode === "login") { const u = employees.find(x => x.email === form.email); if (u && form.password.length >= 4) { onAuth(u); return; } setErr("Неверный email или пароль"); }
    else { if (!form.firstName || !form.email || !form.password) { setErr("Заполните обязательные поля"); return; } if (employees.find(x => x.email === form.email)) { setErr("Email уже зарегистрирован"); return; } const u: Employee = { id: uid(), firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, role: "user", department: "daksdrive", progress: {}, joinDate: todayStr(), treeLevel: 3 }; onRegister(u); onAuth(u); }
    await register(form.email, form.password)
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4"><div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" /><div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" /></div>
    <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 mb-4"><Zap className="w-6 h-6 text-primary" /></div><h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{mode === "login" ? "Вход в систему" : "Регистрация"}</h1><p className="text-sm text-muted-foreground mt-1">DaksDrive & iMoped Training Platform</p></div>
      <GC className="p-6"><form onSubmit={submit} className="space-y-4">
        {mode === "register" && <><div className="grid grid-cols-2 gap-3"><Inp label="Имя *" placeholder="Алексей" value={form.firstName} onChange={f("firstName")} /><Inp label="Фамилия" placeholder="Петров" value={form.lastName} onChange={f("lastName")} /></div><Inp label="Телефон" type="tel" placeholder="+998 90 000-00-00" value={form.phone} onChange={f("phone")} /></>}
        <Inp label="Email *" type="email" placeholder="email@daksdrive.uz" value={form.email} onChange={f("email")} />
        <Inp label="Пароль *" type="password" placeholder="••••••••" value={form.password} onChange={f("password")} />
        {err && <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20"><AlertCircle className="w-4 h-4 flex-shrink-0" />{err}</div>}
        <Btn type="submit" className="w-full justify-center">{mode === "login" ? "Войти" : "Создать аккаунт"}</Btn>
      </form>
        <div className="mt-4 pt-4 border-t border-white/7 text-center text-sm text-muted-foreground">{mode === "login" ? "Нет аккаунта?" : "Есть аккаунт?"}{" "}<button onClick={switchMode} className="text-primary hover:underline font-medium">{mode === "login" ? "Зарегистрироваться" : "Войти"}</button></div>
        {mode === "login" && <div className="mt-3 p-3 rounded-lg bg-white/3 border border-white/7 text-xs text-muted-foreground font-mono space-y-0.5"><div className="text-foreground/50 mb-1">Демо:</div><div>Admin: admin@daksdrive.uz / admin123</div><div>User: a.petrov@daksdrive.uz / 1234</div></div>}
      </GC>
    </motion.div>
  </div>;
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomePage({ user, setPage }: { user: Employee; setPage: (p: Page) => void }) {
  const cats = CATS.map(c => ({ ...c, prog: user.progress[c.id] ?? 0 }));
  const total = Math.round(cats.reduce((a, c) => a + c.prog, 0) / CATS.length);
  const certs = cats.filter(c => c.prog >= 85).length;
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="relative rounded-2xl overflow-hidden border border-white/8" style={{ background: "linear-gradient(135deg,#0d1117 0%,#131926 100%)" }}>
      <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" /><div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl" /></div>
      <div className="relative px-6 py-8 md:px-10 md:py-10"><Badge color="#00c2ff">Training Platform v2.0</Badge><h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-2" style={{ fontFamily: "Outfit,sans-serif" }}>Добро пожаловать,<br /><span className="text-primary">{user.firstName}!</span></h1><p className="text-muted-foreground max-w-md text-sm leading-relaxed">Проходите модули, получайте сертификаты и развивайте профессиональные навыки.</p>
        <div className="flex flex-wrap gap-3 mt-6"><Btn onClick={() => setPage("training")} icon={<BookOpen className="w-4 h-4" />}>Начать обучение</Btn><Btn variant="outline" onClick={() => setPage("about")} icon={<Info className="w-4 h-4" />}>О компании</Btn></div></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ label: "Прогресс", value: `${total}%`, icon: TrendingUp, color: "#00c2ff" }, { label: "Сертификаты", value: certs, icon: Award, color: "#a855f7" }, { label: "Модулей", value: CATS.length, icon: BookOpen, color: "#10b981" }, { label: "Статус", value: certs >= 1 ? "Активен" : "В процессе", icon: Target, color: "#f59e0b" }].map(({ label, value, icon: Icon, color }) => <GC key={label} className="px-4 py-5"><div className="flex items-start justify-between"><div><div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{value}</div><div className="text-xs text-muted-foreground mt-0.5">{label}</div></div><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}><Icon className="w-4 h-4" style={{ color }} /></div></div></GC>)}</div>
    <div><h2 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: "Outfit,sans-serif" }}>Учебные модули</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{cats.map(({ id, label, icon: Icon, color, prog }) => <motion.div key={id} whileHover={{ scale: 1.01 }}><GC className="p-5 hover:border-white/15 transition-all" style={{ borderColor: prog > 0 ? color + "33" : undefined }}><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}><Icon className="w-5 h-5" style={{ color }} /></div><div><div className="font-semibold text-foreground text-sm">{label}</div><div className="text-xs text-muted-foreground">{prog >= 85 ? "Пройдено ✓" : prog > 0 ? "В процессе" : "Не начато"}</div></div>{prog >= 85 && <Award className="w-4 h-4 text-yellow-400 ml-auto" />}</div><Bar value={prog} color={color} /><div className="flex justify-between items-center mt-2"><span className="text-xs text-muted-foreground">{prog}%</span><button onClick={() => setPage("training")} className="text-xs font-semibold" style={{ color }}>{prog === 0 ? "Начать →" : "Продолжить →"}</button></div></GC></motion.div>)}</div></div>
  </motion.div>;
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutPage() {
  const ms = [{ year: "2022", t: "Основание DaksDrive", d: "Старт логистического сервиса в Ташкенте. Первые 10 автомобилей, 5 сотрудников." }, { year: "2023", t: "Запуск iMoped", d: "Выход на рынок микромобильности. 100 самокатов в первый месяц." }, { year: "2024", t: "Масштабирование", d: "Парк вырос до 200+ ТС. Открыт офис в Самарканде. 80+ сотрудников." }, { year: "2026", t: "Экспансия", d: "Выход в Бухару. iMoped Pro. Внедрение AI-аналитики." }];
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
    <div><Badge color="#00c2ff">О компании</Badge><h1 className="text-3xl font-bold text-foreground mt-3 mb-2" style={{ fontFamily: "Outfit,sans-serif" }}>DaksDrive & iMoped</h1><p className="text-muted-foreground leading-relaxed">Мы строим инфраструктуру городской мобильности в Узбекистане. DaksDrive — надёжная доставка последней мили, iMoped — экологичная микромобильность. Наша миссия: удобное, доступное и устойчивое перемещение по городу.</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ label: "Лет на рынке", value: "4+" }, { label: "Сотрудников", value: "127+" }, { label: "Городов", value: "3" }, { label: "Самокатов iMoped", value: "500+" }].map(s => <GC key={s.label} className="p-5 text-center"><div className="text-3xl font-bold text-primary mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></GC>)}</div>
    <div><h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "Outfit,sans-serif" }}>История</h2><div className="space-y-0">{ms.map((m, i) => <div key={m.year} className="flex gap-5"><div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{m.year}</div>{i < ms.length - 1 && <div className="w-px flex-1 bg-white/10 my-2" />}</div><div className="pb-8 pt-1 flex-1"><div className="font-bold text-foreground text-sm mb-1">{m.t}</div><div className="text-sm text-muted-foreground leading-relaxed">{m.d}</div></div></div>)}</div></div>
    <GC className="p-6" style={{ background: "linear-gradient(135deg,#0d1117,#131926)", borderColor: "#00c2ff22" }}><h3 className="font-bold text-foreground mb-3" style={{ fontFamily: "Outfit,sans-serif" }}>Наши ценности</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[{ e: "🚀", t: "Скорость", d: "Доставка — это время." }, { e: "🌱", t: "Экология", d: "iMoped — нулевые выбросы." }, { e: "🤝", t: "Команда", d: "Сильная команда — главный актив." }].map(v => <div key={v.t}><div className="text-2xl">{v.e}</div><div className="font-semibold text-foreground text-sm mt-1">{v.t}</div><div className="text-xs text-muted-foreground">{v.d}</div></div>)}</div></GC>
  </motion.div>;
}

// ─── Training ─────────────────────────────────────────────────────────────────
function TrainingPage({ user, setUser, kbItems, scriptItems, testQs }: { user: Employee; setUser: (u: Employee) => void; kbItems: KBItem[]; scriptItems: ScriptItem[]; testQs: TestQ[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"knowledge" | "scripts" | "video" | "test">("knowledge");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const cat = sel ? CAT_MAP[sel] : null;
  const catKB = kbItems.filter(k => k.category === sel);
  const catSc = scriptItems.filter(s => s.category === sel);
  const catTQ = testQs.filter(q => q.category === sel);
  const openTest = () => { setAnswers(new Array(catTQ.length).fill(null)); setSubmitted(false); setTab("test"); };
  const doSubmit = () => { if (!sel) return; const c = answers.reduce((acc, a, i) => acc + (a === catTQ[i].correct ? 1 : 0), 0); const pct = catTQ.length ? Math.round((c / catTQ.length) * 100) : 0; setUser({ ...user, progress: { ...user.progress, [sel]: pct } }); setSubmitted(true); };
  const score = submitted && catTQ.length ? Math.round((answers.reduce((acc, a, i) => acc + (a === catTQ[i].correct ? 1 : 0), 0) / catTQ.length) * 100) : 0;

  if (!sel || !cat) {
    return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Обучение</h1><p className="text-muted-foreground text-sm">Выберите категорию для начала</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{CATS.map(({ id, label, icon: Icon, color }) => { const prog = user.progress[id] ?? 0; return <motion.div key={id} whileHover={{ scale: 1.01 }}><GC className="p-6 cursor-pointer hover:border-white/15 transition-all" style={{ borderColor: prog >= 85 ? color + "44" : undefined }} onClick={() => setSel(id)}><div className="flex items-center justify-between mb-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + "22" }}><Icon className="w-6 h-6" style={{ color }} /></div>{prog >= 85 ? <Award className="w-5 h-5 text-yellow-400" /> : <Unlock className="w-5 h-5 text-muted-foreground/60" />}</div><h3 className="font-bold text-foreground text-lg mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>{label}</h3><p className="text-muted-foreground text-xs mb-4">{kbItems.filter(k => k.category === id).length} статей · {scriptItems.filter(s => s.category === id).length} скриптов · тест</p><Bar value={prog} color={color} /><div className="flex justify-between mt-2"><span className="text-xs text-muted-foreground">{prog}%</span><span className="text-xs font-semibold" style={{ color }}>{prog === 0 ? "Начать →" : prog >= 85 ? "Повторить →" : "Продолжить →"}</span></div></GC></motion.div>; })}
      </div></motion.div>;
  }

  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div className="flex items-center gap-3"><button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cat.color + "22" }}><cat.icon className="w-5 h-5" style={{ color: cat.color }} /></div><div><h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{cat.label}</h1><div className="text-xs text-muted-foreground">{user.progress[sel] ?? 0}% завершено</div></div></div>
    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/7 w-fit">{[{ id: "knowledge", label: "База знаний", icon: Layers }, { id: "scripts", label: "Скрипты", icon: FileText }, { id: "video", label: "Видео", icon: Play }, { id: "test", label: "Тест", icon: CheckSquare }].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => id === "test" ? openTest() : setTab(id as any)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all", tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>
    <AnimatePresence mode="wait">
      {tab === "knowledge" && <motion.div key="kb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">{catKB.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Материалы скоро появятся</GC> : catKB.map(i => <Acc key={i.id} q={i.question} a={i.answer} />)}</motion.div>}
      {tab === "scripts" && <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">{catSc.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Скрипты скоро появятся</GC> : catSc.map(s => <GC key={s.id} className="p-5"><div className="flex items-center gap-2 mb-3"><Badge color={cat.color}>{cat.label}</Badge><h3 className="font-semibold text-foreground text-sm">{s.title}</h3></div><pre className="text-muted-foreground text-xs whitespace-pre-wrap font-mono leading-relaxed bg-white/3 p-4 rounded-lg border border-white/7">{s.content}</pre></GC>)}</motion.div>}
      {tab === "video" && <motion.div key="vid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">{["Введение", "Ключевые процессы", "Практика"].map((t, i) => <GC key={i}><div className="relative h-40 bg-gradient-to-br from-white/5 to-white/2 flex items-center justify-center border-b border-white/7"><div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 transition-all cursor-pointer"><Play className="w-5 h-5 text-primary ml-0.5" /></div></div><div className="p-4"><div className="text-sm font-medium text-foreground">{t}</div><div className="text-xs text-muted-foreground mt-0.5">{cat.label} · Урок {i + 1} · {(i + 1) * 8} мин</div></div></GC>)}</motion.div>}
      {tab === "test" && <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {submitted ? <GC className="p-10 text-center"><div className={cn("text-6xl font-bold mb-3", score >= 85 ? "text-primary" : "text-destructive")} style={{ fontFamily: "Outfit,sans-serif" }}>{score}%</div><div className={cn("text-lg font-semibold mb-2", score >= 85 ? "text-primary" : "text-destructive")}>{score >= 85 ? "🎓 Тест пройден!" : "Тест не пройден"}</div><p className="text-muted-foreground text-sm mb-6">{score >= 85 ? "Сертификат доступен в разделе «Сертификаты»." : `Результат: ${score}%. Нужно ≥85%.`}</p><div className="flex gap-3 justify-center"><Btn onClick={() => { setAnswers(new Array(catTQ.length).fill(null)); setSubmitted(false); }}>Пройти снова</Btn><Btn variant="outline" onClick={() => setTab("knowledge")}>К материалам</Btn></div></GC>
          : catTQ.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Тест для этого раздела ещё не создан администратором</GC>
            : <div className="space-y-4">{catTQ.map((q, qi) => <GC key={q.id} className="p-5"><div className="text-xs font-mono text-muted-foreground mb-2">Вопрос {qi + 1} / {catTQ.length}</div><p className="text-sm font-medium text-foreground mb-4">{q.question}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt, oi) => <button key={oi} onClick={() => setAnswers(a => a.map((v, i) => i === qi ? oi : v))} className={cn("text-left px-4 py-2.5 rounded-lg border text-sm transition-all", answers[qi] === oi ? "border-primary/50 bg-primary/10 text-primary" : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/20 hover:text-foreground")}>{opt}</button>)}</div></GC>)}<Btn onClick={doSubmit} disabled={answers.some(a => a === null)} className="w-full justify-center">Завершить тест</Btn></div>}
      </motion.div>}
    </AnimatePresence>
  </motion.div>;
}

// ─── Knowledge ────────────────────────────────────────────────────────────────
function KnowledgePage({ items }: { items: KBItem[] }) {
  const [search, setSearch] = useState(""), [cat, setCat] = useState("all");
  const filtered = items.filter(k => (cat === "all" || k.category === cat) && (k.question.toLowerCase().includes(search.toLowerCase()) || k.answer.toLowerCase().includes(search.toLowerCase())));
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>База знаний</h1><p className="text-muted-foreground text-sm">Ответы по всем отделам</p></div>
    <div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/8 bg-white/5 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="flex gap-2 flex-wrap"><button onClick={() => setCat("all")} className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all", cat === "all" ? "bg-primary/15 text-primary border-primary/30" : "border-white/8 text-muted-foreground hover:border-white/20")}>Все</button>{CATS.map(c => <button key={c.id} onClick={() => setCat(c.id)} className="px-3 py-1.5 rounded-lg text-sm border transition-all" style={cat === c.id ? { background: c.color + "22", borderColor: c.color + "55", color: c.color } : { borderColor: "rgba(255,255,255,0.08)", color: "#6b7a99" }}>{c.label}</button>)}</div></div>
    <div className="space-y-3">{filtered.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Ничего не найдено</GC> : filtered.map(item => { const c = CAT_MAP[item.category]; return <div key={item.id}>{c && <div className="mb-1 px-1"><Badge color={c.color}>{c.label}</Badge></div>}<Acc q={item.question} a={item.answer} /></div>; })}</div>
  </motion.div>;
}

// ─── Scripts ──────────────────────────────────────────────────────────────────
function ScriptsPage({ items }: { items: ScriptItem[] }) {
  const [cat, setCat] = useState("all");
  const filtered = items.filter(s => cat === "all" || s.category === cat);
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Скрипты</h1><p className="text-muted-foreground text-sm">Речевые шаблоны по отделам</p></div>
    <div className="flex gap-2 flex-wrap"><button onClick={() => setCat("all")} className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all", cat === "all" ? "bg-primary/15 text-primary border-primary/30" : "border-white/8 text-muted-foreground hover:border-white/20")}>Все</button>{CATS.map(c => <button key={c.id} onClick={() => setCat(c.id)} className="px-3 py-1.5 rounded-lg text-sm border transition-all" style={cat === c.id ? { background: c.color + "22", borderColor: c.color + "55", color: c.color } : { borderColor: "rgba(255,255,255,0.08)", color: "#6b7a99" }}>{c.label}</button>)}</div>
    <div className="space-y-4">{filtered.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Скрипты не найдены</GC> : filtered.map(s => { const c = CAT_MAP[s.category]!; return <GC key={s.id} className="p-5"><div className="flex items-center gap-2 mb-3"><Badge color={c.color}>{c.label}</Badge><h3 className="font-semibold text-foreground text-sm">{s.title}</h3></div><pre className="text-muted-foreground text-xs whitespace-pre-wrap font-mono leading-relaxed bg-white/3 p-4 rounded-lg border border-white/7">{s.content}</pre></GC>; })}</div>
  </motion.div>;
}

// ─── Team (Org Tree) ──────────────────────────────────────────────────────────
function TeamPage({ employees }: { employees: Employee[] }) {
  const [detail, setDetail] = useState<Employee | null>(null);
  const visible = employees.filter(e => e.role !== "admin");
  const byLevel = [0, 1, 2, 3].map(lv => visible.filter(e => (e.treeLevel ?? 3) === lv));
  const lvLabels = ["Основатель", "Руководство", "Менеджеры", "Сотрудники"];
  const EmpNode = ({ emp }: { emp: Employee }) => { const cat = CAT_MAP[emp.department]; return <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer" onClick={() => setDetail(emp)}><div className="flex flex-col items-center gap-2 w-28"><div className="w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0" style={{ borderColor: cat?.color ?? "#00c2ff" }}>{emp.photoUrl ? <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ background: (cat?.color ?? "#00c2ff") + "22", color: cat?.color ?? "#00c2ff" }}>{emp.firstName[0]}{emp.lastName[0]}</div>}</div><div className="text-center"><div className="text-xs font-semibold text-foreground leading-tight">{emp.firstName}</div><div className="text-xs font-semibold text-foreground leading-tight">{emp.lastName}</div><div className="text-[10px] mt-0.5" style={{ color: cat?.color ?? "#6b7a99" }}>{emp.position ?? cat?.label}</div></div></div></motion.div>; };
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Наша команда</h1><p className="text-muted-foreground text-sm">Организационная структура · нажмите на карточку для деталей</p></div>
    <div className="overflow-x-auto pb-4"><div className="min-w-[600px] flex flex-col items-center gap-0">
      {byLevel.map((group, li) => group.length === 0 ? null : <div key={li} className="w-full flex flex-col items-center">
        {li > 0 && <div className="w-px h-8 bg-white/15" />}
        <div className="mb-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground font-mono">{lvLabels[li]}</div>
        <div className="relative flex items-start justify-center gap-8">{group.length > 1 && <div className="absolute top-8 left-14 right-14 h-px bg-white/15" />}{group.map(emp => <EmpNode key={emp.id} emp={emp} />)}</div>
      </div>)}
    </div></div>
    <AnimatePresence>{detail && <Modal title={`${detail.firstName} ${detail.lastName}`} onClose={() => setDetail(null)}>
      <div className="space-y-4">
        <div className="flex items-center gap-4"><div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/15 flex-shrink-0">{detail.photoUrl ? <img src={detail.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ background: (CAT_MAP[detail.department]?.color ?? "#00c2ff") + "22", color: CAT_MAP[detail.department]?.color ?? "#00c2ff" }}>{detail.firstName[0]}{detail.lastName[0]}</div>}</div><div><div className="font-bold text-foreground text-lg" style={{ fontFamily: "Outfit,sans-serif" }}>{detail.firstName} {detail.lastName}</div><div className="text-sm text-primary">{detail.position}</div>{detail.quote && <div className="text-xs text-muted-foreground italic mt-1">«{detail.quote}»</div>}</div></div>
        <div className="grid grid-cols-2 gap-2 text-sm">{[{ icon: Building2, label: "Отдел", val: CAT_MAP[detail.department]?.label ?? detail.department }, { icon: Phone, label: "Телефон", val: detail.phone || "—" }, { icon: Mail, label: "Email", val: detail.email }, { icon: Clock, label: "В компании с", val: detail.joinDate ?? "—" }, { icon: Gift, label: "День рождения", val: detail.birthday ?? "—" }].map(({ icon: Icon, label, val }) => <div key={label} className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/7"><Icon className="w-4 h-4 text-primary/60 flex-shrink-0 mt-0.5" /><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm text-foreground font-medium break-all">{val}</div></div></div>)}</div>
        {(detail.telegram || detail.instagram) && <div className="flex gap-2 flex-wrap">{detail.telegram && <a href={`https://t.me/${detail.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs hover:bg-blue-500/25 transition-all"><Send className="w-3.5 h-3.5" />{detail.telegram}</a>}{detail.instagram && <a href="#" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-500/25 text-pink-400 text-xs hover:bg-pink-500/25 transition-all"><Instagram className="w-3.5 h-3.5" />{detail.instagram}</a>}</div>}
      </div>
    </Modal>}</AnimatePresence>
  </motion.div>;
}

// ─── Departments ──────────────────────────────────────────────────────────────
const DEPT_DATA = [{ id: "daksdrive", name: "DaksDrive", icon: Car, color: "#00c2ff", description: "Отдел логистики и доставки. Управляет парком ТС, маршрутами и взаимодействием с клиентами.", headcount: 45, kpis: ["Время доставки <40 мин", "NPS ≥ 4.7", "Утилизация парка ≥ 85%"], detail: "DaksDrive отвечает за операционную логистику: планирование маршрутов, контроль водителей, взаимодействие с клиентами. Используем GPS-трекинг в реальном времени и AI-диспетчеризацию для оптимальной загрузки парка." }, { id: "imoped", name: "iMoped", icon: Zap, color: "#a855f7", description: "Сервис аренды электросамокатов. Fleet management, зарядка, клиентский сервис.", headcount: 30, kpis: ["Uptime самокатов ≥ 92%", "Время разрядки <8 ч", "Рейтинг приложения ≥ 4.6"], detail: "iMoped обслуживает парк из 500+ электросамокатов в трёх городах. Команда следит за зарядкой, техническим состоянием, геолокацией и клиентскими обращениями 24/7." }, { id: "support", name: "Тех-поддержка", icon: Cpu, color: "#10b981", description: "Центр технической поддержки пользователей и внутренних систем 24/7.", headcount: 18, kpis: ["FCR ≥ 75%", "Время ответа <2 мин", "CSAT ≥ 90%"], detail: "Поддержка обрабатывает обращения по всем продуктам. Работаем по двухуровневой схеме: L1 — базовая поддержка, L2 — технические специалисты. SLA: 2 часа для эскалации." }, { id: "security", name: "СБ", icon: Shield, color: "#f59e0b", description: "Физическая и информационная безопасность объектов.", headcount: 12, kpis: ["0 инцидентов/мес", "100% охват патрулирования", "Аудит каждые 90 дней"], detail: "Служба безопасности контролирует доступ на объекты, ведёт видеонаблюдение, проводит аудиты и расследует инциденты. Тесное взаимодействие с IT-безопасностью." }, { id: "mechanic", name: "Механики", icon: Wrench, color: "#ef4444", description: "Техническое обслуживание и ремонт всего парка транспортных средств.", headcount: 22, kpis: ["ТО в срок ≥ 98%", "Простой ≤ 4 ч", "Возврат с ремонта <5%"], detail: "Механический отдел обеспечивает техническую готовность парка: плановое ТО, аварийный ремонт, диагностику. Специализируемся на ДВС-автомобилях и электротранспорте." }];

function DepartmentsPage() {
  const [sel, setSel] = useState<string | null>(null);
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Отделы</h1><p className="text-muted-foreground text-sm">Нажмите на отдел для подробной информации</p></div>
    <div className="space-y-3">{DEPT_DATA.map(d => <GC key={d.id} className="p-5 cursor-pointer hover:border-white/20 transition-all" onClick={() => setSel(sel === d.id ? null : d.id)}>
      <div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: d.color + "22" }}><d.icon className="w-5 h-5" style={{ color: d.color }} /></div>
        <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{d.name}</h3><Badge color={d.color}>{d.headcount} чел.</Badge></div><ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", sel === d.id && "rotate-180")} /></div>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{d.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">{d.kpis.map(k => <span key={k} className="text-xs px-2 py-1 rounded-md border border-white/8 bg-white/3 text-muted-foreground font-mono">{k}</span>)}</div></div></div>
      <AnimatePresence>{sel === d.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-4 pt-4 border-t border-white/7 text-sm text-muted-foreground leading-relaxed">{d.detail}</div></motion.div>}</AnimatePresence>
    </GC>)}</div>
  </motion.div>;
}

// ─── News ──────────────────────────────────────────────────────────────────────
function NewsPage({ employees }: { news: NewsItem[]; employees: Employee[] }) {

  const [tab, setTab] = useState<"news" | "birthday">("news");
  const [news, setNews] = useState([]);

  const bdays = employees.filter(e => e.birthday && e.role !== "admin").map(e => { const [, mm, dd] = (e.birthday ?? "").split("-"); return { ...e, mmdd: `${mm}.${dd}`, sk: parseInt(mm) * 100 + parseInt(dd) }; }).sort((a, b) => a.sk - b.sk);

  useEffect(() => {
    const fetchNews = async () => {
      const newsData = await getNews();

      if (Array.isArray(newsData)) {
        setNews(newsData);
      } else {
        console.error("news не массив:", newsData);
        setNews([]);
      }
    };

    fetchNews();
  }, []);

  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Новости</h1><p className="text-muted-foreground text-sm">События компании</p></div>
    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/7 w-fit">{[{ id: "news", label: "Новости", icon: Newspaper }, { id: "birthday", label: "Дни рождения", icon: Gift }].map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id as any)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>
    {tab === "news" && <div className="space-y-3">{news.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Новостей пока нет</GC> : Array.isArray(news) && news.map(item => <GC key={item.id} className="p-5"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"><Newspaper className="w-4 h-4 text-primary" /></div><div><div className="flex items-center gap-2 flex-wrap mb-1"><span className="text-xs text-muted-foreground font-mono">{item.id}</span><span className="text-xs text-primary">{item.authorName}</span><span className="text-xs text-muted-foreground">({item.id})</span></div><h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3><p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p></div></div></GC>)}</div>}
    {tab === "birthday" && <div className="space-y-3">{bdays.length === 0 ? <GC className="p-10 text-center text-muted-foreground text-sm">Дни рождения не указаны</GC> : bdays.map(e => { const cat = CAT_MAP[e.department]; return <GC key={e.id} className="p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-2xl flex-shrink-0">🎂</div><div className="flex-1"><div className="font-semibold text-foreground text-sm">{e.firstName} {e.lastName}</div><div className="text-xs text-muted-foreground">{cat?.label ?? e.department}{e.position ? ` · ${e.position}` : ""}</div><div className="text-xs text-yellow-400 mt-0.5">{e.mmdd}</div></div></div></GC>; })}</div>}
  </motion.div>;
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
function KpiPage() {
  const [v, setV] = useState({ base: "500000", planQty: "100", pricePerUnit: "5000", bonus: "50000", penalty: "0" });
  const base = +v.base || 0, qty = +v.planQty || 0, price = +v.pricePerUnit || 0, bonus = +v.bonus || 0, penalty = +v.penalty || 0;
  const planIncome = qty * price, total = Math.round(base + planIncome + bonus - penalty);
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>KPI Калькулятор</h1><p className="text-muted-foreground text-sm">Расчёт зарплаты по показателям</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <GC className="p-6 space-y-4"><h3 className="font-semibold text-foreground text-sm border-b border-white/7 pb-2">Параметры</h3>
        {(["base", "planQty", "pricePerUnit", "bonus", "penalty"] as const).map(k => { const labels = { base: "Фикса (базовая ставка)", planQty: "Количество плана", pricePerUnit: "Цена за 1 план (сум)", bonus: "Бонус (сум)", penalty: "Штраф (сум)" }; return <div key={k}><label className="text-xs text-muted-foreground mb-1.5 block">{labels[k]}</label><input type="number" className="w-full px-3 py-2.5 rounded-lg border border-white/8 bg-white/5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" value={v[k]} onChange={e => setV(p => ({ ...p, [k]: e.target.value }))} /></div>; })}
      </GC>
      <div className="space-y-4">
        <GC className="p-6 text-center" style={{ background: "linear-gradient(135deg,#0d1117,#131926)", borderColor: "#00c2ff33" }}><div className="text-xs text-muted-foreground mb-1">Итоговая зарплата</div><div className="text-4xl font-bold text-primary" style={{ fontFamily: "Outfit,sans-serif" }}>{total.toLocaleString("ru-RU")}</div><div className="text-sm text-muted-foreground mt-1">сум / месяц</div></GC>
        <GC className="p-5 space-y-3"><h3 className="text-sm font-semibold text-foreground border-b border-white/7 pb-2">Детализация</h3>{[{ label: "Фиксированная ставка", val: base, plus: true }, { label: `Доход от плана (${qty} × ${price.toLocaleString("ru-RU")})`, val: planIncome, plus: true }, { label: "Бонус", val: bonus, plus: true }, { label: "Штрафы", val: penalty, plus: false }].map(({ label, val, plus }) => <div key={label} className="flex justify-between items-start gap-2 text-xs"><span className="text-muted-foreground">{label}</span><span className={cn("font-mono font-medium flex-shrink-0", !plus && val > 0 ? "text-destructive" : "text-foreground")}>{plus ? "+" : "−"}{val.toLocaleString("ru-RU")}</span></div>)}<div className="pt-2 border-t border-white/7 flex justify-between text-sm font-bold"><span>Итого</span><span className="text-primary font-mono">{total.toLocaleString("ru-RU")} сум</span></div></GC>
      </div>
    </div>
  </motion.div>;
}

// ─── Certificates ─────────────────────────────────────────────────────────────
function CertificatesPage({ user }: { user: Employee }) {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Сертификаты</h1><p className="text-muted-foreground text-sm">Результаты учебных модулей</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{CATS.map(({ id, label, icon: Icon, color }) => { const sc = user.progress[id] ?? 0, passed = sc >= 85; return <GC key={id} className="overflow-hidden" style={{ borderColor: passed ? color + "44" : undefined }}><div className="p-5" style={{ background: passed ? `linear-gradient(135deg,${color}10 0%,transparent 100%)` : undefined }}><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}><Icon className="w-5 h-5" style={{ color }} /></div><div><div className="font-bold text-foreground text-sm">{label}</div><div className="text-xs text-muted-foreground">Учебный модуль</div></div></div><div className="text-2xl">{passed ? "🏆" : sc > 0 ? "❌" : "⏳"}</div></div>{passed ? <div className="border border-white/10 rounded-xl p-4 space-y-2" style={{ background: "rgba(0,0,0,0.2)" }}><div className="text-xs text-muted-foreground font-mono">СЕРТИФИКАТ О ПРОХОЖДЕНИИ</div><div className="font-bold text-foreground">{user.firstName} {user.lastName}</div><div className="text-xs text-muted-foreground">Отдел: {label}</div><div className="flex items-center justify-between mt-3"><Badge color={color}>{sc}% — Принят</Badge><div className="text-xs text-muted-foreground">2026</div></div></div> : <div className="border border-destructive/20 rounded-xl p-4 bg-destructive/5 text-center"><div className="text-destructive font-semibold text-sm mb-1">{sc > 0 ? "Не прошёл обучение" : "Тест не пройден"}</div><div className="text-xs text-muted-foreground">{sc > 0 ? `Результат: ${sc}%. Требуется ≥85%` : "Пройдите тест в разделе «Обучение»"}</div></div>}</div></GC>; })}</div>
  </motion.div>;
}

// ─── Locations ────────────────────────────────────────────────────────────────
function LocationsPage() {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Локации</h1><p className="text-muted-foreground text-sm">Наши офисы в Узбекистане</p></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{OFFICES.map((o, i) => <div key={o.city} className="relative group">{o.isHQ && <div className="absolute -top-2 -right-2 z-10"><Badge color="#f59e0b">HQ</Badge></div>}<GC className="overflow-hidden hover:border-primary/30 transition-all duration-300" style={{ borderColor: o.isHQ ? "#00c2ff22" : undefined }}><div className="h-2 w-full" style={{ background: o.isHQ ? "linear-gradient(90deg,#00c2ff,#a855f7)" : "linear-gradient(90deg,#ffffff11,#ffffff05)" }} /><div className="p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-primary" /></div><div><div className="font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{o.city}</div><div className="text-xs text-primary">{o.sub}</div></div></div><div className="space-y-3">{[{ icon: MapPin, val: o.address, color: "#6b7a99" }, { icon: Phone, val: o.phone, color: "#00c2ff", href: `tel:${o.phone}` }, { icon: Mail, val: o.email, color: "#a855f7", href: `mailto:${o.email}` }, { icon: Clock, val: o.hours, color: "#10b981" }].map(({ icon: Icon, val, color, href }: any) => href ? <a key={val} href={href} className="flex items-start gap-2.5 text-xs group/l"><Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} /><span className="text-muted-foreground group-hover/l:text-foreground transition-colors">{val}</span></a> : <div key={val} className="flex items-start gap-2.5 text-xs"><Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} /><span className="text-muted-foreground">{val}</span></div>)}</div><div className="mt-5 h-28 rounded-xl bg-white/3 border border-white/7 flex items-center justify-center relative overflow-hidden"><div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%,rgba(0,194,255,0.05) 0%,transparent 70%)" }} /><MapPin className="w-5 h-5 opacity-20" /><span className="ml-2 text-xs opacity-40 font-mono">Карта · {o.city}</span></div></div></GC></div>)}</div>
  </motion.div>;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
function ContactsPage() {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-xl">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Контакты</h1><p className="text-muted-foreground text-sm">Свяжитесь с нами</p></div>
    <GC className="p-6 space-y-4"><h3 className="font-semibold text-foreground text-sm">Главный офис — Ташкент</h3>{[{ icon: Phone, label: "+998 71 200-10-00", href: "tel:+998712001000" }, { icon: Mail, label: "tashkent@daksdrive.uz", href: "mailto:tashkent@daksdrive.uz" }, { icon: MapPin, label: "ул. Амира Темура, 107Б, офис 412", href: "#" }].map(({ icon: Icon, label, href }) => <a key={label} href={href} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"><div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-all"><Icon className="w-4 h-4 text-primary" /></div>{label}</a>)}</GC>
    <div><h3 className="font-semibold text-foreground text-sm mb-3">Социальные сети</h3><div className="grid grid-cols-2 gap-3">{[{ label: "Telegram", color: "#2196F3" }, { label: "Instagram", color: "#E1306C" }, { label: "Facebook", color: "#1877F2" }, { label: "YouTube", color: "#FF0000" }].map(({ label, color }) => <a key={label} href="#" className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5 transition-all"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}><Globe className="w-4 h-4" style={{ color }} /></div><span className="text-sm font-medium text-foreground">{label}</span><ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" /></a>)}</div></div>
  </motion.div>;
}

// ─── Help ──────────────────────────────────────────────────────────────────────
function HelpPage({ user, onSubmit }: { user: Employee; onSubmit: (r: HelpReq) => void }) {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", description: "" });
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.description.trim()) return; onSubmit({ id: uid(), ...form, submittedBy: user.id, date: todayStr(), status: "new" }); setSent(true); setForm(f => ({ ...f, description: "" })); setTimeout(() => setSent(false), 5000); };
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-lg">
    <div><h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Нужна помощь?</h1><p className="text-muted-foreground text-sm">Ответим в течение 2 часов</p></div>
    <AnimatePresence>{sent && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm"><CheckCircle className="w-5 h-5 flex-shrink-0" />Заявка отправлена!</motion.div>}</AnimatePresence>
    <GC className="p-6"><form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Inp label="Имя" value={form.firstName} onChange={(e: any) => setForm({ ...form, firstName: e.target.value })} required /><Inp label="Фамилия" value={form.lastName} onChange={(e: any) => setForm({ ...form, lastName: e.target.value })} /></div><Inp label="Телефон" type="tel" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 000-00-00" /><Inp label="Описание проблемы *" textarea rows={5} value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Подробно опишите ситуацию..." required /><Btn type="submit" className="w-full justify-center" icon={<Send className="w-4 h-4" />}>Отправить заявку</Btn></form></GC>
  </motion.div>;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
function AdminPage({ employees, setEmployees, helpReqs, setHelpReqs, kbItems, setKbItems, scriptItems, setScriptItems, testQs, setTestQs, currentUser }: any) {
  const [sec, setSec] = useState<"overview" | "employees" | "kb" | "scripts" | "tests" | "progress" | "help" | "news" | "ai">("overview");
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState<Partial<Employee>>({});
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [showKbForm, setShowKbForm] = useState(false);
  const [editKb, setEditKb] = useState<KBItem | null>(null);
  const [kbForm, setKbForm] = useState<Partial<KBItem>>({ category: "daksdrive" });
  const [showScForm, setShowScForm] = useState(false);
  const [editSc, setEditSc] = useState<ScriptItem | null>(null);
  const [scForm, setScForm] = useState<Partial<ScriptItem>>({ category: "daksdrive" });
  const [showTestForm, setShowTestForm] = useState(false);
  const [editTest, setEditTest] = useState<TestQ | null>(null);
  const [testForm, setTestForm] = useState<any>({ category: "daksdrive", opts: ["", "", "", ""], correct: 0 });
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", content: "" });
  const [news, setNews] = useState([]);

  const staff = employees.filter((e: Employee) => e.role !== "admin");
  const newHelp = helpReqs.filter((r: HelpReq) => r.status === "new").length;

  const openAddEmp = () => { setEmpForm({ department: "daksdrive", treeLevel: 3 }); setEditEmp(null); setShowEmpForm(true); };
  const openEditEmp = (e: Employee) => { setEmpForm({ ...e }); setEditEmp(e); setShowEmpForm(true); };
  const saveEmp = () => {
    if (!empForm.firstName || !empForm.email) return;
    if (editEmp) { setEmployees((p: Employee[]) => p.map(e => e.id === editEmp.id ? { ...e, ...empForm } : e)); }
    else { if (employees.find((e: Employee) => e.email === empForm.email)) { alert("Email уже существует"); return; } setEmployees((p: Employee[]) => [...p, { id: uid(), role: "user", progress: {}, joinDate: todayStr(), ...empForm }]); }
    setShowEmpForm(false); setEditEmp(null); setEmpForm({});
  };
  const saveKb = () => { if (!kbForm.question || !kbForm.answer || !kbForm.category) return; if (editKb) { setKbItems((p: KBItem[]) => p.map(k => k.id === editKb.id ? { ...k, ...kbForm } : k)); } else { setKbItems((p: KBItem[]) => [...p, { id: uid(), ...kbForm }]); } setShowKbForm(false); setEditKb(null); setKbForm({ category: "daksdrive" }); };
  const saveSc = () => { if (!scForm.title || !scForm.content || !scForm.category) return; if (editSc) { setScriptItems((p: ScriptItem[]) => p.map(s => s.id === editSc.id ? { ...s, ...scForm } : s)); } else { setScriptItems((p: ScriptItem[]) => [...p, { id: uid(), ...scForm }]); } setShowScForm(false); setEditSc(null); setScForm({ category: "daksdrive" }); };
  const saveTest = () => { if (!testForm.question || !testForm.category) return; const validOpts = (testForm.opts ?? []).filter((o: string) => o.trim()); if (validOpts.length < 2) return; const q = { id: uid(), category: testForm.category, question: testForm.question, options: testForm.opts ?? [], correct: testForm.correct ?? 0 }; if (editTest) { setTestQs((p: TestQ[]) => p.map(t => t.id === editTest.id ? { ...q, id: editTest.id } : t)); } else { setTestQs((p: TestQ[]) => [...p, q]); } setShowTestForm(false); setEditTest(null); setTestForm({ category: "daksdrive", opts: ["", "", "", ""], correct: 0 }); };

  const secs = [{ id: "overview", label: "Обзор", icon: BarChart2 }, { id: "employees", label: "Сотрудники", icon: Users }, { id: "kb", label: "База знаний", icon: Layers }, { id: "scripts", label: "Скрипты", icon: FileText }, { id: "tests", label: "Тесты", icon: CheckSquare }, { id: "progress", label: "Прогресс", icon: TrendingUp }, { id: "help", label: `Помощь${newHelp > 0 ? ` (${newHelp})` : ""}`, icon: HelpCircle }, { id: "news", label: "Новости", icon: Newspaper }, { id: "ai", label: "AI Анализ", icon: Brain }];
  const stC: any = { new: "#ef4444", "in-progress": "#f59e0b", resolved: "#10b981" };
  const stL: any = { new: "Новая", "in-progress": "В работе", resolved: "Решена" };

  const handleDelete = async (id: string) => {
    await deleteNews(id); // удалили из базы

    // обновили UI
    setNews((prev) => prev.filter((n) => n.id !== id));
  };


  const addNewsHandler = async () => {
    if (!newsForm.title || !newsForm.content) return;
    await addNews(
      newsForm.title,
      newsForm.content,
      30,
    ).then((res) => {
      if (res) {
        console.log("Новость успешно добавлена");
      } else {
        alert("Ошибка при добавлении новости");
      }
    }).finally(() => setShowNewsForm(false));
  }


  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div className="flex items-center gap-2"><Badge color="#f59e0b">ADMIN</Badge><h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>Панель управления</h1></div>
    <div className="flex gap-1 flex-wrap bg-white/5 p-1 rounded-xl border border-white/7">{secs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setSec(id as any)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", sec === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>

    <AnimatePresence mode="wait">
      {sec === "overview" && <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ label: "Сотрудников", value: staff.length, color: "#00c2ff", icon: Users }, { label: "Новых заявок", value: newHelp, color: "#ef4444", icon: HelpCircle }, { label: "Публикаций", value: news.length, color: "#10b981", icon: Newspaper }, { label: "Ср. прогресс", value: `${Math.round(staff.reduce((acc: number, e: Employee) => { const vals = Object.values(e.progress) as number[]; return acc + (vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0); }, 0) / (staff.length || 1))}%`, color: "#a855f7", icon: TrendingUp }].map(({ label, value, color, icon: Icon }: any) => <GC key={label} className="px-4 py-5"><div className="flex items-start justify-between"><div><div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{value}</div><div className="text-xs text-muted-foreground mt-0.5">{label}</div></div><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}><Icon className="w-4 h-4" style={{ color }} /></div></div></GC>)}</div>
        <GC className="p-5"><h3 className="font-semibold text-foreground text-sm mb-5">Прогресс по отделам</h3><div className="space-y-4">{CATS.map(c => { const catE = staff.filter((e: Employee) => e.department === c.id); const passed = catE.filter((e: Employee) => (e.progress[c.id] ?? 0) >= 85).length; const avg = catE.length ? Math.round(catE.reduce((a: number, e: Employee) => a + (e.progress[c.id] ?? 0), 0) / catE.length) : 0; return <div key={c.id}><div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-2"><c.icon className="w-4 h-4" style={{ color: c.color }} /><span className="text-sm font-medium text-foreground">{c.label}</span><Badge color={c.color}>{catE.length} чел.</Badge></div><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="font-mono">{avg}% ср.</span><span className="text-yellow-400">🏆{passed}</span></div></div><Bar value={avg} color={c.color} /></div>; })}</div></GC>
      </motion.div>}

      {sec === "employees" && <motion.div key="emp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{staff.length} сотрудников</div><Btn onClick={openAddEmp} icon={<UserPlus className="w-4 h-4" />}>Добавить</Btn></div>
        <div className="space-y-2">{staff.map((emp: Employee) => { const cat = CAT_MAP[emp.department]; return <GC key={emp.id} className="px-5 py-4 hover:border-white/15 transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">{emp.photoUrl ? <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: (cat?.color ?? "#00c2ff") + "22", color: cat?.color ?? "#00c2ff" }}>{emp.firstName[0]}{emp.lastName[0]}</div>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold text-foreground">{emp.firstName} {emp.lastName}</span>{cat && <Badge color={cat.color}>{cat.label}</Badge>}{emp.position && <span className="text-xs text-muted-foreground">{emp.position}</span>}</div><div className="text-xs text-muted-foreground">{emp.email}{emp.birthday && ` · 🎂 ${emp.birthday}`}</div></div><div className="flex gap-1 flex-shrink-0"><Btn variant="ghost" sm icon={<Info className="w-3.5 h-3.5" />} onClick={() => setViewEmp(emp)} /><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEditEmp(emp)} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => setEmployees((p: Employee[]) => p.filter(e => e.id !== emp.id))} /></div></div></GC>; })}</div>
      </motion.div>}

      {sec === "kb" && <motion.div key="kb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{kbItems.length} статей</div><Btn onClick={() => { setKbForm({ category: "daksdrive" }); setEditKb(null); setShowKbForm(true); }} icon={<Plus className="w-4 h-4" />}>Добавить статью</Btn></div>
        {CATS.map(cat => { const items = kbItems.filter((k: KBItem) => k.category === cat.id); return items.length === 0 ? null : <GC key={cat.id} className="p-5"><div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cat.color + "22" }}><cat.icon className="w-4 h-4" style={{ color: cat.color }} /></div><span className="font-semibold text-foreground text-sm">{cat.label}</span><Badge color={cat.color}>{items.length}</Badge></div><div className="space-y-2">{items.map((item: KBItem) => <div key={item.id} className="flex items-start justify-between gap-3 py-2 border-t border-white/5"><div className="flex-1 min-w-0"><div className="text-xs text-foreground font-medium">{item.question}</div><div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.answer}</div></div><div className="flex gap-1 flex-shrink-0"><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setKbForm({ ...item }); setEditKb(item); setShowKbForm(true); }} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => setKbItems((p: KBItem[]) => p.filter(k => k.id !== item.id))} /></div></div>)}</div></GC>; })}
      </motion.div>}

      {sec === "scripts" && <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{scriptItems.length} скриптов</div><Btn onClick={() => { setScForm({ category: "daksdrive" }); setEditSc(null); setShowScForm(true); }} icon={<Plus className="w-4 h-4" />}>Добавить скрипт</Btn></div>
        {CATS.map(cat => { const items = scriptItems.filter((s: ScriptItem) => s.category === cat.id); return items.length === 0 ? null : <GC key={cat.id} className="p-5"><div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cat.color + "22" }}><cat.icon className="w-4 h-4" style={{ color: cat.color }} /></div><span className="font-semibold text-foreground text-sm">{cat.label}</span><Badge color={cat.color}>{items.length}</Badge></div><div className="space-y-2">{items.map((s: ScriptItem) => <div key={s.id} className="flex items-start justify-between gap-3 py-2 border-t border-white/5"><div className="flex-1 min-w-0"><div className="text-xs text-foreground font-medium">{s.title}</div><div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.content.split("\n")[0]}</div></div><div className="flex gap-1 flex-shrink-0"><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setScForm({ ...s }); setEditSc(s); setShowScForm(true); }} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => setScriptItems((p: ScriptItem[]) => p.filter(x => x.id !== s.id))} /></div></div>)}</div></GC>; })}
      </motion.div>}

      {sec === "tests" && <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{testQs.length} вопросов</div><Btn onClick={() => { setTestForm({ category: "daksdrive", opts: ["", "", "", ""], correct: 0 }); setEditTest(null); setShowTestForm(true); }} icon={<Plus className="w-4 h-4" />}>Добавить вопрос</Btn></div>
        {CATS.map(cat => { const qs = testQs.filter((q: TestQ) => q.category === cat.id); return qs.length === 0 ? null : <GC key={cat.id} className="p-5"><div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cat.color + "22" }}><cat.icon className="w-4 h-4" style={{ color: cat.color }} /></div><span className="font-semibold text-foreground text-sm">{cat.label}</span><Badge color={cat.color}>{qs.length} вопросов</Badge></div><div className="space-y-2">{qs.map((q: TestQ, qi: number) => <div key={q.id} className="flex items-start justify-between gap-3 py-2 border-t border-white/5"><div className="flex-1 min-w-0"><div className="text-xs text-foreground font-medium">{qi + 1}. {q.question}</div><div className="text-xs text-muted-foreground mt-0.5">✓ {q.options[q.correct]}</div></div><div className="flex gap-1 flex-shrink-0"><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setTestForm({ ...q, opts: [...q.options] }); setEditTest(q); setShowTestForm(true); }} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => setTestQs((p: TestQ[]) => p.filter(x => x.id !== q.id))} /></div></div>)}</div></GC>; })}
      </motion.div>}

      {sec === "progress" && <motion.div key="prog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {staff.map((emp: Employee) => { const cat = CAT_MAP[emp.department]; const pv = CATS.map(c => ({ ...c, val: emp.progress[c.id] ?? 0 })); const certCount = pv.filter(p => p.val >= 85).length; const avg = Math.round(pv.reduce((a, p) => a + p.val, 0) / CATS.length); return <GC key={emp.id} className="p-5"><div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0">{emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: (cat?.color ?? "#00c2ff") + "22", color: cat?.color ?? "#00c2ff" }}>{emp.firstName[0]}{emp.lastName[0]}</div>}</div><div><div className="font-semibold text-foreground text-sm">{emp.firstName} {emp.lastName}</div><div className="text-xs text-muted-foreground">{emp.position ?? cat?.label}</div></div></div><div className="text-right flex-shrink-0"><div className="text-lg font-bold text-primary" style={{ fontFamily: "Outfit,sans-serif" }}>{avg}%</div><div className="text-xs text-muted-foreground">{certCount} 🏆</div></div></div><div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{pv.map(p => <div key={p.id} className="p-2 rounded-lg bg-white/3 border border-white/7"><div className="flex items-center justify-between mb-1.5"><span className="text-[10px] text-muted-foreground">{p.label}</span>{p.val >= 85 && <Award className="w-3 h-3 text-yellow-400" />}</div><Bar value={p.val} color={p.color} /><div className="text-xs font-mono text-foreground mt-1 text-right">{p.val}%</div></div>)}</div></GC>; })}</motion.div>}

      {sec === "help" && <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="text-sm text-muted-foreground">{helpReqs.length} заявок · {newHelp} новых</div>
        {helpReqs.length === 0 && <GC className="p-10 text-center text-muted-foreground text-sm">Заявок нет</GC>}
        {helpReqs.map((r: HelpReq) => <GC key={r.id} className="p-5" style={{ borderColor: r.status === "new" ? "#ef444422" : undefined }}><div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-semibold text-foreground text-sm">{r.firstName} {r.lastName}</span><Badge color={stC[r.status]}>{stL[r.status]}</Badge><span className="text-xs text-muted-foreground font-mono">{r.date}</span></div>{r.phone && <div className="text-xs text-muted-foreground mb-2">{r.phone}</div>}<p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p></div><div className="flex flex-col gap-1 flex-shrink-0">{r.status === "new" && <Btn sm variant="outline" onClick={() => setHelpReqs((p: HelpReq[]) => p.map(x => x.id === r.id ? { ...x, status: "in-progress" as const } : x))}>В работу</Btn>}{r.status === "in-progress" && <Btn sm variant="green" onClick={() => setHelpReqs((p: HelpReq[]) => p.map(x => x.id === r.id ? { ...x, status: "resolved" as const } : x))}>Решено</Btn>}{r.status === "resolved" && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Решено</span>}</div></div></GC>)}
      </motion.div>}

      {sec === "news" && <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{news?.length} публикаций</div><Btn onClick={() => setShowNewsForm(true)} icon={<Plus className="w-4 h-4" />}>Опубликовать</Btn></div>
        {(news || []).map((item: NewsItem) => (
          <GC key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-3">

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.created_at}
                  </span>
                  <span className="text-xs text-primary">
                    {item.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.authorDept})
                  </span>
                </div>

                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {item.title}
                </h3>

                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                  {item.content}
                </p>
              </div>

              <Btn
                variant="ghost"
                sm
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="hover:text-destructive"
                onClick={() => handleDelete(item.id)}
              />

            </div>
          </GC>
        ))}
      </motion.div>}

      {sec === "ai" && <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex justify-between items-center"><div className="text-sm text-muted-foreground">AI анализ звонков</div><Btn icon={<Upload className="w-4 h-4" />}>Загрузить запись</Btn></div>
        <GC className="p-5 border-primary/20 bg-primary/5"><div className="flex items-start gap-3"><Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><div><div className="text-sm font-semibold text-foreground mb-1">AI Анализ звонков</div><div className="text-xs text-muted-foreground">Оценка по 12 параметрам: соответствие скрипту, тон, решение, CSAT и др.</div></div></div></GC>
        {[{ id: "1", name: "Алексей Петров", date: "2026-07-01", score: 87, feedback: "Хорошая работа с возражениями. Нужно ускорить предоставление информации о тарифах.", status: "pass" }, { id: "2", name: "Мария Иванова", date: "2026-06-30", score: 64, feedback: "Слабый rapport с клиентом. Не использовала скрипт приветствия. Требуется доп. обучение.", status: "fail" }, { id: "3", name: "Дмитрий Козлов", date: "2026-06-29", score: 93, feedback: "Отличный звонок. Чёткое следование скрипту, быстрое решение.", status: "pass" }].map(r => <GC key={r.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="font-semibold text-foreground text-sm">{r.name}</span><Badge color={r.status === "pass" ? "#10b981" : "#ef4444"}>{r.status === "pass" ? "Прошёл" : "Не прошёл"}</Badge><span className="text-xs text-muted-foreground font-mono">{r.date}</span></div><p className="text-xs text-muted-foreground leading-relaxed">{r.feedback}</p></div><div className="text-right flex-shrink-0"><div className={cn("text-2xl font-bold", r.score >= 85 ? "text-primary" : "text-destructive")} style={{ fontFamily: "Outfit,sans-serif" }}>{r.score}%</div><div className="text-xs text-muted-foreground">Score</div></div></div><div className="mt-3"><Bar value={r.score} color={r.score >= 85 ? "#10b981" : "#ef4444"} /></div></GC>)}
      </motion.div>}
    </AnimatePresence>

    {/* Modals */}
    <AnimatePresence>
      {showEmpForm && <Modal title={editEmp ? "Редактировать сотрудника" : "Новый сотрудник"} onClose={() => setShowEmpForm(false)}>
        <div className="space-y-3"><PhotoUpload value={empForm.photoUrl ?? ""} onChange={v => setEmpForm(p => ({ ...p, photoUrl: v }))} />
          <div className="grid grid-cols-2 gap-3"><Inp label="Имя *" value={empForm.firstName ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, firstName: e.target.value }))} /><Inp label="Фамилия" value={empForm.lastName ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, lastName: e.target.value }))} /><Inp label="Email *" type="email" value={empForm.email ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, email: e.target.value }))} /><Inp label="Пароль (почта)" value={empForm.emailPassword ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, emailPassword: e.target.value }))} placeholder="для справки" /><Inp label="Телефон" value={empForm.phone ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998 90 000-00-00" /><Inp label="День рождения" type="date" value={empForm.birthday ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, birthday: e.target.value }))} /><Inp label="Должность" value={empForm.position ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, position: e.target.value }))} placeholder="Менеджер" /><Inp label="Telegram" value={empForm.telegram ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, telegram: e.target.value }))} placeholder="@username" /><Inp label="Instagram" value={empForm.instagram ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@username" /><Inp label="Дата вступления" type="date" value={empForm.joinDate ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, joinDate: e.target.value }))} /></div>
          <Inp label="Цитата / Bio" value={empForm.quote ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, quote: e.target.value }))} placeholder="Короткая цитата или описание" />
          <div className="grid grid-cols-2 gap-3"><Sel label="Отдел" value={empForm.department ?? "daksdrive"} onChange={(e: any) => setEmpForm(p => ({ ...p, department: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Sel><Sel label="Уровень в дереве" value={String(empForm.treeLevel ?? 3)} onChange={(e: any) => setEmpForm(p => ({ ...p, treeLevel: +e.target.value }))}>{TREE_LEVELS.map((l, i) => <option key={i} value={i}>{i}. {l}</option>)}</Sel></div>
          <Sel label="Руководитель" value={empForm.parentId ?? ""} onChange={(e: any) => setEmpForm(p => ({ ...p, parentId: e.target.value }))}><option value="">— Нет —</option>{employees.filter((e: Employee) => e.role !== "admin" && e.id !== editEmp?.id).map((e: Employee) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</Sel>
          <div className="flex gap-2 pt-2"><Btn onClick={saveEmp} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowEmpForm(false)}>Отмена</Btn></div></div>
      </Modal>}

      {viewEmp && <Modal title={`${viewEmp.firstName} ${viewEmp.lastName}`} onClose={() => setViewEmp(null)}>
        <div className="space-y-4"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 flex-shrink-0">{viewEmp.photoUrl ? <img src={viewEmp.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ background: (CAT_MAP[viewEmp.department]?.color ?? "#00c2ff") + "22", color: CAT_MAP[viewEmp.department]?.color ?? "#00c2ff" }}>{viewEmp.firstName[0]}{viewEmp.lastName[0]}</div>}</div><div><div className="font-bold text-foreground" style={{ fontFamily: "Outfit,sans-serif" }}>{viewEmp.firstName} {viewEmp.lastName}</div><div className="text-sm text-primary">{viewEmp.position}</div>{viewEmp.quote && <div className="text-xs text-muted-foreground italic mt-1">«{viewEmp.quote}»</div>}</div></div>
          <div className="grid grid-cols-1 gap-2">{[{ label: "Email", val: viewEmp.email }, { label: "Пароль (почта)", val: viewEmp.emailPassword ?? "—", secret: true }, { label: "Телефон", val: viewEmp.phone || "—" }, { label: "Отдел", val: CAT_MAP[viewEmp.department]?.label ?? viewEmp.department }, { label: "День рождения", val: viewEmp.birthday ?? "—" }, { label: "В компании с", val: viewEmp.joinDate ?? "—" }, { label: "Telegram", val: viewEmp.telegram ?? "—" }, { label: "Instagram", val: viewEmp.instagram ?? "—" }].map(({ label, val, secret }) => <div key={label} className="flex justify-between items-center p-2.5 rounded-lg bg-white/3 border border-white/7"><span className="text-xs text-muted-foreground">{label}</span><span className={cn("text-xs font-mono", secret ? "text-yellow-400" : "text-foreground")}>{val}</span></div>)}</div></div>
      </Modal>}

      {showKbForm && <Modal title={editKb ? "Редактировать статью" : "Новая статья"} onClose={() => setShowKbForm(false)}>
        <div className="space-y-3"><Sel label="Категория" value={kbForm.category ?? "daksdrive"} onChange={(e: any) => setKbForm(p => ({ ...p, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Sel><Inp label="Вопрос *" value={kbForm.question ?? ""} onChange={(e: any) => setKbForm(p => ({ ...p, question: e.target.value }))} placeholder="Введите вопрос" /><Inp label="Ответ *" textarea rows={5} value={kbForm.answer ?? ""} onChange={(e: any) => setKbForm(p => ({ ...p, answer: e.target.value }))} placeholder="Введите ответ" /><div className="flex gap-2 pt-1"><Btn onClick={saveKb} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowKbForm(false)}>Отмена</Btn></div></div>
      </Modal>}

      {showScForm && <Modal title={editSc ? "Редактировать скрипт" : "Новый скрипт"} onClose={() => setShowScForm(false)}>
        <div className="space-y-3"><Sel label="Отдел" value={scForm.category ?? "daksdrive"} onChange={(e: any) => setScForm(p => ({ ...p, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Sel><Inp label="Название скрипта *" value={scForm.title ?? ""} onChange={(e: any) => setScForm(p => ({ ...p, title: e.target.value }))} placeholder="Приём входящего звонка" /><Inp label="Текст скрипта *" textarea rows={8} value={scForm.content ?? ""} onChange={(e: any) => setScForm(p => ({ ...p, content: e.target.value }))} placeholder="— Добрый день..." /><div className="flex gap-2 pt-1"><Btn onClick={saveSc} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowScForm(false)}>Отмена</Btn></div></div>
      </Modal>}

      {showTestForm && <Modal title={editTest ? "Редактировать вопрос" : "Новый вопрос"} onClose={() => setShowTestForm(false)}>
        <div className="space-y-3"><Sel label="Категория" value={testForm.category ?? "daksdrive"} onChange={(e: any) => setTestForm((p: any) => ({ ...p, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Sel><Inp label="Вопрос *" value={testForm.question ?? ""} onChange={(e: any) => setTestForm((p: any) => ({ ...p, question: e.target.value }))} placeholder="Введите вопрос" />
          <div className="space-y-2"><label className="text-xs text-muted-foreground font-medium">Варианты ответов (отметьте правильный)</label>{(testForm.opts ?? ["", "", "", ""]).map((opt: string, oi: number) => <div key={oi} className="flex items-center gap-2"><input type="radio" name="correct" checked={testForm.correct === oi} onChange={() => setTestForm((p: any) => ({ ...p, correct: oi }))} className="accent-primary flex-shrink-0" /><input className="flex-1 px-3 py-2 rounded-lg border border-white/8 bg-white/5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder={`Вариант ${oi + 1}`} value={opt} onChange={e => setTestForm((p: any) => ({ ...p, opts: (p.opts ?? []).map((o: string, i: number) => i === oi ? e.target.value : o) }))} /></div>)}</div>
          <div className="flex gap-2 pt-1"><Btn onClick={saveTest} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowTestForm(false)}>Отмена</Btn></div></div>
      </Modal>}

      {showNewsForm && <Modal title="Опубликовать новость" onClose={() => setShowNewsForm(false)}>
        <div className="space-y-3"><Inp label="Заголовок *" value={newsForm.title} onChange={(e: any) => setNewsForm(p => ({ ...p, title: e.target.value }))} placeholder="Введите заголовок" /><Inp label="Текст *" textarea rows={5} value={newsForm.content} onChange={(e: any) => setNewsForm(p => ({ ...p, content: e.target.value }))} placeholder="Содержание новости..." />
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-white/3 border border-white/7"><Star className="w-3.5 h-3.5 text-primary flex-shrink-0" />Опубликует: <span className="text-primary">{currentUser.firstName} {currentUser.lastName}</span> · Администрация</div>
          <div className="flex gap-2 pt-1"><Btn onClick={addNewsHandler} icon={<Send className="w-4 h-4" />}>Опубликовать</Btn><Btn variant="ghost" onClick={() => setShowNewsForm(false)}>Отмена</Btn></div></div>
      </Modal>}
    </AnimatePresence>
  </motion.div>;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useLS<Page>("lms_page", "login");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [sessionId, setSessionId] = useLS<string | null>("lms_session", null);
  const [employees, setEmployees] = useLS<Employee[]>("lms_employees", INIT_EMP);
  const [helpReqs, setHelpReqs] = useLS<HelpReq[]>("lms_help", []);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [kbItems, setKbItems] = useLS<KBItem[]>("lms_kb", INIT_KB);
  const [scriptItems, setScriptItems] = useLS<ScriptItem[]>("lms_scripts", INIT_SC);
  const [testQs, setTestQs] = useLS<TestQ[]>("lms_tests", INIT_TQ);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);


  React.useEffect(() => {
    const fetchNews = async () => {
      const newsData = await getNews();
      if (newsData) {
        setNews(newsData);
      } else {
        console.error("Ошибка при получении новостей");
      }
    }

    fetchNews();
  }, [])

  const currentUser: Employee | null = sessionId === "admin"
    ? { id: "admin", firstName: "Мурoддилло", lastName: "Хамроев", email: "admin@daksdrive.uz", phone: "", role: "admin", department: "all", progress: {}, position: "Администратор" }
    : employees.find(e => e.id === sessionId) ?? null;

  const handleAuth = (u: Employee) => { setSessionId(u.role === "admin" ? "admin" : u.id); setPage(u.role === "admin" ? "admin" : "home"); };
  const handleRegister = (u: Employee) => setEmployees(p => [...p, u]);
  const handleLogout = () => { setSessionId(null); setPage("login"); };
  const updateUser = (u: Employee) => { setEmployees(p => p.map(e => e.id === u.id ? u : e)); };

  useEffect(() => { if (currentUser && (page === "login" || page === "register")) setPage(currentUser.role === "admin" ? "admin" : "home"); }, []);

  if (!currentUser) {
    return <AuthPage mode={authMode} employees={employees} onAuth={handleAuth} switchMode={() => setAuthMode(m => m === "login" ? "register" : "login")} onRegister={handleRegister} />;
  }

  const newHelpCount = helpReqs.filter((r: HelpReq) => r.status === "new").length;

  const render = () => {
    switch (page) {
      case "home": return <HomePage user={currentUser} setPage={setPage} />;
      case "about": return <AboutPage />;
      case "training": return <TrainingPage user={currentUser} setUser={updateUser} kbItems={kbItems} scriptItems={scriptItems} testQs={testQs} />;
      case "knowledge": return <KnowledgePage items={kbItems} />;
      case "scripts": return <ScriptsPage items={scriptItems} />;
      case "team": return <TeamPage employees={employees} />;
      case "departments": return <DepartmentsPage />;
      case "news": return <NewsPage news={news} employees={employees} />;
      case "kpi": return <KpiPage />;
      case "certificates": return <CertificatesPage user={currentUser} />;
      case "locations": return <LocationsPage />;
      case "contacts": return <ContactsPage />;
      case "help": return <HelpPage user={currentUser} onSubmit={r => setHelpReqs(p => [r, ...p])} />;
      case "admin": return <AdminPage employees={employees} setEmployees={setEmployees} helpReqs={helpReqs} setHelpReqs={setHelpReqs} news={news} setNews={setNews} kbItems={kbItems} setKbItems={setKbItems} scriptItems={scriptItems} setScriptItems={setScriptItems} testQs={testQs} setTestQs={setTestQs} currentUser={currentUser} />;
      default: return <HomePage user={currentUser} setPage={setPage} />;
    }
  };

  return <div className="min-h-screen bg-background" style={{ fontFamily: "Inter,sans-serif" }}>
    <Sidebar page={page} setPage={setPage} user={currentUser} onLogout={handleLogout} open={sidebarOpen} setOpen={setSidebarOpen} badge={newHelpCount} />
    <div className="lg:pl-64 min-h-screen flex flex-col">
      <div className="sticky top-0 z-30 border-b border-white/7 bg-background/80 backdrop-blur-xl px-4 md:px-6 h-14 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"><Menu className="w-5 h-5" /></button>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {currentUser.role === "admin" && newHelpCount > 0 && <button onClick={() => setPage("admin")} className="relative text-muted-foreground hover:text-foreground transition-colors"><Bell className="w-4 h-4" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-white text-[10px] flex items-center justify-center font-bold">{newHelpCount}</span></button>}
          <div className="h-4 w-px bg-white/10" />
          <div className="text-sm text-muted-foreground hidden sm:block">{currentUser.firstName}</div>
          <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15 flex-shrink-0">{currentUser.photoUrl ? <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary" style={{ background: "#00c2ff22" }}>{currentUser.firstName[0]}{currentUser.lastName[0]}</div>}</div>
        </div>
      </div>
      <main className="flex-1 px-4 md:px-6 py-6 max-w-5xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {render()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-white/7 px-6 py-4 text-center text-xs text-muted-foreground">© 2026 DaksDrive Platform — Created by muroddillo kxamroev</footer>
    </div>
  </div>;
}
