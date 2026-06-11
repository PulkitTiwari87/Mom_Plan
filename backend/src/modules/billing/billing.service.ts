import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { sendEmail } from '../../config/email';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import Stripe from 'stripe';
import {
  assertBillablePlan,
  getPlanConfig,
  isMockStripeMode,
  isUpgrade,
  toUserPlan,
  type OrgPlanId,
} from './billing.plans';

const SUCCESS_URL = `${env.FRONTEND_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${env.FRONTEND_URL}/dashboard/settings?checkout=cancelled`;

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };
  return mapping[status] ?? 'active';
}

function addOneYear(from = new Date()): Date {
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

export class BillingService {
  private async getUserOrThrow(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  private async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: { in: ['active', 'past_due', 'trialing'] },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  private async ensureStripeCustomer(user: { id: string; email: string; full_name: string; stripe_customer_id: string | null }) {
    if (user.stripe_customer_id) return user.stripe_customer_id;

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { stripe_customer_id: customer.id },
    });

    return customer.id;
  }

  /** Shared activation logic used by mock checkout, community activation, and webhooks */
  async activateSubscription(params: {
    userId: string;
    plan: UserPlan;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
    amountCents?: number;
    stripePaymentIntentId?: string | null;
    skipEmail?: boolean;
  }) {
    const {
      userId,
      plan,
      stripeCustomerId,
      stripeSubscriptionId,
      status = 'active',
      currentPeriodStart = new Date(),
      currentPeriodEnd = addOneYear(),
      cancelAtPeriodEnd = false,
      amountCents,
      stripePaymentIntentId,
      skipEmail = false,
    } = params;

    const user = await this.getUserOrThrow(userId);

    // Idempotent: if subscription already exists with same Stripe ID, update it
    let subscription = stripeSubscriptionId
      ? await prisma.subscription.findUnique({ where: { stripe_subscription_id: stripeSubscriptionId } })
      : null;

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan,
          status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          stripe_customer_id: stripeCustomerId ?? subscription.stripe_customer_id,
        },
      });
    } else {
      // Deactivate other active subscriptions for this user
      await prisma.subscription.updateMany({
        where: {
          user_id: userId,
          status: { in: ['active', 'past_due', 'trialing'] },
        },
        data: { status: 'canceled' },
      });

      subscription = await prisma.subscription.create({
        data: {
          user_id: userId,
          plan,
          status,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        stripe_customer_id: stripeCustomerId ?? user.stripe_customer_id,
        stripe_subscription_id: stripeSubscriptionId ?? user.stripe_subscription_id,
      },
    });

    if (amountCents && amountCents > 0) {
      const paymentIntentId = stripePaymentIntentId ?? `mock_pi_${subscription.id}`;
      await prisma.payment.upsert({
        where: { stripe_payment_intent_id: paymentIntentId },
        create: {
          user_id: userId,
          subscription_id: subscription.id,
          stripe_payment_intent_id: paymentIntentId,
          amount: amountCents,
          currency: 'usd',
          status: 'succeeded',
        },
        update: { status: 'succeeded' },
      });
    }

    if (!skipEmail && plan !== 'community') {
      const planConfig = getPlanConfig(plan);
      await sendEmail({
        to: user.email,
        subject: `MomPlan Subscription Confirmed: ${planConfig?.displayName ?? plan}`,
        html: `<h1>Thank you for subscribing to the ${planConfig?.displayName ?? plan} plan!</h1>
        <p>Your organization features are now fully active.</p>`,
      });
    }

    return subscription;
  }

  async activateCommunityPlan(userId: string) {
    const user = await this.getUserOrThrow(userId);

    await prisma.subscription.updateMany({
      where: {
        user_id: userId,
        status: { in: ['active', 'past_due', 'trialing'] },
      },
      data: { status: 'canceled' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        plan: 'community',
        status: 'active',
        current_period_start: new Date(),
        current_period_end: null,
        cancel_at_period_end: false,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'community',
        stripe_subscription_id: null,
      },
    });

    return subscription;
  }

  async createCheckoutSession(userId: string, plan: string) {
    const user = await this.getUserOrThrow(userId);
    const planConfig = assertBillablePlan(plan);

    if (isMockStripeMode()) {
      console.log(`⚠️ [MOCK STRIPE CHECKOUT] Plan: ${plan} for User: ${user.email}`);
      const mockSubId = `sub_mock_${Date.now()}`;
      const mockCustomerId = user.stripe_customer_id ?? `cus_mock_${userId}`;

      await this.activateSubscription({
        userId,
        plan: toUserPlan(plan),
        stripeCustomerId: mockCustomerId,
        stripeSubscriptionId: mockSubId,
        amountCents: planConfig.annualAmountCents,
        stripePaymentIntentId: `pi_mock_${Date.now()}`,
      });

      return { url: `${env.FRONTEND_URL}/dashboard/billing/success?mock=true&plan=${plan}` };
    }

    const customerId = await this.ensureStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.stripePriceId!, quantity: 1 }],
      mode: 'subscription',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
    });

    if (!session.url) {
      throw new BadRequestError('Failed to create checkout session');
    }

    return { url: session.url };
  }

  async upgradeSubscription(userId: string, targetPlan: string) {
    const user = await this.getUserOrThrow(userId);
    const planConfig = assertBillablePlan(targetPlan);
    const target = toUserPlan(targetPlan);

    if (!isUpgrade(user.plan, target)) {
      throw new BadRequestError('Target plan must be higher than your current plan');
    }

    const activeSub = await this.getActiveSubscription(userId);

    if (isMockStripeMode()) {
      await this.activateSubscription({
        userId,
        plan: target,
        stripeCustomerId: user.stripe_customer_id ?? `cus_mock_${userId}`,
        stripeSubscriptionId: activeSub?.stripe_subscription_id ?? `sub_mock_${Date.now()}`,
        amountCents: planConfig.annualAmountCents,
        stripePaymentIntentId: `pi_mock_upgrade_${Date.now()}`,
      });
      return { plan: target, upgraded: true };
    }

    if (!activeSub?.stripe_subscription_id || !user.stripe_customer_id) {
      const checkout = await this.createCheckoutSession(userId, targetPlan);
      return { checkoutUrl: checkout.url, upgraded: false };
    }

    const stripeSub = await stripe.subscriptions.retrieve(activeSub.stripe_subscription_id);
    const updated = await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: planConfig.stripePriceId!,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: { userId, plan: targetPlan },
    });

    await this.syncSubscriptionFromStripe(updated, userId, target);

    return { plan: target, upgraded: true };
  }

  async cancelSubscription(userId: string) {
    const user = await this.getUserOrThrow(userId);
    const activeSub = await this.getActiveSubscription(userId);

    if (!activeSub || user.plan === 'community') {
      throw new BadRequestError('No active paid subscription to cancel');
    }

    if (isMockStripeMode()) {
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { cancel_at_period_end: true },
      });
      return { cancelAtPeriodEnd: true, currentPeriodEnd: activeSub.current_period_end };
    }

    if (!activeSub.stripe_subscription_id) {
      throw new BadRequestError('Subscription record is missing Stripe ID');
    }

    const updated = await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: {
        cancel_at_period_end: true,
        current_period_end: new Date(updated.current_period_end * 1000),
      },
    });

    return {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
    };
  }

  async reactivateSubscription(userId: string) {
    const activeSub = await this.getActiveSubscription(userId);

    if (!activeSub?.cancel_at_period_end) {
      throw new BadRequestError('No pending cancellation to reactivate');
    }

    if (isMockStripeMode()) {
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { cancel_at_period_end: false },
      });
      return { reactivated: true, cancelAtPeriodEnd: false };
    }

    if (!activeSub.stripe_subscription_id) {
      throw new BadRequestError('Subscription record is missing Stripe ID');
    }

    await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: { cancel_at_period_end: false },
    });

    return { reactivated: true, cancelAtPeriodEnd: false };
  }

  async createPortalSession(userId: string) {
    const user = await this.getUserOrThrow(userId);

    if (!user.stripe_customer_id) {
      throw new BadRequestError('No active billing customer record found');
    }

    if (isMockStripeMode()) {
      return { url: `${env.FRONTEND_URL}/dashboard/settings?simulated_portal=true` };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${env.FRONTEND_URL}/dashboard/settings`,
    });

    return { url: portalSession.url };
  }

  async getSubscriptionStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const subscription = await this.getActiveSubscription(userId);

    let status: SubscriptionStatus | string = subscription?.status ?? 'active';
    let currentPeriodEnd = subscription?.current_period_end ?? null;
    let cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;

    if (
      subscription?.stripe_subscription_id &&
      !isMockStripeMode()
    ) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        status = mapStripeStatus(sub.status);
        currentPeriodEnd = new Date(sub.current_period_end * 1000);
        cancelAtPeriodEnd = sub.cancel_at_period_end;
      } catch (err) {
        console.error('Failed to retrieve subscription from Stripe:', err);
      }
    }

    return {
      plan: user.plan,
      status,
      current_period_end: currentPeriodEnd,
      next_billing_date: currentPeriodEnd,
      renewal_date: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      stripe_subscription_id: user.stripe_subscription_id,
    };
  }

  private async syncSubscriptionFromStripe(stripeSub: Stripe.Subscription, userId: string, plan?: UserPlan) {
    const resolvedPlan =
      plan ??
      (stripeSub.metadata?.plan as UserPlan | undefined) ??
      (await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }))?.plan ??
      'community';

    await this.activateSubscription({
      userId,
      plan: resolvedPlan,
      stripeCustomerId: typeof stripeSub.customer === 'string' ? stripeSub.customer : undefined,
      stripeSubscriptionId: stripeSub.id,
      status: mapStripeStatus(stripeSub.status),
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      skipEmail: true,
    });
  }

  private async recordBillingEvent(event: Stripe.Event, userId?: string) {
    const existing = await prisma.billingEvent.findUnique({
      where: { stripe_event_id: event.id },
    });
    if (existing) return false;

    await prisma.billingEvent.create({
      data: {
        user_id: userId,
        event_type: event.type,
        stripe_event_id: event.id,
        payload: event.data.object as object,
      },
    });
    return true;
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown webhook error';
      console.error('⚠️ Stripe webhook signature verification failed:', message);
      throw new BadRequestError(`Webhook Error: ${message}`);
    }

    const isNew = await this.recordBillingEvent(event);
    if (!isNew) {
      console.log(`Skipping duplicate webhook event: ${event.id}`);
      return { received: true, duplicate: true };
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planStr = session.metadata?.plan as OrgPlanId | undefined;

    if (!userId || !planStr) return;

    // Prevent duplicate activation if subscription already linked
    const subId = typeof session.subscription === 'string' ? session.subscription : null;
    if (subId) {
      const existing = await prisma.subscription.findUnique({
        where: { stripe_subscription_id: subId },
      });
      if (existing) return;
    }

    const planConfig = getPlanConfig(planStr);
    const customerId = typeof session.customer === 'string' ? session.customer : null;

    let periodEnd = addOneYear();
    if (subId && !isMockStripeMode()) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        periodEnd = new Date(stripeSub.current_period_end * 1000);
      } catch {
        // use default
      }
    }

    await this.activateSubscription({
      userId,
      plan: toUserPlan(planStr),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subId,
      currentPeriodEnd: periodEnd,
      amountCents: planConfig?.annualAmountCents,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : `pi_checkout_${session.id}`,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
    if (!customerId) return;

    const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
    if (!user) return;

    const plan = (subscription.metadata?.plan as UserPlan) || user.plan;

    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      await this.downgradeUser(user.id, user.email, user.full_name);
      return;
    }

    await this.syncSubscriptionFromStripe(subscription, user.id, plan);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
    if (!customerId) return;

    const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
    if (!user) return;

    await prisma.subscription.updateMany({
      where: { stripe_subscription_id: subscription.id },
      data: { status: 'canceled' },
    });

    await this.downgradeUser(user.id, user.email, user.full_name);
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
    if (!customerId || !invoice.amount_paid) return;

    const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
    if (!user) return;

    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
    const subscription = subId
      ? await prisma.subscription.findUnique({ where: { stripe_subscription_id: subId } })
      : await this.getActiveSubscription(user.id);

    const paymentIntentId =
      typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : `pi_invoice_${invoice.id}`;

    await prisma.payment.upsert({
      where: { stripe_payment_intent_id: paymentIntentId },
      create: {
        user_id: user.id,
        subscription_id: subscription?.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
      },
      update: { status: 'succeeded' },
    });

    if (subscription && subscription.status !== 'active') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active' },
      });
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
    if (!customerId) return;

    const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
    if (!user) return;

    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
    if (subId) {
      await prisma.subscription.updateMany({
        where: { stripe_subscription_id: subId },
        data: { status: 'past_due' },
      });
    }

    const paymentIntentId =
      typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : `pi_failed_${invoice.id}`;

    await prisma.payment.upsert({
      where: { stripe_payment_intent_id: paymentIntentId },
      create: {
        user_id: user.id,
        subscription_id: subId
          ? (await prisma.subscription.findUnique({ where: { stripe_subscription_id: subId } }))?.id
          : undefined,
        stripe_payment_intent_id: paymentIntentId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
      },
      update: { status: 'failed' },
    });

    await prisma.notification.create({
      data: {
        user_id: user.id,
        type: 'system',
        title: 'Payment Failed',
        message:
          'We were unable to process your subscription payment. Please update your billing details to avoid service interruption.',
        action_url: '/dashboard/settings',
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'MomPlan Payment Failed',
      html: `<h1>Payment Failed</h1>
      <p>Hello ${user.full_name}, we were unable to process your recent subscription payment.</p>
      <p>Please update your payment method in your billing settings to keep your plan active.</p>`,
    });
  }

  private async downgradeUser(userId: string, email: string, fullName: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'community', stripe_subscription_id: null },
    });

    await sendEmail({
      to: email,
      subject: 'MomPlan Subscription Cancelled',
      html: `<h1>Subscription Cancelled</h1>
      <p>Hello ${fullName}, your paid MomPlan tier has ended. Your account is now on the Community plan.</p>
      <p>You can upgrade anytime from your dashboard.</p>`,
    });
  }
}
