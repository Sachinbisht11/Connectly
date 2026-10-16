# Connectly — Product Requirements Document (PRD)

**Version:** 2.0  
**Status:** Product specification for MVP planning  
**Product type:** Real-time messaging web application  
**Target platforms:** Responsive desktop and mobile web  
**Primary stack:** React + TypeScript, Node.js, Express, Socket.IO, MongoDB  
**Planned first build:** 10-day MVP sprint (ambitious; scope may need to be reduced)  

---

## 1. Product Vision

Connectly is a modern, WhatsApp-inspired messaging web application for private and group communication. Users can exchange text messages, photos, videos, documents, voice notes, and other supported media in real time; make voice/video calls in a later phase; manage groups; share statuses; and schedule messages for future delivery.

Connectly is an independent product inspired by common messaging-app workflows. It must use its own name, branding, visual design, and implementation rather than copying WhatsApp's proprietary assets or implying affiliation.

### 1.1 Problem

Users expect messaging apps to support fast communication, reliable history, media sharing, presence, group conversations, and convenient controls. Connectly brings these workflows together in one responsive application, with scheduled sending as a differentiating feature.

### 1.2 Product Goals

- Deliver reliable one-to-one and group messaging in real time.
- Support common media types, including photos, videos, documents, and voice notes.
- Persist messages and media references so history survives refreshes and reconnects.
- Provide presence, typing indicators, delivery/read receipts, and unread counts.
- Let users schedule a message for a future date and time.
- Provide strong privacy, authorization, validation, and abuse protections.
- Build a polished, accessible, responsive interface.
- Use maintainable React + TypeScript and Node.js architecture suitable for a portfolio and future extension.

### 1.3 Non-Goals for the First Release

- Matching WhatsApp's full global scale or every proprietary feature.
- Guaranteed end-to-end encryption until it is deliberately designed and independently reviewed.
- Payments, business APIs, public channels, and large-scale enterprise administration.
- Native iOS/Android apps; the initial product is a web application.
- Production-grade voice/video calling in the initial 10-day sprint.

---

## 2. Users and Core Use Cases

### Target users

- Individuals who want private, real-time communication.
- Friends, classmates, and small teams using group conversations.
- Users who need to send media and documents.
- Users who want to prepare messages and deliver them later.

### Primary use cases

1. Register, sign in, and set up a profile.
2. Find another user and start a private chat.
3. Send text, images, videos, files, and voice notes.
4. Create a group and communicate with its members.
5. See online status, typing activity, message delivery, and read status.
6. Reply to, react to, edit, delete, forward, or search messages.
7. Schedule a message, then edit or cancel it before delivery.
8. Manage privacy, notifications, blocked users, and active sessions.
9. Use the application on desktop and mobile browser layouts.

---

## 3. Scope and Priorities

### P0 — Core MVP

- Registration, login, logout, and protected routes.
- User profile and user search.
- One-to-one conversations.
- Persistent text messaging and paginated history.
- Real-time delivery through Socket.IO.
- Group conversations with basic member and admin controls.
- Online/offline presence and typing indicators.
- Sent, delivered, and read status where supported.
- Photo, video, and document attachments.
- Scheduled text messages with list, edit, cancel, and delivery status.
- Responsive UI, validation, error handling, and baseline security.
- Deployment, README, and essential automated tests.

### P1 — Important enhancements

- Voice notes.
- Message replies and reactions.
- Edit and delete own messages.
- Forward messages.
- Unread counts and mute conversation.
- Message search.
- Image/video previews and download controls.
- User blocking and reporting.
- In-app notifications.
- Scheduled media messages if upload and storage flows are stable.
- Personal reminders.

### P2 — Later / advanced features

- One-to-one voice and video calls using WebRTC.
- Group voice/video calls.
- Stories/status updates that expire after a configurable period.
- Disappearing messages.
- Multi-device session management.
- Browser push notifications.
- Progressive Web App installation and offline draft support.
- Link previews.
- Contact sync, if appropriate and privacy-conscious.
- End-to-end encryption after a separate security design and review.
- Advanced media compression, upload resume, and storage lifecycle policies.

**Scope note:** A feature-complete WhatsApp-level product is much larger than a 10-day project. The sprint should produce a reliable, demonstrable MVP first. P1 and P2 features should be implemented only after the P0 workflows work end to end.

