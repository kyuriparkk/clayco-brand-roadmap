/**
 * Clayco Brand Roadmap — single source of truth for content + status.
 *
 * Edit this file as the project moves forward, commit, and push — everything
 * else (timeline, status strip, drawer) is derived from it automatically.
 *
 * Step status values: "done" | "active" | "blocked" | "todo"
 *   done    — complete
 *   active  — currently in progress
 *   blocked — stuck / delayed, needs attention (shown with a warning treatment)
 *   todo    — not started yet
 *
 * A phase's own status, percent-complete, and "current sub-stage" are all
 * derived automatically from its `steps` (see script.js) — you only need to
 * update step-level `status`.
 *
 * Dates: `projectStart` anchors the 1–10 month axis to the calendar using
 * 30-day months. Adjust it if the real kickoff date changes; every other
 * date (phase ranges, target launch, the current-position marker) recomputes
 * from it plus `progressMonth`.
 */

/**
 * Microsoft Graph / Entra ID (Azure AD) config for the "+ add owner" people
 * search. To turn on real Clayco directory search:
 *
 *   1. In Azure Portal → Microsoft Entra ID → App registrations, register a
 *      new "Single-page application" (SPA).
 *   2. Add this page's URL as a redirect URI (SPA platform), e.g.
 *      https://<your-domain>/index.html
 *   3. Under API permissions, add Microsoft Graph delegated permission
 *      "User.ReadBasic.All" (no admin consent is typically required for
 *      this one, but check with your Entra admin).
 *   4. Copy the "Application (client) ID" and "Directory (tenant) ID" from
 *      the app registration's Overview page into clientId / tenantId below.
 *
 * Until both are filled in, "+ add owner" falls back to typing a name.
 */
const MS_GRAPH_CONFIG = {
  clientId: "",
  tenantId: "",
  scopes: ["User.ReadBasic.All"],
};

