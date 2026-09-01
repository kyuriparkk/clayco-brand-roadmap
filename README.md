# Clayco Brand Roadmap

A live, single-page tracker for the Clayco enterprise brand project — Research →
Brand Strategy → Design System → Website → Brand Guidelines → Implementation →
Launch, plus ongoing Brand Governance & Measurement.

Vanilla HTML/CSS/JS, no build step. The homepage shows a 10-month timeline with
a "You are here" marker; clicking any stage jumps to its detailed checklist of
sub-stages below.

## Updating status

Everything editable lives in **[`roadmap-data.js`](roadmap-data.js)** — nothing
else needs to change as the project progresses:

- Set a step's `status` to `"done"`, `"active"`, or `"todo"`.
- A phase's overall badge/color is derived automatically from its steps.
- Move the `progressMonth` value to reposition the "You are here" marker on
  the timeline.
- Update `updated` to today's date.

Commit and push — GitHub Pages redeploys automatically within a minute or two.

## Local preview

Serve the folder over HTTP (plain `file://` won't load the JS in some browsers):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

This is a static site meant for GitHub Pages, serving `index.html` from the
repo root on the default branch.
