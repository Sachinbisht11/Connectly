# Connectly — AI Coding Rules, Architecture Guardrails & Milestone Plan

**Document version:** 1.0  
**Purpose:** A shared instruction manual for any AI coding assistant working on Connectly.  
**Product:** Connectly, a responsive real-time messaging web application.  
**Working principle:** Implement the smallest verified increment, keep the code understandable, and do not claim work is complete until it has been tested.

---

## 1. How the AI Must Work

These rules are mandatory for every coding session.

### 1.1 Work in milestones, not giant batches
1. Read this document and the project PRD before making changes.
2. Inspect the existing repository before suggesting or editing files.
3. Identify the current milestone and its acceptance criteria.
4. Work only on the current milestone unless the user explicitly changes scope.
5. Break the milestone into small, reviewable tasks.
6. Before editing, state briefly:
   - what will change;
   - which files are likely to change;
   - dependencies or configuration needed;
   - how the work will be verified.
7. Implement the smallest coherent change.
8. Run the relevant formatter, linter, type checker, tests, and build commands that exist in the repository.
9. Fix failures caused by the change. Do not hide failures by weakening tests or disabling checks.
10. Summarize files changed, behavior added, commands run, results, known limitations, and the next step.

### 1.2 Do not fabricate progress
- Never say a command passed unless it was actually run and its result observed.
- Never say a feature is complete if it is only a UI mock, placeholder, TODO, or hard-coded demo.
- Clearly distinguish **implemented**, **tested**, **manually verified**, **not verified**, and **deferred**.
- If a requirement is unclear, inspect the PRD and repository first. Ask one focused question only when the ambiguity blocks safe progress.
- Do not silently make major product or architecture decisions.
- Do not overwrite existing work or delete files without explaining why and getting permission when the impact is significant.
- Do not add a dependency just because it is convenient; explain its purpose and maintenance cost.
- Do not expose secrets, tokens, private user data, or environment-variable values in logs, examples, screenshots, or documentation.

### 1.3 Preserve user control
- Show a short plan before significant changes.
- Prefer focused diffs over rewriting entire files.
- Do not run destructive commands, reset branches, delete databases, rotate credentials, deploy to production, or incur paid costs without explicit approval.
- Never commit, push, or deploy unless explicitly asked.
- If a tool cannot inspect or execute something, say so and provide the exact command the user can run.

---

## 2. Product Context and Scope

Connectly is an original, WhatsApp-inspired web messaging app. It must have its own name, branding, layout details, and assets; do not copy proprietary branding or imply affiliation with WhatsApp.

### 2.1 Intended stack
Use these choices unless the repository or user explicitly approves a change:

**Frontend**
- React
- TypeScript with strict type checking
- Vite
- Tailwind CSS
- React Router
- Socket.IO Client
- React Hook Form and Zod for forms/validation where appropriate
- Vitest and React Testing Library for unit/component tests
- Playwright for important end-to-end flows

**Backend**
- Node.js
- TypeScript
- Express
- Socket.IO
- MongoDB Atlas with Mongoose
- Zod or a comparable schema validator
- bcrypt for password hashing
- A deliberate, documented session/JWT strategy
- Rate limiting and security middleware

**Media**
- Store uploaded binary media in managed object/media storage such as Cloudinary or S3-compatible storage.
- Store metadata and storage references in MongoDB, not large media binaries.
- Keep provider credentials on the server.
- Protect private media with authorization or appropriately scoped, expiring signed URLs.

**Deployment direction**
- Frontend: Vercel or equivalent.
- API and Socket.IO: a persistent Node.js host that supports WebSockets.
- Database: MongoDB Atlas.
- Confirm host sleep, WebSocket, file upload, environment variable, and background-worker behavior before relying on it.

Do not add Redis, a queue, a global state library, or another infrastructure service until a requirement needs it. Explain trade-offs before introducing one.

### 2.2 Product priorities
**P0 — MVP**
- Registration, login, logout, protected routes.
- User profile and user search.
- One-to-one conversations.
- Persistent text messages and paginated history.
- Real-time delivery through Socket.IO.
- Basic groups and member/admin controls.
- Presence and typing indicators.
- Sent/delivered/read status where implemented reliably.
- Photo, video, and document attachments.
- Scheduled text messages with list, edit, cancel, and delivery status.
- Responsive UI, validation, error handling, security, tests, documentation, deployment.

**P1 — Later improvements**
- Voice notes.
- Replies, reactions, edit/delete/forward.
- Message search, mute, unread counts, in-app notifications.
- Scheduled media, only after scheduled text is reliable.

