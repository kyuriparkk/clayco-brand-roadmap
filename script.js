(function () {
  const ICON = { done: "✓", active: "•", todo: "" };

  function phaseStatus(phase) {
    const statuses = phase.steps.map((s) => s.status);
    if (statuses.every((s) => s === "done")) return "done";
    if (statuses.some((s) => s === "active")) return "active";
    return "todo";
  }

  function buildGridlines(months) {
    const layer = document.createElement("div");
    layer.className = "gridlines";
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
    ruler.style.gridTemplateColumns = `repeat(${months}, 1fr)`;
    for (let m = 1; m <= months; m++) {
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = m;
      ruler.appendChild(num);
    }
    return ruler;
  }

  function buildGantt(root, onOpen) {
    const months = ROADMAP.months;
    const chart = document.createElement("div");
    chart.className = "chart";
    chart.appendChild(buildGridlines(months));

    const rows = document.createElement("div");
    rows.className = "rows";

    ROADMAP.phases.forEach((phase) => {
      const status = phaseStatus(phase);
      const row = document.createElement("div");
      row.className = "row";

      const bar = document.createElement("button");
      const fadeClass = phase.fade ? `fade-${phase.fade}` : "";
      bar.className = `bar ${status} ${fadeClass}`.trim();
      bar.style.left = `${((phase.month - 1) / months) * 100}%`;
      bar.style.width = `${(phase.span / months) * 100}%`;
      bar.title = phase.title;
      bar.innerHTML =
        `<span>${phase.title}</span>` + (status === "done" ? `<span class="done-check">✓</span>` : "");
      bar.addEventListener("click", () => onOpen(phase.id));
      row.appendChild(bar);
      rows.appendChild(row);
    });

    // Live-stage marker — a plain vertical bar, no label.
    const nowLine = document.createElement("div");
    nowLine.className = "now-line";
    nowLine.style.left = `${((ROADMAP.progressMonth - 1) / months) * 100}%`;
    rows.appendChild(nowLine);

    chart.appendChild(rows);
    chart.appendChild(buildRuler(months));
    root.appendChild(chart);
  }

  function buildStep(step) {
    const li = document.createElement("li");
    li.className = `step ${step.status}`;
    const top = document.createElement("div");
    top.className = "step-top";
    top.innerHTML = `<span class="step-icon ${step.status}">${ICON[step.status]}</span>${step.title}`;
    li.appendChild(top);
    if (step.detail && step.detail.length) {
      const ul = document.createElement("ul");
      ul.className = "step-detail";
      step.detail.forEach((d) => {
        const dli = document.createElement("li");
        dli.textContent = d;
        ul.appendChild(dli);
      });
      li.appendChild(ul);
    }
    return li;
  }

  function renderPhaseInto(phase, container, isOngoing) {
    container.innerHTML = "";
    const status = isOngoing ? "todo" : phaseStatus(phase);

    const head = document.createElement("div");
    head.className = "phase-head";
    head.innerHTML = `<h3>${phase.title}</h3><span class="phase-badge ${status}">${status}</span>`;
    container.appendChild(head);

    const blurb = document.createElement("p");
    blurb.className = "phase-blurb";
    blurb.textContent = phase.blurb;
    container.appendChild(blurb);

    const ul = document.createElement("ul");
    ul.className = "steps";
    phase.steps.forEach((s) => ul.appendChild(buildStep(s)));
    container.appendChild(ul);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("modal-overlay");
    const modalBody = document.getElementById("modal-body");

    const byId = new Map(ROADMAP.phases.map((p) => [p.id, p]));

    function openModal(id) {
      const phase = id === ROADMAP.ongoing.id ? ROADMAP.ongoing : byId.get(id);
      if (!phase) return;
      renderPhaseInto(phase, modalBody, id === ROADMAP.ongoing.id);
      overlay.hidden = false;
      history.replaceState(null, "", `#${id}`);
    }

    function closeModal() {
      overlay.hidden = true;
      history.replaceState(null, "", location.pathname + location.search);
    }

    document.getElementById("modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeModal();
    });

    buildGantt(document.getElementById("gantt"), openModal);

    document.getElementById("ongoing-trigger").addEventListener("click", () => openModal(ROADMAP.ongoing.id));

    document.getElementById("updated").textContent = ROADMAP.updated;

    const initial = location.hash.replace("#", "");
    if (initial && (byId.has(initial) || initial === ROADMAP.ongoing.id)) openModal(initial);
  });
})();
