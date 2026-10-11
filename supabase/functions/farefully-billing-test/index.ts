// Sandbox-only Checkout and Billing Portal. NEVER accepts live Stripe keys.
// This function intentionally defaults closed; no real charge or paid entitlement can result.
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const ORIGIN = "https://farefully.co.uk";
const BASE = ORIGIN + "/app/account.html";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Vary": "Origin",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const env = (key: string) => Deno.env.get(key)?.trim() ?? "";

function configured() {
  const secret = env("STRIPE_TEST_SECRET_KEY");
  return env("FAREFULLY_TEST_BILLING_ENABLED") === "true" &&
    secret.startsWith("sk_test_") &&
    !!env("STRIPE_TEST_PRICE_MONTHLY") &&
    !!env("STRIPE_TEST_PRICE_ANNUAL") &&
    !!env("SUPABASE_URL") &&
    !!env("SUPABASE_ANON_KEY") &&
    !!env("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (req.headers.get("Origin") !== ORIGIN) return json({ error: "Origin not allowed" }, 403);
  if (!configured()) return json({ error: "Test billing is not enabled." }, 503);

  const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return json({ error: "Sign in before managing billing." }, 401);
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user?.id || !user.email_confirmed_at) {
    return json({ error: "A confirmed Farefully account is required." }, 401);
  }
  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let payload: { action?: string; plan?: string };
  try {
    payload = await req.json();
    if (!payload || typeof payload !== "object") throw Error("Invalid body");
  } catch {
    return json({ error: "A valid JSON request is required." }, 400);
  }
  if (!["checkout", "portal", "status"].includes(payload.action ?? "")) {
    return json({ error: "Unknown billing action." }, 400);
  }
  const { data: record, error: readError } = await admin.from("billing_test_accounts")
    .select("stripe_customer_id,stripe_subscription_id,subscription_status,current_period_end,price_id")
    .eq("user_id", user.id).maybeSingle();
  if (readError) return json({ error: "Test billing store is unavailable." }, 503);
  if (payload.action === "status") {
    return json({
      mode: "test", status: record?.subscription_status ?? "inactive",
      current_period_end: record?.current_period_end ?? null,
      // Sandbox subscriptions MUST NOT unlock live Farefully Plus.
      plus_enabled: false,
    });
  }

  const stripe = new Stripe(env("STRIPE_TEST_SECRET_KEY"), {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
  });
  try {
    if (payload.action === "portal") {
      if (!record?.stripe_customer_id) {
        return json({ error: "No sandbox billing customer exists yet." }, 404);
      }
      const portal = await stripe.billingPortal.sessions.create({
        customer: record.stripe_customer_id,
        return_url: BASE + "?test_billing=portal_return",
        ...(env("STRIPE_TEST_PORTAL_CONFIGURATION")
          ? { configuration: env("STRIPE_TEST_PORTAL_CONFIGURATION") } : {}),
      });
      if (!portal.url) throw Error("Billing portal URL not returned");
      return json({ mode: "test", url: portal.url });
    }
    if (payload.plan !== "monthly" && payload.plan !== "annual") {
      return json({ error: "Choose monthly or annual." }, 400);
    }
    if (record?.subscription_status === "active" || record?.subscription_status === "trialing") {
      return json({ error: "A test subscription exists. Manage it in the billing portal." }, 409);
    }
    const monthly = payload.plan === "monthly";
    const priceId = env(monthly ? "STRIPE_TEST_PRICE_MONTHLY" : "STRIPE_TEST_PRICE_ANNUAL");
    const price = await stripe.prices.retrieve(priceId);
    // A live price/key must never be usable, even if an operator misconfigures an env variable.
    if (price.livemode || !price.active || price.currency !== "gbp" ||
        price.type !== "recurring" || price.unit_amount !== (monthly ? 399 : 3499) ||
        price.recurring?.interval !== (monthly ? "month" : "year")) {
      return json({ error: "Sandbox price does not match the approved Farefully plan." }, 503);
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      ...(record?.stripe_customer_id
        ? { customer: record.stripe_customer_id } : { customer_email: user.email }),
      success_url: BASE + "?test_billing=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: BASE + "?test_billing=canceled",
      subscription_data: { metadata: { farefully_user_id: user.id, farefully_billing_mode: "test" } },
      metadata: { farefully_user_id: user.id, farefully_billing_mode: "test" },
      allow_promotion_codes: false,
    });
    if (!checkout.url || checkout.livemode) throw Error("Invalid sandbox Checkout Session");
    return json({ mode: "test", url: checkout.url });
  } catch (error) {
    console.error("Sandbox billing action failed", String(error));
    return json({ error: "Sandbox billing is temporarily unavailable." }, 502);
  }
});
