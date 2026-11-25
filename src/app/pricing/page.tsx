import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NavbarServer } from "@/components/navbar-server";
import { PricingActions } from "@/components/pricing-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock, Mic, Headphones, ShieldCheck } from "lucide-react";

async function PricingContent() {
  const user = await getCurrentUser();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="border-[#D8D2CF] bg-white flex flex-col justify-between">
        <div>
          <CardHeader>
            <Badge className="w-fit bg-[#D8D2CF] text-[#2E3604]">Free</Badge>
            <CardTitle className="font-heading text-4xl text-[#2E3604] pt-2">
              Базовый тариф
            </CardTitle>
            <div className="text-3xl font-bold text-[#2E3604]">
              $0 <span className="text-xs font-normal text-[#8D8179]">/ навсегда</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#4E5E07]" />
              <span>10 минут практики в день (сброс в 12:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#4E5E07]" />
              <span>5 уроков бесплатно (этап Начальный A1–A2)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#4E5E07]" />
              <span>Базовые темы, квизы и задачи</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#4E5E07]" />
              <span>Грамматика и правописание с AI-репетитором</span>
            </div>
          </CardContent>
        </div>
        <div className="p-6 pt-0">
          <Link href={user ? "/dashboard" : "/register"}>
            <Button
              variant="outline"
              className="w-full border-[#4E5E07] text-[#4E5E07] hover:bg-[#4E5E07] hover:text-white"
            >
              {user ? "Вернуться в кабинет" : "Начать бесплатно"}
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="border-2 border-[#E19D29] bg-[#2E3604] text-[#F6F4F2] flex flex-col justify-between shadow-lg">
        <div>
          <CardHeader>
            <Badge className="w-fit bg-[#E19D29] text-[#2E3604]">
              <Sparkles className="h-3 w-3 mr-1" /> Pro
            </Badge>
            <CardTitle className="font-heading text-4xl text-white pt-2">
              Персональный наставник
            </CardTitle>
            <div className="text-3xl font-bold text-[#E19D29]">
              $12 <span className="text-xs font-normal text-[#D8D2CF]">/ месяц</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#E19D29]" />
              <span>Неограниченное время использования</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-[#E19D29]" />
              <span>Проверка произношения и ударений</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[#E19D29]" />
              <span>Speaking (диалоги) и Listening (аудирование)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#E19D29]" />
              <span>Детальный разбор ошибок и все уровни A1–C2</span>
            </div>
          </CardContent>
        </div>
        <div className="p-6 pt-0">
          <PricingActions
            isLoggedIn={Boolean(user)}
            isPro={user?.plan === "PRO"}
            hasCustomer={Boolean(user?.stripeCustomerId)}
          />
        </div>
      </Card>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F2]">
      <Suspense
        fallback={
          <header className="h-16 border-b border-[#D8D2CF] bg-[#F6F4F2]/90" />
        }
      >
        <NavbarServer />
      </Suspense>
      <main className="mx-auto max-w-5xl w-full px-4 py-14 sm:px-6 space-y-10">
        <div className="text-center space-y-3">
          <Badge className="bg-[#4E5E07] text-white hover:bg-[#4E5E07]">
            Stripe Billing
          </Badge>
          <h1 className="font-heading text-5xl sm:text-6xl text-[#2E3604]">
            Выберите свой темп обучения
          </h1>
          <p className="text-xs sm:text-sm text-[#8D8179] max-w-xl mx-auto">
            Бесплатный тариф даёт 10 минут практики каждый день со сбросом в 12:00 (полдень).
            Pro снимает все ограничения и открывает голосовую практику.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-center text-xs text-[#8D8179] py-12">
              Загрузка тарифов...
            </div>
          }
        >
          <PricingContent />
        </Suspense>
      </main>
    </div>
  );
}
