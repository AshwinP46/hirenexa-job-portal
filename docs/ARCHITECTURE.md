# System Architecture

```
                       ┌────────────────────────────────┐
                       │          End Users             │
                       │  Students · Recruiters · Admins│
                       └──────────────┬─────────────────┘
                                      │ HTTPS
                                      ▼
        ┌──────────────────────────────────────────────────────┐
        │       TanStack Start (React 19 + Vite 8, SSR)        │
        │ ┌────────────┐  ┌─────────────┐  ┌────────────────┐  │
        │ │  AuthGate  │→ │  AppShell   │→ │  Role Sidebar  │  │
        │ └────────────┘  └─────────────┘  └────────────────┘  │
        │                                                      │
        │  Pages: / · /auth · /student · /recruiter · /admin   │
        │         /jobs · /applications · /interviews          │
        │         /profile · /activity · /recruiter/jobs       │
        │                                                      │
        │  Engines: match · eligibility · insights · exports   │
        └──────────────────────┬───────────────────────────────┘
                               │ supabase-js (publishable key)
                               ▼
        ┌──────────────────────────────────────────────────────┐
        │                    Supabase                          │
        │                                                      │
        │  Postgres  ── RLS policies on every public table     │
        │  Auth      ── Email/password + Google OAuth          │
        │  Storage   ── resumes bucket (private)               │
        │  Triggers  ── handle_new_user · touch_updated_at     │
        │  Functions ── has_role · get_primary_role (DEFINER)  │
        └──────────────────────────────────────────────────────┘
```

## Frontend layers

- **Router** — `src/router.tsx`, file-based routes in `src/routes/`.
- **Shell** — `AppShell`, `AuthGate`, role sidebars.
- **Data layer** — `src/lib/api.ts` consolidates queries/mutations.
- **Domain engines** — `match.ts`, `insights.ts`, `exports.ts`.

## Backend layers

- **RLS-first** — every public table enables RLS with policies scoped to `auth.uid()` or `has_role()`.
- **Service-role isolation** — `client.server.ts` only runs inside server handlers; never imported by route/component code at module scope.
- **Auth flow** — Google OAuth via Supabase native provider (`supabase.auth.signInWithOAuth`). Configure the Google provider in your Supabase project's Auth settings.

## Reliability

- Root error boundary + 404 route
- TanStack Query retry policy
- Audit logging on sensitive mutations
- SEO meta + OG tags at root for share previews
