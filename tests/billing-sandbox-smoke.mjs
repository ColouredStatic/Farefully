import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const checkout = readFileSync(new URL("../supabase/functions/farefully-billing-test/index.ts", import.meta.url), "utf8");
const webhook = readFileSync(new URL("../supabase/functions/farefully-stripe-test-webhook/index.ts", import.meta.url), "utf8");
const sql = readFileSync(new URL("../supabase/migrations/20261011143000_billing_test_only.sql", import.meta.url), "utf8");
const docs = readFileSync(new URL("../docs/paid-launch-integration.md", import.meta.url), "utf8");
const sandbox = readFileSync(new URL("../app/billing-sandbox.html", import.meta.url), "utf8");

for(const [name,source] of [["checkout",checkout],["webhook",webhook],["migration",sql]]) {
  assert.doesNotMatch(source,/sk_live_|pk_live_|whsec_[A-Za-z0-9]{20,}|price_1UP3z/i,
    name+": live secrets/production price IDs must never enter sandbox source");
  assert.doesNotMatch(source,/\.(from|into)\(["']billing_accounts["']\)/,
    name+": MUST NEVER write live subscription records");
}
for(const source of [checkout,webhook]){
  assert.match(source,/FAREFULLY_TEST_BILLING_ENABLED/);
  assert.match(source,/STRIPE_TEST_SECRET_KEY/);
  assert.match(source,/sk_test_/);
  assert.match(source,/billing_test_accounts/);
}
assert.match(checkout,/client\.auth\.getUser\(token\)/,"Auth token must be validated by Supabase");
assert.match(checkout,/email_confirmed_at/,"Verified email required");
assert.match(checkout,/payload\.plan !== "monthly"/);
assert.match(checkout,/price\.livemode \|\| !price\.active/,"Stripe test price only");
assert.match(checkout,/price\.unit_amount !== \(monthly \? 399 : 3499\)/);
assert.match(checkout,/checkout\.livemode/,"Reject live checkout sessions");
assert.match(checkout,/subscription_data: \{ metadata: \{/,"Subscription must retain mapped user ID");
assert.match(checkout,/billingPortal\.sessions\.create/,"Customer needs cancellation route");
assert.match(checkout,/plus_enabled: false/,"Sandbox must never confer Plus access");
assert.match(webhook,/constructEventAsync/,"Verify raw Stripe webhook signature");
assert.match(webhook,/request\.text\(\)/,"Signature verification must use raw request body");
assert.match(webhook,/event\.livemode !== false/,"Live events forbidden");
assert.match(webhook,/stripe\.subscriptions\.retrieve/,"Retrieve current subscription to handle stale events");
assert.match(webhook,/stripe_test_webhook_events/,"Durable idempotency log");
assert.match(webhook,/farefully_billing_mode !== "test"/,"Ignore subscriptions outside Farefully sandbox");
assert.match(webhook,/eventError/,"Only mark event handled after updating account");
assert.match(sql,/enable row level security/);
assert.match(sql,/test_billing_read_own/);
assert.match(sql,/auth\.uid\(\)/);
assert.match(sql,/references auth\.users\(id\) on delete cascade/);
assert.match(sql,/revoke all on public\.stripe_test_webhook_events from anon, authenticated/);
assert.match(docs,/FAREFULLY_TEST_BILLING_ENABLED/,"Document closed-by-default sandbox activation");
assert.match(sandbox,/name="robots" content="noindex,nofollow"/);
assert.match(sandbox,/TEST MODE ONLY/);
assert.match(sandbox,/client\.functions\.invoke\('farefully-billing-test'/);
assert.match(sandbox,/data-action="checkout" data-plan="monthly"/);
assert.match(sandbox,/data-action="checkout" data-plan="annual"/);
assert.match(sandbox,/data-action="portal"/);
assert.match(sandbox,/checkout\.stripe\.com/);
assert.match(sandbox,/billing\.stripe\.com/);
assert.match(sandbox,/new URLSearchParams\(location\.search\)/);
const script=sandbox.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,"Billing sandbox client script must exist");
new vm.Script(script[1]);
console.log("Farefully Stripe sandbox contract passed: authenticated test-only sessions, signed events, isolated DB and no live entitlement changes.");
