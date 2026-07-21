# Database ER Diagram

```
        ┌─────────────────┐         ┌────────────────────┐
        │  auth.users     │         │   user_roles       │
        │  (Supabase)     │1───────*│  user_id           │
        │  id (PK)        │         │  role (enum)       │
        └────────┬────────┘         └────────────────────┘
                 │1
                 │
        ┌────────▼────────┐
        │   profiles      │
        │  id (PK,FK)     │
        │  name · email   │
        │  phone · avatar │
        └────────┬────────┘
                 │1
        ┌────────┴────────────────────────┐
        │                                 │
   ┌────▼────────┐                ┌───────▼──────┐
   │  students   │                │  recruiters  │
   │  id (PK,FK) │                │  id (PK,FK)  │
   │  department │                │  company_name│
   │  cgpa       │                │  recruiter_  │
   │  skills[]   │                │   name       │
   │  resume_url │                └───────┬──────┘
   └────┬────────┘                        │1
        │                                 │
        │1                                │*
        │                          ┌──────▼──────┐
        │                          │    jobs     │
        │*                         │  id (PK)    │
   ┌────▼─────────────┐            │  recruiter  │
   │  applications    │*──────────1│   _id (FK)  │
   │  id (PK)         │            │  title      │
   │  student_id (FK) │            │  package    │
   │  job_id (FK)     │            │  min_cgpa   │
   │  status          │            │  skills[]   │
   └────┬─────────────┘            │  deadline   │
        │1                         └──────┬──────┘
        │                                 │1
        │*                                │*
   ┌────▼──────────┐               ┌──────▼────────┐
   │  interviews   │               │  saved_jobs   │
   │  id (PK)      │               │  student_id   │
   │  application  │               │  job_id       │
   │   _id (FK)    │               └───────────────┘
   │  scheduled_at │
   │  mode         │               ┌───────────────┐
   └───────────────┘               │ notifications │
                                   │  user_id (FK) │
                                   │  type · body  │
   ┌───────────────┐               │  read_at      │
   │  audit_logs   │               └───────────────┘
   │  actor_id (FK)│
   │  action       │
   │  target       │
   │  meta (jsonb) │
   └───────────────┘
```

## Key constraints

- `profiles.id` references `auth.users.id` with `ON DELETE CASCADE`.
- `students.id` / `recruiters.id` reference `profiles.id`.
- `jobs.recruiter_id` → `recruiters.id`.
- `applications` has unique `(student_id, job_id)`.
- `saved_jobs` has unique `(student_id, job_id)`.

## RLS summary

| Table | Read | Write |
| --- | --- | --- |
| profiles | self + admin | self + admin |
| students | self + recruiter (via app) + admin | self + admin |
| recruiters | authenticated | self + admin |
| jobs | authenticated | owning recruiter + admin |
| applications | applicant + job owner + admin | applicant (create), owner (status), admin |
| interviews | applicant + owner + admin | owner + admin |
| saved_jobs | self | self |
| notifications | self | self + service-role |
| audit_logs | admin | service-role / triggers |
| user_roles | self read, admin write | admin |
