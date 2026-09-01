/**
 * Clayco Brand Roadmap — content + status data.
 *
 * THIS IS THE FILE TO EDIT as the project moves forward.
 * Nothing else in the site needs to change when a stage's status changes —
 * update `status` fields here, commit, push. GitHub Pages redeploys automatically.
 *
 * status values:
 *   "done"        — complete
 *   "active"      — currently in progress (shows the "You are here" marker)
 *   "todo"        — not started yet
 *
 * A phase's own status is derived automatically from its steps (see script.js),
 * so you normally only need to update the `status` on individual `steps`.
 */

const ROADMAP = {
  months: 10,
  updated: "2026-09-01",
  // Where the "You are here" marker sits on the 1–10 month axis.
  // Currently: wrapping up Research, starting Brand Strategy.
  progressMonth: 2.6,
  phases: [
    {
      id: "research",
      month: 1,
      span: 3,
      title: "Research & Discovery",
      blurb: "Interview synthesis, audience research, competitive review, and current-brand audit.",
      steps: [
        {
          title: "Interview synthesis",
          status: "done",
          detail: ["Organize completed interview findings", "Translate findings into branding implications"],
        },
        {
          title: "Audience research",
          status: "done",
          detail: [
            "Identify primary and secondary audiences (Clients / Employees & recruits / Partners / Communities)",
            "Identify current and desired perceptions",
            "Create audience journeys",
          ],
        },
        {
          title: "Competitors",
          status: "done",
          detail: [
            "Identify direct and indirect competitors",
            "Compare positioning, names, taglines, messages, structures, visual identities, websites, digital experience, differentiation",
          ],
        },
        {
          title: "Review current brand",
          status: "done",
          detail: [
            "Logo & variations / Typography / imagery / graphic style / websites / social media / presentations, proposals / construction tools / signage",
            "Identify inconsistencies and accessibility gaps",
          ],
        },
        {
          title: "Research synthesis",
          status: "active",
          detail: ["Roll findings from all research streams into a single synthesis"],
        },
      ],
    },
    {
      id: "brand-strategy",
      month: 2,
      span: 2,
      title: "Brand Strategy",
      blurb: "Foundation, positioning, architecture, and language/naming.",
      steps: [
        {
          title: "Brand foundation",
          status: "active",
          detail: [
            "Purpose / Mission / Vision / Promise / Values",
            "Brand personality / desired future perception",
          ],
        },
        {
          title: "Positioning",
          status: "todo",
          detail: ["Market / Audience / Differentiators"],
        },
        {
          title: "Architecture",
          status: "todo",
          detail: [
            "Features and relationships of the 6 units",
            "Organize communities",
            "What / how to highlight",
          ],
        },
        {
          title: "Language",
          status: "todo",
          detail: [
            "Naming: company / service / program / product / descriptors / domain / social handle",
            "Naming rules for future services",
            "Verbal identity: narrative, tagline, one-sentence description, headline, voice, storytelling frameworks",
          ],
        },
      ],
    },
    {
      id: "design-system",
      month: 3,
      span: 4,
      title: "Design System",
      blurb: "Creative direction, logo, type, color, imagery, and the graphic + digital systems. (+ John)",
      steps: [
        {
          title: "Creative direction",
          status: "todo",
          detail: ["Brand strategy → visual principles", "Distinctiveness / accessibility"],
        },
        {
          title: "Logo",
          status: "todo",
          detail: ["Primary / secondary / small / colors / units logo family", "(Dohyoung, Sam A.)"],
        },
        {
          title: "Typography",
          status: "todo",
          detail: ["Primary title / secondary / font hierarchy / licensing"],
        },
        {
          title: "Colors",
          status: "todo",
          detail: ["Primary / secondary / functional / digital / print / contrast requirements"],
        },
        {
          title: "Imagery",
          status: "todo",
          detail: ["Photography direction / project / people", "Video direction / requirements"],
        },
        {
          title: "Graphic system",
          status: "todo",
          detail: [
            "Grid / layout",
            "Devices / platform",
            "Icon / infographic",
            "Illustration",
            "Data visualization / charts / diagrams",
            "Maps",
            "Motion principles",
            "Presentation system",
            "Proposal system",
            "Social templates",
          ],
        },
        {
          title: "Digital design system",
          status: "todo",
          detail: [
            "Typography",
            "Color tokens",
            "Buttons / links / navigation / cards / motion",
            "Reusable component library",
          ],
        },
      ],
    },
    {
      id: "website",
      month: 5,
      span: 2,
      title: "Website",
      blurb: "Research, requirements, architecture, prototypes, content, and launch prep.",
      steps: [
        { title: "Website research", status: "todo", detail: [] },
        { title: "Requirements", status: "todo", detail: [] },
        { title: "Web architecture", status: "todo", detail: [] },
        { title: "Wireframe / prototypes", status: "todo", detail: [] },
        { title: "Content strategy / production", status: "todo", detail: [] },
        { title: "Test / launch prep", status: "todo", detail: [] },
      ],
    },
    {
      id: "brand-guidelines",
      month: 6,
      span: 2,
      title: "Brand Guidelines",
      blurb: "Codify the full system, plus templates and tools for every application.",
      steps: [
        {
          title: "Brand guideline",
          status: "todo",
          detail: [
            "Brand strategy, architecture, naming, verbal identity",
            "Logo, typography, color, imagery, graphic system, digital system",
            "Accessibility, co-branding",
            "Correct and incorrect examples",
          ],
        },
        {
          title: "Templates / tools",
          status: "todo",
          detail: [
            "Presentation / proposal / documents / email / social / recruiting",
            "Vehicles & equipment / event materials / PPE & apparel",
            "Instructions",
          ],
        },
      ],
    },
    {
      id: "implementation",
      month: 8,
      span: 1,
      title: "Implementation & Migration",
      blurb: "Roll the new system out across the org.",
      steps: [{ title: "Details to be defined", status: "todo", detail: [] }],
    },
    {
      id: "launch",
      month: 9,
      span: 1,
      title: "Launch",
      blurb: "Train, launch internally, launch externally, then iterate on feedback.",
      steps: [
        { title: "Training", status: "todo", detail: [] },
        { title: "Internal launch", status: "todo", detail: [] },
        { title: "External launch", status: "todo", detail: [] },
        { title: "Feedback / updates", status: "todo", detail: [] },
      ],
    },
  ],
  // Ongoing phase — not part of the 10-month bar chart, continues after launch.
  ongoing: {
    id: "governance",
    title: "Brand Governance & Measurement",
    blurb: "Ongoing stewardship of the brand system once it's live.",
    steps: [{ title: "Details to be defined", status: "todo", detail: [] }],
  },
};
