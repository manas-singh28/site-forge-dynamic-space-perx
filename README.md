# Architect 2.0 — Product, User Flow, HLD, and LLD

## 1. Overview

Architect 2.0 is a premium AI product-creation experience that turns a simple idea into a visible software build journey. Instead of acting like a black-box code generator, it explains what it understands, shows the system design, reviews implementation choices, and helps move the product toward deployment.

This project is designed as a strong demo/prototype. It uses deterministic, client-side state and simulated workflows to communicate the product story clearly without depending on external APIs or a live backend.

Key product promise:
- Convert an idea into requirements, architecture, agents, code, preview, and deployment flow
- Keep AI reasoning visible and reviewable
- Help both non-technical and technical users understand what is being built
- Show a credible software creation journey through a premium developer-tool UX

---

## 2. Product Goal and Positioning

The platform aims to help users do more than generate code. It supports the full creation lifecycle:

- idea capture
- requirements review
- application architecture
- agent design
- workspaces and implementation surfaces
- live preview
- GitHub-style push simulation
- deployment review and release

This makes it useful for:
- non-technical users who want a guided path from product idea to working app
- technical users who want visibility into the decision-making behind the architecture and implementation

---

## 3. User Flow

The primary user journey is intentionally linear and easy to understand.

### 3.1 Main User Journey

1. Visitor lands on the public landing page.
2. User clicks Start demo or Explore Expense Intelligence.
3. Login/demo screen asks for a local workspace name.
4. User enters the idea or uses the sample project.
5. Architect analyzes the request and maps users, workflows, and capabilities.
6. User reviews the structured requirements summary.
7. Architect proposes architecture and system nodes.
8. User inspects nodes, agents, data model, and integrations.
9. User accepts architecture and enters the build workflow.
10. Build stages progress visibly through architecture and workspaces.
11. User opens the project workspace and sees explorer, AI panel, and preview.
12. User can review code, request a change, inspect diffs, and apply updates.
13. User uploads a receipt or triggers agent workflows.
14. User runs the agent playground and reviews guardrail behavior.
15. User goes through release and deployment review.
16. Project is pushed to a simulated GitHub flow and deployed to a local demo environment.

### 3.2 Example Product Flow

For the flagship project, Expense Intelligence, the flow looks like this:

- Employee uploads receipt
- AI extracts merchant, amount, date, and type
- Expense is categorized
- Approval policy is applied
- Finance review is triggered
- Notifications are sent
- Expense dashboard updates for reporting

This is represented in the UI through the architecture canvas, the agents screen, and the live workspace preview.

---

## 4. High-Level Design (HLD)

### 4.1 Design Principles

- transparency over abstraction
- visible AI reasoning over hidden magic
- guided workflow over freeform chaos
- demo realism over production complexity
- premium developer-tool aesthetic over generic SaaS styling

### 4.2 High-Level Architecture

The system is structured around a single app shell with multiple workflow stages:

- Public landing shell
- Demo login / onboarding screen
- Requirements review
- Architecture canvas
- Build process
- Workspace explorer and AI interaction tab
- Agent catalog and playground
- Data model inspector
- Integrations and deployment review

### 4.3 Main Components

#### A. Public Front Door
Responsible for:
- branding
- product positioning
- CTA flow to demo
- sample data / theme toggles

#### B. Onboarding and Requirement Capture
Responsible for:
- collecting the idea or prompt
- selecting collaboration mode
- summarizing requirement interpretation
- showing transparent progress while AI “understands” the project

#### C. Architecture Layer
Responsible for:
- representing nodes like users, web app, API gateway, orchestrator, agents, and data services
- showing relationships between application parts
- allowing inspection of purpose, model, tools, guardrails, and dependencies

#### D. Build Layer
Responsible for:
- showing staged work being created
- representing system components being assembled
- moving the user from architecture acceptance to app workspace

#### E. Workspace Layer
Responsible for:
- project explorer
- code view
- AI assistant
- diff review
- preview pane
- request-to-change workflow

#### F. Agent Layer
Responsible for:
- specialized agent catalog
- configured purpose, tools, models, and guardrails
- deterministic playground simulation

#### G. Release and Deployment Layer
Responsible for:
- review recommendations
- GitHub push simulation
- deployment logs
- production status / live URL

### 4.4 Runtime Model

The application's runtime is intentionally lightweight:

- client-side state controls the active screen
- mocked workflow transitions simulate agent execution
- local state drives alerts, previews, and deployment lifecycle
- all major state transitions are deterministic and trackable

This makes the app easy to demo and understand without deploying real services.

---

## 5. Low-Level Design (LLD)

### 5.1 UI State Model

The app keeps a rich set of local UI states such as:

- path / route
- theme
- sample data toggle
- onboarding stage
- build progress
- selected architecture node
- selected file
- active tab in workspace
- agent selected for configuration
- receipt upload state
- push state
- deployment state
- command palette / assistant drawer status
- toast notifications

This state is coordinated in the main page component in [app/page.tsx](app/page.tsx).

### 5.2 Key Functions and Responsibilities

#### `handleBuild()`
Starts the idea-to-architecture flow. It validates input, sets the onboarding stage, and starts the AI interpretation state.

#### `handleLooksGood()`
After requirements are reviewed, it advances the user into the architecture stage.

#### `handleAcceptArchitecture()`
Moves from architecture review to build progress and workspace creation.

