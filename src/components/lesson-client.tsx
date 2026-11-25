"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/lib/curriculum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

interface LessonClientProps {
  lesson: Lesson;
}

export function LessonClient({ lesson }: LessonClientProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function speakRussian(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/→.*$/, "").replace(/\(.*?\)/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "ru-RU";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  const allAnswered = lesson.quiz.every((q) => answers[q.id] !== undefined);
  const correctCount = lesson.quiz.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const scorePercent =
    lesson.quiz.length > 0
      ? Math.round((correctCount / lesson.quiz.length) * 100)
      : 100;

  async function handleFinishQuiz() {
    setSubmitted(true);
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scorePercent,
          secondsSpent: 60,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(data.error || "Не удалось сохранить прогресс");
        return;
      }
      setSaveMessage(
        `Урок завершён! Ваш результат: ${scorePercent}%. Прогресс сохранён.`
      );
      router.refresh();
    } catch {
      setSaveMessage("Ошибка сохранения результата");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="border-[#D8D2CF] text-[#2E3604]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в кабинет
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#4E5E07] text-white">
            Уровень {lesson.level}
          </Badge>
          <Badge variant="outline" className="border-[#D8D2CF] text-[#8D8179]">
            ~{lesson.durationMinutes} мин
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-4xl sm:text-5xl text-[#2E3604]">
          {lesson.title}
        </h1>
        <p className="text-sm text-[#8D8179]">{lesson.subtitle}</p>
      </div>

      {/* Theory */}
      <div className="space-y-4">
        {lesson.theory.map((block, idx) => (
          <Card key={idx} className="border-[#D8D2CF] bg-white">
            <CardHeader>
              <CardTitle className="font-mono text-base font-semibold text-[#2E3604]">
                {block.heading}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs sm:text-sm leading-relaxed text-[#2E3604]/90">
                {block.body}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {block.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[#D8D2CF]/70 bg-[#F6F4F2] p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#2E3604]">
                        {ex.ru}
                      </div>
                      <div className="text-[11px] text-[#8D8179] mt-1">
                        {ex.note}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => speakRussian(ex.ru)}
                      title="Озвучить"
                      className="h-8 w-8 text-[#4E5E07] hover:bg-[#D8D2CF]/40 shrink-0"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz */}
      <Card className="border-[#D8D2CF] bg-white">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#2E3604]">
            Квиз: грамматика и правописание
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {lesson.quiz.map((q, idx) => {
            const chosen = answers[q.id];
            return (
              <div
                key={q.id}
                className="space-y-3 border-b border-[#D8D2CF]/60 pb-5 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-[#2E3604]">
                    {idx + 1}. {q.question}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-[#D8D2CF] text-[10px] uppercase text-[#8D8179]"
                  >
                    {q.category}
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isCorrect = optIdx === q.correctIndex;
                    let cls =
                      "justify-start text-left h-auto py-2.5 px-3 text-xs border-[#D8D2CF] text-[#2E3604]";
                    if (submitted) {
                      if (isCorrect) {
                        cls += " bg-[#4E5E07]/15 border-[#4E5E07] text-[#2E3604]";
                      } else if (isSelected) {
                        cls += " bg-red-50 border-red-400 text-red-800";
                      }
                    } else if (isSelected) {
                      cls += " bg-[#E19D29]/20 border-[#E19D29]";
                    }

                    return (
                      <Button
                        key={optIdx}
                        type="button"
                        variant="outline"
                        disabled={submitted}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={cls}
                      >
                        <span className="mr-2 font-bold">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {opt}
                      </Button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className="flex items-start gap-2 rounded-lg bg-[#F6F4F2] p-3 text-xs">
                    {chosen === q.correctIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-[#4E5E07] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-[#2E3604]">{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {!submitted ? (
              <Button
                disabled={!allAnswered || saving}
                onClick={handleFinishQuiz}
                className="bg-[#4E5E07] text-white hover:bg-[#2E3604]"
              >
                Проверить и завершить урок
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 w-full justify-between">
                <div className="text-xs font-semibold text-[#4E5E07]">
                  {saveMessage}
                </div>
                <Link href="/tutor">
                  <Button className="bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Закрепить с AI-репетитором
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