**P2 — Future**
- Voice/video calls.
- Status/stories, disappearing messages, multi-device sessions.
- Browser push, PWA/offline drafts.
- End-to-end encryption only after a separate security design/review.

The AI must not start P1/P2 features while a required P0 milestone is incomplete, unless the user explicitly reprioritizes the project.

---

## 3. Architecture and Code Organization

Use a clear separation of concerns. Adapt to the repository's actual layout, but avoid mixing UI, business rules, persistence, and transport logic in the same file.

Suggested structure:

```text
connectly/
├── client/
│   ├── src/
│   │   ├── app/                 # app setup, router, providers
│   │   ├── assets/
│   │   ├── components/          # reusable presentational components
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   ├── media/
│   │   │   └── scheduled-messages/
│   │   ├── hooks/
│   │   ├── lib/                 # API client, socket client, utilities
│   │   ├── types/
│   │   └── main.tsx
│   ├── public/
│   └── tests/
├── server/
│   ├── src/
│   │   ├── config/              # validated environment configuration
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   ├── media/
│   │   │   └── scheduled-messages/
│   │   ├── sockets/
│   │   ├── jobs/                # background jobs/workers
│   │   ├── shared/
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── decisions/
├── .env.example
├── .gitignore
├── README.md
└── AI_RULES_AND_MILESTONES.md
```

This is a target, not a mandate to restructure everything immediately. If the repository already has a sensible layout, preserve it and document the existing convention.

### 3.1 Backend module pattern
For a feature with meaningful complexity, prefer:
- **route**: URL and HTTP method wiring;
- **controller/handler**: parse request and shape response;
- **service**: business rules and orchestration;
- **model/repository**: persistence;
- **schema**: input validation;
- **types**: shared feature-specific types;
- **tests**: unit/integration coverage.

Do not create empty layers for trivial features. Keep abstractions proportional to actual complexity.

### 3.2 Frontend feature pattern
Keep feature UI, hooks, API calls, schemas, and tests near the feature when practical. Shared components should be generic and reusable; do not turn every one-off element into a shared abstraction.

### 3.3 Dependency direction
- UI components must not directly query MongoDB or know database model details.
- HTTP controllers and Socket.IO handlers must call shared business logic instead of duplicating it.
- Business logic should not depend on React components.
- Validate all untrusted input at system boundaries.
- Keep environment/configuration access centralized.

---

## 4. Clean Code Rules

### 4.1 Naming and readability
- Use descriptive names that communicate intent.
- React components and TypeScript types/interfaces use `PascalCase`.
- Variables and functions use `camelCase`.
- Constants use `UPPER_SNAKE_CASE` only for genuine constants, not every variable.
- Use consistent file naming already established in the repository.
- Avoid cryptic abbreviations, deeply nested conditionals, and clever one-liners.
- Prefer early returns and small functions with one clear responsibility.
- Extract a function when it clarifies a meaningful operation, not merely to reduce line count.
- Avoid giant components, giant services, and files that combine unrelated features.
- Avoid `any`. If unavoidable temporarily, explain why and create a follow-up task. Prefer `unknown` plus narrowing.
- Do not use non-null assertions (`!`) or type casts to silence a problem without a documented reason.
- Remove unused imports, variables, dead code, and obsolete comments.

### 4.2 Comments and documentation
- Write comments to explain **why**, constraints, security implications, or non-obvious decisions—not to narrate every line.
- Document public/shared functions when their contract is not self-evident.
- Document complex business rules, scheduling behavior, authorization checks, retries, idempotency, and unusual edge cases.
- Add JSDoc to exported utilities/services where it materially helps future maintainers.
- Keep README setup steps accurate and tested.
- Update API docs and architecture docs when behavior or contracts change.
- Every non-obvious workaround must explain the reason and, where possible, link to a tracked issue.
- Do not add false, redundant, or stale comments. Code and comments must agree.

### 4.3 Error handling
- Use typed, predictable error responses.
- Do not swallow exceptions or return fake success after a failure.
- Log useful diagnostic context while redacting secrets and sensitive message content.
- Provide actionable user-facing messages without exposing stack traces, database internals, or secrets.
- Handle loading, empty, success, offline, retry, and error states in the UI.
- Avoid duplicate error handling at every layer; define clear ownership.

