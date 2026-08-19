# AskFlow AI

A simple full-stack AI chat application: React + TypeScript frontend, Node.js/Express backend, Supabase (Auth + PostgreSQL) for data, and Gemini for AI replies.

## Stack

- **Frontend:** React.js + TypeScript, Tailwind CSS, React Router
- **Backend:** Node.js + Express.js, Zod validation
- **Auth & DB:** Supabase Auth + PostgreSQL (with Row Level Security)
- **AI:** Gemini API via `@google/genai` (called only from the backend)

## Folder structure

```
askflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/env.ts          # Zod-validated environment config
│   │   ├── lib/supabase.ts        # Supabase admin (service-role) client
│   │   ├── middleware/auth.ts     # Verifies Supabase JWT on every request
│   │   ├── middleware/errorHandler.ts
│   │   ├── routes/chat.ts         # /api/conversations, /api/conversations/:id/messages
│   │   ├── services/chatService.ts
│   │   ├── services/geminiService.ts
│   │   └── server.ts
│   ├── supabase/migrations/0001_init.sql
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/            # Sidebar, AppLayout, ProtectedRoute, chat UI
    │   ├── context/AuthContext.tsx
    │   ├── lib/supabaseClient.ts  # Browser Supabase client (anon key only)
    │   ├── lib/api.ts             # Fetch wrapper that attaches the user's JWT
    │   ├── pages/                 # Login, Signup, Dashboard, Chatbot
    │   └── types/
    └── .env.example
```

## How auth & security work

- The frontend signs users up/in/out directly against Supabase Auth using the **anon key** (safe to expose — access is enforced by Row Level Security).
- On every backend request, the frontend sends the user's Supabase access token as `Authorization: Bearer <token>`.
- The backend verifies that token against Supabase (`supabase.auth.getUser(token)`) using the **service role key**, which lives only on the server.
- The **Gemini API key** and **Supabase service role key** are read only from `backend/.env` and are never sent to the browser.
- Database tables have **Row Level Security** enabled so that, even if data were ever queried directly with a user's JWT, a user could only ever see their own conversations and messages.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://ai.google.dev/)

## Setup

### 1. Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migration in [`backend/supabase/migrations/0001_init.sql`](backend/supabase/migrations/0001_init.sql). This creates the `conversations` and `messages` tables and their RLS policies.
3. From **Project Settings → API**, collect:
   - Project URL
   - `anon` public key
   - `service_role` secret key (⚠️ keep this out of the frontend)
4. Under **Authentication → Providers**, make sure Email sign-up is enabled. For local development, you can disable "Confirm email" so signup logs users in immediately.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY
npm install
npm run dev
```

The API starts on `http://localhost:4000` by default.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev
```

The app starts on `http://localhost:5173` by default.

### 4. Try it out

1. Open `http://localhost:5173`, sign up, then sign in.
2. You'll land on the **Dashboard** with your conversation count and a "Start new chat" button.
3. Click **AI Chatbot** in the sidebar (or "Start new chat") to open the full-page chat, send a message, and get a Gemini-powered reply.

## Environment variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Backend port (default `4000`) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only secret key — bypasses RLS |
| `SUPABASE_ANON_KEY` | Public anon key (also used server-side for token verification) |
| `GEMINI_API_KEY` | Server-only Gemini API key |
| `GEMINI_MODEL` | Gemini model id (default `gemini-2.0-flash`) |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key — safe for the browser |
| `VITE_API_BASE_URL` | Backend API base URL (default `http://localhost:4000`) |

## API endpoints

All endpoints require `Authorization: Bearer <supabase_access_token>`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/conversations` | List the current user's conversations |
| GET | `/api/conversations/count` | Total conversation count |
| POST | `/api/conversations` | Create a new conversation |
| DELETE | `/api/conversations/:id` | Delete a conversation |
| GET | `/api/conversations/:id/messages` | List messages in a conversation |
| POST | `/api/conversations/:id/messages` | Send a message; backend calls Gemini and returns both the saved user message and the AI reply |

## Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```
