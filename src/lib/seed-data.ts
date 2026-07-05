import type {
  Employee, KBItem, ScriptItem, TestQ, NewsItem,
  Department, Location, AboutContent, ContactContent, TrainingVideo, AiAnalysis,
} from "./types";

export const INIT_EMP: Omit<Employee, "id">[] = [
  { firstName: "Мурoдdилло", lastName: "Хамроев", email: "m.khamroev@daksdrive.uz", phone: "+998 90 000-00-01", role: "user", department: "daksdrive", progress: {}, birthday: "1990-04-10", position: "CEO & Основатель", treeLevel: 0, telegram: "@muroddillo", instagram: "@muroddillo_k", quote: "Движение — это жизнь. DaksDrive — это движение.", joinDate: "2022-01-01" },
  { firstName: "Диёра", lastName: "Юсупова", email: "d.yusupova@daksdrive.uz", phone: "+998 91 000-00-02", role: "user", department: "daksdrive", progress: {}, birthday: "1993-08-22", position: "HR Director", treeLevel: 1, parentId: "1", telegram: "@diyora_hr", joinDate: "2022-03-15" },
  { firstName: "Тимур", lastName: "Рашидов", email: "t.rashidov@daksdrive.uz", phone: "+998 93 000-00-03", role: "user", department: "support", progress: { support: 95 }, birthday: "1988-11-05", position: "CTO", treeLevel: 1, parentId: "1", telegram: "@timur_cto", joinDate: "2022-02-01" },
  { firstName: "Алексей", lastName: "Петров", email: "a.petrov@daksdrive.uz", phone: "+998 90 123-45-67", role: "user", department: "daksdrive", progress: { daksdrive: 92 }, birthday: "1996-03-15", position: "Fleet Manager", treeLevel: 2, parentId: "2", joinDate: "2023-01-10" },
  { firstName: "Мария", lastName: "Иванова", email: "m.ivanova@imoped.uz", phone: "+998 91 234-56-78", role: "user", department: "imoped", progress: { imoped: 78 }, birthday: "1992-07-12", position: "iMoped Lead", treeLevel: 2, parentId: "2", joinDate: "2023-06-20" },
  { firstName: "Анна", lastName: "Сидорова", email: "a.sidorova@daksdrive.uz", phone: "+998 94 456-78-90", role: "user", department: "security", progress: { security: 88 }, birthday: "1988-05-22", position: "Инспектор СБ", treeLevel: 3, parentId: "3", joinDate: "2023-12-01" },
  { firstName: "Сергей", lastName: "Новиков", email: "s.novikov@daksdrive.uz", phone: "+998 95 567-89-01", role: "user", department: "mechanic", progress: { mechanic: 62 }, birthday: "2001-07-18", position: "Механик", treeLevel: 3, parentId: "3", joinDate: "2024-05-15" },
];

export const INIT_KB: Omit<KBItem, "id">[] = [
  { category: "daksdrive", question: "Как зарегистрировать новое ТС?", answer: "Перейдите «Транспорт» → «Добавить ТС». Введите VIN, марку, модель, год. Прикрепите СТС и ОСАГО. Нажмите «Сохранить»." },
  { category: "daksdrive", question: "Что делать при отказе GPS-трекера?", answer: "1. Перезагрузите трекер (10 сек).\n2. Проверьте SIM.\n3. Убедитесь в покрытии.\n4. Создайте заявку в Тех-поддержку с ID устройства." },
  { category: "imoped", question: "Как провести предрейсовый осмотр самоката?", answer: "Заряд АКБ ≥40%, давление шин 2.5–3 bar, тормоза (ход ≤20мм), фары, руль и дека. Зафиксируйте в журнале." },
  { category: "imoped", question: "Какие тарифы доступны?", answer: "«Старт» — 5 мин бесплатно + 9 руб/мин.\n«Дневной» — 290 руб/4 ч.\n«Безлимит» — 990 руб/мес." },
  { category: "support", question: "Как сбросить пароль пользователя?", answer: "Панель → Пользователи → учётная запись → «Сбросить пароль». Система отправит на email. Все сбросы — в журнал ИБ." },
  { category: "security", question: "Порядок при обнаружении постороннего", answer: "1. Уточните цель и документы.\n2. Без документов — уведомите руководителя.\n3. Отказ — вызовите охрану.\n4. Зафиксируйте в журнале." },
  { category: "mechanic", question: "Периодичность ТО электромотора", answer: "ТО-1 каждые 500 мч: смазка подшипников.\nТО-2 каждые 2000 мч: полная диагностика, замер обмоток, очистка вентиляции." },
];

