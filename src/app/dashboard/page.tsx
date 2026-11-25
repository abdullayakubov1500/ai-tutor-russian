import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { syncAndGetQuota } from "@/lib/quota";
import { syncStripeSubscription } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { DashboardClient } from "@/components/dashboard-client";

async function DashboardContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ upgraded?: string; session_id?: string }>;
}) {
  let user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParamsPromise;
  if (user.plan === "FREE" && (params.session_id || user.stripeCustomerId)) {
    const activated = await syncStripeSubscription(
      user.id,
      user.stripeCustomerId,
      params.session_id
    );
    if (activated) {
      const refreshed = await getCurrentUser();
      if (refreshed) user = refreshed;
    }
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

export default function DashboardPage(context: {
  searchParams: Promise<{ upgraded?: string; session_id?: string }>;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl w-full px-4 py-12 text-xs text-[#8D8179]">
            Загрузка кабинета...
          </div>
        }
      >
        <DashboardContent searchParamsPromise={context.searchParams} />
      </Suspense>
    </div>
  );
}
