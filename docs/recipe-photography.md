# Farefully recipe photography catalog

## Beta batch 1, 11 October 2026

Farefully has 220 built-in dinners. Four already have existing Wix-hosted images; this batch assigns **11 additional dish-specific illustrative photos**. Never silently assign a generic photo to another recipe unless someone checks that it matches the dish.

Images in `RECIPE_PHOTOS` are loaded as optimised third-party image URLs (typically 1100 pixels). Batch 1 uses [Unsplash](https://unsplash.com/license); Batch 2 includes [Pexels](https://www.pexels.com/license/) and Creative Commons photographs on Wikimedia Commons. Each image retains its individual source record. Photographer attribution and relevant Creative Commons licenses are displayed on the recipe detail page, with ingredient/presentation caveats. Recipe images are **illustrative**, not representations of the specific supermarket products or dietary/allergen guarantees.

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

After Batches 1 and 2: **27/220 built-in dinners** have assigned actual photographs (four pre-existing, 23 curated). The remaining 193 use the existing illustrated fallback. User-created recipes are unaffected.

Next: source specific, suitable images for the remaining most frequently suggested dinners, prioritising existing saved meal plans and then expanding to the broader recipe library.

## Beta batch 2, 11 October 2026

Twelve newly mapped recipe photos. The illustrations below are **representative**, not pictures of the precise Farefully recipe or confirmation of its ingredients. Where an exact stock-photo match was unavailable, we chose an image of the same type of prepared dish and included an explicit caveat next to the credit. Those images should be replaced with exact recipe photography when available.

| Recipe ID | Recipe | Image source | Photographer | Match note / license |
| --- | --- | --- | --- | --- |
| `pasta` | Chicken pasta bake | [Pexels](https://www.pexels.com/photo/delicious-baked-macaroni-in-glass-dish-38090650/) | Muhammad Khawar Nazir | Baked pasta; chicken not independently verified as pictured, Pexels |
| `chickenbacon` | Chicken & bacon pasta | [Pexels](https://www.pexels.com/photo/close-up-photo-of-delicious-pasta-12557555/) | Alejandro Aznar | Creamy bacon pasta; chicken may not be visible, Pexels |
| `sausagecass` | Sausage casserole | [Pexels](https://www.pexels.com/photo/delicious-beans-with-bits-of-sausages-in-a-pan-9201962/) | Erik Mclean | Sausages and beans in pan, Pexels |
| `sausagetray` | Sausage & vegetable traybake | [Pexels](https://www.pexels.com/photo/rustic-potato-and-sausage-dish-on-checkered-cloth-37275057/) | cami | Roasted sausage and potatoes, vegetables vary, Pexels |
| `burgers` | Homemade beef burgers | [Pexels](https://www.pexels.com/photo/beef-burger-with-tomato-and-lettuce-14509069/) | Ruben Dao Cuentas | Beef burger, Pexels |
| `chickenburgers` | Chicken burgers & wedges | [Pexels](https://www.pexels.com/photo/chicken-burger-with-fries-1431305/) | Anush Gorak | Chicken burger with fries, not wedges, Pexels |
| `fishpie` | Easy fish pie | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Fish_Pie.jpg) | Atelier Joly | Actual fish pie with mashed potato topping, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `tunapasta` | Tuna pasta bake | [Pexels](https://www.pexels.com/photo/creamy-baked-pasta-dish-on-white-napkin-35622190/) | bams awey | Baked pasta; tuna not independently verified as pictured, Pexels |
| `jacket` | Jacket potatoes, beans & cheese | [Unsplash](https://unsplash.com/photos/a-white-plate-topped-with-a-baked-potato-covered-in-beans-7N2zWBNJ_Hw) | Gennady Zakharin | Baked potato with beans, cheese may differ, Unsplash |
| `tunajackets` | Tuna mayo jacket potatoes | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Baked_potato_with_tuna,_sweetcorn_and_mayonnaise_-_Waitrose_caf%C3%A9,_Worthing_2025-12-11.jpg) | Andy Li | Actual tuna and mayonnaise jacket potato, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `vegpastabake` | Vegetable pasta bake | [Pexels](https://www.pexels.com/photo/cheesy-baked-pasta-with-olives-and-peppers-34567494/) | Tanha Tamanna Syed | Baked pasta with peppers and olives, Pexels |
| `chickpeacurry` | Chickpea curry | [Pexels](https://www.pexels.com/photo/food-healthy-beans-dinner-6544375/) | Alesia Kozik | Chickpea and rice curry bowl, Pexels |

**Batch 2 licensing:** Individual Pexels source pages indicate “Free to use”; Unsplash image page indicates “Free to use under the Unsplash License”; Wikimedia file pages specify CC BY-SA 3.0 and CC0 1.0 respectively. CC BY-SA requires appropriate attribution, the linked license and indication of adaptations; recipe detail retains these links and the photos are automatically cropped only for presentation. No stock photo establishes food-safety or ingredient accuracy.

**Release checks:** `tests/recipe-photography-smoke.mjs` covers 23 mapped images, 3 source types, URL shapes, attribution, license links, photo fallbacks and recipe IDs. GitHub Pages deployment must be checked separately before claiming this batch is live.
