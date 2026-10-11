# Farefully Plus production integration

Status: **NOT LIVE. Sandbox integration code is prepared but disabled until separately configured and tested. Do not accept paid subscriptions until the checks below pass.**

## Production source of truth
- GitHub repository: `ColouredStatic/Farefully`, branch `main`.
- Public app: `https://farefully.co.uk/app/` (GitHub Pages).
- IONOS manages the domain and email. Preserve existing DNS/email records.
- The Wix deployment is a secondary copy. Never overwrite the GitHub app with older Wix files.
- Live household accounts and profiles are stored in Supabase (public.households) with revision-safe sync and account-scoped browser caches. Legacy beta browser-only profiles are deliberately not imported.

## Required production services
1. Identity provider with verified email sign-up, login, password recovery and refreshable sessions.
2. Server-enforced per-user data access. Each household and plan belongs to an authenticated user. Never trust a user ID sent in a client request without validating the session.
3. Server-side Stripe integration, including hosted Checkout, webhook signature verification, idempotent event processing, customer-to-user mapping, and a billing portal.
4. Premium entitlement checked by the server, based on Stripe subscription state. Never gate paid features using localStorage alone.
5. Privacy/data retention, export/deletion, backups, operational logs, rate limiting and monitoring.

## Existing live Stripe catalogue (Colouredstatic account)
- Product: `prod_VPtnpdjyQudd6r`
- Monthly: `price_1UP3znIqBfvfkSOTUsDFP7Pa` (£3.99/month)
- Annual: `price_1UP3zoIqBfvfkSOT259mA0UK` (£34.99/year)
- Stripe secret key and webhook signing secret must be stored **only** in the backend's secret store, never in this public repository.

## Local-to-cloud migration
- Preserve the full local profile JSON before migration.
- Only migrate after verified login and explicit user consent.
- Upsert with stable profile IDs and user ownership, retry safely without duplicates.
- Never clear localStorage until server confirms successful writes and a read-back check.
- If migration fails, preserve existing local profiles and show a retry option.
- Treat allergy and Coeliac settings as safety-critical. Preserve them exactly and revalidate all recipes against current preferences.

