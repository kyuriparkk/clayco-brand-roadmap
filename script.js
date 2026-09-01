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

  function monthOffsetDate(monthNumber) {
    return addDays(parseISO(ROADMAP.projectStart), (monthNumber - 1) * 30);
  }

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatMonthYear(date) {
    return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  function formatFull(date) {
    return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  function formatDateStr(iso) {
    return formatFull(parseISO(iso));
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

  function phaseCounts(phase) {
    return {
      done: phase.steps.filter((s) => s.status === "done").length,
      total: phase.steps.length,
    };
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

  function currentPhase() {
    const withActivity = ROADMAP.phases.filter((p) => phaseStatus(p) === "active" || phaseStatus(p) === "blocked");
    if (withActivity.length) return withActivity.reduce((a, b) => (b.month > a.month ? b : a));
    const started = ROADMAP.phases.filter((p) => phaseStatus(p) !== "todo");
    if (started.length) return started.reduce((a, b) => (b.month > a.month ? b : a));
    return ROADMAP.phases[0];
  }

  function phaseById(id) {
    if (id === ROADMAP.ongoing.id) return ROADMAP.ongoing;
    return ROADMAP.phases.find((p) => p.id === id);
  }

  function dependsOnTitles(phase) {
    if (!phase.dependsOn || !phase.dependsOn.length) return [];
    return phase.dependsOn.map((id) => {
      const p = phaseById(id);
      return p ? p.title : id;
    });
  }

  // ---------- status strip ----------

  function renderStatusStrip() {
    const cur = currentPhase();
    document.getElementById("stat-phase").textContent = cur.title;

    const pct = overallPercent();
    document.getElementById("stat-progress").innerHTML = `<span class="big">${pct}%</span> complete`;

    const health = ROADMAP.health;
    const healthLabels = { "on-track": "On Track", "at-risk": "At Risk", delayed: "Delayed" };
    document.getElementById("stat-health").innerHTML =
      `<span class="health-dot ${health.status}"></span>${healthLabels[health.status] || health.status}`;

    const launchPhase = phaseById("launch");
    const launchDate = monthOffsetDate(launchPhase.month + launchPhase.span);
    document.getElementById("stat-launch").textContent = formatMonthYear(launchDate);

    document.getElementById("stat-updated").textContent = formatDateStr(ROADMAP.updated);
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
      num.textContent = m;
      ruler.appendChild(num);
    }
    return ruler;
  }

  function stageMetaLabel(phase) {
    const status = phaseStatus(phase);
    const pct = phasePercent(phase);
    if (status === "done") return "Complete";
    if (status === "blocked") return "Blocked";
    if (status === "active") return `In progress · ${pct}%`;
    return "Not started";
  }

  function buildStageButton(phase, rowIndex, months, onOpen) {
    const status = phaseStatus(phase);
    const pct = phasePercent(phase);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `stage status-${status}`;
    btn.style.gridColumn = `${phase.month} / span ${phase.span}`;
    btn.style.gridRow = `${rowIndex}`;
    const startDate = monthOffsetDate(phase.month);
    const endDate = addDays(monthOffsetDate(phase.month + phase.span), -1);
    btn.setAttribute(
      "aria-label",
      `${phase.title}, ${STATUS_TEXT[status]}, ${pct}% complete, ${formatMonthYear(startDate)} to ${formatMonthYear(endDate)}. Open details.`
    );

    const titleRow = document.createElement("span");
    titleRow.className = "stage-title-row";
    titleRow.innerHTML = `<span class="stage-title">${phase.title}</span>`;
    btn.appendChild(titleRow);

    const meta = document.createElement("span");
    meta.className = "stage-meta";
    meta.innerHTML =
      `<span class="status-badge ${status}" aria-hidden="true">${STATUS_ICON[status]}</span>` +
      `<span>${stageMetaLabel(phase)}</span>`;
    btn.appendChild(meta);

    const track = document.createElement("span");
    track.className = "track";
    const fill = document.createElement("span");
    fill.className = "track-fill";
    fill.style.width = status === "todo" ? "0%" : `${pct}%`;
    track.appendChild(fill);
    btn.appendChild(track);

    btn.addEventListener("click", () => onOpen(phase.id));
    return btn;
  }

  function buildDesktopChart(root, onOpen) {
    const months = ROADMAP.months;
    const chart = document.createElement("div");
    chart.className = "timeline-chart";
    chart.appendChild(buildGridlines(months));

    const nowMarker = document.createElement("div");
    nowMarker.className = "now-marker";
    nowMarker.style.left = `${((ROADMAP.progressMonth - 1) / months) * 100}%`;
    const nowDate = monthOffsetDate(ROADMAP.progressMonth);
    nowMarker.innerHTML =
      `<span class="now-tag">Current position — ${formatFull(nowDate)}</span><span class="now-line"></span>`;
    chart.appendChild(nowMarker);

    const grid = document.createElement("div");
    grid.className = "stage-grid";
    ROADMAP.phases.forEach((phase, i) => {
      grid.appendChild(buildStageButton(phase, i + 1, months, onOpen));
    });

    const govWrap = document.createElement("div");
    govWrap.className = "governance-band";
    govWrap.style.gridRow = `${ROADMAP.phases.length + 1}`;

    const ticks = document.createElement("div");
    ticks.className = "governance-ticks";
    ticks.setAttribute("aria-hidden", "true");
    ROADMAP.phases.forEach((phase) => {
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = `${((phase.month - 1) / months) * 100}%`;
      ticks.appendChild(tick);
    });
    govWrap.appendChild(ticks);

    const govBtn = document.createElement("button");
    govBtn.type = "button";
    govBtn.className = "governance";
    govBtn.setAttribute("aria-label", `${ROADMAP.ongoing.title} — continuous foundation beneath the roadmap. Open details.`);
    govBtn.innerHTML =
      `<span class="gov-title">${ROADMAP.ongoing.title} — continuous foundation</span>` +
      `<span class="gov-note">${ROADMAP.ongoing.blurb}</span>`;
    govBtn.addEventListener("click", () => onOpen(ROADMAP.ongoing.id));
    govWrap.appendChild(govBtn);

    grid.appendChild(govWrap);
    chart.appendChild(grid);
    chart.appendChild(buildRuler(months));
    root.appendChild(chart);
  }

  // ---------- mobile stage list ----------

  function buildMobileList(root, onOpen) {
    const list = document.createElement("ul");
    list.className = "mobile-stage-list";
    const curPhase = currentPhase();

    ROADMAP.phases.forEach((phase) => {
      const status = phaseStatus(phase);
      const pct = phasePercent(phase);
      const startDate = monthOffsetDate(phase.month);
      const endDate = addDays(monthOffsetDate(phase.month + phase.span), -1);

      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `mobile-stage status-${status}`;
      btn.setAttribute(
        "aria-label",
        `${phase.title}, ${STATUS_TEXT[status]}, ${pct}% complete. Open details.`
      );

      const isCurrent = phase.id === curPhase.id;
      btn.innerHTML = `
        <span class="stage-title-row">
          <span class="stage-title">${phase.title}</span>
          ${isCurrent ? '<span class="mobile-current-badge">Current</span>' : ""}
        </span>
        <span class="stage-meta">
          <span class="status-badge ${status}" aria-hidden="true">${STATUS_ICON[status]}</span>
          <span>${stageMetaLabel(phase)}</span>
        </span>
        <span class="track mobile-track"><span class="track-fill" style="width:${status === "todo" ? 0 : pct}%"></span></span>
        <span class="mobile-dates">${formatMonthYear(startDate)} – ${formatMonthYear(endDate)}</span>
      `;
      btn.addEventListener("click", () => onOpen(phase.id));
      li.appendChild(btn);
      list.appendChild(li);
    });

    const govLi = document.createElement("li");
    govLi.className = "governance-band-mobile";
    const govBtn = document.createElement("button");
    govBtn.type = "button";
    govBtn.className = "mobile-stage";
    govBtn.setAttribute("aria-label", `${ROADMAP.ongoing.title} — continuous foundation. Open details.`);
    govBtn.innerHTML = `
      <span class="stage-title-row"><span class="stage-title">${ROADMAP.ongoing.title}</span></span>
      <span class="stage-meta"><span>Continuous foundation beneath every stage</span></span>
    `;
    govBtn.addEventListener("click", () => onOpen(ROADMAP.ongoing.id));
    govLi.appendChild(govBtn);
    list.appendChild(govLi);

    root.appendChild(list);
  }

  // ---------- drawer ----------

  function buildSubstep(step) {
    const details = document.createElement("details");
    details.className = "substep";
    const summary = document.createElement("summary");
    summary.innerHTML =
      `<span class="status-badge ${step.status}" aria-hidden="true">${STATUS_ICON[step.status]}</span>` +
      `<span class="stitle">${step.title}</span>` +
      `<span class="stag status-${step.status}">${STATUS_TEXT[step.status]}</span>`;
    details.appendChild(summary);
    const ul = document.createElement("ul");
    ul.className = "sdetail";
    (step.detail || []).forEach((d) => {
      const li = document.createElement("li");
      li.textContent = d;
      ul.appendChild(li);
    });
    details.appendChild(ul);
    return details;
  }

  function listOrEmpty(items, emptyText) {
    const ul = document.createElement("ul");
    if (!items || !items.length) {
      ul.className = "plain-list empty";
      const li = document.createElement("li");
      li.textContent = emptyText;
      ul.appendChild(li);
      return ul;
    }
    ul.className = "plain-list";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    return ul;
  }

  function renderDrawer(phase, isOngoing) {
    const status = isOngoing ? phaseStatus(phase) : phaseStatus(phase);
    const pct = phasePercent(phase);
    const counts = phaseCounts(phase);
    const { current, next } = currentAndNextStep(phase);

    const header = document.getElementById("drawer-header-content");
    const startDate = isOngoing ? null : monthOffsetDate(phase.month);
    const endDate = isOngoing ? null : addDays(monthOffsetDate(phase.month + phase.span), -1);

    header.innerHTML = `
      <h3 id="drawer-title">${phase.title}</h3>
      <div class="drawer-badges">
        <span class="pill status-${status}">${STATUS_ICON[status]} ${STATUS_TEXT[status]}</span>
        <span class="pill">${pct}% complete</span>
      </div>
      <div class="drawer-meta-grid">
        <div><div class="m-label">Owner</div><div class="m-value">${phase.owner || "—"}</div></div>
        <div><div class="m-label">${isOngoing ? "Cadence" : "Dates"}</div><div class="m-value">${
          isOngoing ? "Ongoing" : `${formatMonthYear(startDate)} – ${formatMonthYear(endDate)}`
        }</div></div>
      </div>
    `;

    const body = document.getElementById("drawer-body-content");
    body.innerHTML = "";

    const objective = document.createElement("div");
    objective.className = "drawer-section";
    objective.innerHTML = `<h4>Objective</h4><p>${phase.blurb}</p>`;
    body.appendChild(objective);

    const subSection = document.createElement("div");
    subSection.className = "drawer-section";
    subSection.innerHTML = `<h4>Sub-stages</h4>`;

    const summary = document.createElement("div");
    summary.className = "progress-summary";
    summary.innerHTML =
      `<span class="count">${counts.done} of ${counts.total} sub-stages complete</span>` +
      `<span class="track"><span class="track-fill" style="width:${pct}%"></span></span>`;
    subSection.appendChild(summary);

    const nextAction = document.createElement("div");
    nextAction.className = "next-action";
    if (current) {
      nextAction.innerHTML = `<strong>Current:</strong> ${current.title}${
        next ? ` &nbsp;·&nbsp; <strong>Next:</strong> ${next.title}` : ""
      }`;
    } else if (next) {
      nextAction.innerHTML = `<strong>Next up:</strong> ${next.title}`;
    } else {
      nextAction.innerHTML = `<strong>All sub-stages complete.</strong>`;
    }
    subSection.appendChild(nextAction);

    const stepsList = document.createElement("div");
    stepsList.className = "substeps";
    phase.steps.forEach((s) => stepsList.appendChild(buildSubstep(s)));
    subSection.appendChild(stepsList);
    body.appendChild(subSection);

    const deliverables = document.createElement("div");
    deliverables.className = "drawer-section";
    deliverables.innerHTML = `<h4>Deliverables</h4>`;
    deliverables.appendChild(listOrEmpty(phase.steps.map((s) => s.title), "None defined yet"));
    body.appendChild(deliverables);

    const gate = document.createElement("div");
    gate.className = "drawer-section";
    gate.innerHTML = `<h4>Approval gate</h4><p>${phase.approvalGate || "Not yet defined"}</p>`;
    body.appendChild(gate);

    const deps = document.createElement("div");
    deps.className = "drawer-section";
    deps.innerHTML = `<h4>Dependencies</h4>`;
    deps.appendChild(listOrEmpty(dependsOnTitles(phase), "No upstream dependencies"));
    body.appendChild(deps);

    const risks = document.createElement("div");
    risks.className = "drawer-section";
    risks.innerHTML = `<h4>Risks &amp; blockers</h4>`;
    risks.appendChild(listOrEmpty(phase.risks, "No risks currently flagged"));
    body.appendChild(risks);

    const update = document.createElement("div");
    update.className = "drawer-section";
    update.innerHTML = `<h4>Latest update</h4>`;
    if (phase.latestUpdate) {
      const block = document.createElement("div");
      block.className = "update-block";
      block.innerHTML =
        `<span class="u-date">${formatDateStr(phase.latestUpdate.date)}</span><p>${phase.latestUpdate.text}</p>`;
      update.appendChild(block);
    } else {
      const p = document.createElement("p");
      p.textContent = "No update logged yet.";
      update.appendChild(p);
    }
    body.appendChild(update);
  }

  // ---------- init ----------

  document.addEventListener("DOMContentLoaded", () => {
    renderStatusStrip();

    const dialog = document.getElementById("drawer");
    let lastFocused = null;

    function openDrawer(id) {
      const isOngoing = id === ROADMAP.ongoing.id;
      const phase = phaseById(id);
      if (!phase) return;
      lastFocused = document.activeElement;
      renderDrawer(phase, isOngoing);
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

    buildDesktopChart(document.getElementById("timeline-chart-wrap"), openDrawer);
    buildMobileList(document.getElementById("mobile-list-wrap"), openDrawer);

    document.getElementById("footer-updated").textContent = formatDateStr(ROADMAP.updated);
    document.getElementById("footer-updated-by").textContent = ROADMAP.updatedBy;
    document.getElementById("footer-next-update").textContent = formatDateStr(ROADMAP.nextUpdate);

    const initial = location.hash.replace("#", "");
    if (initial && phaseById(initial)) openDrawer(initial);
  });
})();