---

## 4. Functional Requirements

### FR-01 — Account and Authentication

**Requirements**
- Register with display name, email, and password.
- Log in and log out.
- Hash passwords using bcrypt or an equivalent password-hashing algorithm.
- Protect private API routes and socket connections.
- Normalize email addresses and enforce uniqueness.
- Provide clear validation and authentication errors.
- Support profile editing and avatar selection/upload.
- Avoid exposing password hashes or sensitive account fields.

**Acceptance criteria**
- A user can register and log in.
- Duplicate normalized email addresses are rejected.
- Invalid credentials do not authenticate a user.
- Protected APIs and socket events reject unauthenticated requests.
- Passwords are never stored in plaintext.

### FR-02 — Profiles and User Discovery

**Requirements**
- Display name, avatar, and optional status/about text.
- Search for users by supported identifiers, such as display name or email.
- Start or reopen a private conversation.
- Show recent conversations and latest-message preview.
- Respect blocked-user and privacy rules.

**Acceptance criteria**
- Search returns authorized, appropriate results.
- Selecting a user opens an existing private conversation or creates one without duplicates.
- Private profile data is not exposed unnecessarily.

### FR-03 — One-to-One Text Messaging

**Requirements**
- Send and receive text messages in real time.
- Persist messages in MongoDB.
- Load conversation history with pagination or cursor-based loading.
- Show timestamps and sender identity.
- Support optimistic UI with rollback/error handling.
- Reconcile client-generated temporary IDs with server-confirmed messages.
- Enforce conversation membership on every request.

**Acceptance criteria**
- Messages remain available after refresh and reconnect.
- A connected recipient receives a new message without refreshing.
- A disconnected recipient can load missed messages from history.
- Unauthorized users cannot read or send messages in a private conversation.

### FR-04 — Message Delivery, Read Receipts, and Unread Counts

**Requirements**
- Show message states such as sending, sent, delivered, read, and failed where applicable.
- Track unread messages per conversation.
- Mark messages as read when the conversation is viewed according to the product's read policy.
- Keep persisted state consistent with socket events.
- Allow users to disable read receipts if included in privacy settings.

**Acceptance criteria**
- State changes are persisted and survive refresh.
- A failed send is visibly distinguishable from a sent message.
- Unread counts update when messages are read.
- Reconnection does not create duplicate messages or receipt records.

### FR-05 — Real-Time Presence and Typing

**Requirements**
- Show online/offline status and optional last seen.
- Show typing indicators in the active conversation.
- Clear typing state after inactivity or disconnect.
- Handle users connected from multiple browser tabs/devices.
- Apply privacy settings to presence and last-seen information.

**Acceptance criteria**
- Presence changes propagate to relevant users.
- Typing indicators appear and clear without refreshing.
- A disconnected tab does not incorrectly mark a user offline if another session remains active.

### FR-06 — Group Chats

**Requirements**
- Create a group with a name and optional image.
- Add and remove members subject to permissions.
- Assign group administrators.
- Show group member list and basic group information.
- Send messages to all authorized members.
- Support group-specific message history and unread state.
- Prevent non-members from accessing group messages.
- Define behavior when a member leaves or is removed.

**Acceptance criteria**
- Authorized users can create a group and exchange messages.
- Only permitted admins/members can perform group-management actions.
- Removed members cannot access future group messages.
- Socket events are delivered only to current authorized members.

### FR-07 — Photo, Video, and Document Sharing

**Requirements**
- Support image uploads and previews.
- Support video uploads and playback where browser codecs permit.
- Support document/file attachments with filename, size, and download action.
- Validate file type, extension, MIME type, and size on the server.
- Store media in object storage or a managed media service; store metadata and URLs in MongoDB.
- Show upload progress, cancellation where practical, and failure/retry states.
- Generate safe thumbnails/previews where supported.
- Enforce authorization before allowing private media access.
- Avoid trusting client-provided MIME types alone.

**Acceptance criteria**
- Supported attachments upload and appear in the correct conversation.
- Recipients can view or download authorized media.
- Unsupported or oversized files are rejected with a useful error.
- Failed uploads do not create misleading successful messages.
- Media access is not publicly exposed unless explicitly intended.

