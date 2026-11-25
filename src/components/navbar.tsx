"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, BookOpen, MessageSquare, CreditCard } from "lucide-react";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    plan: "FREE" | "PRO";
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#D8D2CF] bg-[#F6F4F2]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E3604] text-[#E19D29] text-lg font-bold">
            С
          </span>
          <span className="font-heading text-3xl text-[#2E3604] leading-none pt-1">
            Слово AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 transition-colors hover:text-[#4E5E07] ${
              pathname.startsWith("/dashboard")
                ? "text-[#4E5E07] font-semibold"
                : "text-[#8D8179]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Кабинет
          </Link>
          <Link
            href="/tutor"
            className={`flex items-center gap-1.5 transition-colors hover:text-[#4E5E07] ${
              pathname.startsWith("/tutor")
                ? "text-[#4E5E07] font-semibold"
                : "text-[#8D8179]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            AI-репетитор
          </Link>
          <Link
            href="/pricing"
            className={`flex items-center gap-1.5 transition-colors hover:text-[#4E5E07] ${
              pathname.startsWith("/pricing")
                ? "text-[#4E5E07] font-semibold"
                : "text-[#8D8179]"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Тарифы
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Badge
                className={
                  user.plan === "PRO"
                    ? "bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 border-0"
                    : "bg-[#D8D2CF] text-[#2E3604] hover:bg-[#D8D2CF] border-0"
                }
              >
                {user.plan === "PRO" ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> PRO
                  </span>
                ) : (
                  "FREE"
                )}
              </Badge>
              <span className="hidden sm:inline text-xs text-[#8D8179]">
                {user.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-[#D8D2CF] text-[#2E3604] hover:bg-[#D8D2CF]/40"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#2E3604] hover:bg-[#D8D2CF]/40"
                >
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-[#4E5E07] text-white hover:bg-[#2E3604]"
                >
                  Начать бесплатно
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
