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

