# HireNexa v1.0 — Release Notes

**Release date:** June 24, 2026
**Status:** Production-ready

## Highlights

HireNexa v1.0 is a complete, role-based campus recruitment platform with smart matching, resume insights, and end-to-end placement analytics.

## Key Features

### 🧑‍🎓 Student Experience
- Personalized dashboard with MoM KPI trends
- Smart job matching (skills + CGPA + branch eligibility)
- Resume upload with score, strengths, and gap analysis
- Achievement badges + Smart Insights suggestions
- Applications, saved jobs, interview calendar
- Activity Center timeline

### 🧑‍💼 Recruiter Experience
- Job posting & lifecycle management
- Applicant pipeline with status workflow
- Interview scheduling
- Pipeline insights + recruiter KPI trends
- CSV / PDF exports

### 🛡 Admin Experience
- Platform-wide KPIs & MoM deltas
- Department / company / recruiter analytics
- Placement reports
- Full audit logs

### 🔐 Platform
- Email + Google OAuth (Supabase native)
- Role-based routing (admin > recruiter > student)
- RLS-secured Postgres with `has_role` SECURITY DEFINER
- Private resume storage bucket
- Notifications system
- SEO meta + OG share previews
- Global error boundary

## Architecture

- TanStack Start v1 (React 19, SSR, Vite 8)
- Tailwind v4 + shadcn/ui glassmorphism dark UI
- Supabase (Postgres / Auth / Storage)
- TanStack Query for data layer

## Future Roadmap

- AI-powered JD generation & resume rewriter
- In-app messaging between recruiters & students
- Calendar (Google / Outlook) sync for interviews
- Bulk applicant CSV import
- Email notifications via custom domain
- Mobile PWA install
- Recruiter scorecard collaboration
- Public placement microsite per institution

## Known limitations

- Email notifications are not yet wired (in-app only)
- No bulk import UI
- No native mobile apps
