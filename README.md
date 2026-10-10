# Farefully public beta

Farefully is a family meal planner and shopping-list application.

## Production
- **Frontend:** GitHub Pages, `https://farefully.co.uk/` and `/app/`.
- **Database and authentication:** Supabase `farefully-production`, London (`eu-west-2`).
- **Email and domain:** IONOS. Do not alter DNS or mail records as part of app updates.
- **Account page:** `/app/account.html` (email sign-up, login, password recovery, gift membership status).
- **Planner:** `/app/index.html`, `/app/app.js`. Requires a signed-in account and loads profiles from the `public.households` table.
- **Cloud saving:** Every profile change queues a Supabase upsert/delete protected by row-level security. The account-specific localStorage cache and pending-write outbox allow retrying unsent changes.
- **Previous beta profiles:** Remain stored under legacy `farefully_profiles_1`, `farefully_active_1` and `farefully_state_*` keys, but are deliberately **not migrated** to the new account. Customers start a new household.
- **Gifts:** Lifetime and 12-month gift entitlements are prepared but redemption remains locked until the Plus launch.
- **Stripe:** Existing product and prices are created, but checkout/webhooks and paid access are **not live**.

## Publishing checks
1. Validate syntax for `/app/app.js` and the account page scripts.
2. Confirm the GitHub Pages version displays the authentication gate for signed-out visitors.
3. Register and verify an account, save a new household, sign in on a second device and check the restored plan, preferences, basket and custom recipes.
4. Disconnect the network after making a change; confirm a pending-write warning appears and the change uploads after reconnecting.
5. Confirm one account cannot read or modify another account's household.
6. Complete customer account deletion/export and automatic sync conflict resolution before leaving public beta.
7. Do not enable paid checkout or gift redemption until the subscription backend and end-to-end tests pass.

Support: support@farefully.co.uk  
General: hello@farefully.co.uk
