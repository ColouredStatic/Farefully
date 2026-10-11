# Farefully UK supermarket integration strategy
Internal partner brief, 11 October 2026. No agreed commercial partners.

## The proposition
Farefully takes real household food preferences, dietary needs, budgets and pantry items, then produces a week or fortnight of meals and a grouped ingredient shopping list. The next step is a retailer-approved pathway from the shopping list to purchasable grocery products. Farefully does not currently offer a verified direct add-to-basket integration.

## Priority outreach order
1. **Samsung Food / Whisk for Business**. Explore recipe publisher / shopping-list partner routes, UK retailer handoff and licensing. https://samsungfood.com/business/ and https://support.samsungfood.com/hc/en-us/articles/360042706091-Integrated-Stores . Their public API documentation currently says new clients are not accepted, so this is an exploratory commercial enquiry, not a ready API: https://docs.whisk.com/api-overview/introduction .
2. **A smaller independent online grocery retailer using a supported commerce platform.** Ask for authorised product catalogue access and an approved hosted basket referral pilot. Look for a technical and trading contact willing to run a small proof of concept.
3. **Sainsbury's digital grocery and innovation partnerships.** Its SmartLists launched in October 2026: https://corporate.sainsburys.co.uk/news/press-releases/sainsbury-s-launches-smartlists-a-new-ai-powered-way-to-shop/ . The differentiator must be mixed-diet households, not generic AI lists. No public third-party basket write access confirmed.
4. **Tesco digital grocery/product partnerships.** Tesco has its own Meal Planner beta: https://www.tesco.com/help/pages/online-grocery-faqs/meal-planner/introducing-the-meal-planner . Request a user research or authorised handoff pilot rather than assuming a public API exists.
5. **Ocado Group / Ocado Retail.** Explore retailer marketplace integration or approved handoff; likely a larger commercial conversation: https://www.ocadogroup.com/newsroom/stories/exploring-osps-integrations-to-marketplace-and-aggregators .
6. **Innovate UK Business Connect** for introductions to foodtech and retail technology partners: https://www.ukri.org/councils/innovate-uk/guidance-for-applicants/general-guidance/support-for-you-and-your-application/ .

## Integration stages
**Phase 1, now:** one canonical basket line per ingredient, quantity/unit conversions, allergens, household restrictions and user-verified brand choices. Keep checklist and copy/print export as reliable fallbacks.

**Phase 2, authorised catalogue:** map ingredient names and quantities to actual retailer SKUs, pack prices and stock. Show the source/date of each price, label substitution warnings, and calculate total only from verified matched items.

**Phase 3, basket handoff:** use an official partner API, supported checkout link or authorised single sign-on. The supermarket owns actual checkout, payment, stock confirmation and fulfillment. Require consent and do not collect supermarket login details.

**Phase 4, measured pilot:** track opt-in funnel from plan to list to handoff. Negotiate licensing, referral attribution and data retention with partner. Seek explicit permission for any retailer brand assets.

## Pilot ask
Offer a 12-week co-design pilot for approximately 25–50 opted-in UK households with one retailer. Measure successful product matching, quantity accuracy, user-approved substitutions, handoffs, and retailer conversion when partner permits. Agree support arrangements and legal/data ownership before any live order transfer.

## Early sales evidence needed
Two-minute demo, screenshots of difficult dietary combinations, household match and recipe-to-basket, basic user retention and user testimonials with permission, privacy plan, error rates, ingredient unit quality and how allergen-label verification works.

## Partner outreach email template
Subject: Farefully x [Partner] | Family meal planning to grocery basket pilot

Hello [Name],

I'm developing Farefully, a UK meal-planning tool that helps households with different food preferences, dietary requirements and budgets create practical meals and a consolidated shopping list.

We're exploring a small pilot to transfer user-approved shopping lists into a retailer's existing online basket, using an authorised integration rather than scraping or automating customer accounts.

Could you introduce me to the person responsible for digital grocery partnerships or ecommerce integrations? I can send a concise demo and a 12-week pilot outline with product matching, dietary checks, privacy and measurable referral outcomes.

Kind regards,
The Farefully team
hello@farefully.co.uk

## Non-negotiable safeguards
Never present cross-contamination safety as guaranteed or automate substitutions where allergies/coeliac requirements are involved. Retain manufacturer-label warnings. Do not claim partnerships, live prices, wholesale retailer data or checkouts until formally authorised.