const ROADMAP = {
  months: 10,
  // Month 1 of the axis = September; month 10 = June (see script.js
  // monthOffsetDate, which walks real calendar months from this date).
  projectStart: "2026-09-01",
  // Where the current-position marker sits on the 1–10 month axis.
  progressMonth: 1,
  targetLaunch: "2027-06-01",
  updated: "2026-09-01",
  updatedBy: "Kyuri Park",
  nextUpdate: "2026-09-15",
  health: {
    status: "on-track", // "on-track" | "at-risk" | "delayed"
    note: "Research wrapping up on schedule; Brand Strategy kickoff underway.",
  },

  phases: [
    {
      id: "research",
      month: 1,
      span: 2,
      fade: "in",
      bleed: "left",
      title: "Research & Discovery",
      blurb: "Interview synthesis, audience research, competitive review, and current-brand audit.",
      owners: ["Kyuri Park", "David Chiow"],
      approvalGate: "Research synthesis reviewed and approved by brand leadership",
      dependsOn: [],
      risks: [],
      latestUpdate: {
        date: "2026-09-01",
        text: "Interview synthesis, audience research, competitive review, and current-brand audit are complete. Research synthesis is in progress and expected to close out this week.",
      },
      steps: [
        {
          title: "Interview synthesis",
          summary: "Turn completed stakeholder interviews into clear branding takeaways.",
          status: "done",
          detail: ["Organize completed interview findings", "Translate findings into branding implications"],
        },
        {
          title: "Audience research",
          summary: "Map who we're building the brand for and how they see us today.",
          status: "done",
          detail: [
            "Identify primary and secondary audiences (Clients / Employees & recruits / Partners / Communities)",
            "Identify current and desired perceptions",
            "Create audience journeys",
          ],
        },
        {
          title: "Competitors",
          summary: "See how we stack up against direct and indirect competitors.",
          status: "done",
          detail: [
            "Identify direct and indirect competitors",
            "Compare positioning, names, taglines, messages, structures, visual identities, websites, digital experience, differentiation",
          ],
        },
        {
          title: "Review current brand",
          summary: "Catalog every existing brand touchpoint and where it falls short.",
          status: "done",
          detail: [
            "Logo & variations / Typography / imagery / graphic style / websites / social media / presentations, proposals / construction tools / signage",
            "Identify inconsistencies and accessibility gaps",
          ],
        },
        {
          title: "Research synthesis",
          summary: "Combine research findings into one prioritized strategic brief.",
          status: "active",
          detail: ["Roll findings from all research streams into a single synthesis"],
        },
      ],
    },
    {
      id: "brand-strategy",
      month: 1,
      span: 3,
      title: "Brand Strategy",
      blurb: "Foundation, positioning, architecture, and language/naming.",
      owners: ["Kyuri Park", "David Chiow"],
      approvalGate: "Brand foundation & positioning approved by executive sponsor",
      dependsOn: ["research"],
      risks: [],
      latestUpdate: {
        date: "2026-09-01",
        text: "Kickoff underway — brand foundation workshop scheduled.",
      },
      steps: [
        {
          title: "Brand foundation",
          summary: "Define why we exist, where we're going, and what we stand for.",
          status: "active",
          detail: [
            "Purpose / Mission / Vision / Promise / Values",
            "Brand personality / desired future perception",
          ],
        },
        {
          title: "Positioning",
          summary: "Pinpoint how we want to be seen relative to the market and competitors.",
          status: "todo",
          detail: ["Market / Audience / Differentiators"],
        },
        {
          title: "Architecture",
          summary: "Decide how the six business units relate to each other under one brand.",
          status: "todo",
          detail: [
            "Features and relationships of the 6 units",
            "Organize communities",
            "What / how to highlight",
          ],
        },
        {
          title: "Language",
          summary: "Set naming rules and the voice we'll use to talk about the brand.",
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
      month: 2,
      span: 5,
      fade: "out",
      title: "Design System",
      blurb: "Creative direction, logo, type, color, imagery, and the graphic + digital systems.",
      owners: ["Kyuri Park"],
      approvalGate: "Design system approved by creative direction (John) and brand leadership",
      dependsOn: ["brand-strategy"],
      risks: [
        "Design capacity is dependent on external creative support (+ John) — confirm availability before this phase starts.",
      ],
      latestUpdate: null,
      steps: [
        {
          title: "Creative direction",
          summary: "Translate brand strategy into visual principles designers can apply.",
          status: "todo",
          detail: ["Brand strategy → visual principles", "Distinctiveness / accessibility"],
        },
        {
          title: "Logo",
          summary: "Design the primary, secondary, and unit-level logo family.",
          status: "todo",
          detail: ["Primary / secondary / small / colors / units logo family", "(Dohyoung, Sam A.)"],
        },
        {
          title: "Typography",
          summary: "Choose the typefaces and hierarchy used across every touchpoint.",
          status: "todo",
          detail: ["Primary title / secondary / font hierarchy / licensing"],
        },
        {
          title: "Colors",
          summary: "Define the palette for print, digital, and functional use.",
          status: "todo",
          detail: ["Primary / secondary / functional / digital / print / contrast requirements"],
        },
        {
          title: "Imagery",
          summary: "Set the direction for photography and video across the brand.",
          status: "todo",
          detail: ["Photography direction / project / people", "Video direction / requirements"],
        },
        {
          title: "Graphic system",
          summary: "Build the shared visual toolkit — grids, icons, motion, and templates.",
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
          summary: "Create the reusable component library for digital products.",
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
      month: 4,
      span: 5,
      fade: "out",
      title: "Website",
      blurb: "Research, requirements, architecture, prototypes, content, and launch prep.",
      owners: ["Kyuri Park"],
      approvalGate: "Website design & content approved prior to build handoff",
      dependsOn: ["brand-strategy", "design-system"],
      risks: [],
      latestUpdate: null,
      steps: [
        {
          title: "Website research",
          summary: "Audit the current site and gather input on what the new one needs to do.",
          status: "todo",
          detail: [],
        },
        {
          title: "Requirements",
          summary: "Define the features and content the new site must support.",
          status: "todo",
          detail: [],
        },
        {
          title: "Web architecture",
          summary: "Map out the site's structure and how pages connect.",
          status: "todo",
          detail: [],
        },
        {
          title: "Wireframe / prototypes",
          summary: "Sketch and test the site's layout before visual design.",
          status: "todo",
          detail: [],
        },
        {
          title: "Content strategy / production",
          summary: "Plan and write the content that will populate the site.",
          status: "todo",
          detail: [],
        },
        {
          title: "Test / launch prep",
          summary: "QA the site and get it ready to go live.",
          status: "todo",
          detail: [],
        },
      ],
    },
    {
      id: "brand-guidelines",
      month: 7,
      span: 3,
      title: "Brand Guidelines",
      blurb: "Codify the full system, plus templates and tools for every application.",
      owners: ["Kyuri Park", "David Chiow"],
      approvalGate: "Final guidelines approved for org-wide distribution",
      dependsOn: ["design-system"],
      risks: [],
      latestUpdate: null,
      steps: [
        {
          title: "Brand guideline",
          summary: "Document the full brand system so anyone can apply it correctly.",
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
          summary: "Build ready-to-use templates for everyday brand applications.",
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
      span: 3,
      title: "Implementation & Migration",
      blurb: "Roll the new system out across the org.",
      owners: ["Kyuri Park", "David Chiow"],
      approvalGate: "Rollout plan approved by Program Management",
      dependsOn: ["brand-guidelines"],
      risks: [],
      latestUpdate: null,
      steps: [
        {
          title: "Details to be defined",
          summary: "Scope the rollout plan once brand guidelines are finalized.",
          status: "todo",
          detail: [],
        },
      ],
    },
    {
      id: "launch",
      month: 10,
      span: 1,
      fade: "out",
      bleed: "right",
      title: "Launch",
      blurb: "Train, launch internally, launch externally, then iterate on feedback.",
      owners: ["Kyuri Park"],
      approvalGate: "Launch readiness sign-off from executive sponsor",
      dependsOn: ["implementation"],
      risks: [],
      latestUpdate: null,
      steps: [
        {
          title: "Training",
          summary: "Prepare teams to understand and apply the new brand.",
          status: "todo",
          detail: [],
        },
        {
          title: "Internal launch",
          summary: "Introduce the new brand to employees company-wide.",
          status: "todo",
          detail: [],
        },
        {
          title: "External launch",
          summary: "Reveal the new brand to clients, partners, and the public.",
          status: "todo",
          detail: [],
        },
        {
          title: "Feedback / updates",
          summary: "Gather early feedback and make adjustments post-launch.",
          status: "todo",
          detail: [],
        },
      ],
    },
  ],

  // Continuous foundation beneath the whole timeline — not date-boxed.
  ongoing: {
    id: "governance",
    title: "Brand Governance & Measurement",
    blurb: "Ongoing stewardship of the brand system once it's live.",
    owners: ["Kyuri Park"],
    approvalGate: "Reviewed quarterly by the Brand Council",
    dependsOn: ["launch"],
    risks: [],
    latestUpdate: null,
    steps: [
      {
        title: "Brand Governance & Measurement",
        summary: "Keep the brand consistent and on-strategy after launch.",
        status: "todo",
        detail: ["Ongoing stewardship of the brand system once it's live."],
      },
    ],
  },
};
