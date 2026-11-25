import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  stage: z.enum(["BEGINNER", "ADVANCED", "EXPERT"]),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный уровень" }, { status: 400 });
  }

  if (user.plan === "FREE" && parsed.data.stage !== "BEGINNER") {
    return NextResponse.json(
      {
        error:
          "Этапы «Продвинутый» и «Эксперт» доступны на тарифе Pro. Обновите подписку для полного доступа.",
      },
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      currentStage: parsed.data.stage,
      currentLevel: parsed.data.level,
    },
    select: {
      currentStage: true,
      currentLevel: true,
    },
  });

  return NextResponse.json({ user: updated });
}