**Implementation note:** Do not store large binary files directly in ordinary message documents. Use object storage or a managed media provider, then save attachment metadata such as storage key, MIME type, size, and URL in MongoDB. Use signed URLs or an authenticated delivery strategy for private media.

### FR-08 — Voice Notes

**Requirements**
- Record audio in supported browsers using browser media APIs.
- Preview and discard a recording before sending.
- Upload and play voice notes in chat.
- Display duration and playback progress.
- Ask for microphone permission clearly and handle denial gracefully.

**Acceptance criteria**
- Users can record, preview, send, and play a supported voice note.
- The UI handles unsupported browsers and permission denial.
- Audio attachments follow the same validation and privacy rules as other media.

**Priority:** P1, after image/video/document upload works reliably.

### FR-09 — Message Replies, Reactions, Forwarding, Editing, and Deletion

**Requirements**
- Reply to a specific message with a contextual preview.
- React to messages using a defined set of emoji.
- Edit own text messages within a configurable time window, if enabled.
- Delete own messages according to a clearly defined policy.
- Forward messages to another permitted conversation.
- Keep edits/deletions consistent across connected clients.

**Acceptance criteria**
- Reply and reaction references point to valid messages.
- Users cannot edit or delete messages they do not own unless a group-admin policy explicitly permits it.
- Updates propagate in real time and persist.
- Deleted content follows the product's defined retention behavior.

### FR-10 — Search and Conversation Controls

**Requirements**
- Search conversations by name.
- Search messages within a conversation or across conversations the user can access.
- Pin, archive, or mute conversations where included.
- Display unread counts.
- Confirm destructive actions when appropriate.

**Acceptance criteria**
- Search returns only messages the user is authorized to access.
- Muted conversations follow the defined notification behavior.
- Pinned and archived state persists across sessions.

### FR-11 — Scheduled Messages

**Description:** A user can prepare a message and have the server deliver it at a selected future date and time without the browser remaining open.

**User stories**
- As a user, I want to schedule a message for a future time.
- As a user, I want to see all my scheduled messages.
- As a user, I want to edit or cancel a scheduled message before processing.
- As a recipient, I want the scheduled message to appear in the conversation at delivery time.
- As a user, I want to see whether a scheduled message was sent or failed.

**Requirements**
- Add a “Schedule message” action to the composer.
- Select a future date/time and validate the input.
- Display the selected time in the user's local timezone.
- Store the actual scheduled instant in UTC.
- List pending scheduled messages with recipient, preview, time, and status.
- Allow editing/cancellation while the job remains pending.
- Support retries and recovery after backend restarts.
- Persist the delivered message through the same message service used by normal messages.
- Notify connected recipients through Socket.IO.
- Prevent duplicate message records during retry or concurrent processing.
- Keep scheduled messages private to their sender until delivery.
- Reject unauthorized changes and attempts to schedule in the past.

**Scheduled message states**
- `scheduled`: waiting for delivery time.
- `processing`: claimed by a worker.
- `sent`: persisted as a chat message.
- `failed`: delivery could not complete after the applicable retry policy.
- `cancelled`: cancelled before processing.

**Acceptance criteria**
1. A valid future message can be scheduled.
2. It remains scheduled when the sender closes the browser.
3. It is processed by the backend at or after its due time.
4. Connected recipients receive it in real time.
5. Disconnected recipients can retrieve it from history later.
6. The sender can edit or cancel it while still pending.
7. A retry does not create a duplicate message.
8. Pending jobs are recovered after a normal server restart.
9. Times display correctly across user time zones.
10. Only the owner can manage their scheduled messages.

**Implementation approach**
- Store scheduled jobs durably in MongoDB.
- For a small initial deployment, a polling worker using `node-cron` can claim due jobs with atomic state transitions.
- If multiple worker instances or stronger queue operations are needed, use a durable queue such as BullMQ with Redis.
- Use idempotency keys or unique references and make the message-creation operation safe to retry.
- Do not rely on browser timers or an in-memory-only scheduler.

**Scope:** Start with scheduled text messages. Scheduled media can be added once upload, authorization, and storage flows are stable.

### FR-12 — Personal Reminders

