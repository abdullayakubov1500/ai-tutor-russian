import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    typescript: true,
  });
}

export const PRO_PLAN_PRICE_RUB_DISPLAY = "990 ₽ / мес";
export const PRO_PLAN_PRICE_USD_CENTS = 1200; // $12.00 fallback if no Price ID

/**
 * Verifies Stripe Checkout Session or active customer subscription directly
 * with Stripe API so Pro activates immediately even before webhook delivery.
 */
export async function syncStripeSubscription(
  userId: string,
  stripeCustomerId: string | null,
  sessionId?: string
): Promise<boolean> {
  const stripe = getStripeClient();
  if (!stripe) return false;

  try {
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const belongsToUser =
        session.metadata?.userId === userId ||
        (stripeCustomerId && session.customer === stripeCustomerId);

      if (
        belongsToUser &&
        (session.payment_status === "paid" || session.status === "complete")
      ) {
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            stripeCustomerId: customerId ?? stripeCustomerId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
            subscriptionStatus: "active",
          },
        });
        return true;
      }
    }

    if (stripeCustomerId) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 5,
      });
      const activeSub = subs.data.find(
        (s) => s.status === "active" || s.status === "trialing"
      );
      if (activeSub) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            stripeSubscriptionId: activeSub.id,
            subscriptionStatus: activeSub.status,
          },
        });
        return true;
      }
    }
  } catch (err) {
    console.error("Stripe subscription sync error:", err);
  }

  return false;
}
