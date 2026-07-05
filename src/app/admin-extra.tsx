import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Plus, Save, Upload, X, Building2, MapPin, Play, Globe, Brain, Mic } from "lucide-react";
import { toast } from "sonner";
import type {
  Department, Location, TrainingVideo, AiAnalysis,
  AboutContent, ContactContent,
} from "../lib/types";
import {
  updateDepartment,
  createLocation, updateLocation, deleteLocation,
  createTrainingVideo, updateTrainingVideo, deleteTrainingVideo,
  createAiAnalysis,
  analyzeCallRecording,
  updateAboutContent, updateContactContent,
  uploadTrainingVideo,
  uploadCallRecording,
} from "../lib/api";
import { getIcon } from "../lib/icon-map";

const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function GC({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-white/8 bg-card overflow-hidden", className)}>{children}</div>;
}
function Badge({ children, color = "#00c2ff" }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: color + "22", color }}>{children}</span>;
}
function Inp({ label, textarea = false, rows = 3, ...p }: { label?: string; textarea?: boolean; rows?: number } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const cls = "w-full px-3 py-2.5 rounded-lg border border-white/8 bg-white/5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm";
  return <div className="flex flex-col gap-1.5">{label && <label className="text-xs text-muted-foreground font-medium">{label}</label>}{textarea ? <textarea className={cn(cls, "resize-none")} rows={rows} {...p} /> : <input className={cls} {...p} />}</div>;
}
function Sel({ label, children, ...p }: { label?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="flex flex-col gap-1.5">{label && <label className="text-xs text-muted-foreground font-medium">{label}</label>}<select className="w-full px-3 py-2.5 rounded-lg border border-white/8 bg-[#0d1117] text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" {...p}>{children}</select></div>;
}
function Btn({ children, variant = "primary", sm = false, icon, className = "", ...p }: { children?: React.ReactNode; variant?: "primary" | "ghost" | "outline" | "danger"; sm?: boolean; icon?: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const vs = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", ghost: "text-muted-foreground hover:text-foreground hover:bg-white/5", outline: "border border-white/15 text-foreground hover:border-white/30 hover:bg-white/5", danger: "bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25" };
  return <button className={cn("inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-50", sm ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm", vs[variant], className)} {...p}>{icon}{children}</button>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="w-full max-w-lg bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}><div className="flex items-center justify-between px-6 py-4 border-b border-white/7"><h3 className="font-bold text-foreground">{title}</h3><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button></div><div className="px-6 py-5">{children}</div></motion.div></motion.div>;
}

const CATS = [
  { id: "daksdrive", label: "DaksDrive", color: "#00c2ff" },
  { id: "imoped", label: "iMoped", color: "#a855f7" },
  { id: "support", label: "Тех-поддержка", color: "#10b981" },
  { id: "security", label: "СБ", color: "#f59e0b" },
  { id: "mechanic", label: "Механик", color: "#ef4444" },
];

type Props = {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  locations: Location[];
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  trainingVideos: TrainingVideo[];
  setTrainingVideos: React.Dispatch<React.SetStateAction<TrainingVideo[]>>;
  aiAnalyses: AiAnalysis[];
  setAiAnalyses: React.Dispatch<React.SetStateAction<AiAnalysis[]>>;
  aboutContent: AboutContent;
  setAboutContent: React.Dispatch<React.SetStateAction<AboutContent>>;
  contactContent: ContactContent;
  setContactContent: React.Dispatch<React.SetStateAction<ContactContent>>;
  sec: "departments" | "locations" | "videos" | "site" | "ai";
};

export function AdminExtraSection({
  departments, setDepartments, locations, setLocations,
  trainingVideos, setTrainingVideos, aiAnalyses, setAiAnalyses,
  aboutContent, setAboutContent, contactContent, setContactContent, sec,
}: Props) {
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({});
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState<Partial<Location>>({ isHQ: false });
  const [showLocForm, setShowLocForm] = useState(false);
  const [editVid, setEditVid] = useState<TrainingVideo | null>(null);
  const [vidForm, setVidForm] = useState<Partial<TrainingVideo>>({ category: "daksdrive", order: 1, durationMin: 10 });
  const [showVidForm, setShowVidForm] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);
  const vidRef = useRef<HTMLInputElement>(null);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({ employeeName: "", score: 85, feedback: "", status: "pass" as "pass" | "fail", date: new Date().toISOString().split("T")[0] });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiEmployeeName, setAiEmployeeName] = useState("");
  const [aiAudioFile, setAiAudioFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [siteTab, setSiteTab] = useState<"about" | "contacts">("about");
  const [aboutForm, setAboutForm] = useState(aboutContent);
  const [contactForm, setContactForm] = useState(contactContent);

  const saveDept = async () => {
    if (!editDept || !deptForm.name) return;
    const res = await updateDepartment(editDept.id, deptForm);
    if (res.error) { toast.error(res.error); return; }
    if (res.data) setDepartments(p => p.map(d => d.id === editDept.id ? res.data! : d));
    setEditDept(null);
    toast.success("Отдел обновлён");
  };

  const saveLoc = async () => {
    if (!locForm.city || !locForm.address) { toast.error("Заполните город и адрес"); return; }
    if (editLoc) {
      const res = await updateLocation(editLoc.id, locForm);
      if (res.error) { toast.error(res.error); return; }
      if (res.data) setLocations(p => p.map(l => l.id === editLoc.id ? res.data! : l));
      toast.success("Локация обновлена");
    } else {
      const res = await createLocation(locForm as Omit<Location, "id">);
      if (res.error || !res.data) { toast.error(res.error ?? "Ошибка"); return; }
      setLocations(p => [...p, res.data!]);
      toast.success("Локация добавлена");
    }
    setShowLocForm(false);
    setEditLoc(null);
    setLocForm({ isHQ: false });
  };

  const removeLoc = async (id: string) => {
    const res = await deleteLocation(id);
    if (res.error) { toast.error(res.error); return; }
    setLocations(p => p.filter(l => l.id !== id));
    toast.success("Локация удалена");
  };

  const saveVid = async () => {
    if (!vidForm.title || !vidForm.category) { toast.error("Заполните название и отдел"); return; }
    const payload = {
      category: vidForm.category!,
      title: vidForm.title!,
      durationMin: vidForm.durationMin ?? 10,
      order: vidForm.order ?? 1,
      ...(vidForm.videoUrl?.trim() ? { videoUrl: vidForm.videoUrl.trim() } : {}),
    };
    if (editVid) {
      const res = await updateTrainingVideo(editVid.id, payload);
      if (res.error) { toast.error(res.error); return; }
      setTrainingVideos(p => p.map(v => v.id === editVid.id ? { ...v, ...payload } : v));
      toast.success("Видео обновлено");
    } else {
      const res = await createTrainingVideo(payload);
      if (res.error || !res.data) { toast.error(res.error ?? "Ошибка"); return; }
      setTrainingVideos(p => [...p, res.data!]);
      toast.success("Видео добавлено");
    }
    setShowVidForm(false);
    setEditVid(null);
    setVidForm({ category: "daksdrive", order: 1, durationMin: 10 });
  };

  const removeVid = async (id: string) => {
    const res = await deleteTrainingVideo(id);
    if (res.error) { toast.error(res.error); return; }
    setTrainingVideos(p => p.filter(v => v.id !== id));
    toast.success("Видео удалено");
  };

  const handleVidFile = async (f: File) => {
    setVidUploading(true);
    try {
      const res = await uploadTrainingVideo(f);
      if (res.data) {
        setVidForm(p => ({ ...p, videoUrl: res.data! }));
        toast.success("Видео загружено в Storage");
      } else {
        toast.error(res.error ?? "Ошибка загрузки");
      }
    } finally {
      setVidUploading(false);
      if (vidRef.current) vidRef.current.value = "";
    }
  };

  const saveAi = async () => {
    if (!aiForm.employeeName || !aiForm.feedback) { toast.error("Заполните имя и комментарий"); return; }
    const res = await createAiAnalysis({ ...aiForm, source: "manual" });
    if (res.error || !res.data) { toast.error(res.error ?? "Ошибка"); return; }
    setAiAnalyses(p => [res.data!, ...p]);
    setShowAiForm(false);
    setAiForm({ employeeName: "", score: 85, feedback: "", status: "pass", date: new Date().toISOString().split("T")[0] });
    toast.success("Анализ добавлен");
  };

  const runGeminiAnalysis = async () => {
    if (!aiEmployeeName.trim()) { toast.error("Укажите имя сотрудника"); return; }
    if (!aiAudioFile) { toast.error("Выберите аудиозапись звонка"); return; }
    setAiAnalyzing(true);
    try {
      const up = await uploadCallRecording(aiAudioFile);
      if (up.error || !up.data) { toast.error(up.error ?? "Ошибка загрузки"); return; }
      toast.info("Аудио загружено. Gemini анализирует...");
      const res = await analyzeCallRecording({ employeeName: aiEmployeeName.trim(), storagePath: up.data.path });
      if (res.error || !res.data) { toast.error(res.error ?? "Ошибка AI"); return; }
      setAiAnalyses(p => [res.data!, ...p]);
      setAiEmployeeName("");
      setAiAudioFile(null);
      if (audioRef.current) audioRef.current.value = "";
      toast.success(`AI анализ готов: ${res.data.score}%`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const saveAbout = async () => {
    const res = await updateAboutContent(aboutForm);
    if (res.error) { toast.error(res.error); return; }
    setAboutContent(aboutForm);
    toast.success("Страница «О компании» сохранена");
  };

  const saveContacts = async () => {
    const res = await updateContactContent(contactForm);
    if (res.error) { toast.error(res.error); return; }
    setContactContent(contactForm);
    toast.success("Контакты сохранены");
  };

  if (sec === "departments") {
    return <motion.div key="dept" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" />{departments.length} отделов</div>
      {departments.map(d => {
        const Icon = getIcon(d.iconKey);
        return <GC key={d.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3 flex-1"><div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: d.color + "22" }}><Icon className="w-5 h-5" style={{ color: d.color }} /></div><div><div className="font-semibold text-foreground text-sm">{d.name}</div><div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</div><div className="flex gap-2 mt-2"><Badge color={d.color}>{d.headcount} чел.</Badge></div></div></div><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setEditDept(d); setDeptForm({ ...d }); }} /></div></GC>;
      })}
      <AnimatePresence>{editDept && <Modal title={`Редактировать: ${editDept.name}`} onClose={() => setEditDept(null)}><div className="space-y-3">
        <Inp label="Название" value={deptForm.name ?? ""} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} />
        <Inp label="Описание" textarea rows={2} value={deptForm.description ?? ""} onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))} />
        <Inp label="Подробности" textarea rows={4} value={deptForm.detail ?? ""} onChange={e => setDeptForm(p => ({ ...p, detail: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3"><Inp label="Цвет (#hex)" value={deptForm.color ?? ""} onChange={e => setDeptForm(p => ({ ...p, color: e.target.value }))} /><Inp label="Численность" type="number" value={deptForm.headcount ?? 0} onChange={e => setDeptForm(p => ({ ...p, headcount: +e.target.value }))} /></div>
        <Inp label="KPI (через запятую)" value={(deptForm.kpis ?? []).join(", ")} onChange={e => setDeptForm(p => ({ ...p, kpis: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} />
        <div className="flex gap-2 pt-2"><Btn onClick={saveDept} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setEditDept(null)}>Отмена</Btn></div>
      </div></Modal>}</AnimatePresence>
    </motion.div>;
  }

  if (sec === "locations") {
    return <motion.div key="loc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" />{locations.length} локаций</div><Btn onClick={() => { setEditLoc(null); setLocForm({ isHQ: false }); setShowLocForm(true); }} icon={<Plus className="w-4 h-4" />}>Добавить</Btn></div>
      {locations.map(l => <GC key={l.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-semibold text-foreground text-sm">{l.city}</span>{l.isHQ && <Badge color="#f59e0b">HQ</Badge>}</div><div className="text-xs text-muted-foreground mt-1">{l.sub}</div><div className="text-xs text-muted-foreground mt-2">{l.address}</div><div className="text-xs text-muted-foreground">{l.phone} · {l.email}</div></div><div className="flex gap-1"><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setEditLoc(l); setLocForm({ ...l }); setShowLocForm(true); }} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => removeLoc(l.id)} /></div></div></GC>)}
      <AnimatePresence>{showLocForm && <Modal title={editLoc ? "Редактировать локацию" : "Новая локация"} onClose={() => setShowLocForm(false)}><div className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><Inp label="Город *" value={locForm.city ?? ""} onChange={e => setLocForm(p => ({ ...p, city: e.target.value }))} /><Inp label="Район/подзаголовок" value={locForm.sub ?? ""} onChange={e => setLocForm(p => ({ ...p, sub: e.target.value }))} /></div>
        <Inp label="Адрес *" value={locForm.address ?? ""} onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3"><Inp label="Телефон" value={locForm.phone ?? ""} onChange={e => setLocForm(p => ({ ...p, phone: e.target.value }))} /><Inp label="Email" value={locForm.email ?? ""} onChange={e => setLocForm(p => ({ ...p, email: e.target.value }))} /></div>
        <Inp label="Часы работы" value={locForm.hours ?? ""} onChange={e => setLocForm(p => ({ ...p, hours: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={!!locForm.isHQ} onChange={e => setLocForm(p => ({ ...p, isHQ: e.target.checked }))} />Главный офис (HQ)</label>
        <div className="flex gap-2 pt-2"><Btn onClick={saveLoc} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowLocForm(false)}>Отмена</Btn></div>
      </div></Modal>}</AnimatePresence>
    </motion.div>;
  }

  if (sec === "videos") {
    return <motion.div key="vid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground flex items-center gap-2"><Play className="w-4 h-4" />{trainingVideos.length} видео</div><Btn onClick={() => { setEditVid(null); setVidForm({ category: "daksdrive", order: trainingVideos.length + 1, durationMin: 10 }); setShowVidForm(true); }} icon={<Plus className="w-4 h-4" />}>Добавить</Btn></div>
      {trainingVideos.length === 0 && <GC className="p-10 text-center text-muted-foreground text-sm">Видео не добавлены</GC>}
      {CATS.map(cat => {
        const items = trainingVideos.filter(v => v.category === cat.id);
        if (!items.length) return null;
        return <GC key={cat.id} className="p-5"><div className="flex items-center gap-2 mb-3"><Badge color={cat.color}>{cat.label}</Badge><span className="text-xs text-muted-foreground">{items.length} видео</span></div><div className="space-y-2">{items.map(v => <div key={v.id} className="flex items-center justify-between gap-3 py-2 border-t border-white/5"><div><div className="text-sm text-foreground">{v.title}</div><div className="text-xs text-muted-foreground">{v.durationMin} мин · Урок {v.order}{v.videoUrl ? " · ✓ URL" : " · нет видео"}</div></div><div className="flex gap-1"><Btn variant="ghost" sm icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setEditVid(v); setVidForm({ ...v }); setShowVidForm(true); }} /><Btn variant="ghost" sm icon={<Trash2 className="w-3.5 h-3.5" />} className="hover:text-destructive" onClick={() => removeVid(v.id)} /></div></div>)}</div></GC>;
      })}
      <AnimatePresence>{showVidForm && <Modal title={editVid ? "Редактировать видео" : "Новое видео"} onClose={() => setShowVidForm(false)}><div className="space-y-3">
        <Inp label="Название *" value={vidForm.title ?? ""} onChange={e => setVidForm(p => ({ ...p, title: e.target.value }))} />
        <Sel label="Отдел" value={vidForm.category ?? "daksdrive"} onChange={e => setVidForm(p => ({ ...p, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Sel>
        <div className="grid grid-cols-2 gap-3"><Inp label="Длительность (мин)" type="number" value={vidForm.durationMin ?? 10} onChange={e => setVidForm(p => ({ ...p, durationMin: +e.target.value }))} /><Inp label="Порядок" type="number" value={vidForm.order ?? 1} onChange={e => setVidForm(p => ({ ...p, order: +e.target.value }))} /></div>
        <Inp label="URL видео (YouTube, Storage и т.д.)" value={vidForm.videoUrl ?? ""} onChange={e => setVidForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://..." />
        <div className="flex items-center gap-2 flex-wrap">
          <Btn variant="outline" sm icon={<Upload className="w-3.5 h-3.5" />} onClick={() => vidRef.current?.click()} disabled={vidUploading}>{vidUploading ? "Загрузка..." : "Загрузить файл в Storage"}</Btn>
          <span className="text-xs text-muted-foreground">до 100 МБ · или вставьте URL выше</span>
          <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleVidFile(f); }} />
        </div>
        <div className="flex gap-2 pt-2"><Btn onClick={saveVid} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowVidForm(false)}>Отмена</Btn></div>
      </div></Modal>}</AnimatePresence>
    </motion.div>;
  }

  if (sec === "site") {
    return <motion.div key="site" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/7 w-fit">
        <button onClick={() => { setSiteTab("about"); setAboutForm(aboutContent); }} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", siteTab === "about" ? "bg-card text-foreground" : "text-muted-foreground")}><Globe className="w-3.5 h-3.5 inline mr-1" />О компании</button>
        <button onClick={() => { setSiteTab("contacts"); setContactForm(contactContent); }} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", siteTab === "contacts" ? "bg-card text-foreground" : "text-muted-foreground")}>Контакты</button>
      </div>
      {siteTab === "about" ? <GC className="p-5 space-y-3">
        <Inp label="Бейдж" value={aboutForm.badge ?? ""} onChange={e => setAboutForm(p => ({ ...p, badge: e.target.value }))} />
        <Inp label="Заголовок" value={aboutForm.title ?? ""} onChange={e => setAboutForm(p => ({ ...p, title: e.target.value }))} />
        <Inp label="Описание" textarea rows={4} value={aboutForm.description ?? ""} onChange={e => setAboutForm(p => ({ ...p, description: e.target.value }))} />
        <Btn onClick={saveAbout} icon={<Save className="w-4 h-4" />}>Сохранить</Btn>
      </GC> : <GC className="p-5 space-y-3">
        <Inp label="Заголовок офиса" value={contactForm.officeTitle ?? ""} onChange={e => setContactForm(p => ({ ...p, officeTitle: e.target.value }))} />
        {contactForm.items.map((item, i) => <div key={i} className="grid grid-cols-3 gap-2"><Inp label="Тип" value={item.type} onChange={e => setContactForm(p => { const items = [...p.items]; items[i] = { ...items[i], type: e.target.value as "phone" | "email" | "address" }; return { ...p, items }; })} /><Inp label="Подпись" value={item.label} onChange={e => setContactForm(p => { const items = [...p.items]; items[i] = { ...items[i], label: e.target.value }; return { ...p, items }; })} /><Inp label="Ссылка" value={item.href ?? ""} onChange={e => setContactForm(p => { const items = [...p.items]; items[i] = { ...items[i], href: e.target.value }; return { ...p, items }; })} /></div>)}
        <Btn onClick={saveContacts} icon={<Save className="w-4 h-4" />}>Сохранить</Btn>
      </GC>}
    </motion.div>;
  }

  if (sec === "ai") {
    return <>
      <GC className="p-5 border-primary/20 bg-primary/5 space-y-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-foreground">AI анализ через Gemini</div>
            <div className="text-xs text-muted-foreground mt-1">Загрузите запись (mp3/wav до 25 МБ). Gemini требует Blaze plan + Functions. Без Blaze — «Добавить вручную».</div>
          </div>
        </div>
        <Inp label="Сотрудник *" value={aiEmployeeName} onChange={e => setAiEmployeeName(e.target.value)} placeholder="Иван Петров" />
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" sm icon={<Mic className="w-3.5 h-3.5" />} onClick={() => audioRef.current?.click()} disabled={aiAnalyzing}>
            {aiAudioFile ? aiAudioFile.name.slice(0, 24) + (aiAudioFile.name.length > 24 ? "…" : "") : "Выбрать запись"}
          </Btn>
          <Btn onClick={runGeminiAnalysis} disabled={aiAnalyzing || !aiAudioFile} icon={<Brain className="w-4 h-4" />}>
            {aiAnalyzing ? "Анализ..." : "Запустить AI анализ"}
          </Btn>
          <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => setAiAudioFile(e.target.files?.[0] ?? null)} />
        </div>
      </GC>
      <div className="flex justify-end mb-3">
        <Btn variant="outline" onClick={() => setShowAiForm(true)} icon={<Plus className="w-4 h-4" />}>Добавить вручную</Btn>
      </div>
      <AnimatePresence>{showAiForm && <Modal title="Ручной AI-анализ" onClose={() => setShowAiForm(false)}><div className="space-y-3">
        <Inp label="Сотрудник *" value={aiForm.employeeName} onChange={e => setAiForm(p => ({ ...p, employeeName: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3"><Inp label="Дата" type="date" value={aiForm.date} onChange={e => setAiForm(p => ({ ...p, date: e.target.value }))} /><Inp label="Оценка (%)" type="number" min={0} max={100} value={aiForm.score} onChange={e => setAiForm(p => ({ ...p, score: +e.target.value }))} /></div>
        <Sel label="Статус" value={aiForm.status} onChange={e => setAiForm(p => ({ ...p, status: e.target.value as "pass" | "fail" }))}><option value="pass">Прошёл</option><option value="fail">Не прошёл</option></Sel>
        <Inp label="Комментарий *" textarea rows={4} value={aiForm.feedback} onChange={e => setAiForm(p => ({ ...p, feedback: e.target.value }))} />
        <div className="flex gap-2 pt-2"><Btn onClick={saveAi} icon={<Save className="w-4 h-4" />}>Сохранить</Btn><Btn variant="ghost" onClick={() => setShowAiForm(false)}>Отмена</Btn></div>
      </div></Modal>}</AnimatePresence>
    </>;
  }

  return null;
}