### 4.4 Maintainability
- Prefer simple, boring solutions over premature abstractions.
- Do not duplicate business rules across REST endpoints and socket handlers.
- Avoid circular imports and hidden side effects.
- Keep configuration separate from business logic.
- Pin and manage dependencies through the package manager and lockfile.
- Never edit generated files or dependency folders manually.
- Do not suppress lint/type/test failures without explaining the reason and obtaining approval for broad rule changes.

---

## 5. TypeScript and API Contracts

- Enable strict TypeScript checks (`strict: true`) where practical.
- Share API request/response contracts safely. Do not import server-only code into the browser bundle.
- Validate incoming HTTP bodies, query parameters, route parameters, and relevant Socket.IO payloads at runtime.
- TypeScript types alone are not runtime validation.
- Define stable response shapes and consistent error formats.
- Use correct HTTP status codes.
- Use ISO 8601 timestamps in API payloads and store times consistently (normally UTC); convert to the user's local time only in the UI.
- Define pagination explicitly for message history.
- Avoid sending database documents directly as public API responses. Map them to safe response DTOs.
- Do not return password hashes, token secrets, internal storage credentials, or unnecessary private fields.
- Treat user-provided message text, filenames, MIME types, and IDs as untrusted.
- Keep REST and Socket.IO contracts documented in `docs/api.md`.

---

## 6. Security and Privacy Rules

Security is a requirement, not a final polish task.

### Authentication and authorization
- Hash passwords with bcrypt using an appropriate work factor.
- Never store plaintext passwords.
- Select cookie/session or JWT handling deliberately and document the threat model and trade-offs.
- If cookies are used for authentication, configure `HttpOnly`, `Secure` in production, and an appropriate `SameSite` policy; assess CSRF risk.
- If bearer tokens are used, do not put long-lived sensitive tokens in localStorage by default; document the chosen storage and XSS trade-offs.
- Protect every private REST endpoint and every private socket event.
- Check conversation membership on the server before reading, sending, editing, deleting, or acknowledging private messages.
- Never trust a user ID or role sent by the client as proof of identity or authorization.
- Rate-limit login, registration, user search, message creation, and upload operations as appropriate.

### Validation and output
- Validate input on the server even if the client also validates it.
- Render user text safely; do not inject raw HTML.
- Prevent mass assignment by explicitly selecting fields accepted from requests.
- Use least-privilege database and storage credentials.
- Do not commit `.env` files or credentials.
- Keep `.env.example` limited to placeholder values and descriptions.
- Do not log passwords, auth tokens, full private message bodies, signed media URLs, or secret configuration.
- Add security headers and a deliberate CORS allowlist for production.

### Uploads
- Enforce maximum size and allowed file types on the server.
- Do not trust the extension or client-supplied MIME type alone.
- Generate storage object keys server-side; do not use user filenames as paths.
- Restrict upload and download access to authorized users.
- Use signed upload/download URLs with short expiry when appropriate.
- Never store large raw files in MongoDB documents.
- Explain storage cleanup behavior for cancelled/failed uploads and deleted messages.

### Real-time events
- Authenticate Socket.IO connections.
- Validate every event payload.
- Authorize the user for the target conversation before broadcasting.
- Join users to rooms only after server-side authorization.
- Avoid broadcasting private messages to all connected clients.
- Ensure REST and socket paths enforce equivalent permissions.
- Plan reconnect and duplicate-event handling.

### Scheduled messages
- Store scheduled jobs durably in the database or a reliable queue.
- Never rely on a browser timer for server delivery.
- Use an atomic claim/lock or equivalent strategy to prevent multiple workers sending the same message.
- Make processing idempotent; retries must not create duplicate messages.
- Store a clear status and attempt/error metadata without exposing internal details to users.
- Define behavior for past times, time zones, cancellation races, retries, and server restarts.
- Acknowledge that delivery to an offline recipient means persisted delivery to the app, not proof the recipient saw it.

### Security scope honesty
- Do not claim end-to-end encryption unless a deliberate, reviewed protocol is implemented.
- TLS, password hashing, and JWT do not equal end-to-end encryption.
- Do not claim production-grade security from basic middleware alone.

---

## 7. Testing and Definition of Done

### 7.1 Test strategy
- **Unit tests:** business rules, validation, time calculations, message status transitions.
- **Integration tests:** API + database behavior, authorization, upload metadata, scheduler persistence.
- **Component tests:** key forms, chat states, error handling, accessible interactions.
- **End-to-end tests:** register/login, send and receive a message, upload an attachment, schedule/edit/cancel a message.
- Test both success and important failure/unauthorized cases.
- Use test databases and fake storage/clock/queue providers where appropriate.
- Do not make tests depend on production credentials or real private user data.
- Keep tests deterministic; control time in scheduling tests.
- Do not write tests that merely duplicate implementation details.
- If a test cannot run in the current environment, state that clearly and give the command needed.

