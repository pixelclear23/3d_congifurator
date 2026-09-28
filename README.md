# 3D Configurator Toolkit — project site

A static, dependency-free page that explains the configurator toolkit: the Composer-side
capture tool, the browser UI builder, the streamed runtime overlay and the Kit extension
behind them.

Live: <https://pixelclear23.github.io/3d_congifurator/>

## Run it locally

No build step, no npm. Any static server works:

```powershell
python -m http.server 8080
# then open http://localhost:8080/
```

Opening `index.html` straight from disk also works.

## Layout

```
index.html          the whole page
styles.css          styles, no framework
main.js             mobile menu + "current section" nav highlight (optional)
assets/
  shot-viewer.*         the streamed runtime (the hero image)
  shot-capture.*        the capture tool docked in Omniverse Composer
  shot-builder.*        the browser UI builder
  pipeline.svg          the four stages and the artifact each hands on
  message-flow.svg      click -> configuratorApply -> handler -> USD -> video
  data-model.svg        the six captured JSON files and the two generated ones
  favicon.svg
```

The page is deliberately short — around 700 words, a three minute read — on the assumption
that the first visitor is skimming. The detail that used to be inline now lives behind the
"For engineers" disclosure in the pipeline section. If you add copy, add it there rather
than to the top-level sections.

Screenshots are real captures, downscaled to 1920px wide and served as WebP with a
progressive JPEG fallback through `<picture>`; each frame links to the full-size JPEG.
`shot-importer` is the exception: it is a UI panel, small text on flat greys, where JPEG
ringing shows and there is no photographic detail to lose — so it keeps its native 550×373
and ships as PNG with a `quality=92` WebP alongside. The
three explanatory diagrams are hand-authored SVG, because no screenshot can show a data
flow — they also stay legible at any size, theme with the page and carry real text for
search and screen readers.

## Cross-faded frame sets

Two of them: the configurator hero backdrop (`.stage`) and the banner at the top of the Maya
page (`figure.banner .slides`). One function in `main.js` drives both — it runs over every
element carrying `data-slides`, and everything that differs comes off the container:

| attribute       | what it does                                                              |
| --------------- | ------------------------------------------------------------------------- |
| `data-slides`   | asset basenames to load, in order                                         |
| `data-alts`     | pipe-separated alt text, for a set that is content rather than decoration |
| `data-sentinel` | what to observe instead of the container, for a set that cannot report its own visibility |

Frame 1 ships in the markup, so neither set is ever empty; the rest are fetched one at a
time after load and only join the rotation once decoded. The size and shape of the built
frames are copied from the frame in the markup, so a 2000px backdrop and a 1920px banner
both work without the script knowing which is which. Rotation stops while the tab is hidden
or the set is off screen, and under `prefers-reduced-motion` it neither animates nor fetches
the extra frames at all — the markup frame is all a visitor gets, which is why frame 1 should
be the one that matters most.

Every frame in a set must share one aspect ratio or the cross-fade will jump. The banner set
is the bag shot followed by four RTX frames of the car (`car-1`..`car-4`, from
`Renders\mazarati_renders`, one per camera — the near-duplicate takes and the AO/clay passes
in that folder are skipped), all 1920×1080. Backdrop frames are cropped to fill; banner
frames are fitted, because the bag shot carries labels that must not be cut.

The backdrop frames come from `C:\Library\omiverse_project\Renders\website_image`, which also
holds white clay / AO passes; those are skipped, being far too bright to sit behind light text.
To swap a set, drop new renders in, regenerate them (backdrop: 2000px wide, WebP `quality=72`,
JPEG `quality=80`; banner: 1920px wide, WebP `quality=84 method=6`, progressive JPEG
`quality=86`) flattened onto `#0a0c0f` so no alpha can punch a white hole, and list them in
`data-slides` — adding a matching entry to `data-alts` for the banner.

To regenerate the screenshot derivatives after replacing a source capture, resize to 1920px
wide and export both formats (Pillow: `quality=84, method=6` for WebP, `quality=86,
progressive=True` for JPEG), then update the `width`/`height` attributes in `index.html` so
the space is still reserved before the image loads.

## Editing

- Copy lives in `index.html`; there is no templating to learn.
- Each diagram has a `<title>` and `<desc>` for assistive technology. If you change what a
  diagram shows, update its `<desc>` too — the `alt` text on the `<img>` is what most
  screen readers will announce.
- Section IDs are referenced by the nav; renaming one means updating both.

## Before sharing widely

- Add a real contact route. The Stack section currently points at the repository's issue
  tracker; swap in a mailto or a form if you would rather not use issues.
- The repository name has a typo (`3d_congifurator`). It appears in the published URL, so
  renaming it is worth doing before the link goes anywhere public. `gh repo rename` handles
  the redirect; the `<a href>` values in `index.html` and the URL above would need updating.
- The car model referenced in the "scene it was built against" section is a third-party
  asset. It is described, not redistributed, and the page says so.

## Dropping in the explainer video

The lead media slot in the "What I built" section is the video frame. It currently shows
`shot-viewer.*` as a placeholder. When the cut is ready:

1. Put the file in as `website/assets/explainer.mp4` (H.264 + AAC in an MP4 is the safe
   choice; a `.webm` also works and is typed automatically).
2. In `index.html`, set the attribute on that figure:
   ```html
   <figure class="shot media player" data-video="assets/explainer.mp4">
   ```

That is the whole change. `main.js` then draws a play button over the still and swaps in a
`<video controls autoplay playsinline>` on the first click, using the still as the poster so
there is no black flash. Nothing is downloaded until a visitor asks for it, and the
click-to-enlarge link on the still is removed at that point so it cannot hijack the video
controls.

While `data-video` is empty there is deliberately no play button — the page never advertises
a video that does not exist yet.

Notes for the file itself:

- Keep the same 16:9-ish shape as the placeholder, or update the `width`/`height` attributes
  on the `<img>` so the reserved space still matches and the page does not jump.
- The frame breaks out to 1320px wide, so encode at 1920×1080 or better.
- Add captions if you can: a `<track kind="captions" src="...vtt">` line inside the `<video>`
  that `main.js` builds. Recruiters often watch with the sound off.
