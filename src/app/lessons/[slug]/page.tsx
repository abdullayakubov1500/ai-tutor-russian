import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLessonBySlug } from "@/lib/curriculum";
import { Navbar } from "@/components/navbar";
import { LessonClient } from "@/components/lesson-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

async function LessonContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { slug } = await paramsPromise;
  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    notFound();
  }

  const locked = !lesson.isFree && user.plan !== "PRO";

  return (
    <>
      <Navbar user={user} />
      <main className="mx-auto max-w-4xl w-full px-4 py-10 sm:px-6">
        {locked ? (
          <Card className="border-2 border-[#E19D29] bg-white text-center py-8">
            <CardHeader>
              <Lock className="mx-auto h-10 w-10 text-[#E19D29]" />
              <CardTitle className="font-heading text-4xl text-[#2E3604] pt-2">
                Урок доступен на тарифе Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-[#8D8179]">
              <p>
                На бесплатном тарифе открыты 5 базовых уроков. Перейдите на Pro,
                чтобы открыть «{lesson.title}» и все уровни B1–C2.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/pricing">
                  <Button className="bg-[#E19D29] text-[#2E3604] font-semibold">
                    Перейти на Pro
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-[#D8D2CF]">
                    В кабинет
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <LessonClient lesson={lesson} />
        )}
      </main>
    </>
  );
}

export default function LessonPage(context: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl w-full px-4 py-12 text-xs text-[#8D8179]">
            Загрузка урока...
          </div>
        }
      >
        <LessonContent paramsPromise={context.params} />
      </Suspense>
    </div>
  );
}
