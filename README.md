# DaksDrive LMS

Платформа обучения сотрудников DaksDrive & iMoped: модули, база знаний, скрипты, тесты, сертификаты, админ-панель и AI-анализ звонков.

**Стек:** React 18 · Vite · Tailwind CSS · Firebase (Auth, Firestore, Storage, Cloud Functions)

---

## Содержание

1. [Требования](#требования)
2. [Быстрый старт (локально)](#быстрый-старт-локально)
3. [Настройка Firebase с нуля](#настройка-firebase-с-нуля)
4. [Переменные окружения](#переменные-окружения)
5. [Первый вход и роль admin](#первый-вход-и-роль-admin)
6. [Деплой правил Firestore и Storage](#деплой-правил-firestore-и-storage)
7. [Cloud Functions и Gemini AI (Blaze)](#cloud-functions-и-gemini-ai-blaze)
8. [Скрипты npm](#скрипты-npm)
9. [Структура проекта](#структура-проекта)
10. [Коллекции Firestore](#коллекции-firestore)
11. [Cloud Functions](#cloud-functions)
12. [Тарифы Firebase: что работает где](#тарифы-firebase-что-работает-где)
13. [Решение проблем](#решение-проблем)

---

## Требования

- **Node.js** 20+
- **npm** или **pnpm**
- Аккаунт [Google / Firebase](https://console.firebase.google.com)
- Для Cloud Functions и Gemini AI — тариф **Blaze** (pay-as-you-go)

---

## Быстрый старт (локально)

```bash
# 1. Клонировать и установить зависимости
git clone <repo-url> daks
cd daks
npm install

# 2. Создать файл окружения (см. раздел ниже)
cp .env.example .env.local
# Заполнить значения из Firebase Console

# 3. Запустить dev-сервер
npm run dev
```

Приложение откроется по адресу `http://localhost:5173`.

> Backend в dev-режиме — это **облачный Firebase**, а не локальный сервер. Достаточно `npm run dev` + настроенный `.env.local`.

---

## Настройка Firebase с нуля

### Шаг 1. Создать проект

1. Откройте [Firebase Console](https://console.firebase.google.com)
2. **Создать проект** → имя, например `daks-5d81e`
3. Google Analytics — по желанию

### Шаг 2. Web-приложение

1. На главной проекта нажмите **</>** (Web)
2. Зарегистрируйте приложение, скопируйте конфиг (`apiKey`, `authDomain`, …)
3. Вставьте значения в `.env.local` (см. [Переменные окружения](#переменные-окружения))

### Шаг 3. Authentication

1. **Build → Authentication → Get started**
2. Включите провайдер **Email/Password**
3. (Опционально) **Templates** — настройте письма для подтверждения email и сброса пароля

### Шаг 4. Firestore

1. **Build → Firestore Database → Create database**
2. Режим: **Production** (правила деплоим из репозитория)
3. Регион: **europe-west1** (рекомендуется, совпадает с Functions)

### Шаг 5. Storage

1. **Build → Storage → Get started**
2. Режим: **Production**
3. Регион: **europe-west1**

> Без этого шага команда `npm run firebase:rules:storage` выдаст ошибку:  
> *«Firebase Storage has not been set up on project…»*

После создания bucket проверьте `storageBucket` в настройках проекта. Новые проекты часто используют формат:

```
your-project-id.firebasestorage.app
```

а не `your-project.appspot.com`.

### Шаг 6. Привязать CLI к проекту

```bash
npm run firebase:login
```

Убедитесь, что в `.firebaserc` указан ваш `projectId`:

```json
{
  "projects": {
    "default": "ваш-project-id"
  }
}
```

### Шаг 7. Деплой правил

```bash
# Firestore (работает на бесплатном Spark)
npm run firebase:rules

# Storage (только после шага 5)
npm run firebase:rules:storage
```

---

## Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=daks-5d81e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=daks-5d81e
VITE_FIREBASE_STORAGE_BUCKET=daks-5d81e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Где взять значения: **Project settings → General → Your apps → SDK setup and configuration**.

| Переменная | Описание |
|------------|----------|
| `VITE_FIREBASE_API_KEY` | Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `{projectId}.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID проекта |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket из Console (часто `.firebasestorage.app`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

Файл `.env.local` не коммитится в git.

---

## Первый вход и роль admin

### Регистрация

1. Запустите `npm run dev`
2. Откройте приложение → **Регистрация**
3. **Первый зарегистрированный пользователь** автоматически получает роль `admin`

### Назначить admin вручную

Если admin уже есть, через Firestore Console:

1. **Firestore → profiles → {uid пользователя}**
2. Поле `role` → `"admin"`

### Создание сотрудников (admin)

**Администратор → Сотрудники → Добавить**

- Укажите email, пароль (мин. 6 символов), отдел и данные
- Фото загружается в Firebase Storage (`avatars/`)

---

## Деплой правил Firestore и Storage

| Команда | Что деплоит |
|---------|-------------|
| `npm run firebase:rules` | Firestore rules + indexes |
| `npm run firebase:rules:storage` | Storage rules |
| `npm run firebase:rules:all` | Firestore + Storage + indexes |

Правила безопасности:

- **Firestore** — `firestore.rules` (чтение для авторизованных, запись admin)
- **Storage** — `storage.rules` (аватары, видео, записи звонков)

---

## Cloud Functions и Gemini AI (Blaze)

Cloud Functions, секреты и Artifact Registry требуют тариф **Blaze**.

### 1. Перейти на Blaze

[Firebase → Usage and billing → Modify plan → Blaze](https://console.firebase.google.com/project/daks-5d81e/usage/details)

На малых нагрузках расходы обычно $0–5/мес.

### 2. API-ключ Gemini

1. Получите ключ: [Google AI Studio](https://aistudio.google.com/apikey)
2. Сохраните в Firebase Secrets:

```bash
npm run firebase:secret:gemini
# Введите ключ при запросе
```

### 3. Деплой Functions

```bash
cd functions && npm install && cd ..
npm run firebase:deploy:functions
```

Или всё сразу:

```bash
npm run firebase:deploy:all
```

### 4. AI-анализ звонков

**Администратор → AI Анализ**

1. Укажите имя сотрудника
2. Загрузите аудио (mp3/wav, до 25 МБ)
3. **Запустить AI анализ** — Gemini оценит звонок и сохранит результат

Без Blaze / Functions — используйте **Добавить вручную**.

---

## Скрипты npm

| Скрипт | Описание |
|--------|----------|
| `npm run dev` | Dev-сервер Vite |
| `npm run build` | Production-сборка в `dist/` |
| `npm run firebase:login` | Вход в Firebase CLI |
| `npm run firebase:rules` | Деплой Firestore rules + indexes |
| `npm run firebase:rules:storage` | Деплой Storage rules |
| `npm run firebase:rules:all` | Firestore + Storage + indexes |
| `npm run firebase:deploy:functions` | Деплoy Cloud Functions |
| `npm run firebase:deploy:all` | Rules + indexes + Functions |
| `npm run firebase:secret:gemini` | Установить GEMINI_API_KEY |

---

## Структура проекта

```
daks/
├── src/
│   ├── app/
│   │   ├── App.tsx           # UI, страницы, админ-панель
│   │   └── admin-extra.tsx   # Admin: отделы, локации, видео, AI
│   └── lib/
│       ├── api/              # Firestore, Auth, Storage, Functions
│       ├── firebase.ts       # Инициализация Firebase
│       ├── types.ts          # TypeScript-типы
│       └── seed-data.ts      # Начальные данные
├── functions/
│   └── src/
│       ├── index.ts          # Cloud Functions
│       └── gemini.ts         # Gemini AI
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
└── .env.local                # Секреты (не в git)
```

---

## Коллекции Firestore

| Коллекция | Назначение |
|-----------|------------|
| `profiles` | Профили сотрудников, прогресс, роли |
| `kb_items` | База знаний |
| `scripts` | Скрипты продаж / поддержки |
| `test_questions` | Вопросы тестов |
| `news` | Новости |
| `help_requests` | Заявки «Нужна помощь?» |
| `departments` | Отделы |
| `locations` | Офисы и локации |
| `site_content/about` | Страница «О компании» |
| `site_content/contacts` | Контакты |
| `training_videos` | Обучающие видео |
| `ai_analyses` | AI-анализ звонков |
| `_meta/seed` | Метка начального seed |

Данные синхронизируются в **реальном времени** (`onSnapshot`).

---

## Cloud Functions

| Function | Описание |
|----------|----------|
| `createEmployee` | Создание Auth-пользователя + профиль (admin) |
| `deleteEmployee` | Удаление профиля + Auth (admin) |
| `analyzeCall` | AI-анализ аудио через Gemini |
| `setAdminRole` | Назначение admin по email |
| `seedDatabase` | Seed контента (admin) |
| `onAuthUserCreate` | Автопрофиль при регистрации |

Регион Functions: **europe-west1**.

---

## Тарифы Firebase: что работает где

| Функция | Spark (бесплатно) | Blaze |
|---------|-------------------|-------|
| Auth, Firestore, UI | ✅ | ✅ |
| Real-time sync | ✅ | ✅ |
| Деплой Firestore rules | ✅ | ✅ |
| Storage (после Get started) | ✅ | ✅ |
| Создание сотрудника | ✅ fallback | ✅ через Functions |
| Удаление сотрудника | ⚠️ только профиль | ✅ профиль + Auth |
| Gemini AI | ❌ | ✅ |
| Cloud Functions | ❌ | ✅ |

---

## Решение проблем

### `Firebase Storage has not been set up`

Storage не включён в Console.  
→ [Storage → Get started](https://console.firebase.google.com/project/daks-5d81e/storage) → затем `npm run firebase:rules:storage`

### `must be on the Blaze plan`

Functions / Secrets недоступны на Spark.  
→ Upgrade to Blaze или используйте fallback (создание сотрудников работает, удаление Auth — нет).

### `Cloud Functions не задеплоены`

```bash
npm run firebase:deploy:functions
```

### Фото / видео не загружаются

1. Storage включён в Console
2. `VITE_FIREBASE_STORAGE_BUCKET` верный в `.env.local`
3. `npm run firebase:rules:storage`
4. Перезапустите `npm run dev`

### `addDoc() … undefined` при сохранении видео

URL видео необязателен — можно сохранить без него и добавить позже.

### Первый пользователь не admin

В Firestore: `profiles/{uid}.role = "admin"`.

### CORS / Functions not found

Functions не задеплоены или регион не совпадает. Клиент использует `europe-west1`.

---

## Production (хостинг frontend)

```bash
npm run build
```

Папка `dist/` — статические файлы. Варианты хостинга:

- **Firebase Hosting:** `firebase init hosting` → `firebase deploy --only hosting`
- **Vercel / Netlify** — укажите build command `npm run build`, output `dist`
- Не забудьте env-переменные `VITE_*` в настройках хостинга

---

## Лицензия

Private / internal use — DaksDrive.
