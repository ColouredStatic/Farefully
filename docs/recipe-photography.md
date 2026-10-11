# Farefully recipe photography catalog

## Beta batch 1, 11 October 2026

Farefully has 220 built-in dinners. Four already have existing Wix-hosted images; this batch assigns **11 additional dish-specific illustrative photos**. Never silently assign a generic photo to another recipe unless someone checks that it matches the dish.

Images in `RECIPE_PHOTOS` are loaded as optimised 1100-pixel Unsplash URL variants. The linked free-use photo pages explicitly state they are covered by the [Unsplash License](https://unsplash.com/license). Photographer attribution is voluntarily displayed below each recipe's main picture, along with a notice that ingredients and presentation may differ. Recipe images are **illustrative**, not representations of the specific supermarket products or dietary/allergen guarantees.

| Recipe ID | Meal | Photographer | Free photo and source |
| --- | --- | --- | --- |
| `fish` | Fish fingers, chips & peas | Haseeb Modi | [Unsplash photo](https://unsplash.com/photos/a-white-plate-topped-with-french-fries-and-other-foods-9fUCAqck4Zs) |
| `roast` | Roast chicken dinner | Sue Winston | [Unsplash photo](https://unsplash.com/photos/a-white-plate-topped-with-different-types-of-food-1WCLIjfXDeg) |
| `bolognese` | Spaghetti bolognese | Zayed Ahmed Zadu | [Unsplash photo](https://unsplash.com/photos/spaghetti-bolognese-served-on-a-teal-plate-with-garnishes-rQCBC9EgoDE) |
| `meatballs` | Beef meatballs & spaghetti | Pablo Arroyo | [Unsplash photo](https://unsplash.com/photos/a-plate-of-spaghetti-with-meatballs-on-it-F3Ubth-HgMM) |
| `fajitas` | Chicken fajitas | Hybrid Storytellers | [Unsplash photo](https://unsplash.com/photos/chicken-fajitas-with-onions-peppers-and-sour-cream-R8XWXFgz9fQ) |
| `maccheese` | Macaroni-style cheese | Leanna Myers | [Unsplash photo](https://unsplash.com/photos/a-bowl-of-macaroni-and-cheese-Vkx_ZpQwQgE) |
| `eggfriedrice` | Egg fried rice | Uday Agastya | [Unsplash photo](https://unsplash.com/photos/a-close-up-of-a-plate-of-food-on-a-table-XiPhmoXDCQ8) |
| `mixedbeanchilli` | Mixed bean chilli | Frank Holleman | [Unsplash photo](https://unsplash.com/photos/vegetable-dish-on-white-ceramic-bowl-Sw7HoZQaKT8) |
| `salmonrice` | Salmon rice bowls | Huyen Bui | [Unsplash photo](https://unsplash.com/photos/a-bowl-of-food-on-a-wooden-board-DqnkZIUL3e4) |
| `chickenalfredo` | Creamy chicken pasta | Sanket Deorukhkar | [Unsplash photo](https://unsplash.com/photos/chicken-dish-with-vegetables-and-a-side-8Rdkc11wFtk) |
| `rice` | Chicken & vegetable rice | Joe Boshra | [Unsplash photo](https://unsplash.com/photos/healthy-chicken-and-rice-bowl-with-fresh-vegetables-tB2MPTiSrsg) |

## Image display

- A photo appears consistently in the home hero, tomorrow's meal, plan cards, swap suggestions and recipe detail, with the existing four photos preserved.
- Photo and illustration layers are stacked in background cards; illustrated fallback remains visible if a remote photo fails.
- Small `img` thumbnails lazy-load and fall back to a dish-specific placeholder if the URL fails.
- Recipe detail displays the photographer source and explanatory notice. Photos are editorial illustrations, not a promise of exact plating.

## How to extend the library

1. Confirm the recipe name, main ingredients and cooked presentation first; do not use raw fish imagery for a cooked salmon dinner or a vegetarian photo for meat chilli.
2. Open the **individual photo page**, confirm that it says `Free to use under the Unsplash License`, record creator and photo page link; do not include Unsplash+ / other premium content.
3. Reuse the exact `images.unsplash.com/photo-...` image ID visible on that individual page. Use a bounded width and quality instead of a full-resolution download.
4. Add its mapping in `app/app.js` to `RECIPE_PHOTOS`, and update this ledger. Never change the recipe ingredients or dietary safety rules to fit a picture.
5. Run `node tests/recipe-photography-smoke.mjs`, `node tests/planner-startup-smoke.mjs`, and the full CI workflow. Review the images on an actual phone and desktop.
6. Check hotlink availability and long-term suitability. For production resilience, migrate approved photo files to owned hosting with a backed-up license/source ledger rather than relying indefinitely on third-party image hotlinks.

### Coverage

As of this batch: **15/220 built-in dinners** have assigned actual photographs (four pre-existing, 11 new). The remaining 205 use the existing illustrated fallback. User-created recipes are unaffected.

Next: source specific, suitable images for the remaining most frequently suggested dinners, prioritising existing saved meal plans and then expanding to the broader recipe library.
