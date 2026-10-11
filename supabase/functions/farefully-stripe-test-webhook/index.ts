// Stripe sandbox webhook. Public HTTP receiver, secured using Stripe's raw-body signature.
// This file must be deployed with verify_jwt=false: Stripe does not send Supabase JWTs.
// All writes target test-only database tables; production paid entitlements are untouched.
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const env = (name: string) => Deno.env.get(name)?.trim() ?? "";
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const enabled = () => env("FAREFULLY_TEST_BILLING_ENABLED") === "true" &&
  env("STRIPE_TEST_SECRET_KEY").startsWith("sk_test_") &&
  env("STRIPE_TEST_WEBHOOK_SECRET").startsWith("whsec_") &&
  !!env("SUPABASE_URL") && !!env("SUPABASE_SERVICE_ROLE_KEY");
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  if (!enabled()) return respond({ error: "Test billing is not enabled." }, 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return respond({ error: "Missing Stripe signature." }, 400);

  const stripe = new Stripe(env("STRIPE_TEST_SECRET_KEY"), {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
  });
  let event: Stripe.Event;
  try {
    const raw = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      raw, signature, env("STRIPE_TEST_WEBHOOK_SECRET"),
    );
  } catch {
    return respond({ error: "Invalid Stripe webhook signature." }, 400);
  }
  if (event.livemode !== false) return respond({ error: "Live Stripe events are forbidden." }, 400);
  const handled = new Set([
    "checkout.session.completed", "customer.subscription.created",
    "customer.subscription.updated", "customer.subscription.deleted",
    "invoice.paid", "invoice.payment_failed",
  ]);
  if (!handled.has(event.type)) return respond({ ignored: true });

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const { data: prior, error: priorError } = await admin
      .from("stripe_test_webhook_events").select("event_id")
      .eq("event_id", event.id).maybeSingle();
    if (priorError) throw priorError;
    if (prior) return respond({ received: true, duplicate: true });

    let subscriptionId: string | undefined;
    let ownerId: string | undefined;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || session.payment_status === "unpaid") {
        return respond({ ignored: true });
      }
      subscriptionId = typeof session.subscription === "string"
        ? session.subscription : session.subscription?.id;
      ownerId = session.client_reference_id || undefined;
    } else if (event.type.startsWith("customer.subscription.")) {
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    } else {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | { id: string };
        parent?: { subscription_details?: { subscription?: string } };
      };
      subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription : invoice.subscription?.id ||
          invoice.parent?.subscription_details?.subscription;
    }
    if (!subscriptionId) {
      // An invoice without an associated subscription cannot change subscription access.
      const { error } = await admin.from("stripe_test_webhook_events")
        .insert({ event_id: event.id, event_type: event.type });
      if (error && error.code !== "23505") throw error;
      return respond({ received: true, ignored: true });
    }

    // Always pull current state from Stripe, not the event's potentially stale snapshot.
    // This makes duplicate/out-of-order Stripe events converge on the latest status.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.livemode || subscription.metadata?.farefully_billing_mode !== "test") {
      return respond({ received: true, ignored: true });
    }
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer : subscription.customer.id;
    ownerId = uuid(ownerId) ? ownerId : subscription.metadata?.farefully_user_id;
    if (!uuid(ownerId)) {
      const { data: linked, error: linkError } = await admin.from("billing_test_accounts")
        .select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (linkError) throw linkError;
      ownerId = linked?.user_id;
    }
    if (!uuid(ownerId)) throw Error("Verified sandbox subscription has no Farefully user mapping");
    const { data: existing, error: lookupError } = await admin.from("billing_test_accounts")
      .select("stripe_customer_id,stripe_subscription_id,subscription_status")
      .eq("user_id", ownerId).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.stripe_customer_id && existing.stripe_customer_id !== customerId) {
      throw Error("Stripe customer ID differs from existing linked Farefully user");
    }
    if (existing?.stripe_subscription_id &&
        existing.stripe_subscription_id !== subscription.id &&
        ["active", "trialing", "past_due"].includes(existing.subscription_status)) {
      // An older subscription must not overwrite a different current subscription.
      return respond({ received: true, ignored: true });
    }
    const item = subscription.items.data[0];
    const itemPriceId = item?.price?.id ?? null;
    const allowedPrices = [env("STRIPE_TEST_PRICE_MONTHLY"), env("STRIPE_TEST_PRICE_ANNUAL")];
    if (!allowedPrices.includes(itemPriceId ?? "") || !itemPriceId) {
      return respond({ received: true, ignored: true });
    }
    const periodEnd = item?.current_period_end ??
      (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
    const { error: writeError } = await admin.from("billing_test_accounts").upsert({
      user_id: ownerId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      price_id: itemPriceId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (writeError) throw writeError;
    // Mark as handled only after data updates; failures must be retried by Stripe.
    const { error: eventError } = await admin.from("stripe_test_webhook_events")
      .insert({ event_id: event.id, event_type: event.type });
    if (eventError && eventError.code !== "23505") throw eventError;
    return respond({ received: true });
  } catch (error) {
    console.error("Stripe sandbox webhook processing failed", String(error));
    return respond({ error: "Retry sandbox event." }, 500);
  }
});
