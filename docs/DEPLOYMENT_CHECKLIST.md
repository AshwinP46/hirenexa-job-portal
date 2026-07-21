# Deployment Checklist

Run through this list before every production deployment.

## 1. Production build
- [ ] `npm run build` completes with no errors
- [ ] Type check clean (no TS errors)
- [ ] No unused route placeholders
- [ ] No console errors on `/`, `/auth`, `/student`, `/recruiter`, `/admin`

## 2. Environment variables
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` set
- [ ] `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` available server-side
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server only, never exposed to client)

## 3. Google OAuth (if enabled)
- [ ] Google provider enabled in Supabase Dashboard → Authentication → Providers
- [ ] Correct redirect URI set: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- [ ] Google OAuth sign-in redirects and returns session correctly
- [ ] Sign-out clears session and routes to `/auth`

## 4. Storage
- [ ] `resumes` bucket exists and is **private**
- [ ] Signed-URL upload flow tested for students
- [ ] Resume download works for owning student + recruiter (via signed URL)

## 5. RLS policies
- [ ] RLS enabled on every public table (11 tables)
- [ ] `has_role()` / `get_primary_role()` are SECURITY DEFINER with `search_path = public`
- [ ] No table grants broad `anon` access to user-owned data
- [ ] `user_roles` writable only by admin/service role
- [ ] Linter: `supabase db lint` returns no critical findings

## 6. Audit logs
- [ ] Sensitive actions (role grants, status overrides) log to `audit_logs`
- [ ] Admin can view; recruiters cannot see other actors

## 7. Reports & exports
- [ ] Recruiter CSV/PDF export works
- [ ] Admin placement report exports
- [ ] Empty-state handled when no data

## 8. Authentication smoke test
- [ ] Email signup → role auto-assigned by `handle_new_user`
- [ ] Email login → dashboard redirect based on role
- [ ] Google OAuth sign-in → session established → correct dashboard
- [ ] Sign-out clears session and routes to `/auth`
- [ ] Protected routes redirect unauthenticated users

## 9. SEO & sharing
- [ ] Title + meta description set
- [ ] Favicon present

## 10. Role smoke test
- [ ] **Student:** signup → upload resume → apply → see insights
- [ ] **Recruiter:** create job → review applicants → schedule interview → export
- [ ] **Admin:** view KPIs → open audit logs → export report

## 11. Hosting
- [ ] Deploy the Nitro output (`.output/`) to your chosen host
- [ ] Custom domain configured and resolves correctly
- [ ] HTTPS certificate valid
