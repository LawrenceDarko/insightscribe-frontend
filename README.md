# InsightScribe Frontend

Production-grade Next.js 14+ SaaS frontend for **InsightScribe** — AI Product Research Intelligence.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Axios** (API client with interceptors)
- **JWT** auth with Django backend (refresh token in httpOnly cookie)

## Folder structure

```
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── login/route.ts      # Proxy login, set refresh cookie
│   │   │       ├── register/route.ts
│   │   │       ├── refresh/route.ts
│   │   │       └── logout/route.ts
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + TopBar + ProtectedRoute
│   │   │   ├── dashboard/page.tsx
│   │   │   └── projects/
│   │   │       └── [id]/
│   │   │           ├── layout.tsx      # Project nav tabs
│   │   │           ├── page.tsx        # Overview
│   │   │           ├── upload/page.tsx
│   │   │           ├── chat/page.tsx
│   │   │           └── insights/page.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx                    # Landing
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Skeleton.tsx
│   │       └── index.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── DashboardProjects.tsx
│   │   │   └── CreateProjectModal.tsx
│   │   ├── projects/
│   │   │   ├── ProjectNav.tsx
│   │   │   └── ProjectOverview.tsx
│   │   ├── upload/
│   │   │   └── UploadInterview.tsx
│   │   ├── chat/
│   │   │   └── ChatInterface.tsx
│   │   └── insights/
│   │       └── InsightsView.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       # Axios instance, token, 401 refresh
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── upload.ts
│   │   │   ├── chat.ts
│   │   │   ├── insights.ts
│   │   │   └── index.ts
│   │   ├── env.ts              # NEXT_PUBLIC_API_URL, etc.
│   │   └── utils.ts            # cn, formatDate
│   └── types/
│       └── index.ts            # User, Project, Interview, etc.
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run dev**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Backend contract (Django)

The frontend expects these API shapes; align your Django URLs and responses accordingly.

- **Auth**
  - `POST /api/auth/login/` — body: `{ email, password }`, response: `{ access, refresh [, user ] }`
  - `POST /api/auth/register/` — body: `{ email, password [, name ] }`, response: `{ access, refresh [, user ] }`
  - `POST /api/auth/refresh/` — body: `{ refresh }`, response: `{ access [, refresh ] }`
  - `GET /api/auth/me/` — Bearer token, response: `{ id, email [, name ] }`

- **Projects**
  - `GET /api/projects/` — list
  - `POST /api/projects/` — body: `{ name }`
  - `GET /api/projects/:id/`
  - `DELETE /api/projects/:id/`
  - `GET /api/projects/:id/interviews/`

- **Upload / interviews**
  - `POST /api/projects/:id/uploads/` — body: `{ file_name, file_size }`, response: `{ interview [, upload_url ] }`

- **Chat**
  - `GET /api/projects/:id/chat/` — list messages
  - `POST /api/projects/:id/chat/` — body: `{ message }`, response: new message

- **Insights**
  - `GET /api/projects/:id/insights/` — response: `{ feature_requests?, frustrations?, positive_themes?, negative_themes?, onboarding_issues? }` (arrays of `{ id, title, frequency?, sentiment_score?, quotes }`).

## Auth flow

- **Login/register** go to Next.js routes `/api/auth/login` and `/api/auth/register`, which proxy to Django and set an **httpOnly** cookie for the refresh token; the access token is returned in the JSON and kept in memory.
- **401** on any API call triggers a call to `/api/auth/refresh` (with credentials); the new access token is stored and the failed request is retried.
- **Logout** calls `/api/auth/logout` to clear the refresh cookie; access token is cleared in memory.

## Build

```bash
npm run build
npm start
```
