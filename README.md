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
progressive JPEG fallback through `<picture>`; each frame links to the full-size JPEG. The
three explanatory diagrams are hand-authored SVG, because no screenshot can show a data
flow — they also stay legible at any size, theme with the page and carry real text for
search and screen readers.

## The hero backdrop

`hero-1` ships with the page; `main.js` fetches the frames listed in the `data-slides`
attribute on `.stage` one at a time after load, and only joins each to the rotation once it
has decoded. It stops while the tab is hidden or the hero is scrolled away, and under
`prefers-reduced-motion` it neither animates nor fetches the extra frames at all.

The frames come from `C:\Library\omiverse_project\Renders\website_image`. That folder also
holds white clay / AO passes, which are skipped: they are far too bright to sit behind light
text. To swap the set, drop new renders in, regenerate at 2000px wide (WebP `quality=72`,
JPEG `quality=80`) flattened onto `#0a0c0f`, and list them in `data-slides`. All frames must
share one aspect ratio or the cross-fade will jump.

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
