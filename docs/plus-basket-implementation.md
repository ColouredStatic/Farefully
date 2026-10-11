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
- The first split-fortnight preview, aisle ordering and manually entered spend comparison are now working in beta; automated checkout, real SKU mapping, editable trip allocation and more sophisticated waste optimisation remain future work. Paid launch is still blocked.
- Code is not a guarantee of diet/allergen safety; review product labels, pack quantities and real checkout prices.

## Second Plus basket slice, implemented 11 October 2026
- Server-authorised `farefully_plus_shopping_tools` checks the signed-in member's own gift or live active paid entitlement, never sandbox billing. Private shopping preferences are keyed to the account and household. Anonymous users and direct private table access are blocked.
- **Two-trip basket preview** calculates days 1–7 and 8–14 from recipe ingredients (dinners plus breakfasts, lunches and snacks), confirms total consumption against the signed-in household's saved need, applies existing pantry quantities to the first trip, and returns separate model pack counts. It is not a perishable shelf-life guarantee, retailer transfer, or double-counted new basket.
- **Custom aisle ordering** moves existing grocery categories up/down and persists them per household via a membership-checked RPC. Normal Free grouped shopping stays untouched.
- **Actual spend** permits one user-entered amount per household, stored independently from the regular shopping list. The interface compares it with the *current model estimate*, clearly warning that grocery extras, substitutions and changes to the meal plan can make the comparison non-like-for-like. It is not a verified checkout price or transaction history.
- The public homepage and unlinked Plus preview distinguish these beta features from future improvements. Free retains unlimited seven-day regenerations, standard recipes and the practical shopping list.
- Migration: `supabase/migrations/20261011_plus_shopping_tools.sql`; applied in the Farefully production Supabase project. The fourteen-day Free write gate and live checkout remain disabled.

## Next implementation slices
1. Improve realistic SKU/pack-size data provenance and handle excess purchase waste explicitly, without guaranteeing shelf life or product safety.
2. Add editable trip assignments and safe reuse of sealed non-perishables rather than simply showing two estimates.
3. Build a detailed receipt/actual spend history if user demand justifies it.
4. Complete independent paid entitlement enforcement for all premium features, cancellation/downgrade messages and legal readiness. Public billing may only be enabled after separate approval.

## Testing additions
- `tests/plus-shopping-tools-smoke.mjs` mocks Plus and Free, asserts that weekly ingredient totals reconcile, exercises secured settings saves and confirms the Free basket does not change.
- Supabase `farefully_plus_shopping_tools` was checked with an existing Plus gift in a rolled-back transaction and verified to reject accounts without Plus. Direct `anon` RPC access and authenticated direct-table access are denied.
- Real mobile UX, pantry edge cases and cross-device acceptance remain to be checked before selling memberships.

## Tests
`tests/plus-basket-smoke.mjs` runs with synthetic mock signed-in Free and Plus responses. The planner workflow checks syntax and regression tests. Back-end manually read-tested on an already gifted Plus account. A full end-to-end two-account acceptance test is still necessary before charging.
