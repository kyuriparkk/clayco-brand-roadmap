(function () {
  const ICON = { done: "✓", active: "•", todo: "" };

  function phaseStatus(phase) {
    const statuses = phase.steps.map((s) => s.status);
    if (statuses.every((s) => s === "done")) return "done";
    if (statuses.some((s) => s === "active")) return "active";
    return "todo";
  }

  function buildRuler(months) {
    const ruler = document.createElement("div");
    ruler.className = "month-ruler";
    ruler.appendChild(document.createElement("div")).className = "label";
    for (let m = 1; m <= months; m++) {
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = m;
      ruler.appendChild(num);
    }
    return ruler;
  }

  function buildGantt(root) {
    const months = ROADMAP.months;
    const inner = document.createElement("div");
    inner.className = "gantt-inner";
    inner.appendChild(buildRuler(months));

    const rows = document.createElement("div");
    rows.className = "gantt-rows";

    ROADMAP.phases.forEach((phase) => {
      const status = phaseStatus(phase);
      const row = document.createElement("div");
      row.className = "gantt-row";

      const label = document.createElement("div");
      label.className = "rowlabel";
      label.innerHTML = `<span class="status-chip ${status}"></span>${phase.title}`;
      row.appendChild(label);

      const track = document.createElement("div");
      track.className = "track";

      const bar = document.createElement("button");
      bar.className = `bar ${status}`;
      bar.textContent = phase.title;
      bar.title = phase.title;
      bar.style.left = `${((phase.month - 1) / months) * 100}%`;
      bar.style.width = `${(phase.span / months) * 100}%`;
      bar.addEventListener("click", () => {
        document.getElementById(phase.id).scrollIntoView({ behavior: "smooth", block: "start" });
      });
      track.appendChild(bar);
      row.appendChild(track);
      rows.appendChild(row);
    });

    // "You are here" marker, positioned across the full row stack.
    const nowLine = document.createElement("div");
    nowLine.className = "now-line";
    const pct = ((ROADMAP.progressMonth - 1) / months) * 100;
    nowLine.style.left = `calc(220px + (100% - 220px) * ${pct / 100})`;
    const flag = document.createElement("div");
    flag.className = "flag";
    flag.textContent = "You are here";
    nowLine.appendChild(flag);
    rows.appendChild(nowLine);

    inner.appendChild(rows);
    root.appendChild(inner);
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

  function buildPhaseSection(phase, container, isOngoing) {
    const status = isOngoing ? "todo" : phaseStatus(phase);
    const section = document.createElement("section");
    section.className = "phase";
    section.id = phase.id;

    const head = document.createElement("div");
    head.className = "phase-head";
    head.innerHTML = `<h3>${phase.title}</h3><span class="phase-badge ${status}">${status}</span>`;
    section.appendChild(head);

    const blurb = document.createElement("p");
    blurb.className = "phase-blurb";
    blurb.textContent = phase.blurb;
    section.appendChild(blurb);

    const ul = document.createElement("ul");
    ul.className = "steps";
    phase.steps.forEach((s) => ul.appendChild(buildStep(s)));
    section.appendChild(ul);

    container.appendChild(section);
  }

  function buildJumpNav() {
    const nav = document.createElement("nav");
    nav.className = "jumpnav";
    ROADMAP.phases.forEach((phase) => {
      const a = document.createElement("a");
      a.href = `#${phase.id}`;
      a.dataset.target = phase.id;
      const tip = document.createElement("span");
      tip.className = "tip";
      tip.textContent = phase.title;
      a.appendChild(tip);
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    return nav;
  }

  function wireScrollSpy(nav) {
    const links = Array.from(nav.querySelectorAll("a"));
    const sections = ROADMAP.phases.map((p) => document.getElementById(p.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.toggle("current", l.dataset.target === entry.target.id));
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((s) => s && observer.observe(s));
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildGantt(document.getElementById("gantt"));

    const detail = document.getElementById("phase-detail");
    ROADMAP.phases.forEach((phase) => buildPhaseSection(phase, detail, false));

    buildPhaseSection(ROADMAP.ongoing, document.getElementById("ongoing-detail"), true);

    const nav = buildJumpNav();
    wireScrollSpy(nav);

    document.getElementById("updated").textContent = ROADMAP.updated;
  });
})();
