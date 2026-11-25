import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient, PRO_PLAN_PRICE_USD_CENTS } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Войдите в аккаунт для оформления подписки" },
      { status: 401 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe не настроен: добавьте STRIPE_SECRET_KEY в файл .env для проведения оплаты.",
      },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Слово AI — Тариф Pro",
                description:
                  "Безлимитная практика, Speaking, Listening, проверка произношения и разбор ошибок",
              },
              unit_amount: PRO_PLAN_PRICE_USD_CENTS,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
    metadata: {
      userId: user.id,
    },
    success_url: `${appUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
