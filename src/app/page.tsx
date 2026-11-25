import { Suspense } from "react";
import Link from "next/link";
import { NavbarServer } from "@/components/navbar-server";
import { STAGES } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Mic,
  Headphones,
  Sparkles,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <header className="h-16 border-b border-[#D8D2CF] bg-[#F6F4F2]/90" />
        }
      >
        <NavbarServer />
      </Suspense>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#D8D2CF] bg-gradient-to-b from-[#2E3604] via-[#2E3604] to-[#3B4606] text-[#F6F4F2]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <Badge className="bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29] border-0 px-3 py-1 text-xs">
              AI-репетитор на базе Gemini 3.5 Flash Lite
            </Badge>
            <h1 className="font-heading text-5xl sm:text-7xl leading-tight text-white">
              Изучайте русский язык с персональным наставником
            </h1>
            <p className="text-sm sm:text-base text-[#D8D2CF] leading-relaxed max-w-2xl">
              От первых букв кириллицы до безупречной деловой и литературной речи.
              Интерактивные уроки, грамматика и правописание, а также живой
              Speaking, Listening, проверка произношения и глубокий разбор ошибок.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold"
                >
                  Начать 5 уроков бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#8D8179] bg-transparent text-[#F6F4F2] hover:bg-[#4E5E07] hover:text-white"
                >
                  Сравнить тарифы
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-xs text-[#D8D2CF]/90">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#E19D29]" />
                Free: 10 минут практики в день (сброс в 12:00)
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[#E19D29]" />
                5 базовых уроков бесплатно
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stages & Levels Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 w-full">
        <div className="mb-10 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-[#8D8179]">
            Структура обучения
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl text-[#2E3604]">
            Три этапа и шесть уровней мастерства
          </h2>
          <p className="text-sm text-[#8D8179] max-w-2xl">
            Программа адаптируется под ваш текущий уровень — от алфавита A1 до
            свободного владения C2.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STAGES.map((stage, idx) => (
            <Card
              key={stage.id}
              className="border-[#D8D2CF] bg-white shadow-sm hover:border-[#4E5E07] transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-[#8D8179]/40 text-[#4E5E07]"
                  >
                    Этап {idx + 1}
                  </Badge>
                  <GraduationCap className="h-5 w-5 text-[#E19D29]" />
                </div>
                <CardTitle className="font-heading text-3xl text-[#2E3604] pt-2">
                  {stage.title}
                </CardTitle>
                <p className="text-xs text-[#8D8179]">{stage.subtitle}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-[#2E3604]/80">
                  {stage.description}
                </p>
                <div className="space-y-2 border-t border-[#D8D2CF]/60 pt-3">
                  {stage.levels.map((lvl) => (
                    <div
                      key={lvl.id}
                      className="rounded-lg bg-[#F6F4F2] p-2.5 text-xs"
                    >
                      <div className="font-semibold text-[#2E3604]">
                        {lvl.name}
                      </div>
                      <div className="text-[#8D8179] mt-0.5">
                        {lvl.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section className="border-t border-[#D8D2CF] bg-[#EBE7E4]/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center space-y-2">
            <h2 className="font-heading text-4xl sm:text-5xl text-[#2E3604]">
              Прозрачные тарифы
            </h2>
            <p className="text-xs sm:text-sm text-[#8D8179]">
              Бесплатный тариф обновляется каждый день ровно в полдень (12:00)
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-[#D8D2CF] bg-white">
              <CardHeader>
                <Badge className="w-fit bg-[#D8D2CF] text-[#2E3604] hover:bg-[#D8D2CF]">
                  Free
                </Badge>
                <CardTitle className="font-heading text-4xl text-[#2E3604] pt-2">
                  Бесплатный старт
                </CardTitle>
                <p className="text-2xl font-bold text-[#2E3604]">
                  0 ₽ <span className="text-xs font-normal text-[#8D8179]">/ навсегда</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-[#2E3604]">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#4E5E07] shrink-0 mt-0.5" />
                    <span>10 минут практики в день (сброс каждый день в 12:00)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#4E5E07] shrink-0 mt-0.5" />
                    <span>5 бесплатных базовых уроков</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#4E5E07] shrink-0 mt-0.5" />
                    <span>Базовые темы, квизы и задачи</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#4E5E07] shrink-0 mt-0.5" />
                    <span>Грамматика и правописание с AI-репетитором</span>
                  </li>
                </ul>
                <Link href="/register" className="block pt-2">
                  <Button
                    variant="outline"
                    className="w-full border-[#4E5E07] text-[#4E5E07] hover:bg-[#4E5E07] hover:text-white"
                  >
                    Начать бесплатно
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-[#E19D29] bg-[#2E3604] text-[#F6F4F2] shadow-lg">
              <CardHeader>
                <Badge className="w-fit bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]">
                  <Sparkles className="h-3 w-3 mr-1" /> Pro
                </Badge>
                <CardTitle className="font-heading text-4xl text-white pt-2">
                  Полное погружение
                </CardTitle>
                <p className="text-2xl font-bold text-[#E19D29]">
                  $12 <span className="text-xs font-normal text-[#D8D2CF]">/ месяц через Stripe</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-[#F6F4F2]">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-[#E19D29] shrink-0 mt-0.5" />
                    <span>Неограниченное время использования</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mic className="h-4 w-4 text-[#E19D29] shrink-0 mt-0.5" />
                    <span>Проверка произношения и постановка ударений</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Headphones className="h-4 w-4 text-[#E19D29] shrink-0 mt-0.5" />
                    <span>Speaking (разговорные диалоги) и Listening (аудирование)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#E19D29] shrink-0 mt-0.5" />
                    <span>Глубокий разбор ошибок + все уровни B1–C2</span>
                  </li>
                </ul>
                <Link href="/pricing" className="block pt-2">
                  <Button className="w-full bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold">
                    Перейти на Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[#D8D2CF] bg-[#F6F4F2] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8D8179]">
          <span className="font-heading text-2xl text-[#2E3604]">Слово AI</span>
          <span>Персональный AI-репетитор по русскому языку · Gemini 3.5 Flash Lite · Stripe</span>
        </div>
      </footer>
    </div>
  );
}
