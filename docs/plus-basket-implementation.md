# Farefully Plus basket: first secure feature and rollout notes

Status: implementation in beta, 11 October 2026. NOT live subscriptions. See the approved Free/Plus specification and issues #15/#16.

## Implemented in this change
- A server-only, authenticated pack-and-waste *review* based on the caller's saved household plan and nominal ingredient pack sizes. The function returns estimated leftover quantities for each item. It **does not** buy products, change recipe quantities, update a grocery basket, imply live shop pricing, or declare food safe to store.
- The client in `app/app.js` calls `farefully_plus_pack_review` after the household is synced, and renders the returned review without touching the Free basket or planner state.
- Free members can still use ordinary basket and recipes normally. The premium function checks a genuine live Plus gift or active real billing record; sandbox Stripe subscriptions never unlock Plus.
- A separate `farefully_feature_access` RPC reports authoritative plan access. A database trigger can reject new fourteen-day Free plans when the launch flag is enabled.
- **The plan enforcement flag defaults OFF.** Existing beta members, including Free, retain the currently offered fourteen-day plans, swaps and shopping functionality. No one is charged.
- Public homepage compares the intended Free and Plus offerings, clearly identifies under-development features, and retains public beta disclosure. It contains no purchase button.

## Applied Supabase migrations
- `supabase/migrations/20261011_plus_pack_review.sql`: verified member-only review of **saved household** `state.need` and `state.pantry` using model pack sizes supplied as bounded hints.
- `supabase/migrations/20261011_plus_plan_gate_disabled.sql`: private feature-policy switch, authoritative entitlement RPC, and trigger for newly generated extended plans. The switch is off and no table or customer data has been removed.

Deployment target: Supabase `llhbudvpvqnogbgpvcug`. Both migrations were executed on the production project once, then captured here as idempotent migration source. Any future migration pipeline must avoid treating them as new customer-facing feature activation.

## Access control limits
- This protects the **Plus pack review server operation** and prepares a server-side write gate for >7-day plans. It does not make all current browser-side planning logic paid-only. Do not enable live billing until remaining Plus operations are equally protected and UX migration is complete.
- `private.farefully_feature_policy.enforce_paid_plan_limits` must stay `false` until client code handles Free seven-day plans and previously saved fourteen-day plans without broken sync.
- Actual grocery optimisations, split fortnight shopping, store aisle ordering and spend comparison remain future work, not yet included in the premium product for sale.
- Code is not a guarantee of diet/allergen safety; review product labels, pack quantities and real checkout prices.

## Next implementation slices
1. Pack-size data quality: distinguish verified store pack sizes from model estimates, explain rounding, avoid inflated lettuce counts, and maintain ingredient exclusions.
2. Split one fourteen-day basket into two optional seven-day shops with perishable safeguards and clear override.
3. Add optional entered actual-price tracking, without presenting estimated price as real.
4. Custom aisle order saved to cloud without creating household sync conflicts.
5. Server-enforce remaining Premium actions and build tested cancellation/downgrade messaging; only then enable customer billing under explicit authorisation.

## Tests
`tests/plus-basket-smoke.mjs` runs with synthetic mock signed-in Free and Plus responses. The planner workflow checks syntax and regression tests. Back-end manually read-tested on an already gifted Plus account. A full end-to-end two-account acceptance test is still necessary before charging.
