"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F4F2] px-4">
      <Card className="w-full max-w-md border-[#D8D2CF] bg-white shadow-sm">
        <CardHeader className="text-center space-y-1">
          <Link href="/" className="font-heading text-4xl text-[#2E3604]">
            Слово AI
          </Link>
          <CardTitle className="font-mono text-base font-semibold text-[#2E3604]">
            Вход в личный кабинет
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#D8D2CF]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#D8D2CF]"
              />
            </div>
            {error && (
              <p className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4E5E07] text-white hover:bg-[#2E3604]"
            >
              {loading ? "Входим..." : "Войти"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-[#8D8179]">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-[#4E5E07] underline">
              Зарегистрироваться бесплатно
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