export const INIT_SC: Omit<ScriptItem, "id">[] = [
  { category: "daksdrive", title: "Приём входящего звонка", content: "— Добрый [день/вечер], DaksDrive, меня зовут [Имя]. Чем могу помочь?\n\n[Клиент по доставке]\n— Уточните номер заказа.\n— Ваш заказ сейчас [статус]. Ориентировочно — [время].\n\n— Спасибо, что обратились! Хорошего дня." },
  { category: "imoped", title: "Консультация по аренде самоката", content: "— Здравствуйте, iMoped. Меня зовут [Имя].\n\n[По тарифам]\n• «Старт» — 5 мин бесплатно + 9 руб/мин\n• «Дневной» — 290 руб/4 ч\n• «Безлимит» — 990 руб/мес\n\n— Как часто планируете использовать? Подберу вариант." },
  { category: "support", title: "Обработка технической заявки", content: "— Тех-поддержка, [Имя] слушает.\n\n— Опишите проблему. Когда первый раз появилась ошибка?\n\n— Попробуйте [решение]. Если нет — создам заявку.\n— Номер заявки: [ID]." },
  { category: "security", title: "Инструктаж при входе на объект", content: "— Добрый день. Назовите цель визита и предъявите документ.\n\n[Если пропуск есть]\n— Следуйте к ресепшн.\n\n[Если нет]\n— Заполните гостевой журнал." },
  { category: "mechanic", title: "Приём ТС на ремонт", content: "— Принимаю ТС на ремонт. Госномер [номер], пробег [показание].\n— Фиксирую повреждения: [перечислить]. Подтверждаете?\n— Срок диагностики — до 4 часов.\n— Акт приёма № [номер]. Подпишите." },
];

export const INIT_TQ: Omit<TestQ, "id">[] = [
  { category: "daksdrive", question: "Стандартное максимальное время доставки DaksDrive:", options: ["20 минут", "40 минут", "60 минут", "90 минут"], correct: 1 },
  { category: "daksdrive", question: "Минимальный NPS для DaksDrive:", options: ["3.5", "4.0", "4.7", "5.0"], correct: 2 },
  { category: "daksdrive", question: "При задержке свыше скольких минут водитель уведомляет диспетчера:", options: ["20", "30", "35", "40"], correct: 2 },
  { category: "imoped", question: "Минимальный заряд АКБ перед рейсом:", options: ["20%", "30%", "40%", "50%"], correct: 2 },
  { category: "imoped", question: "Нормативное давление шин iMoped:", options: ["1.5–2 bar", "2.5–3 bar", "3.5–4 bar", "4–5 bar"], correct: 1 },
  { category: "support", question: "Целевое время первого ответа на заявку:", options: ["5 минут", "2 минуты", "10 минут", "15 минут"], correct: 1 },
  { category: "security", question: "Периодичность планового аудита безопасности:", options: ["Ежемесячно", "60 дней", "90 дней", "Ежегодно"], correct: 2 },
  { category: "mechanic", question: "Периодичность ТО-1 электромотора:", options: ["250 мч", "500 мч", "1000 мч", "2000 мч"], correct: 1 },
];

export const INIT_NEWS: Omit<NewsItem, "id" | "date">[] = [
  { title: "Запуск новой линейки iMoped Pro", content: "Флагманская модель с автономностью 120 км и навигацией. Продажи — 15 июля.", authorName: "Мурoдdилло Хамроев", authorDept: "Руководство" },
  { title: "DaksDrive расширяет географию", content: "С 1 июля начинаем работу в Самарканде и Бухаре. Охват — 200+ новых точек выдачи.", authorName: "Мурoдdилло Хамроев", authorDept: "Руководство" },
];

