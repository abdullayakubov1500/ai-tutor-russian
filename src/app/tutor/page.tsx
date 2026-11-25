import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { syncAndGetQuota } from "@/lib/quota";
import { Navbar } from "@/components/navbar";
import { TutorClient } from "@/components/tutor-client";
import type { TutorMode } from "@/lib/ai/tutor";

const VALID_MODES: TutorMode[] = [
  "chat",
  "quiz",
  "speaking",
  "listening",
  "pronunciation",
  "error_analysis",
];

async function TutorContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ mode?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const quota = await syncAndGetQuota(user.id);
  if (!quota) {
    redirect("/login");
  }

  const params = await searchParamsPromise;
  const initialMode = VALID_MODES.includes(params.mode as TutorMode)
    ? (params.mode as TutorMode)
    : "chat";

  return (
    <>
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl w-full px-4 py-10 sm:px-6">
        <TutorClient
          user={{
            name: user.name,
            plan: user.plan,
            currentStage: user.currentStage,
            currentLevel: user.currentLevel,
          }}
          initialQuota={quota}
          initialMode={initialMode}
        />
      </main>
    </>
  );
}

export default function TutorPage(context: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl w-full px-4 py-12 text-xs text-[#8D8179]">
            Загрузка AI-репетитора...
          </div>
        }
      >
        <TutorContent searchParamsPromise={context.searchParams} />
      </Suspense>
    </div>
  );
}
