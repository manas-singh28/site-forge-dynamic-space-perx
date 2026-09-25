I’ll turn the confirmed direction into a focused product plan and a four-screen mockup covering the flagship journey’s decisive moments.

# Architect 2.0

## 1. Overview

Architect 2.0 is a premium, desktop-first AI software creation prototype that turns a product idea into an inspectable, deployable application through one continuous journey:

**Idea → Requirements → Architecture → Agents → Build → Code → Preview → GitHub → Deployment**

The hiring-demo experience prioritizes:

- A coherent product narrative over equal depth on every secondary page.
- High-fidelity, realistic interactions using temporary client-side state.
- Transparent AI behavior: every action explains what Architect understood, intends to do, changed, and recommends next.
- Technical credibility without backend infrastructure, API keys, paid services, or real external calls.
- A sophisticated developer-tool aesthetic rather than a conventional SaaS dashboard.

The flagship Expense Intelligence project uses the exact supplied users, expenses, agents, repository, and commit content. All AI, GitHub, agent testing, receipt analysis, and deployment behavior is simulated through deterministic fixtures and timed state transitions.

A lightweight fixture adapter will keep simulated behavior separate from presentation components so the prototype remains credible and extensible.

## 2. User Stories

- As a visitor, I can understand Architect’s value and enter the demo from a concise landing page.
- As a prospective builder, I can describe an application and choose how much control Architect should give me.
- As a builder, I can review Architect’s interpretation before it makes technical decisions.
- As a technical stakeholder, I can inspect an interactive application architecture and understand every node.
- As a builder, I can watch a transparent, believable build sequence instead of jumping to a finished dashboard.
- As a developer, I can browse files, inspect realistic TypeScript, converse with Architect, review diffs, and apply changes.
- As a product owner, I can see changes reflected in a realistic live preview.
- As an AI product evaluator, I can inspect and test specialized agents, guardrails, tools, outputs, and execution traces.
- As a data-oriented user, I can inspect a relational data model and realistic schema metadata.
- As a developer, I can simulate pushing changes to GitHub with commit details and visible confirmation.
- As a technical decision-maker, I can review architectural risks and apply recommendations before deployment.
- As a builder, I can simulate production deployment and reach a convincing live state.
- As a power user, I can use a command palette and contextual assistant from anywhere.
- As a mobile or tablet visitor, I can still access the primary journey through collapsed navigation and panel tabs.

## 3.a. Agent Architecture

Architect’s visible AI behavior uses deterministic client-side fixtures in demo mode. One hosted Lyzr agent is defined as the editable product counterpart, but the prototype does not depend on it and makes no runtime external calls.

The Receipt, Categorization, Approval, and Notification agents shown inside Expense Intelligence are **simulated agents belonging to the application being created**, not additional live Lyzr agents.

| Agent Type | Agent Name | Description | Tools/Data Sources | Trigger | Provider | Model | Temperature | Top_p |
|---|---|---|---|---|---|---|---:|---:|
| Single | Architect Product Copilot | Interprets product requests, explains proposed implementation changes, and produces transparent next-step guidance. Replaced by deterministic fixtures in demo mode. | Current screen context and mock project manifest; no external tools | Contextual assistant prompt or workspace change request | OpenAI | gpt-5.4-mini | 0.2 | 0.9 |

### 3.c. Demo State Model

Temporary in-memory state will track:

- Current onboarding stage.
- Selected control mode.
- Accepted requirements and architecture.
- Build progress.
- Active workspace tab and selected file.
- Proposed, reviewed, and applied AI changes.
- Preview chart variant.
- Receipt analysis progress and added-expense toast.
- Selected architecture node, agent, and database table.
- GitHub push state.
- Applied architecture recommendations.
- Deployment stage and final live state.
- Sidebar, command palette, assistant, modal, and drawer visibility.

Refreshing the page may reset the demo. No account or project data must persist across sessions.

### 3.d. Simulated Interaction Engine

A reusable fixture engine will expose typed mock operations such as:

- `understandIdea`
- `generateArchitecture`
- `runBuildSequence`
- `proposeWorkspaceChange`
- `applyWorkspaceChange`
- `analyzeReceipt`
- `runReceiptAgent`
- `pushToGitHub`
- `applyArchitectureRecommendation`
- `deployApplication`

Each operation progresses through predefined loading, success, and optional error states using short controlled delays. Components remain interactive during the demo without calling external services.

### 3.e. Product Transparency Pattern

Every prominent AI interaction follows the same four-part structure:

1. **Understood** — summarizes the user’s goal or current context.
2. **Plan** — states exactly what Architect will inspect or modify.
3. **Changes** — lists files, architecture elements, or records affected.
4. **Next** — offers review, apply, test, undo, or continue actions.

### 3.f. Route Map

