import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";
import {
  FREE_DAILY_SECONDS_LIMIT,
  FREE_LESSONS_LIMIT,
  getLastNoonBoundary,
  getNextNoonBoundary,
  shouldResetAtNoon,
} from "@/lib/noon";

export {
  FREE_DAILY_SECONDS_LIMIT,
  FREE_LESSONS_LIMIT,
  getLastNoonBoundary,
  getNextNoonBoundary,
  shouldResetAtNoon,
};

export interface QuotaStatus {
  plan: Plan;
  isPro: boolean;
  dailySecondsUsed: number;
  dailySecondsLimit: number | null;
  remainingSeconds: number | null;
  isExhausted: boolean;
  nextResetAt: string;
}

export async function syncAndGetQuota(userId: string): Promise<QuotaStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      dailySecondsUsed: true,
      lastResetAt: true,
    },
  });

  if (!user) return null;

  const now = new Date();
  let secondsUsed = user.dailySecondsUsed;

  if (shouldResetAtNoon(user.lastResetAt, now)) {
    secondsUsed = 0;
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailySecondsUsed: 0,
        lastResetAt: now,
      },
    });
  }

  const isPro = user.plan === "PRO";
  const remainingSeconds = isPro
    ? null
    : Math.max(0, FREE_DAILY_SECONDS_LIMIT - secondsUsed);

  return {
    plan: user.plan,
    isPro,
    dailySecondsUsed: secondsUsed,
    dailySecondsLimit: isPro ? null : FREE_DAILY_SECONDS_LIMIT,
    remainingSeconds,
    isExhausted: !isPro && secondsUsed >= FREE_DAILY_SECONDS_LIMIT,
    nextResetAt: getNextNoonBoundary(now).toISOString(),
  };
}

export async function consumePracticeSeconds(
  userId: string,
  seconds: number
): Promise<QuotaStatus | null> {
  const current = await syncAndGetQuota(userId);
  if (!current) return null;
  if (current.isPro) return current;

  const updatedSeconds = Math.min(
    FREE_DAILY_SECONDS_LIMIT,
    current.dailySecondsUsed + Math.max(0, Math.round(seconds))
  );

  await prisma.user.update({
    where: { id: userId },
    data: { dailySecondsUsed: updatedSeconds },
  });

  return {
    ...current,
    dailySecondsUsed: updatedSeconds,
    remainingSeconds: Math.max(0, FREE_DAILY_SECONDS_LIMIT - updatedSeconds),
    isExhausted: updatedSeconds >= FREE_DAILY_SECONDS_LIMIT,
  };
}