## Subscription lifecycle
- Create checkout sessions on authenticated backend endpoints, with server-selected price IDs.
- Map Stripe customer ID to the authenticated Farefully user; do not rely on email alone.
- Verify Stripe webhook signatures and process at least `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and payment failure events.
- Handle duplicate and out-of-order events with a durable event log and latest subscription lookup.
- Offer self-service cancellation through Stripe's customer portal.
- Keep core allergy and dietary safety features available on the free tier.

## Launch acceptance tests
- Sign up, email verification, login, logout, recovery and cross-device session.
- Household migration with no data loss, including multiple profiles and dietary restrictions.
- Cross-device profile, meal plan and basket synchronisation.
- Monthly and annual checkout; payment success, failure, renewal, cancellation and expired access.
- Unauthenticated and cross-user API access rejected.
- Mobile basket, coeliac/wheat-free/halal restrictions and custom recipes regression-tested.
- Privacy policy, terms, refund/cancellation wording and customer support reviewed.
- Domain and IONOS email remain working.

**Do not publish paid checkout links before all acceptance tests pass.**

## Stripe sandbox foundation (11 October 2026)

Two Supabase Edge Functions and an unlinked local test harness are prepared:
- `supabase/functions/farefully-billing-test/index.ts`: authenticated sandbox Checkout, account status and billing portal.
- `supabase/functions/farefully-stripe-test-webhook/index.ts`: signed test-only webhook with idempotent event handling and current subscription retrieval.
- `app/billing-sandbox.html`: a noindex, unlinked, signed-in test page at https://farefully.co.uk/app/billing-sandbox.html. Its controls are hidden until the backend sandbox gate responds. No live subscription buttons are added to the consumer site.
- `supabase/migrations/20261011143000_billing_test_only.sql`: separate `public.billing_test_accounts` and `public.stripe_test_webhook_events` tables, with RLS.

**Critical guard:** `FAREFULLY_TEST_BILLING_ENABLED` defaults absent/false and the functions require `sk_test_` keys. Both URLs return an unavailable response unless deliberately configured. Only test prices are accepted, checked for `livemode=false`, GBP currency and exact approved amounts (£3.99 monthly, £34.99 yearly). Sandbox subscriptions write only to test tables and **NEVER** grant production Farefully Plus. The live `public.billing_accounts` and `get_farefully_plus_status` records/functions are untouched.

Deploy checkout with JWT verification **enabled** and webhook with JWT verification **disabled** (Stripe sends signatures, not Supabase JWTs; code verifies the raw signed request and test-mode flag before any database operations). Only checkout requests with a validated, confirmed Supabase user token and the Farefully origin are accepted. Do not copy API keys or webhook secrets into GitHub, frontend code, support chat or documentation.

### Project secrets needed for the disabled sandbox to become testable

Set in Supabase's protected Edge Function secrets **after** creating matching *test-mode* prices and webhook configuration in the Coloured Static Stripe account:

- `FAREFULLY_TEST_BILLING_ENABLED=true` (the only opt-in gate, **not set by this release**)
- `STRIPE_TEST_SECRET_KEY` (must start with `sk_test_`)
- Both test price IDs have been supplied and checked into the sandbox functions as public **non-secret** price identifiers. Do not add them as Edge Function secrets. Monthly £3.99: `price_1UPOGJIls1DIXPlbzChS3dll`. Annual £34.99: `price_1UPOHHIls1DIXPlber1baXmE`. The backend separately verifies the associated Stripe price is active, non-live, GBP, for the specified billing interval and correct amount.
- `STRIPE_TEST_WEBHOOK_SECRET` (test-mode Stripe webhook endpoint signing secret, begins `whsec_`)
- `STRIPE_TEST_PORTAL_CONFIGURATION` (optional specific *test-mode* billing portal configuration ID; if absent the account's test-mode default portal config must be enabled)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically to eligible Supabase Edge Functions. The service role is used only server-side and is never exposed to the browser.

Sandbox webhook endpoint URL when deployed:
`https://llhbudvpvqnogbgpvcug.supabase.co/functions/v1/farefully-stripe-test-webhook`

Listen to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Webhooks must be configured **in Stripe test mode**. The current Stripe connection in this workspace exposes the **live** Colouredstatic account only; the user supplied the IDs from the dedicated FarefullySandbox. Never reuse live price IDs or live Stripe API keys. Sandbox price identifiers are configured, but the test API secret, signing secret, webhook endpoint and portal configuration still require activation and verification.

### Remaining acceptance criteria

1. Confirm the two sandbox price identifiers belong to FarefullySandbox by running a test-only Stripe API call. Configure a test billing portal, a test webhook and protected secrets. Activate the opt-in test gate *only after reviewing these settings*.
2. Verify valid signed test webhook, invalid signature rejection, duplicate delivery and out-of-order events.
3. Test Checkout and portal with an authenticated throwaway user in Stripe test mode. Verify account-scoped sandbox rows change, **without** changing the live Plus RPC response.
4. Cover active, trialing, payment failure, cancellation, renewal, and webhook-retry paths; verify no accidental duplicate subscription or orphaned customer record.
5. Determine exactly which features are free versus Plus. Build production server-enforced entitlements after agreement; do not enable a subscription paywall yet.
6. Provide accessible customer billing/renewal/cancellation/privacy wording, account deletion/export and operational alerts. Test a second account for privacy isolation.
7. Perform a separate, explicit review and authorisation before any live Stripe settings, webhook endpoints, payment links, or paid checkout are switched on.

For CI, `node tests/billing-sandbox-smoke.mjs` verifies that no live keys or live-price IDs enter the sandbox source and that authentication, strict price checks, signed webhooks, test-only tables and fail-closed gates are present. **Static checks are not equivalent to an actual Stripe test transaction.**
