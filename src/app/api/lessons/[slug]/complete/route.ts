import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLessonBySlug } from "@/lib/curriculum";
import { consumePracticeSeconds, syncAndGetQuota } from "@/lib/quota";

const completeSchema = z.object({
  score: z.number().int().min(0).max(100),
  secondsSpent: z.number().int().min(0).max(1800).default(60),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { slug } = await context.params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }

  if (!lesson.isFree && user.plan !== "PRO") {
    return NextResponse.json(
      { error: "Этот урок доступен только на тарифе Pro" },
      { status: 403 }
    );
  }

  const quota = await syncAndGetQuota(user.id);
  if (quota?.isExhausted) {
    return NextResponse.json(
      {
        error:
          "Дневной лимит (10 минут) исчерпан. Бесплатный тариф обновится в 12:00 (полдень) или перейдите на Pro.",
      },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const progress = await prisma.lessonProgress.upsert({
    where: {
      userId_lessonSlug: {
        userId: user.id,
        lessonSlug: lesson.slug,
      },
    },
    update: {
      completed: true,
      score: parsed.data.score,
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      lessonSlug: lesson.slug,
      stage: lesson.stage,
      level: lesson.level,
      completed: true,
      score: parsed.data.score,
      completedAt: new Date(),
    },
  });

  const updatedQuota = await consumePracticeSeconds(
    user.id,
    parsed.data.secondsSpent
  );

  return NextResponse.json({ progress, quota: updatedQuota });
}