#### `handlePlan()`
Prepares the AI change plan for workspace modifications.

#### `handleApply()`
Applies the change in the local state and updates preview behavior.

#### `handleStartReceipt()`
Runs the mock receipt workflow and triggers the receipt agent simulation.

#### `handleRunPlayground()`
Executes the agent test trace for the selected agent.

#### `handleDeploy()`
Runs the staged deployment lifecycle and updates deployment state.

### 5.3 Data Structures

The app uses several key types:

- `ThemeMode`: dark | light
- `OnboardingStage`: idle | analyzing | review
- `ReceiptState`: idle | analyzing | complete
- `PushState`: idle | pushing | pushed
- `DeploymentState`: idle | running | live
- `WorkspacePanel`: explorer | ai | preview
- `CenterTab`: code | ai | architecture | diff
- `Tone`: neutral | success | warning | error

These structures make the UI state explicit and domain-driven.

### 5.4 Agent and Workflow Simulation

This project simulates AI actions in a deterministic, controlled way rather than invoking external providers. The UI uses time-based transitions and local state updates to behave like a believable AI workflow.

Examples:
- analyzing requirements
- showing plan progress
- running receipt extraction
- simulating GitHub push
- simulating deployment pipelines

This is intentional; the site is a demo of a productized AI workflow rather than a real operational app backend.

---

## 6. Core Modules and Responsibilities

### 6.1 Public Landing Module
Purpose: create the first impression and explain the product value.

### 6.2 Demo/Onboarding Module
Purpose: capture the user idea and step them into the guided workflow.

### 6.3 Architecture Module
Purpose: show the conceptual design of the application, including system nodes and relationships.

### 6.4 Workspace Module
Purpose: combine explorer, AI, and preview surfaces into a believable software-building environment.

### 6.5 Agent Module
Purpose: expose specialized AI roles such as receipt extraction, categorization, approval, and notifications.

### 6.6 Release Module
Purpose: review deployment risk, run tests, push to GitHub, and publish the app.

### 6.7 Notification/Toast Layer
Purpose: provide clear, short feedback on actions like requirements accepted, changes applied, receipt analyzed, and deployment succeeded.

---

## 7. Data and Domain Model

The project has a simulated Expense Intelligence domain model.

### Entities
- user
- expense
- receipt
- approval
- notification

### Example Relationship Model
- Users own or submit expenses
- Expenses can have associated receipts
- Approvals belong to expense workflows
- Notifications are triggered by state changes

The UI exposes this concept in the data model screen and in the architecture canvas.

### Important Note
This product does not require a real database for the demo. Per the product brief, the data model is simulated product content for demo purposes.

---

## 8. Technical Stack

This app is built with a modern web stack centered on Next.js and React:

- Next.js application shell
- React client state
- Tailwind CSS for styling
- shadcn-style UI primitives
- lucide-react icons
- deterministic mock workflows for AI actions

Relevant files:
- [app/page.tsx](app/page.tsx)
- [workflow.json](workflow.json)
- [plan-handoff/prd.md](plan-handoff/prd.md)
- [response_schemas/architect_product_copilot.json](response_schemas/architect_product_copilot.json)

---

## 9. Sequence Flows

### 9.1 Idea-to-Architecture Flow

1. User enters a prompt.
2. Product copilot interprets the idea.
3. Requirements are extracted and reviewed.
4. Architecture nodes are generated.
5. User reviews and accepts architecture.

### 9.2 Workspace Change Flow

1. User requests a change in the AI panel.
2. Copilot proposes plan and affected surfaces.
3. User reviews diff.
4. User applies the change.
5. Preview updates.

### 9.3 Receipt Analysis Flow

1. User uploads a receipt.
2. Receipt agent analyzes image and fields.
3. Structured extraction is validated.
4. Expense is added to local preview.

### 9.4 Release Flow

1. Review risk/guardrail findings.
2. Fix architecture issue or upload limit issue.
3. Push to a simulated GitHub repository.
4. Run deployment sequence.
5. Show live production URL.

---

## 10. Non-Functional Considerations

### UX
- accessible interaction patterns
- clear status states
- strong visual hierarchy
- reduced friction across transitions

### Reliability
- deterministic simulation reduces runtime unpredictability
- local state is easy to trust in a demo environment

### Maintainability
- UI is organized by workflow stage
- state is explicit and readable
- product design follows a coherent narrative

### Security and Privacy
- no external sensitive data flow in demo mode
- no production identity or database assumptions
- all simulation remains local to the experience

---

## 11. Risks and Assumptions

### Assumptions
- The app is being evaluated as a presentation/demo product, not as a production SaaS backend.
- Users value transparency and product story as much as raw functionality.
- The user journey matters more than a deep implementation of every backend integration.

### Risks
- If users expect real external integrations, the simulation may feel too artificial.
- If the app is judged only as a code generator, it may underplay the architecture and release story.
- If the value proposition is not clear, users may see it as a visual demo rather than a serious builder.

---

## 12. Summary

Architect 2.0 is not just an AI app builder. It is a guided, transparent product-creation system that shows the full logic of building software:

- understand the idea
- plan the system
- configure agents
- review code and diff
- validate in preview
- ship with release confidence

This is what makes it valuable to both non-technical users and technical users: it turns AI from a tool that writes code into a system that helps people reason, review, and ship software more effectively.
