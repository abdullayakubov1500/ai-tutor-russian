"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAGES, LESSONS, type StageId, type LevelId } from "@/lib/curriculum";
import type { QuotaStatus } from "@/lib/quota";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Lock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Mic,
  Headphones,
  MessageSquare,
  ArrowRight,
  Upload,
  FileText,
} from "lucide-react";

interface DashboardClientProps {
  user: {
    name: string;
    plan: "FREE" | "PRO";
    currentStage: StageId;
    currentLevel: string;
    streakDays: number;
  };
  quota: QuotaStatus;
  completedSlugs: Record<string, number>;
}

export function DashboardClient({
  user,
  quota,
  completedSlugs,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<StageId>(user.currentStage);
  const [activeLevel, setActiveLevel] = useState<LevelId>(
    (user.currentLevel as LevelId) || "A1"
  );
  const [stageError, setStageError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<{ key: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/storage")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setUploads(d.items ?? []))
      .catch(() => {});
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/storage", { method: "POST", body: fd });
      if (res.ok) {
        const item = await res.json();
        setUploads((prev) => [{ key: item.key, url: item.url }, ...prev]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const isPro = user.plan === "PRO";
  const usedMinutes = Math.floor(quota.dailySecondsUsed / 60);
  const remainingMinutes =
    quota.remainingSeconds !== null
      ? Math.ceil(quota.remainingSeconds / 60)
      : null;
  const progressPercent = isPro
    ? 100
    : Math.min(100, Math.round((quota.dailySecondsUsed / 600) * 100));

  const nextResetFormatted = new Date(quota.nextResetAt).toLocaleTimeString(
    "ru-RU",
    { hour: "2-digit", minute: "2-digit" }
  );

  async function handleSelectLevel(stage: StageId, level: LevelId) {
    setStageError(null);
    if (!isPro && stage !== "BEGINNER") {
      setStageError(
        "Этапы «Продвинутый» и «Эксперт» открываются на тарифе Pro."
      );
      return;
    }
    setActiveStage(stage);
    setActiveLevel(level);
    const res = await fetch("/api/user/level", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, level }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  const stageLessons = LESSONS.filter((l) => l.stage === activeStage);

  return (
    <div className="space-y-8">
      {/* Top Status Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-[#D8D2CF] bg-white md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-3xl text-[#2E3604]">
                Добро пожаловать, {user.name}
              </CardTitle>
              <Badge
                className={
                  isPro
                    ? "bg-[#E19D29] text-[#2E3604]"
                    : "bg-[#D8D2CF] text-[#2E3604]"
                }
              >
                {isPro ? "Тариф Pro · Безлимит" : "Тариф Free · 10 мин/день"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#2E3604]">
                <Clock className="h-4 w-4 text-[#4E5E07]" />
                {isPro
                  ? "Неограниченное время практики"
                  : `Использовано сегодня: ${usedMinutes} из 10 мин (осталось ${remainingMinutes} мин)`}
              </span>
              {!isPro && (
                <span className="text-[#8D8179]">
                  Сброс в полдень ({nextResetFormatted})
                </span>
              )}
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-[#EBE7E4]" />
            {!isPro && quota.isExhausted && (
              <p className="text-xs text-red-700">
                Дневной лимит исчерпан. Возвращайтесь после 12:00 или перейдите на
                Pro для безлимитной практики.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#D8D2CF] bg-[#2E3604] text-[#F6F4F2]">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-3xl text-white">
              AI-репетитор
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-[#D8D2CF]">
              Модель <span className="text-[#E19D29]">gemini-3.5-flash-lite</span>{" "}
              готова к практике на уровне <strong>{activeLevel}</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/tutor" className="w-full">
                <Button className="w-full bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Открыть AI-репетитора
                </Button>
              </Link>
              {!isPro && (
                <Link href="/pricing" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-[#8D8179] bg-transparent text-[#F6F4F2] hover:bg-[#4E5E07]"
                  >
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-[#E19D29]" />
                    Открыть Pro-режимы
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage & Level Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-heading text-4xl text-[#2E3604]">
            Этапы и уровни изучения
          </h2>
          <span className="text-xs text-[#8D8179]">
            Активный уровень: <strong className="text-[#2E3604]">{activeLevel}</strong>
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STAGES.map((stage) => {
            const locked = !isPro && stage.id !== "BEGINNER";
            const selected = activeStage === stage.id;
            return (
              <Card
                key={stage.id}
                className={`border transition-all ${
                  selected
                    ? "border-[#4E5E07] ring-1 ring-[#4E5E07] bg-white"
                    : "border-[#D8D2CF] bg-white/80"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-3xl text-[#2E3604]">
                      {stage.title}
                    </CardTitle>
                    {locked && (
                      <Badge className="bg-[#E19D29]/20 text-[#2E3604] border border-[#E19D29]">
                        <Lock className="h-3 w-3 mr-1" /> Pro
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#8D8179]">{stage.subtitle}</p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {stage.levels.map((lvl) => (
                    <Button
                      key={lvl.id}
                      size="sm"
                      variant={activeLevel === lvl.id ? "default" : "outline"}
                      onClick={() => handleSelectLevel(stage.id, lvl.id)}
                      className={
                        activeLevel === lvl.id
                          ? "bg-[#4E5E07] text-white hover:bg-[#2E3604]"
                          : "border-[#D8D2CF] text-[#2E3604]"
                      }
                    >
                      {lvl.id}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {stageError && (
          <div className="rounded-lg border border-[#E19D29] bg-[#E19D29]/15 p-3 text-xs text-[#2E3604] flex items-center justify-between">
            <span>{stageError}</span>
            <Link href="/pricing">
              <Button size="sm" className="bg-[#E19D29] text-[#2E3604]">
                Перейти на Pro
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-4xl text-[#2E3604]">
            Уроки этапа
          </h2>
          <span className="text-xs text-[#8D8179]">
            Пройдено: {Object.keys(completedSlugs).length} из {LESSONS.length}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stageLessons.map((lesson) => {
            const lessonLocked = !lesson.isFree && !isPro;
            const score = completedSlugs[lesson.slug];
            const isCompleted = score !== undefined;

            return (
              <Card
                key={lesson.slug}
                className="border-[#D8D2CF] bg-white flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-[#D8D2CF] text-[#4E5E07]"
                    >
                      Урок {lesson.order} · {lesson.level}
                    </Badge>
                    {lessonLocked ? (
                      <Badge className="bg-[#E19D29]/20 text-[#2E3604]">
                        <Lock className="h-3 w-3 mr-1" /> Pro
                      </Badge>
                    ) : isCompleted ? (
                      <Badge className="bg-[#4E5E07] text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {score}%
                      </Badge>
                    ) : (
                      <Badge className="bg-[#D8D2CF] text-[#2E3604]">
                        Бесплатно
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-mono text-base font-semibold text-[#2E3604] pt-2">
                    {lesson.title}
                  </CardTitle>
                  <p className="text-xs text-[#8D8179]">{lesson.subtitle}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-[#F6F4F2] px-2 py-0.5 text-[11px] text-[#8D8179]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {lessonLocked ? (
                    <Link href="/pricing" className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/20"
                      >
                        <Lock className="mr-2 h-3.5 w-3.5" />
                        Открыть с Pro
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/lessons/${lesson.slug}`} className="block">
                      <Button
                        size="sm"
                        className="w-full bg-[#4E5E07] text-white hover:bg-[#2E3604]"
                      >
                        <BookOpen className="mr-2 h-3.5 w-3.5" />
                        {isCompleted ? "Повторить урок" : "Начать урок"}
                        <ArrowRight className="ml-auto h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pro Modes Quick Preview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/tutor?mode=speaking">
          <Card className="border-[#D8D2CF] bg-white hover:border-[#4E5E07] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl bg-[#2E3604] p-3 text-[#E19D29]">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2E3604]">
                  Speaking & Произношение
                </div>
                <div className="text-xs text-[#8D8179]">
                  {isPro ? "Доступно без ограничений" : "Требуется тариф Pro"}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tutor?mode=listening">
          <Card className="border-[#D8D2CF] bg-white hover:border-[#4E5E07] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl bg-[#2E3604] p-3 text-[#E19D29]">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2E3604]">
                  Listening (Аудирование)
                </div>
                <div className="text-xs text-[#8D8179]">
                  {isPro ? "Тренировка понимания речи" : "Требуется тариф Pro"}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tutor?mode=error_analysis">
          <Card className="border-[#D8D2CF] bg-white hover:border-[#4E5E07] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-xl bg-[#2E3604] p-3 text-[#E19D29]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2E3604]">
                  Разбор ошибок
                </div>
                <div className="text-xs text-[#8D8179]">
                  {isPro ? "Орфография, пунктуация, стиль" : "Требуется тариф Pro"}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Neon Object Storage Uploads */}
      <Card className="border-[#D8D2CF] bg-white">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-3xl text-[#2E3604]">
              Мои материалы и записи
            </CardTitle>
            <p className="text-xs text-[#8D8179]">
              Хранилище Neon Object Storage (bucket: uploads)
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <span className="inline-flex items-center rounded-md bg-[#4E5E07] px-3 py-2 text-xs font-medium text-white hover:bg-[#2E3604]">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? "Загрузка..." : "Загрузить файл"}
            </span>
          </label>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-xs text-[#8D8179]">
              Загрузите конспект, эссе или аудиозапись для хранения в облаке Neon.
            </p>
          ) : (
            <div className="space-y-2">
              {uploads.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg bg-[#F6F4F2] px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2 text-[#2E3604] truncate">
                    <FileText className="h-3.5 w-3.5 text-[#4E5E07] shrink-0" />
                    {item.key.split("/").pop()}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4E5E07] underline shrink-0 ml-3"
                  >
                    Открыть
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
