-- Test-only billing ledger. NEVER use these rows to grant production Farefully Plus.
-- The live subscription source of truth remains public.billing_accounts, unchanged here.
create table if not exists public.billing_test_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive','incomplete','incomplete_expired','trialing','active',
      'past_due','canceled','unpaid','paused')),
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.billing_test_accounts enable row level security;

-- Users may inspect their own sandbox billing status; only service_role can write.
revoke all on public.billing_test_accounts from anon, authenticated;
grant select on public.billing_test_accounts to authenticated;
grant all on public.billing_test_accounts to service_role;
create policy "test_billing_read_own" on public.billing_test_accounts
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.stripe_test_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_test_webhook_events enable row level security;
revoke all on public.stripe_test_webhook_events from anon, authenticated;
grant all on public.stripe_test_webhook_events to service_role;
create policy "test_webhook_service_only" on public.stripe_test_webhook_events
  for all to service_role using (true) with check (true);

comment on table public.billing_test_accounts is
  'Sandbox subscription state for integration testing; never grants live Plus entitlements.';
comment on table public.stripe_test_webhook_events is
  'Idempotency ledger for Stripe test-mode signed webhook events only.';
