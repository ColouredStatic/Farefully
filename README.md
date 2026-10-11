# Farefully public beta

Farefully is a family meal planner and shopping-list application.

## Production
- **Frontend:** GitHub Pages, `https://farefully.co.uk/` and `/app/`.
- **Database and authentication:** Supabase `farefully-production`, London (`eu-west-2`).
- **Email and domain:** IONOS. Do not alter DNS or mail records as part of app updates.
- **Account page:** `/app/account.html` (email sign-up, login, password recovery, gift membership status).
- **Planner:** `/app/index.html`, `/app/app.js`. Requires a signed-in account and loads profiles from the `public.households` table.
- **Cloud saving:** Every profile change queues an account-scoped write through Supabase `save_household_versioned` or `delete_household_versioned` RPCs. PostgreSQL household revisions and atomic compare-and-save checks prevent a stale session from silently overwriting newer updates. The account-specific localStorage cache and pending-write outbox retain unsent changes. On a version conflict, the user chooses which copy to keep; choosing the cloud copy also preserves the unsent edits as a browser-only backup.
- **Household resets:** Admin-only reset markers in `public.household_reset_epochs` let devices clear stale account-scoped household caches on their next sign-in/refresh. Auth, payments and Plus membership are unaffected. Only household data is purged.
- **Display recovery:** The planner has a render-error boundary with a visible retry gate; regressions should never silently leave the basket blank.
- **Regression checks:** `node tests/planner-startup-smoke.mjs` tests a saved 14-day basket render, malformed local cache handling and account reset recovery. `.github/workflows/planner-smoke.yml` runs the checks on relevant pushes and pull requests.
- **Previous beta profiles:** Remain stored under legacy `farefully_profiles_1`, `farefully_active_1` and `farefully_state_*` keys, but are deliberately **not migrated** to the new account. Customers start a new household.
- **Gifts:** Lifetime and 12-month gift entitlements are prepared but redemption remains locked until the Plus launch.
- **Stripe:** Existing product and prices are created, but checkout/webhooks and paid access are **not live**.

## Household Fit explanations

The customer-facing recipe assessment uses **Excellent fit**, **Good fit**, **Worth considering** or **Outside your rules**, not the numerical `fitScore` heuristic. `fitScore` is used internally for ranking and is **not** a statistical percentage or a prediction of enjoyment.

- Fully eligible, unrated recipes are **Good fit** by default, not penalised for a lack of positive feedback.
- Recipes with multiple positive taste signals or a loved rating can be **Excellent fit**.
- “Not keen”, mixed feedback or prep time above the household preference produces **Worth considering**.
- Recipes violating any hard food exclusion, dietary rule or “Don't suggest” rating are **Outside your rules** and must stay excluded from future recommendations.
- Expand **Why this fits your household** on plan cards, swaps or recipe detail to see specific evidence and limitations.
- Never infer supermarket-product allergen safety or checkout price from the fit label.

Regression checks: `node tests/household-fit-smoke.mjs`. The GitHub Actions planner smoke workflow includes these checks alongside the existing household/basket startup tests.

## Publishing checks
Before shipping any planner change, run `node tests/planner-startup-smoke.mjs` and check the GitHub Actions planner smoke workflow. A working browser login is not proof that the meal plan or basket rendered successfully.

1. Validate syntax for `/app/app.js` and the account page scripts.
2. Confirm the GitHub Pages version displays the authentication gate for signed-out visitors.
3. Register and verify an account, save a new household, sign in on a second device and check the restored plan, preferences, basket and custom recipes.
4. Disconnect the network after making a change; confirm a pending-write warning appears and the change uploads after reconnecting.
5. Confirm one account cannot read or modify another account's household.
6. Verify concurrent editing on mobile and desktop: a stale session must show conflict choices rather than overwrite a newer cloud revision. Finish account deletion/export before leaving public beta.
7. Do not enable paid checkout or gift redemption until the subscription backend and end-to-end tests pass.

Support: support@farefully.co.uk  
General: hello@farefully.co.uk
