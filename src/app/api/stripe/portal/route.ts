import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe не настроен (отсутствует STRIPE_SECRET_KEY)." },
      { status: 503 }
    );
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "У вас ещё нет активного платёжного профиля Stripe." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
