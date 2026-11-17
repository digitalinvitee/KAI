# Image slots

The images in this folder are **AI-generated concept visuals** supplied by INVITÉ Studio.
They depict a fictional restaurant, not a real place, and the site footer says so. Each one
was cropped from a 1672 × 941 px master to its slot ratio at native resolution (nothing is
upscaled), so the current files are smaller than the slot sizes below. Replace any file with
a larger version under the **same file name**; no HTML or CSS changes are needed.

| File | Ratio | Current file (px) | Slot size for final images (px) | Used in | Shows |
| --- | --- | --- | --- | --- | --- |
| `kai-hero.webp` | 16:9 | 1672 × 941 | 2400 × 1350 | Hero, tablet and desktop | Chef at the hinoki counter, garden beyond |
| `kai-hero-mobile.webp` | 4:5 | 752 × 940 | 1080 × 1350 | Hero on phones | Portrait crop of the hero, on the chef |
| `kai-signature-dish.webp` | 4:5 | 752 × 940 | 1600 × 2000 | Philosophy, Fig. 01 | A single nigiri |
| `kai-detail.webp` | 1:1 | 940 × 940 | 1600 × 1600 | Philosophy, Fig. 02 | Sake flask, cup and a small course |
| `kai-omakase.webp` | 4:5 | 752 × 940 | 1600 × 2000 | Menu, Fig. 03 | Nigiri on a stone slab |
| `kai-interior.webp` | 3:2 | 1410 × 940 | 2400 × 1600 | The Space, Fig. 04 | The counter and chairs |
| `kai-chef.webp` | 3:4 | 705 × 940 | 1500 × 2000 | The Space, Fig. 05 | Chef finishing a tuna nigiri |
| `kai-gallery-01.webp` | 3:4 | 705 × 940 | 1500 × 2000 | The Space, Fig. 06 | Entrance garden and water basin |
| `kai-gallery-02.webp` | 16:10 | 1504 × 940 | 2400 × 1500 | The Space, Fig. 07 | Matcha dessert |
| `kai-private.webp` | 3:2 | 1410 × 940 | 2400 × 1600 | Private dining, Fig. 08 (shown 4:5 on large screens) | A drink in a coupe glass, sake flask and blossom behind |

## Fastest way to swap in final photos

1. Put the originals (JPG, PNG, TIFF, WebP or AVIF) into `images-src/` at the project root,
   named after the slot: `kai-hero.jpg`, `kai-chef.png`, …
2. Run `npm run images`.

Each original is smart-cropped to the slot's ratio, resized to the slot size and saved here
as WebP. Without a `kai-hero-mobile` original, the phone hero is cropped from `kai-hero`.
Use `npm run images -- --center` for plain centre crops.

## Fine-tuning the crop

Each `<img>` in `index.html` carries its focal point as a CSS variable, for example:

```html
<img class="media__img" src="assets/images/kai-chef.webp" … style="--focus: 50% 50%">
```

Change `--focus` (x% y%) to move the crop inside the frame, e.g. `--focus: 50% 30%`
keeps a face higher in a tall frame. The hero's `--focus` (`66% 50%`) keeps the chef in
frame on tablets; phones use the separate portrait file and `--focus-mobile`.

Alt texts and captions are translated in `src/js/i18n/locales/en.js` and `de.js`; update
them when an image changes.
