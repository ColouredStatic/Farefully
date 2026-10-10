# Farefully Plus production integration

Status: **NOT LIVE. Do not accept paid subscriptions until the checks below pass.**

## Production source of truth
- GitHub repository: `ColouredStatic/Farefully`, branch `main`.
- Public app: `https://farefully.co.uk/app/` (GitHub Pages).
- IONOS manages the domain and email. Preserve existing DNS/email records.
- The Wix deployment is a secondary copy. Never overwrite the GitHub app with older Wix files.
- Existing household profiles are stored in browser localStorage under `farefully_profiles_1` and active profile ID under `farefully_active_1`. Legacy keys `tp_profiles_2` and `tp_active_2` may exist.

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