export const SEED_ADMIN = {
  email: "admin@daksdrive.uz",
  password: "admin123",
  firstName: "Мурoдdилло",
  lastName: "Хамроев",
  role: "admin" as const,
  department: "all",
  position: "Администратор",
};

export const SEED_DEMO_USER = {
  email: "a.petrov@daksdrive.uz",
  password: "1234",
};

export const INIT_DEPARTMENTS: Omit<Department, "id">[] = [
  { name: "DaksDrive", iconKey: "Car", color: "#00c2ff", description: "Отдел логистики и доставки. Управляет парком ТС, маршрутами и взаимодействием с клиентами.", headcount: 45, kpis: ["Время доставки <40 мин", "NPS ≥ 4.7", "Утилизация парка ≥ 85%"], detail: "DaksDrive отвечает за операционную логистику: планирование маршрутов, контроль водителей, взаимодействие с клиентами. Используем GPS-трекинг в реальном времени и AI-диспетчеризацию для оптимальной загрузки парка." },
  { name: "iMoped", iconKey: "Zap", color: "#a855f7", description: "Сервис аренды электросамокатов. Fleet management, зарядка, клиентский сервис.", headcount: 30, kpis: ["Uptime самокатов ≥ 92%", "Время разрядки <8 ч", "Рейтинг приложения ≥ 4.6"], detail: "iMoped обслуживает парк из 500+ электросамокатов в трёх городах. Команда следит за зарядкой, техническим состоянием, геолокацией и клиентскими обращениями 24/7." },
  { name: "Тех-поддержка", iconKey: "Cpu", color: "#10b981", description: "Центр технической поддержки пользователей и внутренних систем 24/7.", headcount: 18, kpis: ["FCR ≥ 75%", "Время ответа <2 мин", "CSAT ≥ 90%"], detail: "Поддержка обрабатывает обращения по всем продуктам. Работаем по двухуровневой схеме: L1 — базовая поддержка, L2 — технические специалисты. SLA: 2 часа для эскалации." },
  { name: "СБ", iconKey: "Shield", color: "#f59e0b", description: "Физическая и информационная безопасность объектов.", headcount: 12, kpis: ["0 инцидентов/мес", "100% охват патрулирования", "Аудит каждые 90 дней"], detail: "Служба безопасности контролирует доступ на объекты, ведёт видеонаблюдение, проводит аудиты и расследует инциденты. Тесное взаимодействие с IT-безопасностью." },
  { name: "Механики", iconKey: "Wrench", color: "#ef4444", description: "Техническое обслуживание и ремонт всего парка транспортных средств.", headcount: 22, kpis: ["ТО в срок ≥ 98%", "Простой ≤ 4 ч", "Возврат с ремонта <5%"], detail: "Механический отдел обеспечивает техническую готовность парка: плановое ТО, аварийный ремонт, диагностику. Специализируемся на ДВС-автомобилях и электротранспорте." },
];

export const INIT_DEPARTMENT_IDS = ["daksdrive", "imoped", "support", "security", "mechanic"];

export const INIT_LOCATIONS: Omit<Location, "id">[] = [
  { city: "Ташкент", sub: "Штаб-квартира", address: "ул. Амира Темура, 107Б, офис 412", phone: "+998 71 200-10-00", email: "tashkent@daksdrive.uz", hours: "Пн–Пт: 09:00–18:00", isHQ: true },
  { city: "Самарканд", sub: "Региональный офис", address: "ул. Регистан, 15, 2-й этаж", phone: "+998 66 230-50-70", email: "samarkand@daksdrive.uz", hours: "Пн–Пт: 09:00–17:00", isHQ: false },
  { city: "Бухара", sub: "Региональный офис", address: "ул. Советская, 88", phone: "+998 65 224-30-80", email: "buxara@daksdrive.uz", hours: "Пн–Пт: 09:00–17:00", isHQ: false },
];

