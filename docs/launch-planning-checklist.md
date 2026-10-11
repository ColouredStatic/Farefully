# Farefully UK launch planning

Status: internal preparation only. No live billing is authorised.

## Product offer
Free: core dietary safety filters, seven-day planning, saved household, recipes, shopping basket and cloud sync.
Plus proposal: fourteen-day planning, extra recipe and basket controls, advanced repeat variety and optional verified retailer savings. Proposed prices are GBP 3.99 monthly and GBP 34.99 yearly. Requires owner sign-off and feature enforcement before advertising these as paid benefits.

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
