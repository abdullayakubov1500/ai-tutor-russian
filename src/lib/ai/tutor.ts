import { GoogleGenAI } from "@google/genai";
import type { LevelId, StageId } from "@/lib/curriculum";

export const AI_MODEL = "gemini-3.5-flash-lite";

export type TutorMode =
  | "chat"
  | "quiz"
  | "speaking"
  | "listening"
  | "pronunciation"
  | "error_analysis";

export interface TutorRequestInput {
  mode: TutorMode;
  stage: StageId;
  level: LevelId;
  message: string;
  history?: { role: "user" | "assistant"; text: string }[];
  targetPhrase?: string;
}

export interface TutorResponse {
  reply: string;
  model: string;
  isFallback?: boolean;
  structured?: {
    correctedText?: string;
    errors?: {
      fragment: string;
      correction: string;
      type: string;
      rule: string;
    }[];
    pronunciationScore?: number;
    stressTips?: string[];
    listeningScript?: string;
    listeningQuestion?: string;
    listeningOptions?: string[];
    listeningAnswerIndex?: number;
  };
}

const STAGE_LABELS: Record<StageId, string> = {
  BEGINNER: "Начальный (Beginner)",
  ADVANCED: "Продвинутый (Advanced)",
  EXPERT: "Эксперт (Expert)",
};

function buildSystemInstruction(
  mode: TutorMode,
  stage: StageId,
  level: LevelId
): string {
  const base = `Ты — персональный AI-репетитор по русскому языку «Слово».
Текущий этап ученика: ${STAGE_LABELS[stage]}, уровень: ${level}.
Адаптируй сложность лексики и объяснений строго под уровень ${level}. Отвечай доброжелательно, чётко и структурированно на русском языке (при необходимости давай краткие пояснения).`;

  switch (mode) {
    case "chat":
      return `${base}
Режим: Грамматика, правописание и базовые темы. Объясняй правила простыми словами с примерами и ударениями (например, молокó).`;
    case "quiz":
      return `${base}
Режим: Квизы и задачи по грамматике и правописанию. Проверяй ответы ученика, давай короткую задачу для закрепления и объясняй, почему вариант верный или ошибочный.`;
    case "speaking":
      return `${base}
Режим: Speaking (разговорная практика). Веди живой естественный диалог с учеником на выбранную тему, задавай встречные вопросы и мягко корректируй речевые недочёты в конце ответа.`;
    case "listening":
      return `${base}
Режим: Listening (аудирование). Верни JSON-объект со следующими полями:
{
  "reply": "Краткое введение для ученика",
  "listeningScript": "Небольшой естественный текст на русском языке (3-5 предложений) уровня ${level}, который будет озвучен ученику",
  "listeningQuestion": "Вопрос на понимание прослушанного текста",
  "listeningOptions": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
  "listeningAnswerIndex": 0
}
Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.`;
    case "pronunciation":
      return `${base}
Режим: Проверка произношения и ударений (Pro). Ученик произнёс фразу (распознанный текст передан в сообщении, а также может быть указана целевая фраза).
Верни JSON-объект:
{
  "reply": "Подробный комментарий по произношению, редукции гласных, мягким согласным и ритмике фразы",
  "pronunciationScore": 88,
  "stressTips": ["слово́ — ударение на последний слог", "совет по произношению"]
}
Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.`;
    case "error_analysis":
      return `${base}
Режим: Глубокий разбор ошибок (Pro). Проанализируй текст ученика на орфографию, пунктуацию, грамматику, падежи и стилистику.
Верни JSON-объект:
{
  "reply": "Общее резюме и рекомендации",
  "correctedText": "Полностью исправленный вариант текста",
  "errors": [
    {
      "fragment": "ошибочный фрагмент",
      "correction": "правильный вариант",
      "type": "Орфография | Пунктуация | Грамматика | Стилистика",
      "rule": "Краткое объяснение правила"
    }
  ]
}
Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.`;
  }
}

function tryParseJson<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export async function runTutorAgent(
  input: TutorRequestInput
): Promise<TutorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return buildDemoFallback(input);
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(
    input.mode,
    input.stage,
    input.level
  );

  const historyText = (input.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Ученик" : "Репетитор"}: ${m.text}`)
    .join("\n");

  const userPrompt = [
    historyText ? `Контекст диалога:\n${historyText}` : "",
    input.targetPhrase ? `Целевая фраза: "${input.targetPhrase}"` : "",
    `Запрос ученика: ${input.message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let response;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: input.mode === "error_analysis" ? 0.2 : 0.6,
        },
      });
      break;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if ((status === 503 || status === 429) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  if (!response) {
    throw lastError ?? new Error("Empty Gemini response");
  }

  const rawText = response.text?.trim() || "Не удалось сформировать ответ.";

  if (
    input.mode === "listening" ||
    input.mode === "pronunciation" ||
    input.mode === "error_analysis"
  ) {
    const parsed = tryParseJson<TutorResponse["structured"] & { reply?: string }>(
      rawText
    );
    if (parsed) {
      const { reply, ...rest } = parsed;
      return {
        reply: reply || "Анализ выполнен.",
        model: AI_MODEL,
        structured: rest,
      };
    }
  }

  return {
    reply: rawText,
    model: AI_MODEL,
  };
}

function buildDemoFallback(input: TutorRequestInput): TutorResponse {
  if (input.mode === "listening") {
    return {
      reply:
        "Демо-режим (добавьте GEMINI_API_KEY в .env для живой генерации через gemini-3.5-flash-lite).",
      model: AI_MODEL,
      isFallback: true,
      structured: {
        listeningScript:
          "Сегодня утром Анна пошла в уютную кофейню на углу улицы. Она заказала тёплый раф и свежий круассан, а затем открыла книгу по истории Москвы.",
        listeningQuestion: "Что Анна заказала в кофейне?",
        listeningOptions: [
          "Чай и пирожное",
          "Тёплый раф и круассан",
          "Эспрессо и сэндвич",
          "Сок и яблоко",
        ],
        listeningAnswerIndex: 1,
      },
    };
  }

  if (input.mode === "pronunciation") {
    return {
      reply:
        "Демо-анализ произношения: фраза распознана уверенно. Обратите внимание на редукцию безударных гласных «о» и мягкость согласных перед «е, и, я».",
      model: AI_MODEL,
      isFallback: true,
      structured: {
        pronunciationScore: 86,
        stressTips: [
          "Следите за чётким ударным слогом — в русском языке он заметно длиннее безударных.",
          "Безударное «о» в предударном слоге произносится ближе к краткому [а].",
        ],
      },
    };
  }

  if (input.mode === "error_analysis") {
    return {
      reply:
        "Демо-разбор ошибок выполнен. Для полноценного анализа подключите GEMINI_API_KEY.",
      model: AI_MODEL,
      isFallback: true,
      structured: {
        correctedText: input.message,
        errors: [
          {
            fragment: input.message.slice(0, 32) || "текст",
            correction: input.message.slice(0, 32) || "текст",
            type: "Информация",
            rule: "Укажите GEMINI_API_KEY в .env, чтобы активировать разбор ошибок моделью gemini-3.5-flash-lite.",
          },
        ],
      },
    };
  }

  return {
    reply: `[Демо-ответ ${AI_MODEL} для уровня ${input.level}] Отличный вопрос! Чтобы получать персональные ответы от модели ${AI_MODEL}, добавьте ваш GEMINI_API_KEY в файл .env.`,
    model: AI_MODEL,
    isFallback: true,
  };
}
