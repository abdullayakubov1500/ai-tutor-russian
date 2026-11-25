import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runTutorAgent, type TutorMode } from "@/lib/ai/tutor";
import { consumePracticeSeconds, syncAndGetQuota } from "@/lib/quota";

const PRO_ONLY_MODES: TutorMode[] = [
  "speaking",
  "listening",
  "pronunciation",
  "error_analysis",
];

const tutorSchema = z.object({
  mode: z.enum([
    "chat",
    "quiz",
    "speaking",
    "listening",
    "pronunciation",
    "error_analysis",
  ]),
  message: z.string().min(1, "Введите сообщение").max(3000),
  stage: z.enum(["BEGINNER", "ADVANCED", "EXPERT"]).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  targetPhrase: z.string().max(500).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string(),
      })
    )
    .optional(),
  elapsedSeconds: z.number().int().min(5).max(300).default(45),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = tutorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректный запрос" },
        { status: 400 }
      );
    }

    const { mode, message, targetPhrase, history, elapsedSeconds } = parsed.data;
    const stage = parsed.data.stage ?? user.currentStage;
    const level = (parsed.data.level ?? user.currentLevel) as
      | "A1"
      | "A2"
      | "B1"
      | "B2"
      | "C1"
      | "C2";

    if (PRO_ONLY_MODES.includes(mode) && user.plan !== "PRO") {
      return NextResponse.json(
        {
          error:
            "Режимы Speaking, Listening, Проверка произношения и Разбор ошибок доступны на тарифе Pro.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const quota = await syncAndGetQuota(user.id);
    if (quota?.isExhausted) {
      return NextResponse.json(
        {
          error:
            "10 минут бесплатной практики на сегодня закончились. Сброс произойдёт в 12:00 (полдень). Перейдите на Pro для безлимитного доступа.",
          quotaExhausted: true,
          quota,
        },
        { status: 429 }
      );
    }

    const result = await runTutorAgent({
      mode,
      stage,
      level,
      message,
      targetPhrase,
      history,
    });

    const updatedQuota = await consumePracticeSeconds(user.id, elapsedSeconds);

    await prisma.practiceSession.create({
      data: {
        userId: user.id,
        mode,
        durationSeconds: elapsedSeconds,
        messagesJson: JSON.stringify([
          { role: "user", text: message },
          { role: "assistant", text: result.reply },
        ]),
        errorAnalysisJson: result.structured
          ? JSON.stringify(result.structured)
          : null,
      },
    });

    return NextResponse.json({
      ...result,
      quota: updatedQuota,
    });
  } catch (err) {
    console.error("Tutor API error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 503 || status === 429) {
      return NextResponse.json(
        {
          error:
            "Модель gemini-3.5-flash-lite временно перегружена. Повторите запрос через несколько секунд.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Не удалось получить ответ от AI-репетитора" },
      { status: 500 }
    );
  }
}
