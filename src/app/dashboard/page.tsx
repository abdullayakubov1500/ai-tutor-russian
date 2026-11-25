import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { syncAndGetQuota } from "@/lib/quota";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { DashboardClient } from "@/components/dashboard-client";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const quota = await syncAndGetQuota(user.id);
  if (!quota) {
    redirect("/login");
  }

  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId: user.id, completed: true },
    select: { lessonSlug: true, score: true },
  });

  const completedSlugs: Record<string, number> = {};
  for (const row of progressRows) {
    completedSlugs[row.lessonSlug] = row.score;
  }

  return (
    <>
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl w-full px-4 py-10 sm:px-6">
        <DashboardClient
          user={{
            name: user.name,
            plan: user.plan,
            currentStage: user.currentStage,
            currentLevel: user.currentLevel,
            streakDays: user.streakDays,
          }}
          quota={quota}
          completedSlugs={completedSlugs}
        />
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl w-full px-4 py-12 text-xs text-[#8D8179]">
            Загрузка кабинета...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
