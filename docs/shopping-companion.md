# Farefully Shopping Companion

Status: First beta implementation on `/app/`. Shopping extras, collected ticks and checked progress are stored on the household account and synced through Supabase. Display settings such as search and in-store/online mode remain local to the browser.

## Implemented

- **In-store:** one-tap checkbox, collected progress (count and percentage), estimated spend on collected recipe groceries, search, show remaining only, reset shopping ticks with confirmation.
- **Everyday extras:** up to 60 extra items with optional free-text quantity, collected toggle and remove action. Names and quantities are escaped before rendering. They are **not** included in grocery price estimates or diet/allergen screening.
- **Online:** choose an official online grocery site (Tesco, Asda, Sainsbury's, Morrisons, Ocado, Waitrose), copy remaining grouped items with estimated product quantities, open the grocer site. Native mobile sharing is available where `navigator.share` is supported; elsewhere sharing falls back to copying the list.
- **Accessibility:** labelled controls, aria-pressed/aria-checked, keyboard-interactive grocery rows, descriptive buttons.
- **Data:** shopping extras and tick state are saved with household JSON and therefore follow the existing account-based cloud sync and revision-conflict safeguards.

## What this is NOT

- This is **not** automatic product matching, basket filling, retailer authentication, checkout, or order submission.
- Prices are Farefully model/snapshot estimates, **not** live till or final online checkout prices. Extras have no estimated cost.
- Customers must check supermarket stock, package sizes, labels, substitutions and final prices; Coeliac, allergy and dietary filters cannot guarantee a store product's suitability.
- The six external links open actual grocery storefronts. They do not claim a retailer partnership or a deep integration.

## Release test checklist

- [ ] On a small phone, check in-store / online mode, controls and quantity fields don't overflow.
- [ ] Mark an ingredient collected on mobile, wait for cloud-save confirmation, refresh desktop: item remains checked and progress matches.
- [ ] Add an extra, mark it collected, sign in on another device: extra and its tick persist.
- [ ] Remove an extra: it disappears on another device without deleting any recipe ingredient.
- [ ] Search by ingredient and choose “only remaining”; confirm all non-matching / collected rows and empty aisle cards are hidden.
- [ ] Reset collected ticks with confirmation; verify quantities, recipes and manual extras are unchanged.
- [ ] Copy/share remaining list on iOS/Android/desktop. Already collected entries must be excluded.
- [ ] Open the supermarket link and ensure it reaches the selected grocer, without implying automatic checkout.
- [ ] Turn internet off mid-shop, return online, confirm stored changes are eventually synced or a conflict is displayed.
- [ ] Two-device simultaneous editing: conflicts must not silently overwrite newer edits.

## Differentiation roadmap, not yet built

1. **Store-aware aisle sequence:** let shoppers save their preferred aisle order per branch (not all supermarkets lay stores out alike).
2. **Actual spend tracker:** optionally enter real shelf prices, discounts and substitutes so users can compare expected vs actual spend without conflating estimates and receipts.
3. **Safer substitutions:** show ingredient alternatives consistent with strict household dietary filters and clearly ask users to verify the exact product packaging.
4. **Household collaboration:** shared list with household invitations and member roles, avoiding password sharing.
5. **Retailer integrations:** only add product matching, order export or direct trolley-fill when a retailer grants documented and tested integration access. Keep user control and clearly distinguish retailer prices.
6. **Recipe photography:** properly licence and attribute actual dish photos. Do not repurpose random images from recipe websites or assume “free to view” means free for commercial reuse.


## Confirmed Free / proposed Plus separation

The owner approved keeping the everyday shopping basket good enough for most families while offering genuinely useful advanced basket workflows in Plus. **No entitlement changes have been activated in the beta.**

- **Free, always:** recipe ingredient list, correct household quantities and units, in-store collected ticks and progress, everyday extras, search and remaining-items filter, copied/shared shopping list, core pantry deductions, essential cloud sync, official links to grocers, basic estimates and safety warnings. These cannot be artificially disabled to force subscriptions.
- **Plus when built and server-authorised:** (1) pack-size and waste-aware optimisation without duplicating ingredients, (2) optional split of 14-day baskets into first and second shops so perishables aren't purchased too soon, (3) advanced planned-versus-actual cost tracker with optional shopper-entered actual prices, and (4) saved custom aisle sequence and advanced pantry/store-budget scenarios. Retailer offer comparisons are included only where data rights and freshness permit.
- **Never automatically promised:** automatic supermarket basket filling, access to a retailer's login, real-time prices or stock, or supermarket endorsements. Those require separate partner authorisation and product verification.
- **Data protection:** paid-plan expiration does not remove a household's basket, manual extras, tick history or recipes. Advanced editing/export rights must be designed to avoid data loss when downgrading.
- **Engineering:** the current browser-generated household JSON and frontend UI do not constitute secure subscription gating. Introduce server-side entitlement checks before restricting any premium basket action, and test legitimate Free usage, Plus, lifetime gift, expired Plus, offline mobile basket and cross-user isolation.

## Development priority locked, 11 October 2026

This implementation is P0 alongside authenticated, server-enforced Plus access. See [advanced basket ticket](https://github.com/ColouredStatic/Farefully/issues/16) and [secure entitlements](https://github.com/ColouredStatic/Farefully/issues/15). Free users retain the entire existing everyday basket. Premium features must be built, clearly differentiated and tested before a live paywall appears.