### 7.2 Definition of done for every task
A task is complete only when all applicable items below are true:

- [ ] Acceptance criteria are met.
- [ ] Code follows the existing project conventions and this document.
- [ ] Input validation and authorization are present where required.
- [ ] Loading, empty, success, and failure behavior is handled where relevant.
- [ ] Tests have been added or updated for meaningful behavior.
- [ ] Formatter and linter pass, if configured.
- [ ] Type checker passes, if configured.
- [ ] Relevant tests pass.
- [ ] Production build passes, if feasible.
- [ ] Documentation and `.env.example` are updated if needed.
- [ ] No secrets or sensitive user data were introduced.
- [ ] The AI reports exact commands and truthful results.
- [ ] Known gaps are recorded rather than hidden.

A visual mockup without working backend behavior does not satisfy a functional feature's acceptance criteria.

---

## 8. Milestone Plan

Milestones are sequential. Do not begin the next milestone until the current one meets its acceptance criteria or the user explicitly accepts a documented exception. The schedule is a guide, not permission to skip quality checks.

### Milestone 0 — Repository inspection and plan
**Goal:** Understand the current state before changing anything.

Tasks:
- Inspect the repository, branch, existing files, package scripts, and current implementation.
- Read the PRD and this instruction document.
- Identify whether frontend/backend are already scaffolded.
- Record current commands for lint, typecheck, test, and build.
- Propose a minimal next-step plan.

Acceptance criteria:
- [ ] Existing project state is summarized.
- [ ] No files were changed during inspection.
- [ ] Missing setup, dependencies, and decisions are listed.
- [ ] The next milestone is agreed.

### Milestone 1 — Project foundation and developer experience
**Goal:** Establish a runnable, maintainable TypeScript project.

Tasks:
- Set up client and server structure (or preserve existing structure if sensible).
- Configure TypeScript strictness, formatting, linting, and environment variables.
- Add `.env.example`, `.gitignore`, README setup instructions, and health endpoint.
- Add central configuration validation and consistent error handling.
- Confirm client and server run locally.

Acceptance criteria:
- [ ] Frontend starts and builds.
- [ ] Backend starts and health endpoint responds.
- [ ] Environment configuration fails clearly when required values are missing.
- [ ] Secrets are ignored by Git.
- [ ] Lint/typecheck/test scripts exist or missing scripts are documented.

### Milestone 2 — Authentication and user profiles
**Goal:** Support secure account access.

Tasks:
- Registration, login, logout, current-user endpoint, protected routes.
- Password hashing, input validation, consistent errors, rate limits.
- Profile read/update and user search with pagination/limits.
- Add API and UI tests.

Acceptance criteria:
- [ ] Valid user can register and sign in.
- [ ] Invalid input and duplicate account are handled safely.
- [ ] Password is never stored or returned in plaintext.
- [ ] Protected endpoints reject unauthenticated requests.
- [ ] Users cannot edit another user's profile.
- [ ] Search does not expose private fields.

### Milestone 3 — Conversation and persistent text messaging
**Goal:** Users can open a conversation and exchange messages that survive refreshes.

Tasks:
- Conversation model and membership rules.
- Create/find direct conversations.
- Message model, send/list APIs, cursor-based pagination.
- Chat list and conversation UI.
- Message ownership and membership authorization.

Acceptance criteria:
- [ ] Two authorized users can start a direct conversation.
- [ ] Messages persist and appear after reload.
- [ ] History pagination works without duplicate or missing records in normal use.
- [ ] Unauthorized users cannot read or send messages in a conversation.
- [ ] Input validation and key tests pass.

### Milestone 4 — Real-time messaging and delivery states
**Goal:** Add reliable live updates.

Tasks:
- Authenticated Socket.IO connection.
- Authorized room membership.
- Real-time new-message events using the same service as REST.
- Reconnect handling, duplicate-event avoidance, typing indicators, presence.
- Delivery/read receipts only to the extent they can be implemented consistently.

Acceptance criteria:
- [ ] A message appears on the recipient's connected client without refresh.
- [ ] Reconnect recovers missed history through the API.
- [ ] Events are authorized and private messages are not broadcast globally.
- [ ] REST and socket message creation enforce the same rules.
- [ ] Multiple event delivery does not visibly duplicate messages.

