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
  pipeline.svg      the four stages and the artifact each hands on
  capture-panel.svg the capture window inside Composer
  builder-ui.svg    the browser UI builder
  viewer.svg        the streamed runtime as a customer sees it
  message-flow.svg  click -> configuratorApply -> handler -> USD -> video
  data-model.svg    the six captured JSON files and the two generated ones
  favicon.svg
```

The diagrams are hand-authored SVG rather than screenshots, so they stay legible at any
size, theme with the page, carry real text for search and screen readers, and cost a few
kilobytes each.

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