- `/` — focused landing page and visual product pipeline.
- `/login` — premium demo login.
- `/app` — home/projects entry with polished empty-state support.
- `/app/new` — idea prompt, control choice, requirements review, and understanding transition.
- `/app/project/expense-intelligence` — three-panel workspace.
- `/app/project/expense-intelligence/architecture` — interactive system canvas.
- `/app/project/expense-intelligence/agents` — agent catalog, configuration drawer, and playground.
- `/app/project/expense-intelligence/data` — relational data model.
- `/app/project/expense-intelligence/integrations` — simulated integration marketplace and GitHub detail.
- `/app/project/expense-intelligence/deploy` — architecture review and deployment sequence.

The building experience appears as a transitional route state between architecture acceptance and the workspace.

## 3.g. Database Configuration

No application database is required.

Architect 2.0 uses temporary client-side demo state and static typed fixtures. The PostgreSQL database shown in the Expense Intelligence architecture, preview, and data model is simulated product content only. No signup, persistent authentication, migration, or database provisioning is needed.

## 4. User Flow

1. The visitor sees the landing hero, compact product pipeline, and animated application preview.
2. **Start Building** opens `/app/new`; **Explore Demo** enters the preconfigured Expense Intelligence journey.
3. The user reviews the prefilled expense-management prompt and keeps **Build with me** selected.
4. **Build Application** shows “Understanding your idea…” with transparent analysis steps.
5. Architect presents understood users, workflows, and capabilities.
6. **Looks good** opens the architecture workspace.
7. The user explores connected nodes and opens the Receipt Agent drawer.
8. **Accept Architecture** starts the staged build experience.
9. Completed and active build tasks advance automatically into the main workspace.
10. The workspace opens with Project Explorer, Architect AI, and Expense Intelligence preview.
11. The user reviews the monthly category request, opens the diff, and applies changes.
12. The preview chart updates and confirms the applied change.
13. **Upload Receipt** runs a simulated analysis and adds the Uber expense with a success toast.
14. The user opens Agents, inspects Receipt Agent, and runs its playground trace.
15. The user visits Deploy and reviews architectural findings before deployment.
16. **Apply recommendation** resolves the retry-policy finding.
17. The global GitHub action simulates pushing 12 files and displays commit `a8f32d1`.
18. **Deploy** runs staged production checks and shows the live application URL.
19. At any point, `Ctrl+K` or `Cmd+K` opens the command palette, while **Ask Architect** opens contextual guidance.

## 5. Integrations Required

No live integrations are required for the prototype.

The following are simulated:

- GitHub connection, repository, branch, commits, diffs, and push behavior.
- Slack, Google Drive, PostgreSQL, AWS, and Stripe marketplace states.
- Receipt OCR and validation.
- AI model execution.
- Notifications.
- Deployment infrastructure and logs.

This ensures the full experience works immediately without API keys, OAuth, a database, or network access.

## 6. UI/UX Specification

Architect opens in a premium dark presentation using near-black `#08090D`, layered surfaces `#101217` and `#151820`, borders `#252936`, white text, muted `#8B91A1`, indigo-purple primary accents, and restrained cyan status accents. A discreet appearance control remains available in Settings.

The shell uses a collapsible 232px sidebar, compact top bar, and content-specific workspaces. Typography is modern and technical, with strong hierarchy, tabular metadata, monospaced code, thin borders, restrained gradients, and selective glass effects. Glow is reserved for active AI, live, and success states.

The main workspace is the visual centerpiece: a navigable file tree on the left, AI/code/diff tabs in the center, and a credible application preview on the right. Resizable-feeling dividers, compact controls, editor chrome, line numbers, and status metadata make it read as a real development environment.

Architecture uses a spacious connected-node canvas with animated directional lines and a sliding detail drawer. Agents use information-dense cards and a separate execution playground. Data uses an entity-relationship canvas rather than a generic table dashboard.

Motion lasts roughly 150–300ms for hover, tabs, drawers, and modals. Longer simulated work uses meaningful progress labels, not indefinite spinners. Success feedback combines state changes, concise toasts, and subtle check animations.

On narrower screens, the sidebar collapses automatically and the three workspace panels become top-level tabs. Drawers become full-height sheets, cards stack, and primary actions remain sticky. Keyboard focus, descriptive labels, reduced-motion support, escape-to-close, adequate contrast, and 40px minimum action targets are required.

## Artifacts & references

- **Selected visual theme:** premium dark AI developer-tool treatment with calm indigo/blue foundations and restrained cyan feedback.
- **Primary demo project:** Expense Intelligence.
- **Primary evaluation path:** landing → requirements → architecture → build → workspace → agents → review → GitHub → deployment.
- **Design references:** Linear, Vercel, Cursor, and Figma are quality references only; the component language and layouts remain original.
- **Mockup coverage:** requirements handoff, architecture canvas, main workspace, and architecture-review/deployment experience.