### Milestone 5 — Groups
**Goal:** Support small group conversations.

Tasks:
- Group creation, metadata, members, roles, and membership changes.
- Group message history and real-time events.
- Server-side role and membership checks.

Acceptance criteria:
- [ ] Authorized users can create groups and message members.
- [ ] Non-members cannot read or post to group conversations.
- [ ] Admin-only actions are enforced on the server.
- [ ] Membership changes affect future authorization immediately.

### Milestone 6 — Media attachments
**Goal:** Share photos, videos, and documents safely.

Tasks:
- Choose/configure managed media storage.
- Implement authorized upload flow and server-side validation.
- Store metadata and message attachment references.
- Upload progress, previews, download/view flow, and errors.
- Cleanup strategy for abandoned uploads.

Acceptance criteria:
- [ ] Allowed files upload and can be shared in a conversation.
- [ ] Disallowed types and oversized files are rejected server-side.
- [ ] Private attachments are not publicly accessible without authorization.
- [ ] Media binaries are not stored directly in MongoDB documents.
- [ ] Upload failure/retry and UI loading states work.

### Milestone 7 — Scheduled text messages
**Goal:** Send a message at a future time even when the sender's browser is closed.

Tasks:
- Scheduled-message model and create/list/edit/cancel APIs.
- Validate future schedule time and use explicit timezone semantics.
- Add persistent background worker or reliable job queue.
- Implement atomic claiming, idempotency, retries, and failure status.
- Add UI for scheduled messages and delivery state.
- Add deterministic tests using a controlled clock.

Acceptance criteria:
- [ ] User can schedule, list, edit, and cancel a pending message.
- [ ] Due messages are processed when no sender browser is open.
- [ ] A worker restart does not lose scheduled jobs.
- [ ] Concurrent processing/retries do not create duplicate messages.
- [ ] Unauthorized users cannot alter another user's scheduled messages.
- [ ] Past time and cancellation-vs-send race behavior are defined and tested.

### Milestone 8 — UX, accessibility, performance, and polish
**Goal:** Make core flows usable and portfolio-ready.

Tasks:
- Responsive desktop/tablet/mobile layouts.
- Accessible labels, keyboard operation, focus indicators, contrast.
- Loading, empty, offline, retry, and error states.
- Paginated/virtualized history if needed, lazy-loaded media, render profiling.
- Optimistic updates only where rollback/error recovery is implemented.
- Measure real performance and address observed bottlenecks.

Acceptance criteria:
- [ ] Core flows work at mobile and desktop viewport sizes.
- [ ] Keyboard focus and main interactions are usable.
- [ ] Important controls have accessible names.
- [ ] No obvious console errors or broken states remain.
- [ ] Performance claims are supported by measurements.

### Milestone 9 — Test, deploy, and document
**Goal:** Produce a working, demonstrable release.

Tasks:
- Add/finish integration and E2E tests for critical flows.
- Review authorization, input validation, CORS, cookies/tokens, uploads, logs, and environment variables.
- Deploy frontend, API/socket server, database, and media storage.
- Test deployed app using separate test accounts.
- Document setup, environment variables, architecture, APIs, limitations, and screenshots/demo.
- Record known issues and a short future roadmap.

Acceptance criteria:
- [ ] Production frontend and backend URLs work.
- [ ] WebSocket connection works on deployed hosting.
- [ ] Critical E2E flows pass or any unrun tests are clearly recorded.
- [ ] No secret is exposed in the client bundle or repository.
- [ ] README supports a fresh local setup.
- [ ] Known limitations and future features are documented.

### Milestone 10 — P1 enhancements (after MVP)
Possible order:
1. Replies and reactions.
2. Edit/delete/forward with clear rules and audit/status behavior.
3. Unread counts, mute, and in-app notifications.
4. Message search.
5. Voice notes.
6. Scheduled media, only after text scheduling is robust.

Acceptance criteria are to be defined before each enhancement begins.

### Milestone 11 — P2 exploration (separate planning required)
Possible features:
- WebRTC calls.
- Status/stories.
- Disappearing messages.
- Multi-device sessions and browser push.
- PWA/offline drafts.
- End-to-end encryption after a dedicated threat model and protocol review.

Do not promise these features as part of the initial MVP.

---

## 9. Suggested Day-by-Day Plan

This is an ambitious ten-day outline. If a milestone fails its acceptance criteria, adjust the schedule instead of pretending it is complete.

