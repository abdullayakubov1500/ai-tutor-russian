# Слово AI — Персональный AI-репетитор по русскому языку

**Live Demo (Vercel):** https://ai-tutor-russian.vercel.app

## Возможности
- **Тариф Free:** 10 минут практики в день (автоматический сброс каждый день в 12:00 / полдень), 5 бесплатных базовых уроков, квизы, грамматика и правописание.
- **Тариф Pro (Stripe):** безлимитное время практики, **Speaking**, **Listening**, проверка произношения и ударений, глубокий разбор ошибок и все уровни `A1–C2`.
- **Этапы обучения:**
  - **Начальный:** `A1` (Азбука и основы), `A2` (Базовое общение)
  - **Продвинутый:** `B1` (Уверенная речь), `B2` (Свободное владение)
  - **Эксперт:** `C1` (Профессиональный), `C2` (Мастерство и литература)

## Стек технологий
- **Frontend:** Next.js 16 (App Router, TypeScript), Tailwind CSS, `shadcn/ui`
- **Типографика:** `Great Vibes` (заголовки) и `Geist Mono` (основной текст)
- **AI-модель:** Google `gemini-3.5-flash-lite` (`@google/genai`)
- **База данных и хранилище:** Neon Lakebase Postgres (Prisma) + Neon Object Storage (`files-sdk/neon`)
- **Оплата:** Stripe Checkout, Billing Portal и Webhooks

## Локальный запуск
1. Скопируйте `.env.example` в `.env` и заполните ключи (`DATABASE_URL`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
2. Установите зависимости и примените схему Prisma:
   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```