**Requirements**
- Create a personal reminder with a title/note and due date/time.
- View upcoming reminders.
- Mark reminders complete or dismiss them.
- Notify the user in-app when a reminder becomes due.
- Persist reminders and recover due reminders after restarts.

**Acceptance criteria**
- Only the owner can view or change a reminder.
- Completed reminders are not repeatedly triggered.
- Reminders survive refresh and backend restart.

**Priority:** P1. Browser push notifications and recurring reminders are later enhancements.

### FR-13 — Voice and Video Calls

**Requirements for a future phase**
- One-to-one audio/video calls using WebRTC.
- Request camera/microphone permission.
- Call invitation, ringing, accept/reject, and hang-up states.
- Use Socket.IO for signaling, not for transporting the media stream itself.
- Evaluate STUN/TURN infrastructure for connectivity across restrictive networks.
- Handle permission errors and connection failures.

**Priority:** P2. Calls require separate testing and infrastructure planning and are not promised in the 10-day MVP.

### FR-14 — Status/Stories

**Requirements for a future phase**
- Post an image or text status.
- View statuses from permitted contacts.
- Expire statuses after a defined period.
- Track views only if included in the privacy design.
- Provide visibility and deletion controls.

**Priority:** P2.

### FR-15 — Privacy, Blocking, and Reporting

**Requirements**
- Block/unblock users.
- Prevent blocked users from initiating or continuing interactions according to product policy.
- Report abusive users or content.
- Configure profile visibility, last seen, and read-receipt preferences where implemented.
- Provide a basic account/session logout flow.
- Minimize personal data collection and avoid logging private message content.

**Acceptance criteria**
- Block/report actions are authorized and persisted.
- Blocking behavior is consistent across REST and Socket.IO.
- Privacy preferences are applied on the server, not merely hidden in the UI.

### FR-16 — Notifications

**Requirements**
- In-app notifications for new messages and due reminders.
- Unread badge and notification preferences.
- Optional browser push notifications in a later phase.
- Do not send notifications for muted conversations when the user has configured them to be muted.
- Avoid leaking private message content in notifications when privacy settings disallow previews.

---

## 5. User Experience and Screens

### Main screens
1. Sign up / login.
2. Profile setup and settings.
3. Main chat layout with conversation list.
4. User search and new-chat flow.
5. One-to-one conversation.
6. Group conversation and member management.
7. Attachment picker, upload progress, and media viewer.
8. Scheduled messages list and schedule/edit dialog.
9. Personal reminders.
10. Privacy, blocked users, and notification settings.
11. Call screen (future phase).
12. Status/stories viewer (future phase).

### Design requirements
- Responsive desktop, tablet, and mobile layouts.
- A clear, original visual identity; do not copy WhatsApp branding/assets.
- Accessible forms, semantic HTML, visible focus states, keyboard support, and adequate contrast.
- Loading, empty, success, offline, retry, and error states.
- Optimistic updates only when failure recovery is implemented.
- Respect reduced-motion preferences where practical.
- Avoid requiring hover for essential mobile actions.

### Performance requirements
- Paginate long message histories.
- Avoid unnecessary React renders.
- Lazy-load media and use thumbnails for large assets.
- Compress/rescale images where appropriate without silently degrading originals.
- Show upload progress for large media.
- Measure performance and Core Web Vitals rather than making unverified claims.

---

## 6. Recommended Technology Stack

### Frontend
- React + TypeScript + Vite.
- Tailwind CSS for styling.
- React Router for navigation.
- Socket.IO Client for real-time events.
- TanStack Query or a comparable library for server state.
- A lightweight state store only if needed for cross-component client state.
- React Hook Form + Zod (or equivalent) for forms and validation.
- Vitest + React Testing Library for unit/component tests.
- Playwright for end-to-end tests.

### Backend
- Node.js + TypeScript + Express.
- Socket.IO for real-time messaging, presence, and signaling events.
- MongoDB Atlas + Mongoose for application data.
- Zod or equivalent for request validation.
- bcrypt for password hashing.
- A carefully selected JWT/session strategy.
- Structured logging with sensitive data redaction.
- Rate limiting and security middleware.
- A background worker for scheduled messages and reminders.

