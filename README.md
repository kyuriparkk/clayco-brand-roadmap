# Clayco Brand Roadmap

A live, single-page tracker for the Clayco enterprise brand project — Research →
Brand Strategy → Design System → Website → Brand Guidelines → Implementation →
Launch, plus ongoing Brand Governance & Measurement.

Vanilla HTML/CSS/JS, no build step. Desktop/tablet show a 10-month Gantt-style
grid with a current-position marker; mobile shows a vertical stage sequence.
Clicking (or Tab + Enter on) any stage opens a right-side drawer (full-screen
sheet on mobile) with its full detail — objective, sub-stages, deliverables,
approval gate, dependencies, risks, and latest update — without losing the
timeline behind it.

## Updating status

Everything editable lives in **[`roadmap-data.js`](roadmap-data.js)** — nothing
else needs to change as the project progresses:

- Set a step's `status` to `"done"`, `"active"`, `"blocked"`, or `"todo"`.
  A phase's badge, percent-complete, and "current sub-stage" are all derived
  automatically from its steps.
- Move `progressMonth` to reposition the current-position marker.
- Update `health.status` (`"on-track"` | `"at-risk"` | `"delayed"`) and
  `health.note` as the project's standing changes.
- Update `updated`, `updatedBy`, and `nextUpdate` each time you edit.
- Per-phase `owner`, `approvalGate`, `dependsOn`, `risks`, and `latestUpdate`
  are free-text/array fields you maintain directly — everything else
  (deliverables, dates, progress %) is computed from steps and `month`/`span`.
- `projectStart` anchors the 1–10 month axis to the calendar (30-day months).
  Move it if the real kickoff date changes.

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