| Day | Focus | Target outcome |
|---|---|---|
| 1 | Milestones 0–1 | Inspect repo, establish client/server, config, health endpoint, README |
| 2 | Milestone 2 | Authentication and basic profile |
| 3 | Milestone 3 | Persistent direct messages and history |
| 4 | Milestone 4 | Socket.IO messaging and reconnect behavior |
| 5 | Milestone 5 | Basic groups, or use this day to stabilize messaging if behind |
| 6 | Milestone 6 | Photo/video/document upload |
| 7 | Milestone 7 | Durable scheduled text messages |
| 8 | Milestone 8 | Responsive UX, accessibility, errors |
| 9 | Milestone 9 | Tests, security review, bug fixes |
| 10 | Milestone 9 | Deployment, demo, README and final verification |

**Scope fallback:** If time is tight, finish and deploy authentication + one-to-one text messaging + real-time updates first. Treat groups and media as the next increment, and scheduled messages as a priority feature that must be explicitly tested. Never label incomplete functionality as finished.

---

## 10. Git and Change Management

- Use small, focused commits when the user asks to commit; otherwise do not commit automatically.
- Suggested branch names: `feat/auth`, `feat/realtime-messaging`, `feat/media-upload`, `feat/scheduled-messages`, `fix/<short-description>`, `docs/<short-description>`.
- Suggested commit format: `feat(messages): persist direct messages`.
- Do not rewrite shared history or force-push without explicit approval.
- Keep lockfiles in sync with package changes.
- Explain database schema changes and any migration/backfill needs.
- Avoid broad refactors in the same change as a feature unless necessary.
- Update this milestone checklist when a milestone is accepted; never mark a milestone complete based on code generation alone.

---

## 11. Required AI Response Format for Every Work Session

At the beginning of a coding session, the AI should respond with:

1. **Current milestone**
2. **What I inspected**
3. **Plan for this increment**
4. **Files likely to change**
5. **Acceptance criteria**

At the end, it must report:

1. **Implemented**
2. **Files changed**
3. **Commands run and actual results**
4. **Tests added/updated**
5. **Known gaps or risks**
6. **Milestone status:** Not started / In progress / Ready for review / Accepted
7. **Next recommended step**

Do not mark a milestone **Accepted** unless the acceptance criteria have been checked and the user has agreed or the agreed workflow explicitly permits acceptance.

---

## 12. Copy-Paste Master Prompt for Your AI Coding Tool

Use this as the first instruction in your coding agent, then keep `AI_RULES_AND_MILESTONES.md` in the repository so it can be referenced in later sessions.

> You are the senior engineer and careful implementation partner for Connectly. First read `AI_RULES_AND_MILESTONES.md` and the product PRD. Inspect the current repository before editing anything. Identify the current milestone and its acceptance criteria. Do not build the whole app in one response. Work on one small, reviewable increment at a time.
>
> Follow the intended React + TypeScript + Vite frontend, Node.js + TypeScript + Express backend, Socket.IO, MongoDB Atlas/Mongoose stack unless the existing repository or I explicitly calls for a change. Follow the clean-code, documentation, security, API-contract, testing, and milestone rules in the instruction file.
>
> Before a significant edit, state the plan and files likely to change. Preserve existing working code. Do not fabricate files, test results, or completion claims. Validate untrusted inputs at runtime; authorize every private HTTP and socket operation on the server; never expose secrets. For scheduled messages, design for durable server-side processing, idempotency, retries, and duplicate prevention.
>
> After each increment, run available format/lint/typecheck/test/build commands, fix regressions, and report exact results. Update documentation and the milestone checklist when appropriate. If something cannot be tested, state that explicitly. Do not commit, push, deploy, delete data, or incur paid costs without my explicit permission. Stop after the current increment and wait for my review before moving to a materially larger task.
>
> Begin with **Milestone 0 — Repository inspection and plan**. Do not modify files until you have reported what exists and proposed the next step.

---

## 13. How to Use This Document

1. Save this file in the root of your repository as `AI_RULES_AND_MILESTONES.md`.
2. Keep the product PRD alongside it, for example in `docs/PRD.md`.
3. Open the repository in your AI coding tool.
4. Paste the master prompt from Section 12.
5. Let the AI inspect the project first; review its plan before authorizing edits.
6. Complete one milestone at a time and run the checks.
7. Ask the AI to update the milestone status only after reviewing the evidence.
8. If you change scope, update both the PRD and the milestone plan.

**Final rule:** Prefer a smaller, secure, tested, documented working product over a large collection of generated files that only appears complete.