### Media storage
Use object storage or a managed media service (for example, Cloudinary or an S3-compatible provider) for photos, videos, documents, and audio. Store attachment metadata and storage references in MongoDB. Keep credentials server-side and protect private media using authenticated access or expiring signed URLs.

### Scheduling
- Initial option: MongoDB-backed jobs plus a polling worker.
- Scale-up option: BullMQ + Redis.
- The production host must keep the worker running reliably; confirm hosting sleep/restart behavior before deployment.

### Deployment
- Frontend: Vercel or another static/web hosting platform.
- API and Socket.IO server: a persistent Node.js host that supports WebSockets.
- Database: MongoDB Atlas.
- Media: managed object storage.
- Redis: only if using a Redis-backed queue or other feature that requires it.

---

## 7. High-Level Architecture

1. The React client calls authenticated REST APIs for account, conversation, message, upload, and scheduling operations.
2. Socket.IO provides live message events, presence, typing, read receipts, and notification events.
3. The backend authenticates users and checks conversation membership before handling private operations.
4. MongoDB stores users, conversations, messages, groups, scheduled messages, reminders, and relevant metadata.
5. Media files are uploaded to object storage through a controlled backend or signed-upload workflow.
6. A background worker processes due scheduled messages and reminders.
7. The message service persists each message and emits events to authorized connected recipients.
8. The frontend fetches persisted history after reconnecting; socket delivery is not the sole source of truth.

---

## 8. Suggested API Surface

These are proposed contracts, not implemented endpoints. Define request/response schemas and error formats before implementation.

### Authentication and profile
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/users/search?q=...`
- `POST /api/users/:userId/block`
- `DELETE /api/users/:userId/block`

### Conversations and messages
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
- `PATCH /api/conversations/:conversationId/read`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/reactions`
- `POST /api/messages/:messageId/forward`

