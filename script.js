(function () {
  const STEP_WEIGHT = { done: 1, active: 0.5, blocked: 0.25, todo: 0 };
  const STATUS_ICON = { done: "✓", active: "•", blocked: "!", todo: "" };
  const STATUS_TEXT = { done: "Complete", active: "In progress", blocked: "Blocked", todo: "Not started" };

  // ---------- date helpers ----------

  function parseISO(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + Math.round(days));
    return d;
  }

  // Walks real calendar months from projectStart (month 1 = projectStart's
  // month) rather than fixed 30-day blocks, so "month 10" lands on the
  // correct real month regardless of how long the months in between are.
  // monthNumber may be fractional (e.g. 2.6) for the current-position marker.
  function monthOffsetDate(monthNumber) {
    const start = parseISO(ROADMAP.projectStart);
    const whole = Math.floor(monthNumber - 1);
    const frac = monthNumber - 1 - whole;
    const base = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + whole, start.getUTCDate()));
    if (frac === 0) return base;
    const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + whole + 1, start.getUTCDate()));
    const daysInSpan = Math.round((next.getTime() - base.getTime()) / 86400000);
    return addDays(base, frac * daysInSpan);
  }

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatMonthYear(date) {
    return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  function formatFull(date) {
    return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  // The one place we want the viewer's actual local calendar day (every
  // other date in this app is a synthetic UTC-anchored project date).
  function formatToday() {
    const d = new Date();
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatDateStr(iso) {
    return formatFull(parseISO(iso));
  }

  function dateRangeLabel(startDate, endDate) {
    const start = formatMonthYear(startDate);
    const end = formatMonthYear(endDate);
    return start === end ? start : `${start} – ${end}`;
  }

  // Placeholder for a real profile photo — initials in an avatar circle.
  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  // ---------- derived data ----------

  function phaseStatus(phase) {
    const statuses = phase.steps.map((s) => s.status);
    if (statuses.every((s) => s === "done")) return "done";
    if (statuses.some((s) => s === "blocked")) return "blocked";
    if (statuses.some((s) => s === "active")) return "active";
    return "todo";
  }

  function phasePercent(phase) {
    const total = phase.steps.length || 1;
    const sum = phase.steps.reduce((acc, s) => acc + (STEP_WEIGHT[s.status] || 0), 0);
    return Math.round((sum / total) * 100);
  }

  function currentAndNextStep(phase) {
    const current = phase.steps.find((s) => s.status === "active" || s.status === "blocked");
    if (current) {
      const idx = phase.steps.indexOf(current);
      return { current, next: phase.steps[idx + 1] || null };
    }
    const firstTodo = phase.steps.find((s) => s.status === "todo");
    if (firstTodo) return { current: null, next: firstTodo };
    return { current: null, next: null };
  }

  function overallPercent() {
    let sum = 0;
    let total = 0;
    ROADMAP.phases.forEach((phase) => {
      phase.steps.forEach((s) => {
        sum += STEP_WEIGHT[s.status] || 0;
        total += 1;
      });
    });
    return total ? Math.round((sum / total) * 100) : 0;
  }

  // All phases actively underway right now — there can be more than one
  // (e.g. Research wrapping up while Brand Strategy has already started).
  function currentPhases() {
    const withActivity = ROADMAP.phases.filter((p) => phaseStatus(p) === "active" || phaseStatus(p) === "blocked");
    if (withActivity.length) return withActivity;
    const started = ROADMAP.phases.filter((p) => phaseStatus(p) !== "todo");
    if (started.length) return [started.reduce((a, b) => (b.month > a.month ? b : a))];
    return [ROADMAP.phases[0]];
  }

  function phaseById(id) {
    if (id === ROADMAP.ongoing.id) return ROADMAP.ongoing;
    return ROADMAP.phases.find((p) => p.id === id);
  }

  // ---------- status strip ----------

  function renderStatusStrip() {
    document.getElementById("stat-phase").textContent = currentPhases()
      .map((p) => p.title)
      .join(", ");

    const pct = overallPercent();
    document.getElementById("stat-progress").innerHTML = `<span class="big">${pct}%</span> complete`;

    document.getElementById("stat-launch").textContent = formatFull(parseISO(ROADMAP.targetLaunch));
  }

  // ---------- desktop/tablet chart ----------

  function buildGridlines(months) {
    const layer = document.createElement("div");
    layer.className = "gridlines";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i <= months; i++) {
      const line = document.createElement("div");
      line.className = "gline";
      line.style.left = `${(i / months) * 100}%`;
      layer.appendChild(line);
    }
    return layer;
  }

  function buildRuler(months) {
    const ruler = document.createElement("div");
    ruler.className = "ruler";
    ruler.setAttribute("aria-hidden", "true");
    for (let m = 1; m <= months; m++) {
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = MONTHS_SHORT[monthOffsetDate(m).getUTCMonth()];
      ruler.appendChild(num);
    }
    return ruler;
  }

  // Three visual tiers on the chart, matching the plain reference timeline:
  // "live" (done or active — solid red), "todo" (light outline), "blocked" (amber).
  function visualTier(status) {
    if (status === "blocked") return "blocked";
    if (status === "todo") return "todo";
    return "live";
  }

  function buildStageButton(phase, rowIndex, onOpen) {
    const status = phaseStatus(phase);
    const pct = phasePercent(phase);
    const fadeClass = phase.fade ? `fade-${phase.fade}` : "";
    const bleedClass = phase.bleed ? `bleed-${phase.bleed}` : "";
    const todoClass = status === "todo" ? "is-todo" : "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `stage ${fadeClass} ${bleedClass} ${todoClass}`.trim();
    btn.style.gridColumn = `${phase.month} / span ${phase.span}`;
    btn.style.gridRow = `${rowIndex}`;
    const startDate = monthOffsetDate(phase.month);
    const endDate = addDays(monthOffsetDate(phase.month + phase.span), -1);
    btn.setAttribute(
      "aria-label",
      `${phase.title}, ${STATUS_TEXT[status]}, ${pct}% complete, ${dateRangeLabel(startDate, endDate)}. Open details.`
    );

    btn.innerHTML =
      `<span class="stage-title">${phase.title}</span>` +
      (status === "done" ? `<span class="stage-check" aria-hidden="true">✓</span>` : "") +
      (status === "blocked" ? `<span class="stage-check" aria-hidden="true">!</span>` : "");

    btn.addEventListener("click", () => onOpen(phase.id));
    return btn;
  }

  function buildDesktopChart(root, onOpen) {
    const months = ROADMAP.months;
    const chart = document.createElement("div");
    chart.className = "timeline-chart";

    // Bars share one positioning context so gridlines and the
    // current-position line are bounded to exactly that area — no more,
    // no less — and never run into the ruler below.
    const stack = document.createElement("div");
    stack.className = "chart-stack";
    stack.appendChild(buildGridlines(months));

    const nowMarker = document.createElement("div");
    nowMarker.className = "now-marker";
    nowMarker.style.left = `${((ROADMAP.progressMonth - 1) / months) * 100}%`;
    nowMarker.innerHTML = `<span class="now-tag">${formatToday()}</span><span class="now-line"></span>`;
    stack.appendChild(nowMarker);

    const grid = document.createElement("div");
    grid.className = "stage-grid";
    ROADMAP.phases.forEach((phase, i) => {
      grid.appendChild(buildStageButton(phase, i + 1, onOpen));
    });

    stack.appendChild(grid);
    chart.appendChild(stack);
    chart.appendChild(buildRuler(months));
    root.appendChild(chart);
  }

  // ---------- mobile stage list ----------

  // A shared month scale sits above the list so every row's mini-bar below
  // reads against the same 10-month ruler — a compact, rotated echo of the
  // desktop Gantt rather than plain text.
  function buildMobileScale(months) {
    const wrap = document.createElement("div");
    wrap.className = "mobile-scale";
    for (let m = 1; m <= months; m++) {
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = MONTHS_SHORT[monthOffsetDate(m).getUTCMonth()];
      wrap.appendChild(num);
    }
    const tick = document.createElement("div");
    tick.className = "mobile-now-tick";
    tick.style.left = `${((ROADMAP.progressMonth - 1) / months) * 100}%`;
    wrap.appendChild(tick);
    return wrap;
  }

  function buildMobileList(root, onOpen) {
    const months = ROADMAP.months;
    root.appendChild(buildMobileScale(months));

    const list = document.createElement("ul");
    list.className = "mobile-stage-list";
    const curPhases = currentPhases();

    ROADMAP.phases.forEach((phase) => {
      const status = phaseStatus(phase);
      const pct = phasePercent(phase);
      const tier = visualTier(status);
      const startDate = monthOffsetDate(phase.month);
      const endDate = addDays(monthOffsetDate(phase.month + phase.span), -1);

      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `mobile-stage tier-${tier}`;
      btn.setAttribute(
        "aria-label",
        `${phase.title}, ${STATUS_TEXT[status]}, ${pct}% complete, ${dateRangeLabel(startDate, endDate)}. Open details.`
      );

      const isCurrent = curPhases.some((p) => p.id === phase.id);
      const fadeClass = phase.fade ? `fade-${phase.fade}` : "";
      btn.innerHTML = `
        <span class="stage-title-row">
          <span class="stage-title">${phase.title}</span>
          ${isCurrent ? '<span class="mobile-current-badge">Current</span>' : ""}
        </span>
        <span class="mobile-track">
          <span class="mobile-seg ${fadeClass}" style="left:${((phase.month - 1) / months) * 100}%; width:${
        (phase.span / months) * 100
      }%"></span>
        </span>
        <span class="mobile-dates">${dateRangeLabel(startDate, endDate)}</span>
      `;
      btn.addEventListener("click", () => onOpen(phase.id));
      li.appendChild(btn);
      list.appendChild(li);
    });

    root.appendChild(list);
  }

  // ---------- drawer ----------

  function buildSubstep(step, currentStep, onToggle, reorderCtx, ownerFallback) {
    const hasDetail = step.detail && step.detail.length;
    const row = document.createElement(hasDetail ? "details" : "div");
    row.className = `substep${step === currentStep ? " is-current" : ""}`;
    const head = document.createElement(hasDetail ? "summary" : "div");
    head.className = "substep-head";

    // Three clickable stages — not started, in progress, complete — cycled
    // in that order with each click, rather than a plain done/not-done box.
    const NEXT_STATUS = { todo: "active", active: "done", done: "todo", blocked: "todo" };
    const check = document.createElement("button");
    check.type = "button";
    check.className = `step-check ${step.status}`;
    const setCheckLabel = () => {
      check.setAttribute("aria-label", `"${step.title}" — ${STATUS_TEXT[step.status]}. Click to advance.`);
    };
    setCheckLabel();
    // Clicking inside a <summary> would otherwise also toggle the
    // disclosure open/closed — keep the two interactions independent.
    check.addEventListener("click", (e) => {
      e.stopPropagation();
      step.status = NEXT_STATUS[step.status] || "todo";
      check.className = `step-check ${step.status}`;
      setCheckLabel();
      if (onToggle) onToggle();
    });
    head.appendChild(check);

    const title = document.createElement("span");
    title.className = "stitle";
    title.textContent = step.title;
    head.appendChild(title);

    // Per-sub-stage assignee — falls back to the phase's owner until
    // individual assignments are decided. Just the avatar shows in the
    // collapsed row; the name only appears once expanded.
    const owner = step.owner || ownerFallback;
    if (owner) {
      const avatar = document.createElement("span");
      avatar.className = "owner-avatar substep-owner-avatar";
      avatar.textContent = initials(owner);
      avatar.setAttribute("aria-label", `Assigned to ${owner}`);
      head.appendChild(avatar);
    }

    if (reorderCtx) {
      const { array, index } = reorderCtx;
      const handle = document.createElement("span");
      handle.className = "drag-handle";
      handle.textContent = "⠿";
      handle.setAttribute("aria-hidden", "true");
      head.appendChild(handle);

      // Press-and-hold-to-drag reordering via the native HTML5 DnD API.
      row.draggable = true;
      row.dataset.index = String(index);
      row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        row.classList.add("drag-over");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        const from = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(from) || from === index) return;
        const [moved] = array.splice(from, 1);
        array.splice(index, 0, moved);
        if (onToggle) onToggle();
      });
    }

    row.appendChild(head);
    if (hasDetail) {
      const body = document.createElement("div");
      body.className = "sdetail-body";
      if (owner) {
        const ownerLine = document.createElement("div");
        ownerLine.className = "substep-owner-full";
        ownerLine.innerHTML = `<span class="owner-avatar" aria-hidden="true">${initials(owner)}</span>${owner}`;
        body.appendChild(ownerLine);
      }
      const ul = document.createElement("ul");
      ul.className = "sdetail";
      step.detail.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = d;
        ul.appendChild(li);
      });
      body.appendChild(ul);
      row.appendChild(body);
    }
    return row;
  }

  function renderDrawer(phase, isOngoing, onToggle) {
    const status = phaseStatus(phase);
    const { current } = currentAndNextStep(phase);

    // Governance & Measurement isn't its own stage on the timeline — it's
    // the continuous foundation that starts once Launch ships, so it's
    // folded in as one more sub-stage of Launch rather than its own section.
    // Reference the real step objects (not copies) so checking them off here
    // persists correctly.
    const displaySteps = phase.id === "launch" ? [...phase.steps, ...ROADMAP.ongoing.steps] : phase.steps;
    const counts = {
      done: displaySteps.filter((s) => s.status === "done").length,
      total: displaySteps.length,
    };

    const header = document.getElementById("drawer-header-content");
    const startDate = isOngoing ? null : monthOffsetDate(phase.month);
    const endDate = isOngoing ? null : addDays(monthOffsetDate(phase.month + phase.span), -1);
    const dateText = isOngoing ? "Ongoing" : dateRangeLabel(startDate, endDate);

    header.innerHTML = `
      <h3 id="drawer-title">${phase.title}</h3>
      <div class="drawer-subline">
        <span class="pill status-${status}">${STATUS_TEXT[status]}</span>
        <span class="drawer-meta-text">${dateText}</span>
      </div>
    `;

    const body = document.getElementById("drawer-body-content");
    body.innerHTML = "";

    const subSection = document.createElement("div");
    subSection.className = "drawer-section";
    subSection.innerHTML = `<h4>Sub-stages <span class="h4-count">${counts.done}/${counts.total}</span></h4>`;
    const stepsList = document.createElement("div");
    stepsList.className = "substeps";
    displaySteps.forEach((s, i) => {
      // Reordering always operates on the real source array — for Launch,
      // items past its own steps belong to Governance's own (single-item)
      // list rather than Launch's.
      const fromGovernance = phase.id === "launch" && i >= phase.steps.length;
      const reorderCtx = fromGovernance
        ? { array: ROADMAP.ongoing.steps, index: i - phase.steps.length }
        : { array: phase.steps, index: i };
      const ownerFallback = fromGovernance ? ROADMAP.ongoing.owner : phase.owner;
      stepsList.appendChild(buildSubstep(s, current, onToggle, reorderCtx, ownerFallback));
    });
    subSection.appendChild(stepsList);
    body.appendChild(subSection);

    const rows = [];
    if (phase.owner) {
      rows.push(["Owner", `<span class="owner-avatar" aria-hidden="true">${initials(phase.owner)}</span>${phase.owner}`]);
    }

    if (rows.length) {
      const detailBlock = document.createElement("div");
      detailBlock.className = "drawer-section";
      detailBlock.innerHTML =
        `<h4>Details</h4>` +
        rows
          .map(([k, v]) => `<div class="drow"><span class="drow-k">${k}</span><span class="drow-v">${v}</span></div>`)
          .join("");
      body.appendChild(detailBlock);
    }
  }

  // ---------- init ----------

  document.addEventListener("DOMContentLoaded", () => {
    const chartWrap = document.getElementById("timeline-chart-wrap");
    const mobileWrap = document.getElementById("mobile-list-wrap");

    function rebuildChart() {
      renderStatusStrip();
      chartWrap.innerHTML = "";
      mobileWrap.innerHTML = "";
      buildDesktopChart(chartWrap, openDrawer);
      buildMobileList(mobileWrap, openDrawer);
    }

    const dialog = document.getElementById("drawer");
    let lastFocused = null;

    function openDrawer(id) {
      const isOngoing = id === ROADMAP.ongoing.id;
      const phase = phaseById(id);
      if (!phase) return;
      lastFocused = document.activeElement;
      // Checking a sub-stage off re-renders this same drawer in place, plus
      // the chart/status strip behind it, so everything stays in sync.
      function onToggle() {
        renderDrawer(phase, isOngoing, onToggle);
        rebuildChart();
      }
      renderDrawer(phase, isOngoing, onToggle);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      requestAnimationFrame(() => dialog.classList.add("is-open"));
      history.replaceState(null, "", `#${id}`);
      document.getElementById("drawer-close").focus();
    }

    function closeDrawer() {
      if (!dialog.classList.contains("is-open")) return;
      dialog.classList.remove("is-open");
      history.replaceState(null, "", location.pathname + location.search);
      window.setTimeout(() => {
        if (dialog.open) dialog.close();
        if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
      }, 260);
    }

    document.getElementById("drawer-close").addEventListener("click", closeDrawer);
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeDrawer();
    });
    // Belt-and-suspenders: some environments don't fire the native `cancel`
    // event for a synthesized Escape keypress even though the dialog is a
    // real top-layer modal, so also handle it explicitly.
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    dialog.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) closeDrawer();
    });

    rebuildChart();

    document.getElementById("footer-updated").textContent = formatDateStr(ROADMAP.updated);
    document.getElementById("footer-updated-by").textContent = ROADMAP.updatedBy;
    document.getElementById("footer-next-update").textContent = formatDateStr(ROADMAP.nextUpdate);

    const initial = location.hash.replace("#", "");
    if (initial && phaseById(initial)) openDrawer(initial);
  });
})();
