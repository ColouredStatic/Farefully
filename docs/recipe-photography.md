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

After Batches 1–3: **39/220 built-in dinners** have assigned photographs (four pre-existing, 35 curated). The remaining 181 use the existing illustrated fallback. The last-reviewed 14-day beta plan has imagery for all its dinners, including two covered in the earlier batches. User-created recipes are unaffected.

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


## Beta batch 3, 11 October 2026: plan-prioritised images

Twelve assigned illustrative images target dinners that have appeared in a beta household's two-week plan. Image captions explicitly disclose when stock photography shows only part of the meal. These are **not** prepared Farefully recipe photographs, verified ingredient lists, or evidence of dietary suitability.

| Recipe ID | Dinner | Photographer | Individual source page | Photo-versus-recipe note |
| --- | --- | --- | --- | --- |
| `omelette` | Cheese omelette, wedges & peas | The Findin Pixels | [Pexels](https://www.pexels.com/photo/close-up-of-omelette-with-peas-and-tomato-sauce-37287421/) | Omelette and peas shown, not wedges/cheese |
| `fishrice` | Crispy fish & rice | Jesus Cabrera | [Pexels](https://www.pexels.com/photo/fried-fish-with-vegetables-and-rice-on-white-ceramic-plate-5041493/) | Fish, rice and vegetables; coating may differ |
| `eggchipspeas2` | Eggs, homemade chips & peas | Spencer Davis | [Pexels](https://www.pexels.com/photo/close-up-of-a-meal-4393015/) | Egg and chips, peas not shown |
| `tunafishcakeshome` | Homemade tuna fishcakes & peas | Andi Farruku | [Pexels](https://www.pexels.com/photo/a-close-up-shot-of-fried-fish-cakes-on-a-wooden-board-8732583/) | Fishcakes; tuna filling and peas not verified |
| `baconeggskillet` | Bacon, egg & potato skillet | freestocks.org | [Pexels](https://www.pexels.com/photo/eggs-with-meat-in-cooking-pan-1412010/) | Bacon and eggs, potatoes/peas not shown |
| `breakfastdinner` | Eggs, beans & toast | Julian Jagtenberg | [Pexels](https://www.pexels.com/photo/fried-egg-and-bread-pklatter-103124/) | Eggs, baked beans and toast |
| `roastchickenleft` | Roast chicken & vegetable leftovers bowl | Helen Brudna | [Pexels](https://www.pexels.com/photo/delicious-roast-chicken-with-fresh-vegetables-32023530/) | Roasted chicken and vegetables, not a leftovers bowl |
| `beefshepherdwraps` | Cottage pie wraps | Farefully (AI-generated) | [Farefully-hosted illustration](https://static.wixstatic.com/media/88ce25_c96f0e1ad3c344588e4854931f6d9ec9~mv2.jpg) | Beef mince, mashed potato and peas in grilled wraps; garnish may differ |
| `eggchickpeacurry` | Egg & chickpea curry | Pranjall Kumar | [Pexels](https://www.pexels.com/photo/green-masala-egg-curry-dish-in-bowl-8625813/) | Egg-and-spinach curry, chickpeas/rice not pictured |
| `porkchopsmash` | Pork chops, mash & green beans | Valeria Boltneva | [Pexels](https://www.pexels.com/photo/pork-chop-and-potatoes-17628617/) | Pork chop and mash, green beans not necessarily shown |
| `beefburgerbowl` | Burger bowls with wedges | Farefully (AI-generated) | [Farefully-hosted illustration](https://static.wixstatic.com/media/88ce25_0bb6cd3a41324ac7b7d228addb6b24ee~mv2.jpg) | Beef mince, lettuce, cheddar, salsa and wedges; extra vegetables may differ |
| `chillijackets2` | Chilli-loaded jacket potatoes | Deepthi Clicks | [Unsplash](https://unsplash.com/photos/a-table-topped-with-bowls-filled-with-food-1_uLJ-gMEHQ) | Beef-and-bean chilli and baked potato separately, not loaded jacket |

All linked Pexels pages are marked free to use under the [Pexels License](https://www.pexels.com/license/); the individual Unsplash page indicates free use under the [Unsplash License](https://unsplash.com/license). The Unsplash page's original image URL was inspected and its photo ID matched against the recipe mapping. Batch 3 does not change the consumer's household data, meal selection, ingredients, shopping basket, or pricing calculations.

**Editorial update, 11 October 2026:** The two lowest-fidelity stock photographs (cottage-pie wraps and burger bowls with wedges) were replaced with individual, generated illustrations styled to the Farefully recipe ingredients. The first source is the original image generated for Farefully; the copyright/license of stock suppliers does not apply to these images. Both JPEG files were uploaded to the user's Farefully Wix Media Manager and publicly linked on `static.wixstatic.com`. Their recipe credits display **AI-generated Farefully recipe illustration** rather than inventing a photographer or implying an exact finished-dish photograph. The generated pictures can include illustrative garnishes not in the recipe: the ingredient list is authoritative.

The photo total remains **39/220**, because these replace two previously assigned photos rather than cover new meals. The next editorial improvement is to cook and photograph these recipes ourselves for an exact plate-by-plate match.

**Beta imaging notes:** Farefully-owned generated pictures are stored in Wix Media Manager as optimised JPEG files, not third-party stock hotlinks. They are clearly described as AI-generated and may contain presentation variations. Stock-photo provider licenses and attribution are unchanged for every other meal.
