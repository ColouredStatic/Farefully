# Farefully: approved Free/Plus product boundary
Owner direction approved 11 October 2026: Free must be genuinely useful to most families; Plus must visibly save further effort. This is the **commercial design**, not yet implemented as a paywall or live billing.

## Product promise
- Free solves the weekly problem, safely, without requiring a credit card or artificial friction.
- Plus makes the same household routine faster, less repetitive and easier to manage across a fortnight, not more medically safe.
- A paying member must receive additional working functionality, not promises about future retailer integrations.
- No loss of stored meals, household data, preferences or shopping lists after cancellation. Premium editing/generation may cease, but existing content stays available.

## Approved capability boundary
| Capability | Free | Plus |
|---|---|---|
| Household adults/children, dislikes, favourite foods, allergy/Coeliac/halal/vegetarian/vegan rules | Full support | Full support |
| Safe recipe matches and required ingredient/packaging checks | Full support | Full support |
| Meal-plan length | 7 days at launch | 7 or 14 days |
| Recipe catalogue and detailed instructions | Access to core catalogue | Same catalogue; no artificial safety omissions |
| Household pantry and shopping lists | Practical pantry deductions; grouped grocery list with quantities, ticks, everyday extras, cloud sync and copy/share | Everything in Free plus optional advanced shopping automation and optimisation |
| Account, saved preferences, cloud sync, mobile basket | Included | Included |
| Swaps and avoiding unacceptable foods | Included | Additional variety controls and repeated-meal management |
| Batch/freezer-friendly meals | Available | Advanced multi-day batch/prep workflows |
| Custom recipes | Starter collection (limit to be user-tested before adoption) | Expanded collection (size and technical cap to be agreed) |
| Grocery budget and retailer estimates | Basic basket estimate and verified offers with source/date disclosures | Planned-versus-actual spending, smarter pack/waste comparisons and advanced verified offer scenarios, where trusted data exists |
| Advanced shopping organisation | Essential checklist, current-category grouping and official retailer links | Saved custom aisle order, two-trip split for a fortnight, advanced stock-up reminders (once built) |
| Automated online supermarket basket | Neither tier until partner authorised | Future partner-dependent capability, not sold as present |

**Keep all allergy, ingredient cross-contamination and Coeliac label-check warnings free.** These are user safety, not upsells. If a verified retailer offer is needed to make a product claim, don't claim it without feed, date and provenance. Every retail substitution must preserve dietary restrictions and user choice.

## What makes Plus worth paying for
1. **Fortnight at a glance:** one reliable 14-day plan with fewer repeated meals, a single consolidated basket and clear batch recommendations.
2. **Fewer swaps needed:** controls to avoid too-frequent meals, respect household vetoes, and rotate favourite meals intentionally. Do not imply these cannot be used on Free; Plus offers greater depth.
3. **Better preparation:** an advanced weekend batch cooking/freezer view that groups ingredients and cooking steps, and can indicate leftovers across days.
4. **A smarter shopping companion:** minimise duplicate ingredients and excess pack quantities, optionally split a 14-day list into two visits, compare planned versus entered actual spending, and customise aisle order. These premium improvements must be implemented and validated, not inferred from an estimate.
5. **Less shopping rework:** trusted, dated and disclosed supermarket offers, only where a legitimate verified feed exists; no fabricated savings.
6. **Flexible membership:** £3.99/month or £34.99/year; self-service renewal and cancellation; existing lifetime entitlement always overrides the need to purchase.

Prioritise a clearly working premium basket enhancement alongside fortnight planning, variety and batch preparation for launch. More speculative retailer integration is a separately funded partnership roadmap.

## Existing accounts and beta migration
The live beta app currently defaults to 14 days for everyone. **Do not retroactively truncate or replace a user's existing plan.** Retain fourteen-day generation while beta is in progress. Before switching on the Free plan at paid launch, show a clear product change notice, move future Free plan creation to seven days, preserve previously generated 14-day plans and their associated shopping lists read-only as necessary. Plus and lifetime gifts continue 14-day generation. Never change food restrictions during downgrade.

Do not silently move legacy beta users into billed subscriptions or start trials requiring a credit card. Only explicit opt-in can start a recurring payment.

## Access controls
The existing planner produces plans in the browser and stores JSON in RLS-scoped Supabase household records. A visual switch alone is NOT secure entitlement enforcement. Launch requires moving paid-only plan generation/limits to an authenticated server endpoint or validated database write path, using server-side user membership (public get_farefully_plus_status or equivalent), never trusting a client-sent tier or localStorage. Server rejects attempts to generate/save newly entitled 14-day Free plans, while old plans remain accessible. Test two users and expiry/cancellation.

Live Stripe remains disabled until these server controls, consumer terms and lifecycle are implemented and reviewed.

## Product tests and measurable success
- Free users should successfully create a household, find safe meals, build seven-day plans and complete shopping without payment.
- Plus users should have at least three demonstrably useful, implemented upgrades by checkout date.
- Cancelling should immediately retain working Free capability and all existing data, with Plus valid until current paid period ends where agreed.
- Track Free second-plan return, Plus upgrades, saved preparation time through surveys, grocery list completion, cancellations, and ingredient safety reports.
- Review conversion after real beta feedback, not by making Free progressively worse.
