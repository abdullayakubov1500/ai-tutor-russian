import Stripe from "stripe";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    typescript: true,
  });
}

export const PRO_PLAN_PRICE_RUB_DISPLAY = "990 ₽ / мес";
export const PRO_PLAN_PRICE_USD_CENTS = 1200; // $12.00 fallback if no Price ID