export const INIT_ABOUT: AboutContent = {
  badge: "О компании",
  title: "DaksDrive & iMoped",
  description: "Мы строим инфраструктуру городской мобильности в Узбекистане. DaksDrive — надёжная доставка последней мили, iMoped — экологичная микромобильность. Наша миссия: удобное, доступное и устойчивое перемещение по городу.",
  stats: [
    { label: "Лет на рынке", value: "3+" },
    { label: "Сотрудников", value: "60+" },
    { label: "Городов", value: "2" },
    { label: "Самокатов iMoped", value: "600+" },
  ],
  timeline: [
    { year: "2023", title: "Запуск iMoped", description: "Выход на рынок микромобильности. 100 самокатов в первый месяц." },
    { year: "2024", title: "Масштабирование", description: "Парк вырос до 200+ ТС. Открыт офис в Самарканде. 80+ сотрудников." },
    { year: "2026", title: "Экспансия", description: "Выход в Бухару. iMoped Pro. Внедрение AI-аналитики." },
  ],
  values: [
    { emoji: "🚀", title: "Скорость", description: "Доставка — это время." },
    { emoji: "🌱", title: "Экология", description: "iMoped — нулевые выбросы." },
    { emoji: "🤝", title: "Команда", description: "Сильная команда — главный актив." },
  ],
};

export const INIT_CONTACTS: ContactContent = {
  officeTitle: "Главный офис — Ташкент",
  items: [
    { type: "phone", label: "+998 71 200-10-00", href: "tel:+998712001000" },
    { type: "email", label: "tashkent@daksdrive.uz", href: "mailto:tashkent@daksdrive.uz" },
    { type: "address", label: "ул. Амира Темура, 107Б, офис 412", href: "#" },
  ],
  socials: [
    { label: "Telegram", color: "#2196F3", href: "#" },
    { label: "Instagram", color: "#E1306C", href: "#" },
    { label: "Facebook", color: "#1877F2", href: "#" },
    { label: "YouTube", color: "#FF0000", href: "#" },
  ],
};

export const INIT_VIDEOS: Omit<TrainingVideo, "id">[] = [
  { category: "daksdrive", title: "Введение", durationMin: 8, order: 1 },
  { category: "daksdrive", title: "Ключевые процессы", durationMin: 16, order: 2 },
  { category: "daksdrive", title: "Практика", durationMin: 24, order: 3 },
  { category: "imoped", title: "Введение", durationMin: 8, order: 1 },
  { category: "imoped", title: "Ключевые процессы", durationMin: 16, order: 2 },
  { category: "imoped", title: "Практика", durationMin: 24, order: 3 },
  { category: "support", title: "Введение", durationMin: 8, order: 1 },
  { category: "support", title: "Ключевые процессы", durationMin: 16, order: 2 },
  { category: "support", title: "Практика", durationMin: 24, order: 3 },
  { category: "security", title: "Введение", durationMin: 8, order: 1 },
  { category: "security", title: "Ключевые процессы", durationMin: 16, order: 2 },
  { category: "security", title: "Практика", durationMin: 24, order: 3 },
  { category: "mechanic", title: "Введение", durationMin: 8, order: 1 },
  { category: "mechanic", title: "Ключевые процессы", durationMin: 16, order: 2 },
  { category: "mechanic", title: "Практика", durationMin: 24, order: 3 },
];

export const INIT_AI: Omit<AiAnalysis, "id">[] = [
  { employeeName: "Алексей Петров", date: "2026-07-01", score: 87, feedback: "Хорошая работа с возражениями. Нужно ускорить предоставление информации о тарифах.", status: "pass" },
  { employeeName: "Мария Иванова", date: "2026-06-30", score: 64, feedback: "Слабый rapport с клиентом. Не использовала скрипт приветствия. Требуется доп. обучение.", status: "fail" },
  { employeeName: "Дмитрий Козлов", date: "2026-06-29", score: 93, feedback: "Отличный звонок. Чёткое следование скрипту, быстрое решение.", status: "pass" },
];
