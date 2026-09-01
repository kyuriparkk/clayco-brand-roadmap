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

  function dependsOnTitles(phase) {
    if (!phase.dependsOn || !phase.dependsOn.length) return [];
    return phase.dependsOn.map((id) => {
      const p = phaseById(id);
      return p ? p.title : id;
    });
  }

  // ---------- status strip ----------

  function renderStatusStrip() {
    document.getElementById("stat-phase").textContent = currentPhases()
      .map((p) => p.title)
      .join(", ");

    const pct = overallPercent();
    document.getElementById("stat-progress").innerHTML = `<span class="big">${pct}%</span>`;

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

  // ---------- Microsoft Graph people search (optional) ----------

  let msalApp = null;
  let msalAccount = null;

  function graphConfigured() {
    return Boolean(
      typeof MS_GRAPH_CONFIG !== "undefined" && MS_GRAPH_CONFIG.clientId && MS_GRAPH_CONFIG.tenantId
    );
  }

  function getMsalApp() {
    if (!graphConfigured() || typeof msal === "undefined") return null;
    if (!msalApp) {
      msalApp = new msal.PublicClientApplication({
        auth: {
          clientId: MS_GRAPH_CONFIG.clientId,
          authority: `https://login.microsoftonline.com/${MS_GRAPH_CONFIG.tenantId}`,
          redirectUri: window.location.origin + window.location.pathname,
        },
        cache: { cacheLocation: "sessionStorage" },
      });
    }
    return msalApp;
  }

  async function ensureSignedIn(app) {
    const existing = app.getAllAccounts();
    if (existing.length) {
      msalAccount = existing[0];
      return msalAccount;
    }
    const result = await app.loginPopup({ scopes: MS_GRAPH_CONFIG.scopes });
    msalAccount = result.account;
    return msalAccount;
  }

  async function getGraphToken(app) {
    const account = msalAccount || app.getAllAccounts()[0];
    try {
      const result = await app.acquireTokenSilent({ scopes: MS_GRAPH_CONFIG.scopes, account });
      return result.accessToken;
    } catch (silentErr) {
      const result = await app.acquireTokenPopup({ scopes: MS_GRAPH_CONFIG.scopes });
      msalAccount = result.account;
      return result.accessToken;
    }
  }

  // Searches the org's real directory via Microsoft Graph
  // (GET /users?$search=...) — requires MS_GRAPH_CONFIG to be filled in.
  async function searchGraphPeople(query) {
    const app = getMsalApp();
    if (!app) return null; // not configured — caller should fall back
    await ensureSignedIn(app);
    const token = await getGraphToken(app);
    const url =
      `https://graph.microsoft.com/v1.0/users?$search="displayName:${encodeURIComponent(query)}"` +
      `&$select=displayName,mail,jobTitle&$top=8`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
    });
    if (!res.ok) throw new Error(`Graph search failed (${res.status})`);
    const data = await res.json();
    return data.value || [];
  }

  // Shared "+ add owner" flow for both the phase-level Details row and each
  // sub-stage. Swaps the "+" button for a real inline text field — no native
  // prompt()/alert() dialogs, which some embedded browser contexts block
  // silently. Typing a name and pressing Enter adds it directly. When
  // Microsoft Graph is configured and signed in, matching directory results
  // appear in a dropdown to pick from instead.
  function startAddOwner(btn, getOwnersArray, onToggle) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-owner-input";
    input.placeholder = graphConfigured() ? "Search directory…" : "Type a name…";
    input.autocomplete = "off";

    const wrap = document.createElement("span");
    wrap.className = "add-owner-wrap";
    wrap.appendChild(input);

    const menu = document.createElement("div");
    menu.className = "add-owner-menu";
    menu.hidden = true;
    wrap.appendChild(menu);

    btn.replaceWith(wrap);
    input.focus();

    let cancelled = false;
    function restoreButton() {
      if (cancelled) return;
      cancelled = true;
      wrap.replaceWith(btn);
    }

    function addName(name) {
      const trimmed = name.trim();
      if (!trimmed) return restoreButton();
      getOwnersArray().push(trimmed);
      cancelled = true; // the whole drawer re-renders via onToggle
      if (onToggle) onToggle();
    }

    let searchToken = 0;
    async function runSearch(query) {
      const myToken = ++searchToken;
      try {
        const results = await searchGraphPeople(query);
        if (myToken !== searchToken || !results) return;
        menu.innerHTML = "";
        if (!results.length) {
          menu.hidden = true;
          return;
        }
        results.forEach((r) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "add-owner-option";
          item.textContent = r.jobTitle ? `${r.displayName} — ${r.jobTitle}` : r.displayName;
          item.addEventListener("mousedown", (e) => {
            e.preventDefault(); // keep focus so the blur handler doesn't fire first
            addName(r.displayName);
          });
          menu.appendChild(item);
        });
        menu.hidden = false;
      } catch (err) {
        console.error("Microsoft Graph search failed:", err);
        menu.hidden = true;
      }
    }

    if (graphConfigured()) {
      input.addEventListener("input", () => {
        const q = input.value.trim();
        if (q.length < 2) {
          menu.hidden = true;
          return;
        }
        runSearch(q);
      });
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") restoreButton();
      if (e.key === "Enter") addName(input.value);
    });
    input.addEventListener("blur", () => {
      // Let an option's mousedown register first if that's what caused the blur.
      setTimeout(restoreButton, 150);
    });
  }

  // ---------- drawer ----------

  function buildOwnerField(ownersToShow, ensureOwnersArray, onToggle) {
    const wrap = document.createElement("span");
    wrap.className = "drow-v";
    ownersToShow.forEach((name) => {
      const pair = document.createElement("span");
      pair.className = "owner-pair";
      pair.innerHTML = `<span class="owner-avatar" aria-hidden="true">${initials(name)}</span>${name}`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-owner-btn";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", `Remove ${name}`);
      removeBtn.addEventListener("click", () => {
        const arr = ensureOwnersArray();
        const idx = arr.indexOf(name);
        if (idx !== -1) arr.splice(idx, 1);
        if (onToggle) onToggle();
      });
      pair.appendChild(removeBtn);

      wrap.appendChild(pair);
    });
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-owner-btn";
    addBtn.textContent = "+";
    addBtn.setAttribute("aria-label", "Add an owner");
    addBtn.addEventListener("click", () => startAddOwner(addBtn, ensureOwnersArray, onToggle));
    wrap.appendChild(addBtn);
    return wrap;
  }

  // One row in the left-hand sub-stage list — selecting it (click anywhere
  // on the row) is the only way to change what the right panel shows, so
  // exactly one sub-stage is ever "active" at a time. The status circle is
  // also independently clickable to cycle not-started → in-progress →
  // complete without changing the selection logic.
  function buildNavRow(step, isSelected, onSelect, onToggle, reorderCtx) {
    const NEXT_STATUS = { todo: "active", active: "done", done: "todo", blocked: "todo" };
    const row = document.createElement("button");
    row.type = "button";
    row.className = `substage-nav-row${isSelected ? " is-selected" : ""}`;
    row.addEventListener("click", onSelect);

    // Press-and-hold-to-drag reordering via the native HTML5 DnD API — a
    // plain click still selects the row as normal.
    if (reorderCtx) {
      const { array, index } = reorderCtx;
      row.draggable = true;
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

    const check = document.createElement("span");
    check.className = `step-check ${step.status}`;
    check.setAttribute("role", "button");
    check.tabIndex = 0;
    check.setAttribute("aria-label", `"${step.title}" — ${STATUS_TEXT[step.status]}. Click to advance.`);
    const cycle = (e) => {
      e.stopPropagation();
      step.status = NEXT_STATUS[step.status] || "todo";
      if (onToggle) onToggle();
    };
    check.addEventListener("click", cycle);
    check.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cycle(e);
      }
    });
    row.appendChild(check);

    const text = document.createElement("span");
    text.className = "substage-nav-text";
    const title = document.createElement("span");
    title.className = "substage-nav-title";
    title.textContent = step.title;
    text.appendChild(title);
    row.appendChild(text);

    return row;
  }

  // The right-hand panel for whichever sub-stage is selected.
  function buildDetailPanel(container, { step, phase, isCurrent, ownerFallback, onToggle }) {
    container.innerHTML = "";

    const eyebrow = document.createElement("div");
    eyebrow.className = "detail-eyebrow";
    eyebrow.textContent = "Selected sub-stage";
    container.appendChild(eyebrow);

    const h3 = document.createElement("h3");
    h3.className = "detail-title";
    h3.textContent = step.title;
    container.appendChild(h3);

    const subline = document.createElement("div");
    subline.className = "drawer-subline";
    subline.innerHTML = `<span class="pill status-${step.status}">${STATUS_TEXT[step.status]}</span>`;
    container.appendChild(subline);

    const col = document.createElement("div");
    col.className = "detail-col detail-col-single";

    const ownersToShow = step.owners || ownerFallback || [];
    const ownerField = document.createElement("div");
    ownerField.className = "detail-field";
    ownerField.innerHTML = "<h4>Owner</h4>";
    ownerField.appendChild(
      buildOwnerField(
        ownersToShow,
        () => {
          if (!step.owners) step.owners = [...ownersToShow];
          return step.owners;
        },
        onToggle
      )
    );
    col.appendChild(ownerField);

    const objective = document.createElement("div");
    objective.className = "detail-field";
    objective.innerHTML = "<h4>Objective</h4>";
    if (step.detail && step.detail.length) {
      const ul = document.createElement("ul");
      ul.className = "sdetail";
      step.detail.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = d;
        ul.appendChild(li);
      });
      objective.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.textContent = phase.blurb;
      objective.appendChild(p);
    }
    col.appendChild(objective);

    container.appendChild(col);
  }

  function renderDrawer(phase, isOngoing, onToggle) {
    const status = phaseStatus(phase);

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

    // Which sub-stage is selected persists on the phase object itself so it
    // survives the full re-render triggered by status/owner changes,
    // defaulting to whichever sub-stage is actually in progress right now.
    const currentStep = displaySteps.find((s) => s.status === "active" || s.status === "blocked") || null;
    if (phase.__selected == null || phase.__selected >= displaySteps.length) {
      phase.__selected = currentStep ? displaySteps.indexOf(currentStep) : 0;
    }
    const selectedStep = displaySteps[phase.__selected];

    const columns = document.createElement("div");
    columns.className = "drawer-columns";

    const nav = document.createElement("div");
    nav.className = "substage-nav";
    nav.innerHTML = `<h4>Sub-stages <span class="h4-count">${counts.done}/${counts.total}</span></h4>`;
    const navList = document.createElement("div");
    navList.className = "substage-nav-list";
    displaySteps.forEach((s, i) => {
      const fromGov = phase.id === "launch" && i >= phase.steps.length;
      const reorderCtx = fromGov
        ? { array: ROADMAP.ongoing.steps, index: i - phase.steps.length }
        : { array: phase.steps, index: i };
      navList.appendChild(
        buildNavRow(
          s,
          s === selectedStep,
          () => {
            phase.__selected = i;
            if (onToggle) onToggle();
          },
          onToggle,
          reorderCtx
        )
      );
    });
    nav.appendChild(navList);

    const detail = document.createElement("div");
    detail.className = "substage-detail";

    const selIdx = displaySteps.indexOf(selectedStep);
    const fromGovernance = phase.id === "launch" && selIdx >= phase.steps.length;
    buildDetailPanel(detail, {
      step: selectedStep,
      phase,
      isCurrent: selectedStep === currentStep,
      ownerFallback: fromGovernance ? ROADMAP.ongoing.owners : phase.owners,
      onToggle,
    });

    columns.appendChild(nav);
    columns.appendChild(detail);
    body.appendChild(columns);
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

    const initial = location.hash.replace("#", "");
    if (initial && phaseById(initial)) openDrawer(initial);
  });
})();
