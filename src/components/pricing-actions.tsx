"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, CreditCard } from "lucide-react";

interface PricingActionsProps {
  isLoggedIn: boolean;
  isPro: boolean;
  hasCustomer: boolean;
}

export function PricingActions({
  isLoggedIn,
  isPro,
  hasCustomer,
}: PricingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка создания платёжной сессии");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Сетевая ошибка при обращении к Stripe");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось открыть портал Stripe");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {isPro ? (
        <Button
          onClick={handlePortal}
          disabled={loading || !hasCustomer}
          className="w-full bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {loading ? "Открываем Stripe..." : "Управлять подпиской (Stripe)"}
        </Button>
      ) : (
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-[#E19D29] text-[#2E3604] hover:bg-[#E19D29]/90 font-semibold"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Переход к Stripe..." : "Оформить Pro через Stripe"}
        </Button>
      )}
      {error && (
        <p className="rounded-md bg-red-950/60 border border-red-400/40 p-2.5 text-xs text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