### Groups
- `POST /api/groups`
- `GET /api/groups/:groupId`
- `PATCH /api/groups/:groupId`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members/:userId`

### Media
- `POST /api/uploads/initiate` (if using signed uploads)
- `POST /api/uploads/complete` (if required by the provider workflow)
- `GET /api/attachments/:attachmentId` (authorize access before serving or redirecting)

### Scheduled messages
- `POST /api/scheduled-messages`
- `GET /api/scheduled-messages`
- `PATCH /api/scheduled-messages/:scheduledMessageId`
- `DELETE /api/scheduled-messages/:scheduledMessageId`

### Reminders
- `POST /api/reminders`
- `GET /api/reminders`
- `PATCH /api/reminders/:reminderId`
- `DELETE /api/reminders/:reminderId`

### Future features
- Call signaling events over Socket.IO; do not use REST polling as the primary call signaling mechanism.
- Status/story endpoints only when the P2 status feature is approved.

---

## 9. Data Model Overview

### User
- `displayName`
- `email`
- `passwordHash`
- `avatar`
- `about`
- `privacySettings`
- `createdAt`, `updatedAt`

### Conversation
- `type` (`direct` or `group`)
- `participantIds`
- `lastMessageId`
- `createdAt`, `updatedAt`

### Message
- `conversationId`
- `senderId`
- `type` (`text`, `image`, `video`, `file`, `audio`, etc.)
- `textContent` (optional)
- `attachments` (metadata references)
- `replyToMessageId` (optional)
- `reactions` (optional)
- `editedAt` (optional)
- `deletedAt` (optional)
- `createdAt`, `updatedAt`
- delivery/read metadata as appropriate

### Attachment
- `ownerId`
- `storageKey` or provider reference
- `url` or controlled access reference
- `mimeType`
- `sizeBytes`
- `originalFilename`
- `width`, `height`, `duration` where relevant
- `createdAt`

### Group metadata
- `conversationId`
- `name`
- `avatar`
- `adminIds`
- member roles and join/leave metadata as needed

### ScheduledMessage
- `senderId`
- `conversationId`
- `recipientId` where applicable
- `content`
- `attachments` if scheduled media is later enabled
- `scheduledAt` (UTC)
- `status`
- `claimedAt`
- `sentMessageId`
- `attemptCount`
- `lastError`
- `idempotencyKey`
- `createdAt`, `updatedAt`

### Reminder
- `userId`
- `title`
- `dueAt` (UTC)
- `status`
- `completedAt`
- `createdAt`, `updatedAt`

Use schema validation and indexes for common queries. Index messages by conversation and creation time, scheduled jobs by status and due time, and membership references as appropriate. Avoid embedding unbounded message histories in a single conversation document.

---

## 10. Security, Privacy, and Abuse Prevention

- Hash passwords securely; never store plaintext passwords.
- Use HTTPS in production and protect environment secrets.
- Apply authentication and authorization to REST and socket operations.
- Verify group membership before broadcasting or retrieving group content.
- Validate input schemas and enforce content and upload size limits.
- Check file types using server-side inspection where feasible; never trust client MIME type alone.
- Scan or moderate uploaded files as appropriate to the deployment's risk level.
- Keep private media behind authorization or short-lived signed URLs.
- Apply rate limits to authentication, messaging, search, uploads, and reporting.
- Prevent NoSQL injection and unsafe query construction.
- Configure CORS for known origins.
- Choose token/session storage deliberately and address XSS/CSRF risks.
- Redact tokens, passwords, and private message bodies from logs.
- Define data deletion, retention, and backup policies.
- Provide block/report controls and basic abuse handling.
- Do not claim end-to-end encryption unless a correct protocol has been implemented and reviewed.
- Clearly document that this MVP is not a substitute for a security-audited production messaging service.

---

## 11. Non-Functional Requirements

### Reliability
- Persist messages and scheduling state.
- Recover pending scheduled jobs after normal restarts.
- Deduplicate retried message processing.
- Recover message history through APIs after socket reconnect.
- Return understandable errors and avoid silent data loss.

### Performance
- Use indexed database queries and paginated history.
- Lazy-load large media and use previews/thumbnails.
- Avoid unnecessary re-renders and oversized API responses.
- Measure loading and interaction metrics on realistic test data.

### Accessibility
- Semantic HTML, labeled controls, keyboard navigation, visible focus, sufficient contrast.
- Accessible announcements for important message and upload status changes.
- Touch-friendly controls on mobile.

### Maintainability
- Separate routes, controllers, services, models, socket handlers, and background jobs.
- Share message-persistence logic between REST and scheduled delivery.
- Use TypeScript types, linting, formatting, environment validation, and clear documentation.
- Keep secrets and deployment configuration out of source control.

### Compatibility
- Support current major browsers.
- Gracefully handle offline/disconnected states.
- Handle media types based on browser support.
- Display scheduled times in local time while storing UTC instants.

---

## 12. Testing Plan

### Unit and component tests
- Form validation and authentication states.
- Message rendering and optimistic rollback.
- Attachment validation and upload progress states.
- Scheduled-message date validation and state transitions.
- Time-zone conversions.
- Group permission logic.

### Integration tests
- Registration and login.
- Direct and group conversation authorization.
- Message persistence and retrieval.
- Upload authorization and metadata persistence.
- Scheduling, cancellation, retries, and idempotency.
- Read receipts and unread counts.
- Blocked-user behavior.

### End-to-end tests
1. Register two users and exchange text messages.
2. Verify messages appear without refreshing.
3. Upload and view an image.
4. Upload and play a supported video.
5. Send a document and download it.
6. Create a group and exchange a message.
7. Schedule a message, close the sender's browser, and verify delivery.
8. Cancel a pending scheduled message.
9. Verify authorization and privacy controls.
10. Test mobile and desktop layouts.

### Release gates
- Critical authentication and authorization tests pass.
- Core chat and attachment workflows pass in a deployed environment.
- Scheduled delivery works without an open browser.
- Retry tests do not create duplicate message records.
- No known critical security issue remains.
- README setup steps work from a clean checkout.

---

## 13. Development Roadmap

### Phase 1 — Core MVP

**Day 1: Setup**
- Initialize React + TypeScript + Vite frontend.
- Initialize Node.js + TypeScript + Express backend.
- Configure environment variables, Git, linting, and health checks.

**Day 2: Authentication**
- User model, register/login, password hashing, validation, protected APIs.

**Day 3: Users and direct conversations**
- User search, conversation model, create/reopen conversation.

**Day 4: Chat interface**
- Responsive layout, message list, composer, loading and error states.

**Day 5: Persistent messages**
- Create/list message APIs, pagination, authorization.

**Day 6: Real-time messaging**
- Authenticated Socket.IO connections, room membership, live message events, reconnect handling.

**Day 7: Groups and presence**
- Basic groups and membership permissions; presence and typing indicators.

**Day 8: Media and scheduling**
- Prioritize image/file upload and scheduled text messages. Add video support only if the core paths are stable.

**Day 9: Reliability and tests**
- Read receipts where feasible, scheduled job recovery, idempotency, validation, accessibility, responsive fixes.

**Day 10: Deployment**
- Deploy, configure database/media storage, verify core workflows, write README and demo instructions.

### Phase 2 — Product polish
- Voice notes, reactions, replies, edit/delete, search, mute/archive/pin, reminders, stronger notifications.

### Phase 3 — Advanced features
- WebRTC voice/video calls, statuses/stories, PWA/offline enhancements, multi-device improvements, and a separately reviewed end-to-end encryption design.

**Planning warning:** The full feature list is not realistic to implement and thoroughly secure in ten days. Ten days is a target for a reduced demo MVP, not a production-equivalent WhatsApp replacement. Reduce scope before sacrificing security, data integrity, or testing.

---

## 14. Deployment and Deliverables

Expected deliverables for the MVP:
- Deployed responsive web application.
- Frontend and backend source repositories or a clearly organized monorepo.
- Database models and documented API contracts.
- Working direct messaging and basic groups.
- Working image/file sharing, with video included if feasible.
- Scheduled text messaging with management controls.
- Tests for critical user journeys.
- README with prerequisites, environment variables, local development, deployment, and known limitations.
- Screenshots or a demo recording.

Only describe features as completed after they have been implemented and tested. Add actual deployment and repository URLs after they exist.

---

## 15. Success Metrics

The MVP is successful when:
- Users can register, log in, and find other users.
- Direct messages persist and arrive in real time.
- Basic group chats enforce membership and permissions.
- Supported image/video/document workflows function within configured limits.
- Users can schedule, edit, and cancel pending text messages.
- Scheduled messages deliver without the sender's browser being open.
- Normal retries do not create duplicate message records.
- Critical flows pass automated tests.
- The deployed app works on desktop and mobile browsers.
- A new developer can run the app using the README.

---

## 16. Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope exceeds ten days | Ship a reduced MVP; move advanced features to later phases. |
| Media hosting costs or limits | Set file-size limits and use managed storage with clear quotas. |
| Unauthorized media access | Use authenticated access or expiring signed URLs. |
| Duplicate scheduled sends | Use idempotency keys, atomic claims, and unique message references. |
| Worker restarts or sleeping hosts | Use durable storage and a host that reliably runs background workers. |
| Multiple workers claim one job | Use atomic database claims or a coordinated durable queue. |
| Socket disconnection loses events | Treat the database as source of truth and reload history on reconnect. |
| Privacy/security gaps | Enforce server-side authorization, test permissions, and avoid unsupported encryption claims. |
| Video compatibility issues | Test supported formats and show graceful fallback behavior. |

---

## 17. Out of Scope for the First MVP

- Production-scale infrastructure comparable to WhatsApp.
- Guaranteed end-to-end encryption.
- Audio/video calls and group calls.
- Full status/stories feature.
- Native Android and iOS apps.
- Payments, business APIs, and public channels.
- Advanced multi-device synchronization.
- Sophisticated moderation or enterprise administration.

These can be planned after the core application has been built, tested, and deployed.

---

## 18. Final Product Definition

Connectly is a WhatsApp-inspired, independently branded real-time messaging web application built with React + TypeScript, Node.js, Express, Socket.IO, MongoDB, and managed media storage.

The first release focuses on secure accounts, direct and basic group chats, persistent real-time text messages, photo/video/document sharing, presence and message status, and reliable scheduled text messages. Voice notes, reminders, message tools, calls, statuses, and advanced privacy features follow in later phases.

**Definition of done:** Two users can sign in, find each other, exchange persistent real-time messages and supported attachments, communicate in a group with enforced permissions, and schedule a message that is delivered by the backend even when the sender's browser is closed. Critical workflows are tested, the deployed app is documented, and limitations are stated honestly.
