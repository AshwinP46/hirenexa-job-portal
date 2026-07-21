# Demo Data Guide

> ⚠️ Demo accounts are for evaluation only. Reset passwords or remove before going to production.

## Student demo

| Field | Value |
| --- | --- |
| Email | `student.demo@hirenexa.app` |
| Password | `Demo@1234` |
| Role | student |
| Department | Computer Science |
| CGPA | 8.6 |
| Skills | React, TypeScript, Node.js, SQL |

What to try:
- Upload a resume on **/profile**
- Browse matched jobs on **/jobs**
- Apply and track on **/applications**
- View Resume Insights & Achievements on **/student**

## Recruiter demo

| Field | Value |
| --- | --- |
| Email | `recruiter.demo@hirenexa.app` |
| Password | `Demo@1234` |
| Role | recruiter |
| Company | Nexa Labs |

What to try:
- Create a job on **/recruiter/jobs**
- Review applicants and update status
- Schedule an interview on **/interviews**
- Export pipeline as CSV / PDF

## Admin demo

| Field | Value |
| --- | --- |
| Email | `admin.demo@hirenexa.app` |
| Password | `Demo@1234` |
| Role | admin |

What to try:
- Platform KPIs + MoM trends on **/admin**
- Review **audit logs**
- Export placement reports
- Inspect Activity Center across roles

## Seeding

Demo accounts are created on first signup with the matching email. Role is set via the `role` field in `raw_user_meta_data` (handled by `handle_new_user`).

To seed via SQL, insert into `auth.users` is **not** supported through the Data API — use Supabase Auth Admin (server-side) or sign up the accounts manually once.
