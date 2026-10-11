# Farefully UK launch planning

Status: internal preparation only. No live billing is authorised.

## Product offer, owner-approved direction
**Product principle confirmed 11 October:** Free must genuinely work for the majority of households and should never rely on artificial friction. Plus must be visibly more useful and save real time, rather than paywalling safety.

**Free at launch:** seven-day meal planning, basic swaps and recipes, complete dietary safety and Coeliac packaging warnings, useful consolidated basket, pantry, saved household and cloud sync. No card needed.

**Plus, £3.99 monthly / £34.99 annually:** Free plus fourteen-day plans, deeper meal variety and repeat controls, batch/freezer and leftover planning, advanced personal recipe/pantry controls, and evidence-backed budget options when verified sources exist.

**Important scope distinction:** This is an approved product specification, not an implemented paywall. App beta currently defaults to fourteen-day plans for everyone and stays that way until the migration is communicated and secure feature gating passes. All current plans, data and lifetime Plus gift rights are protected.

**Engineering definition:** Existing app constructs plans in browser JavaScript and writes household JSON; server-side membership RPC is currently only an access badge. A paid-tier feature cannot be safely protected by browser restrictions alone. Implement actual server-side enforcement before activating live Stripe; no public subscriptions until then. Full specification: [Approved Free/Plus product boundary](approved-free-plus-spec.md).

## Technical prerequisites
1. Enforce tier access in the authenticated backend, not just interface controls.
2. Protect lifetime gifts and saved household data.
3. Prepare separate live billing and webhook integration behind a disabled launch switch.
4. Expose renewal, cancellation scheduled, expired and payment issue states.
5. Test ownership, data deletion, cancellation and allergy restrictions with automated checks.
6. Complete UK consumer terms, privacy, payment disclosures, receipts and support.
7. Launch to a small invited cohort before opening public checkout.

## Timing
Weeks 1-2 tier rules and server controls; weeks 3-4 billing and compliance; week 5 paid pilot after approval; week 6 public launch if stable.

## Metrics
Activation: saved household and first meal plan. Retention: second weekly meal plan. Track basket completion, subscriber conversion, cancellations and service issues. Never promise supermarket integration until formally authorised.


## Six-week action plan and responsible workstreams

| Window | Build / launch work | Acceptance criterion |
|---|---|---|
| Week 1 | Implement approved plan split; audit each planner feature and beta migration; avoid falsely paywalling basic dietary needs | Approved matrix with free-safe limits and lifetime gifts preserved |
| Week 2 | Authoritative Supabase entitlement checks for 7/14-day planning and premium capabilities; no JavaScript-only restrictions | Logged-out, Free, Plus, lifetime and second-user automated tests |
| Week 3 | Build separate production Stripe Checkout/Portal/webhook handlers behind a launch switch defaulting OFF | Server verifies live-only price, key, signature, deduplication, account ownership |
| Week 4 | Terms/cancellation disclosures, refund rights, support inbox, account data export/removal, allergen and basket regressions | Owner reviews legal copy and safety tests; no serious regressions |
| Week 5 | Invitation-only pilot with 10-20 consenting households, live payment only after explicit authorisation | Payment receipt and cancelation tests, support operation, daily reconciliation |
| Week 6 | Public launch and measured onboarding campaign if pilot stable | First-day and first-week dashboard; rollback plan; spend cap |

### Customer journey to ship
- Visitors see Free (no payment card) and Plus (GBP 3.99 per month or 34.99 per year) with correct recurring terms and clearly disclosed renewal.
- Signed-in users see plan, source of access (lifetime gift, fixed-term gift, or paid), renewal date, cancel-at-period-end state, and payment failure.
- Lifetime and gift members are not asked to buy duplicate subscriptions. A user who downgrades retains their saved recipes, plan history and existing basket.
- A secure account menu leads to invoices, payment method and self-serve cancellation; live billing portal is enabled only for users linked to an authenticated Stripe customer.
- Confirmation, change and cancellation emails have a monitored support address.
- Data is not sold or shared with grocers without consent; expiry and deletion policies cover dietary preferences and shopping histories.

### Safety, privacy and UK launch blockers
- Keep coeliac warnings, food-allergy exclusions, ingredient checks and dietary household safety on Free. Users always verify the final purchased product label. Follow Food Standards Agency guidance at https://www.food.gov.uk/food-safety-and-hygiene/food-allergies-intolerances-and-coeliac-disease .
- Do not imply that all listed grocery prices or promotions are live if they come from incomplete or expired feeds.
- Review UK Consumer Contracts Regulations, relevant in-force DMCC Act provisions and changes due next year before charging. Subscription renewal/cancellation rules can change; obtain professional legal review where appropriate: https://www.legislation.gov.uk/ukpga/2024/13/part/4 .
- Privacy page must explain actual storage, third-party processors (Stripe, Supabase), purpose, retention, UK privacy rights and support contact. Review data export/delete UX.
- Confirm VAT and business tax treatment with an accountant, reconcile Stripe payouts, and check the statement descriptor matches the disclosed trading entity.
- Preserve IONOS DNS and email, GitHub Pages deployment, existing Supabase auth and gifting scheme.

### Low-budget acquisition
First 100 beta households: existing Pinterest, voluntary personal contacts, UK family-meals creators, disability/caregiver and Coeliac community administrators who permit beta feedback posts. Show a real two-week meal plan, basket, costs and dietary options. Avoid unsolicited posting in closed support groups.
Second hundred: refine onboarding emails and recipe SEO; collect quotes only with consent; trial referral offers only after payment and gift accounting works.
Do not pay for large advertisements until repeated weekly usage is established.

### Weekly KPIs to monitor
- New accounts; first household created; first saved meal plan; basket opened/downloaded; second plan within 14 days.
- Household dietary restrictions consistency; reports of unsafe substitutions; ingredient quantity complaints; crash-free sessions.
- Free to Plus upgrade by cohort, monthly recurring revenue, payment errors, cancellation requests and refund outcomes.
- For retailers: percentage of basket items matching an approved SKU, user-confirmed quantity accuracy and opt-in handoff conversion.

### Example revenue scenarios (gross, not forecast)
- 25 monthly subscribers: GBP 99.75 per month.
- 100 monthly subscribers: GBP 399 per month.
- 250 monthly subscribers: GBP 997.50 per month.
All exclude processing costs, taxes, support, refunds, annual discounts and churn. No assumption that the conversion targets will be achieved.

### Launch authorisation checklist
Owner must approve (1) feature table, (2) trading identity and terms, (3) live backend and payments security review, (4) handling of existing lifetime gifts, (5) support readiness, (6) small live pilot, and only then (7) open public checkout. No live billing changes in this planning PR.
