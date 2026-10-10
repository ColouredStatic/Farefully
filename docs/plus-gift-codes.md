# Farefully Plus gift-code programme

Status: **Prepared. Redemption locked until paid-feature launch.**

## Gift types
- Friends & Family: lifetime Plus, 10 total account redemptions.
- Beta VIP: 12 months of Plus from redemption, 20 total account redemptions.
- Each account may redeem each gift-code type at most once. An existing lifetime member does not consume another code.
- Each shareable code is generated with high entropy; only its SHA-256 digest is stored in Supabase. **Do not commit plaintext codes** to GitHub.
- Redemption requires a verified, authenticated Supabase account and is rate limited (8 attempts per 15 minutes/account).
- Gifts and paid Stripe subscriptions are separate. Redeeming a gift does not cancel a recurring subscription.

## Database infrastructure (Supabase project farefully-production)
- `private.plus_gift_codes`: private digests, allowance counts, validity, grant period.
- `private.plus_gift_redemptions`: server-side records, with one use per code/account.
- `private.plus_gift_attempts`: brute-force rate limiting.
- `private.plus_gift_launch_control`: initially `redemption_open=false`.
- `public.plus_gift_memberships`: RLS-protected, owner-readable gift entitlements.
- `public.redeem_plus_gift_code(text)`: authenticated-only, server-side redemption with row locking and launch gate.
- `public.get_farefully_plus_status()`: authenticated, RLS-checked entitlement status (read only).
- `public.is_plus_gift_redemption_open()`: authenticated-only, read-only launch gate check.

## Frontend
`app/account.html` offers the gift-code input and membership status for signed-in users. The Redeem control is disabled while the launch flag is off.

## Before enabling redemption
1. Confirm GitHub Pages serves the updated account page and email confirmation/reset redirect works.
2. Verify a genuine user's sign-in and cloud profile backup/restore, including dietary preferences.
3. Enforce Plus entitlements in the actual meal planner **server-side**; RPC status displayed on the account page alone does not gate paid features.
4. Complete Stripe Checkout, subscription webhook signatures, entitlement lifecycle, cancellations and payment-failure handling.
5. Test two separate accounts redeeming limited codes, repeat use, invalid/expired/exhausted codes, and full-cap concurrent requests.
6. Confirm the 12-month grant begins no sooner than paid launch. The gate must remain off until launch.
7. Enable gift redemption in Supabase only after all launch checks pass.

**Do not store the codes in public website source or enable payment processing before the billing acceptance tests pass.**
