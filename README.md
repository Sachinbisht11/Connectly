# Connectly

A real-time messaging web application (MVP). WhatsApp-inspired, independently branded.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + TypeScript + Express + Socket.IO + MongoDB (Mongoose)
- **Auth:** bcrypt password hashing + JWT
- **Media:** Managed object storage (Cloudinary/S3-compatible) with metadata in MongoDB

## Project layout

```
connectly/
├── client/          # Vite + React + TypeScript frontend
├── server/          # Node + TypeScript + Express backend
├── .env.example     # environment variable templates
├── .gitignore
├── package.json     # workspace root scripts
└── README.md
```

## Prerequisites

- Node.js >= 20
- npm
- MongoDB Atlas cluster (or local MongoDB)

## Local setup

```bash
# Install dependencies for client and server
npm run setup

# Copy environment templates and fill in real values
cp .env.example .env
cp client/.env.example client/.env.example  # if a client env template is added later
# Edit .env with your MongoDB URI, JWT secret, and CORS origin
```

## Running locally

```bash
# Run both client (Vite) and server (tsx) together
npm run dev

# Or run separately
npm run dev --workspace=server   # http://localhost:5001
npm run dev --workspace=client   # http://localhost:5173
```

## Scripts

| Script | Workspace | Purpose |
|---|---|---|
| `npm run dev` | root | Start client + server concurrently |
| `npm run build` | root | Build server + client |
| `npm run lint` | root | Typecheck + lint both workspaces |
| `npm run dev` | server | Start Express + Socket.IO server |
| `npm run build` | server | TypeScript build to `dist/` |
| `npm run start` | server | Run built server (`node dist/server.js`) |
| `npm run dev` | client | Start Vite dev server |
| `npm run build` | client | TypeCheck + Vite production build |

## Health check

```bash
curl http://localhost:5001/api/health
# Expected: {"status":"ok","service":"connectly-api","env":"development"}
```

## API: Conversations and messages

All endpoints require a valid authentication cookie (`token`) set by `/api/auth/login` or `/api/auth/register`.

- `POST /api/conversations` — create or find a direct conversation with another user  
  Body: `{ "participantId": "<userId>" }`  
  Returns `{ conversation, created }`
- `GET /api/conversations` — list conversations the current user participates in  
  Returns `{ conversations: [...] }`
- `POST /api/conversations/:conversationId/messages` — send a text message  
  Body: `{ "textContent": "..." }`  
  Returns `{ message }` (HTTP 201)
- `GET /api/conversations/:conversationId/messages` — paginated message history  
  Query: `?limit=20&before=<messageId>` (oldest-first page)  
  Returns `{ messages: [...], hasMore }`

Server-side checks conversation membership before allowing reads or sends.

## Milestones

See `Connectly_AI_Rules_and_Milestones.md` (product rules & milestone plan) and `Connectly_PRD.md` (product requirements document). Work proceeds one milestone at a time; do not start the next milestone until the current one meets its acceptance criteria.

## Security

- Never commit `.env` or credentials.
- `.env.example` contains placeholder values only.
- Do not log passwords, tokens, or private message content.
