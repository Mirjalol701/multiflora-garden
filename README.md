# MultiFlora Garden

Высокооптимизированный сайт питомника растений на Next.js 15 + Prisma + PostgreSQL.

## Стек

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS v4, Shadcn UI, Lucide React
- **Backend:** Server Actions, Prisma ORM, PostgreSQL
- **Валидация:** Zod

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

Скопируйте `.env.example` в `.env` и укажите строку подключения PostgreSQL:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/multiflora_garden?schema=public"
```

### 3. Миграция и сидирование

```bash
npm run db:push
npm run db:seed
```

### 4. Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Архитектура Zero-Lag

| Оптимизация | Реализация |
|---|---|
| SSR списков | Server Components + `revalidate` |
| Пагинация | `skip/take` в Prisma, URL-параметр `page` |
| Select полей | Только нужные поля в `findMany` |
| Индексы БД | `category`, `price`, `createdAt`, составной `[category, price]` |
| Мгновенные фильтры | `useTransition` + URL searchParams без блокировки UI |
| Loading states | `loading.tsx` + Suspense скелетоны |
| Формы | `useActionState` + Toast, валидация Zod на сервере |

## Структура

```
prisma/schema.prisma     — модели Plant, Service, CallbackRequest
src/actions/             — Server Actions (plants, services, callback)
src/lib/validations.ts   — Zod-схемы
src/components/catalog/  — каталог (SSR карточки + client фильтры)
src/components/forms/    — форма обратной связи
src/app/                 — страницы App Router
```
