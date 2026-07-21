import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleHome, type AppRole } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";

// ---------------- Auth gate ----------------
export function useRequireRole(allowed?: AppRole[]) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (allowed && role && !allowed.includes(role)) {
      navigate({ to: roleHome(role) });
    }
  }, [user, role, loading, allowed, navigate]);
  return { user, role, loading, authorized: !!user && (!allowed || (role && allowed.includes(role))) };
}

// ---------------- Generic query helper ----------------
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e as Error))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => reload(), [reload]);
  return { data, loading, error, reload };
}

// ---------------- Profile + student ----------------
export async function fetchMyProfile(userId: string) {
  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("students").select("*").eq("id", userId).maybeSingle(),
  ]);
  return { profile, student };
}

export async function fetchMyRecruiter(userId: string) {
  const [{ data: profile }, { data: recruiter }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("recruiters").select("*").eq("id", userId).maybeSingle(),
  ]);
  return { profile, recruiter };
}

export async function updateMyProfile(userId: string, patch: { name?: string; phone?: string | null; avatar_url?: string | null }) {
  return supabase.from("profiles").update(patch).eq("id", userId);
}

export async function updateMyStudent(userId: string, patch: Partial<{
  department: string | null;
  cgpa: number | null;
  roll_number: string | null;
  year_of_study: number | null;
  skills: string[];
  bio: string | null;
  resume_url: string | null;
}>) {
  return supabase.from("students").update(patch).eq("id", userId);
}

// ---------------- Jobs ----------------
export interface JobWithRecruiter {
  id: string;
  title: string;
  description: string;
  location: string | null;
  package_lpa: number | null;
  minimum_cgpa: number | null;
  deadline: string | null;
  job_type: string | null;
  openings: number;
  skills_required: string[];
  is_active: boolean;
  created_at: string;
  recruiter_id: string;
  company_name?: string;
  company_logo?: string | null;
}

export async function fetchActiveJobs(): Promise<JobWithRecruiter[]> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (!jobs?.length) return [];
  const recruiterIds = Array.from(new Set(jobs.map((j) => j.recruiter_id)));
  const { data: recs } = await supabase
    .from("recruiters")
    .select("id, company_name, company_logo")
    .in("id", recruiterIds);
  const map = new Map((recs ?? []).map((r) => [r.id, r]));
  return jobs.map((j) => ({
    ...j,
    company_name: map.get(j.recruiter_id)?.company_name ?? "Unknown Co.",
    company_logo: map.get(j.recruiter_id)?.company_logo ?? null,
  }));
}

// ---------------- Applications ----------------
export type AppStatus = "applied" | "shortlisted" | "interview_scheduled" | "selected" | "rejected";

export async function fetchMyApplications(studentId: string) {
  const { data: apps } = await supabase
    .from("applications")
    .select("*")
    .eq("student_id", studentId)
    .order("applied_at", { ascending: false });
  if (!apps?.length) return [];
  const jobIds = Array.from(new Set(apps.map((a) => a.job_id)));
  const { data: jobs } = await supabase.from("jobs").select("*").in("id", jobIds);
  const recIds = Array.from(new Set((jobs ?? []).map((j) => j.recruiter_id)));
  const { data: recs } = await supabase.from("recruiters").select("id, company_name").in("id", recIds);
  const recMap = new Map((recs ?? []).map((r) => [r.id, r.company_name]));
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
  return apps.map((a) => {
    const job = jobMap.get(a.job_id);
    return {
      ...a,
      job_title: job?.title ?? "—",
      job_package: job?.package_lpa ?? null,
      company_name: job ? recMap.get(job.recruiter_id) ?? "Unknown" : "Unknown",
    };
  });
}

export async function applyToJob(args: { studentId: string; jobId: string; matchScore: number }) {
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("student_id", args.studentId)
    .eq("job_id", args.jobId)
    .maybeSingle();
  if (existing) return { error: { message: "You have already applied to this job." } };
  const res = await supabase.from("applications").insert({
    student_id: args.studentId,
    job_id: args.jobId,
    status: "applied",
    match_score: args.matchScore,
  });
  if (!res.error) {
    await logAudit(args.studentId, "application_created", "application", null, { jobId: args.jobId });
  }
  return res;
}

// ---------------- Interviews ----------------
export async function fetchMyInterviews(studentId: string) {
  const { data: apps } = await supabase
    .from("applications")
    .select("id, job_id")
    .eq("student_id", studentId);
  if (!apps?.length) return [];
  const appIds = apps.map((a) => a.id);
  const { data: ivs } = await supabase
    .from("interviews")
    .select("*")
    .in("application_id", appIds)
    .order("interview_date", { ascending: true });
  const jobIds = Array.from(new Set(apps.map((a) => a.job_id)));
  const { data: jobs } = await supabase.from("jobs").select("id, title, recruiter_id").in("id", jobIds);
  const recIds = Array.from(new Set((jobs ?? []).map((j) => j.recruiter_id)));
  const { data: recs } = await supabase.from("recruiters").select("id, company_name").in("id", recIds);
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
  const recMap = new Map((recs ?? []).map((r) => [r.id, r.company_name]));
  const appMap = new Map(apps.map((a) => [a.id, a]));
  return (ivs ?? []).map((iv) => {
    const app = appMap.get(iv.application_id);
    const job = app ? jobMap.get(app.job_id) : null;
    return {
      ...iv,
      job_title: job?.title ?? "—",
      company_name: job ? recMap.get(job.recruiter_id) ?? "Unknown" : "Unknown",
    };
  });
}

// ---------------- Notifications ----------------
export async function fetchMyNotifications(userId: string, limit = 20) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  return supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string) {
  return supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

export async function notifyUser(userId: string, title: string, message: string, type = "info", link: string | null = null) {
  return supabase.from("notifications").insert({ user_id: userId, title, message, type, link });
}

// ---------------- Resume upload ----------------
export async function uploadResume(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/resume-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
    upsert: true,
    contentType: file.type || "application/pdf",
  });
  if (upErr) return { error: upErr };
  await updateMyStudent(userId, { resume_url: path });
  return { error: null, path };
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (upErr) return { error: upErr, publicUrl: null };
  const { data } = await supabase.storage.from("resumes").createSignedUrl(path, 31536000); // 1 year expiry
  const publicUrl = data?.signedUrl ?? null;
  if (publicUrl) {
    await updateMyProfile(userId, { avatar_url: publicUrl });
  }
  return { error: null, publicUrl };
}

export async function getResumeSignedUrl(path: string) {
  const { data } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

// ---------------- Saved jobs ----------------
export async function fetchSavedJobIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("saved_jobs").select("job_id").eq("student_id", userId);
  return new Set((data ?? []).map((r) => r.job_id));
}
export async function saveJob(userId: string, jobId: string) {
  return supabase.from("saved_jobs").insert({ student_id: userId, job_id: jobId });
}
export async function unsaveJob(userId: string, jobId: string) {
  return supabase.from("saved_jobs").delete().eq("student_id", userId).eq("job_id", jobId);
}

// ---------------- Audit ----------------
export type AuditAction =
  | "job_created" | "job_updated" | "job_deleted" | "job_archived"
  | "interview_scheduled" | "interview_rescheduled" | "interview_cancelled"
  | "application_status_changed" | "application_created";

export async function logAudit(_actorId: string, action: AuditAction, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  return supabase.rpc("log_audit_event", {
    _action: action,
    _entity_type: entityType,
    _entity_id: entityId as string,
    _metadata: metadata as never,
  });
}
export async function fetchAuditLogs(limit = 50) {
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

// ---------------- Recruiter: dashboard + CRUD ----------------
export async function fetchRecruiterDashboard(recruiterId: string) {
  const { data: jobs } = await supabase.from("jobs").select("*").eq("recruiter_id", recruiterId);
  const jobIds = (jobs ?? []).map((j) => j.id);
  const [{ data: apps }, { data: ivs }] = await Promise.all([
    jobIds.length
      ? supabase.from("applications").select("*").in("job_id", jobIds)
      : Promise.resolve({ data: [] as any[] }),
    jobIds.length
      ? supabase.from("interviews").select("*, applications!inner(job_id)").in("applications.job_id", jobIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const activeJobs = (jobs ?? []).filter((j) => j.is_active).length;
  const applicationsReceived = (apps ?? []).length;
  const interviewsScheduled = (ivs ?? []).filter((i) => i.status === "scheduled").length;
  const selectedCount = (apps ?? []).filter((a) => a.status === "selected").length;

  // applications trend last 7 days
  const days: { d: string; apps: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = (apps ?? []).filter((a) => a.applied_at.slice(0, 10) === key).length;
    days.push({ d: label, apps: count });
  }

  const funnel = [
    { stage: "Applied", count: (apps ?? []).length },
    { stage: "Shortlisted", count: (apps ?? []).filter((a) => a.status === "shortlisted").length },
    { stage: "Interview", count: (apps ?? []).filter((a) => a.status === "interview_scheduled").length },
    { stage: "Selected", count: selectedCount },
    { stage: "Rejected", count: (apps ?? []).filter((a) => a.status === "rejected").length },
  ];

  // top jobs by application count
  const byJob = new Map<string, { title: string; apps: number; selected: number }>();
  (jobs ?? []).forEach((j) => byJob.set(j.id, { title: j.title, apps: 0, selected: 0 }));
  (apps ?? []).forEach((a) => {
    const r = byJob.get(a.job_id);
    if (!r) return;
    r.apps++;
    if (a.status === "selected") r.selected++;
  });
  const topJobs = Array.from(byJob.values()).sort((a, b) => b.apps - a.apps).slice(0, 5);

  // Period deltas — last 30d vs prior 30d
  const now = Date.now();
  const D30 = 30 * 86_400_000;
  const within = (iso: string | null | undefined, start: number, end: number) => {
    if (!iso) return false;
    const t = +new Date(iso);
    return t >= start && t < end;
  };
  const curStart = now - D30, prevStart = now - 2 * D30;
  const cur = {
    jobs: (jobs ?? []).filter((j) => within(j.created_at, curStart, now)).length,
    apps: (apps ?? []).filter((a) => within(a.applied_at, curStart, now)).length,
    ivs: (ivs ?? []).filter((i) => within(i.interview_date, curStart, now)).length,
    sel: (apps ?? []).filter((a) => a.status === "selected" && within(a.applied_at, curStart, now)).length,
  };
  const prev = {
    jobs: (jobs ?? []).filter((j) => within(j.created_at, prevStart, curStart)).length,
    apps: (apps ?? []).filter((a) => within(a.applied_at, prevStart, curStart)).length,
    ivs: (ivs ?? []).filter((i) => within(i.interview_date, prevStart, curStart)).length,
    sel: (apps ?? []).filter((a) => a.status === "selected" && within(a.applied_at, prevStart, curStart)).length,
  };
  const trends = { cur, prev };

  // Smart recruiter insights
  const smartInsights: string[] = [];
  if (topJobs[0]) smartInsights.push(`Best performing post: "${topJobs[0].title}" with ${topJobs[0].apps} applicants.`);
  const shortlisted = (apps ?? []).filter((a) => a.status === "shortlisted").length;
  const pipelineHealth = applicationsReceived ? Math.round(((shortlisted + interviewsScheduled + selectedCount) / applicationsReceived) * 100) : 0;
  smartInsights.push(`Pipeline health: ${pipelineHealth}% of applicants advanced beyond initial review.`);
  const ivConv = interviewsScheduled ? Math.round((selectedCount / interviewsScheduled) * 100) : 0;
  smartInsights.push(`Interview conversion: ${ivConv}% of interviewed candidates selected.`);
  const efficiency = activeJobs ? +(applicationsReceived / activeJobs).toFixed(1) : 0;
  smartInsights.push(`Hiring efficiency: ${efficiency} applications per active job.`);
  if (cur.apps > prev.apps) smartInsights.push(`Activity is trending up — ${cur.apps - prev.apps} more applications in the last 30 days.`);
  else if (cur.apps < prev.apps) smartInsights.push(`Activity slowed by ${prev.apps - cur.apps} applications vs the prior 30 days — consider refreshing job posts.`);

  return { activeJobs, applicationsReceived, interviewsScheduled, selectedCount, trend: days, funnel, topJobs, trends, smartInsights };
}

export interface RecruiterJobRow {
  id: string; title: string; location: string | null; package_lpa: number | null;
  minimum_cgpa: number | null; deadline: string | null; openings: number;
  skills_required: string[]; is_active: boolean; created_at: string;
  description: string; job_type: string | null;
  applications: number;
}
export async function fetchRecruiterJobs(recruiterId: string): Promise<RecruiterJobRow[]> {
  const { data: jobs } = await supabase.from("jobs").select("*").eq("recruiter_id", recruiterId).order("created_at", { ascending: false });
  if (!jobs?.length) return [];
  const ids = jobs.map((j) => j.id);
  const { data: apps } = await supabase.from("applications").select("job_id").in("job_id", ids);
  const counts = new Map<string, number>();
  (apps ?? []).forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1));
  return jobs.map((j) => ({ ...j, applications: counts.get(j.id) ?? 0 } as RecruiterJobRow));
}

export interface JobInput {
  title: string; description: string; location: string | null; package_lpa: number | null;
  minimum_cgpa: number | null; deadline: string | null; job_type: string | null;
  openings: number; skills_required: string[];
}
export async function createJob(recruiterId: string, input: JobInput) {
  const { data, error } = await supabase.from("jobs").insert({
    recruiter_id: recruiterId, is_active: true, ...input,
  }).select("id").maybeSingle();
  if (!error && data) await logAudit(recruiterId, "job_created", "job", data.id, { title: input.title });
  return { data, error };
}
export async function updateJob(recruiterId: string, jobId: string, patch: Partial<JobInput & { is_active: boolean }>) {
  const res = await supabase.from("jobs").update(patch).eq("id", jobId);
  if (!res.error) await logAudit(recruiterId, "job_updated", "job", jobId, patch);
  return res;
}
export async function deleteJob(recruiterId: string, jobId: string) {
  const res = await supabase.from("jobs").delete().eq("id", jobId);
  if (!res.error) await logAudit(recruiterId, "job_deleted", "job", jobId, {});
  return res;
}
export async function archiveJob(recruiterId: string, jobId: string, archived = true) {
  const res = await supabase.from("jobs").update({ is_active: !archived }).eq("id", jobId);
  if (!res.error) await logAudit(recruiterId, "job_archived", "job", jobId, { archived });
  return res;
}

// ---------------- Applicants (recruiter view) ----------------
export interface ApplicantRow {
  application_id: string; job_id: string; job_title: string;
  student_id: string; student_name: string; student_email: string;
  department: string | null; cgpa: number | null; skills: string[];
  resume_url: string | null; match_score: number | null;
  status: AppStatus; applied_at: string;
}
export async function fetchRecruiterApplicants(recruiterId: string): Promise<ApplicantRow[]> {
  const { data: jobs } = await supabase.from("jobs").select("id, title").eq("recruiter_id", recruiterId);
  if (!jobs?.length) return [];
  const jobIds = jobs.map((j) => j.id);
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));
  const { data: apps } = await supabase.from("applications").select("*").in("job_id", jobIds).order("applied_at", { ascending: false });
  if (!apps?.length) return [];
  const studentIds = Array.from(new Set(apps.map((a) => a.student_id)));
  const [{ data: students }, { data: profiles }] = await Promise.all([
    supabase.from("students").select("*").in("id", studentIds),
    supabase.from("profiles").select("id, name, email").in("id", studentIds),
  ]);
  const sMap = new Map((students ?? []).map((s) => [s.id, s]));
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return apps.map((a) => {
    const s = sMap.get(a.student_id);
    const p = pMap.get(a.student_id);
    return {
      application_id: a.id, job_id: a.job_id, job_title: jobMap.get(a.job_id) ?? "—",
      student_id: a.student_id, student_name: p?.name ?? "—", student_email: p?.email ?? "—",
      department: s?.department ?? null, cgpa: s?.cgpa ?? null, skills: s?.skills ?? [],
      resume_url: s?.resume_url ?? null, match_score: a.match_score,
      status: a.status as AppStatus, applied_at: a.applied_at,
    };
  });
}

export async function updateApplicationStatus(actorId: string, applicationId: string, status: AppStatus, studentId?: string, jobTitle?: string) {
  const res = await supabase.from("applications").update({ status }).eq("id", applicationId);
  if (!res.error) {
    await logAudit(actorId, "application_status_changed", "application", applicationId, { status });
    if (studentId) {
      const titles: Record<AppStatus, string> = {
        applied: "Application received",
        shortlisted: "You've been shortlisted! 🎉",
        interview_scheduled: "Interview scheduled",
        selected: "Congratulations — you're selected! 🏆",
        rejected: "Application update",
      };
      await notifyUser(studentId, titles[status],
        `Your application${jobTitle ? ` for ${jobTitle}` : ""} is now: ${status.replace(/_/g, " ")}.`,
        status === "selected" ? "success" : status === "rejected" ? "warning" : "info");
    }
  }
  return res;
}

// ---------------- Interviews (recruiter view) ----------------
export interface RecruiterInterviewRow {
  id: string; application_id: string; interview_date: string;
  mode: "online" | "onsite"; status: "scheduled" | "completed" | "cancelled";
  round_name: string | null; meeting_link: string | null; location: string | null;
  feedback: string | null;
  student_id: string; student_name: string; job_id: string; job_title: string;
}
export async function fetchRecruiterInterviews(recruiterId: string): Promise<RecruiterInterviewRow[]> {
  const { data: jobs } = await supabase.from("jobs").select("id, title").eq("recruiter_id", recruiterId);
  if (!jobs?.length) return [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));
  const jobIds = jobs.map((j) => j.id);
  const { data: apps } = await supabase.from("applications").select("id, student_id, job_id").in("job_id", jobIds);
  if (!apps?.length) return [];
  const appMap = new Map(apps.map((a) => [a.id, a]));
  const { data: ivs } = await supabase.from("interviews").select("*").in("application_id", apps.map((a) => a.id)).order("interview_date", { ascending: true });
  if (!ivs?.length) return [];
  const studentIds = Array.from(new Set(apps.map((a) => a.student_id)));
  const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", studentIds);
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  return ivs.map((iv) => {
    const app = appMap.get(iv.application_id)!;
    return {
      id: iv.id, application_id: iv.application_id, interview_date: iv.interview_date,
      mode: iv.mode, status: iv.status, round_name: iv.round_name,
      meeting_link: iv.meeting_link, location: iv.location, feedback: iv.feedback,
      student_id: app.student_id, student_name: pMap.get(app.student_id) ?? "—",
      job_id: app.job_id, job_title: jobMap.get(app.job_id) ?? "—",
    };
  });
}

export async function scheduleInterview(actorId: string, args: {
  applicationId: string; interviewDate: string; mode: "online" | "onsite";
  roundName?: string; meetingLink?: string; location?: string;
  studentId?: string; jobTitle?: string;
}) {
  const res = await supabase.from("interviews").insert({
    application_id: args.applicationId, interview_date: args.interviewDate, mode: args.mode,
    round_name: args.roundName ?? "Round 1", meeting_link: args.meetingLink ?? null,
    location: args.location ?? null, status: "scheduled",
  });
  if (!res.error) {
    await supabase.from("applications").update({ status: "interview_scheduled" }).eq("id", args.applicationId);
    await logAudit(actorId, "interview_scheduled", "interview", args.applicationId, { date: args.interviewDate });
    if (args.studentId) {
      await notifyUser(args.studentId, "Interview scheduled 📅",
        `Your interview${args.jobTitle ? ` for ${args.jobTitle}` : ""} is scheduled for ${new Date(args.interviewDate).toLocaleString()}.`,
        "info");
    }
  }
  return res;
}
export async function rescheduleInterview(actorId: string, id: string, newDate: string, studentId?: string) {
  const res = await supabase.from("interviews").update({ interview_date: newDate }).eq("id", id);
  if (!res.error) {
    await logAudit(actorId, "interview_rescheduled", "interview", id, { newDate });
    if (studentId) await notifyUser(studentId, "Interview rescheduled", `Your interview was moved to ${new Date(newDate).toLocaleString()}.`, "info");
  }
  return res;
}
export async function cancelInterview(actorId: string, id: string, studentId?: string) {
  const res = await supabase.from("interviews").update({ status: "cancelled" }).eq("id", id);
  if (!res.error) {
    await logAudit(actorId, "interview_cancelled", "interview", id, {});
    if (studentId) await notifyUser(studentId, "Interview cancelled", "An upcoming interview was cancelled.", "warning");
  }
  return res;
}

// ---------------- Admin ----------------
export async function fetchAdminOverview() {
  const [studentsR, recruitersR, jobsR, appsR, ivsR] = await Promise.all([
    supabase.from("students").select("id, department, cgpa, year_of_study, skills, created_at", { count: "exact" }),
    supabase.from("recruiters").select("id, company_name, industry, website, created_at", { count: "exact" }),
    supabase.from("jobs").select("id, title, recruiter_id, package_lpa, created_at, is_active", { count: "exact" }),
    supabase.from("applications").select("id, status, job_id, student_id, applied_at"),
    supabase.from("interviews").select("id, status"),
  ]);

  const students = studentsR.data ?? [];
  const recruiters = recruitersR.data ?? [];
  const jobs = jobsR.data ?? [];
  const apps = appsR.data ?? [];
  const ivs = ivsR.data ?? [];

  const selected = apps.filter((a) => a.status === "selected");
  const placementRate = students.length ? Math.round((new Set(selected.map((a) => a.student_id)).size / students.length) * 100) : 0;

  // average package among selected jobs
  const jobPkg = new Map(jobs.map((j) => [j.id, j.package_lpa ?? 0]));
  const pkgs = selected.map((a) => jobPkg.get(a.job_id) ?? 0).filter((p) => p > 0);
  const avgPackage = pkgs.length ? +(pkgs.reduce((s, n) => s + n, 0) / pkgs.length).toFixed(1) : 0;

  // dept-wise placements
  const sMap = new Map(students.map((s) => [s.id, s]));
  const deptCount = new Map<string, number>();
  selected.forEach((a) => {
    const dept = sMap.get(a.student_id)?.department ?? "—";
    deptCount.set(dept, (deptCount.get(dept) ?? 0) + 1);
  });
  const deptData = Array.from(deptCount.entries()).map(([dept, placed]) => ({ dept, placed })).sort((a, b) => b.placed - a.placed);

  // company-wise placements
  const rMap = new Map(recruiters.map((r) => [r.id, r]));
  const jMap = new Map(jobs.map((j) => [j.id, j]));
  const compCount = new Map<string, number>();
  selected.forEach((a) => {
    const job = jMap.get(a.job_id);
    const comp = job ? rMap.get(job.recruiter_id)?.company_name ?? "—" : "—";
    compCount.set(comp, (compCount.get(comp) ?? 0) + 1);
  });
  const palette = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)"];
  const companyData = Array.from(compCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }));

  // monthly hiring trend last 6 months (by applied_at when status selected)
  const monthly: { m: string; hires: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    const hires = selected.filter((a) => a.applied_at.slice(0, 7) === key).length;
    monthly.push({ m: label, hires });
  }

  // package distribution buckets
  const bands = [
    { range: "0-6 L", min: 0, max: 6 }, { range: "6-10 L", min: 6, max: 10 },
    { range: "10-15 L", min: 10, max: 15 }, { range: "15-25 L", min: 15, max: 25 },
    { range: "25+", min: 25, max: Infinity },
  ];
  const packageDist = bands.map((b) => ({
    range: b.range,
    count: pkgs.filter((p) => p >= b.min && p < b.max).length,
  }));

  // status breakdown
  const statusBreakdown: { name: string; count: number; color: string }[] = [
    { name: "Applied", count: apps.filter((a) => a.status === "applied").length, color: "var(--chart-1)" },
    { name: "Shortlisted", count: apps.filter((a) => a.status === "shortlisted").length, color: "var(--chart-2)" },
    { name: "Interview", count: apps.filter((a) => a.status === "interview_scheduled").length, color: "var(--chart-3)" },
    { name: "Selected", count: selected.length, color: "var(--chart-4)" },
    { name: "Rejected", count: apps.filter((a) => a.status === "rejected").length, color: "var(--chart-5)" },
  ];

  // Period deltas — last 30d vs prior 30d
  const nowMs = Date.now();
  const D30 = 30 * 86_400_000;
  const inRange = (iso: string | null | undefined, start: number, end: number) => {
    if (!iso) return false;
    const t = +new Date(iso);
    return t >= start && t < end;
  };
  const curS = nowMs - D30, prevS = nowMs - 2 * D30;
  const placedIds = (period: "cur" | "prev") => {
    const [s, e] = period === "cur" ? [curS, nowMs] : [prevS, curS];
    return new Set(selected.filter((a) => inRange(a.applied_at, s, e)).map((a) => a.student_id));
  };
  const curSel = selected.filter((a) => inRange(a.applied_at, curS, nowMs));
  const prevSel = selected.filter((a) => inRange(a.applied_at, prevS, curS));
  const curPkgs = curSel.map((a) => jobPkg.get(a.job_id) ?? 0).filter((p) => p > 0);
  const prevPkgs = prevSel.map((a) => jobPkg.get(a.job_id) ?? 0).filter((p) => p > 0);
  const trends = {
    cur: {
      students: students.filter((s: any) => inRange(s.created_at, curS, nowMs)).length,
      recruiters: recruiters.filter((r: any) => inRange(r.created_at, curS, nowMs)).length,
      jobs: jobs.filter((j) => inRange(j.created_at, curS, nowMs)).length,
      placements: curSel.length,
      placementRate: students.length ? Math.round((placedIds("cur").size / students.length) * 100) : 0,
      avgPackage: curPkgs.length ? +(curPkgs.reduce((s, n) => s + n, 0) / curPkgs.length).toFixed(1) : 0,
    },
    prev: {
      students: students.filter((s: any) => inRange(s.created_at, prevS, curS)).length,
      recruiters: recruiters.filter((r: any) => inRange(r.created_at, prevS, curS)).length,
      jobs: jobs.filter((j) => inRange(j.created_at, prevS, curS)).length,
      placements: prevSel.length,
      placementRate: students.length ? Math.round((placedIds("prev").size / students.length) * 100) : 0,
      avgPackage: prevPkgs.length ? +(prevPkgs.reduce((s, n) => s + n, 0) / prevPkgs.length).toFixed(1) : 0,
    },
  };

  // Smart admin insights
  const smartInsights: string[] = [];
  if (deptData[0]) smartInsights.push(`Best performing department: ${deptData[0].dept} with ${deptData[0].placed} placements.`);
  if (companyData[0]) smartInsights.push(`Top hiring company: ${companyData[0].name} with ${companyData[0].value} offers.`);
  if (trends.cur.placements > trends.prev.placements) smartInsights.push(`Placements up by ${trends.cur.placements - trends.prev.placements} vs the prior 30 days — momentum building.`);
  else if (trends.cur.placements < trends.prev.placements) smartInsights.push(`Placements down by ${trends.prev.placements - trends.cur.placements} this period — review recruiter engagement.`);
  if (placementRate >= 70) smartInsights.push(`Strong overall placement rate at ${placementRate}% of registered students.`);
  else if (placementRate > 0) smartInsights.push(`Placement rate at ${placementRate}% — focus on under-placed departments to improve.`);
  // recruiter performance: top recruiter by offers
  const recOffers = new Map<string, number>();
  selected.forEach((a) => {
    const job = jMap.get(a.job_id);
    if (!job) return;
    const r = rMap.get(job.recruiter_id);
    if (!r) return;
    recOffers.set(r.company_name, (recOffers.get(r.company_name) ?? 0) + 1);
  });
  const topRec = Array.from(recOffers.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topRec) smartInsights.push(`Most active recruiter: ${topRec[0]} extending ${topRec[1]} offers across the platform.`);

  return {
    totals: {
      students: students.length,
      recruiters: recruiters.length,
      jobs: jobs.length,
      activeJobs: jobs.filter((j) => j.is_active).length,
      applications: apps.length,
      interviews: ivs.length,
      placements: selected.length,
      placementRate,
      avgPackage,
    },
    trends, smartInsights,
    deptData, companyData, monthly, packageDist, statusBreakdown,
    recent: {
      students: students.slice(0, 6),
      recruiters: recruiters.slice(0, 6),
      jobs: jobs.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6).map((j) => ({
        ...j, company_name: rMap.get(j.recruiter_id)?.company_name ?? "—",
      })),
    },
    raw: { students, recruiters, jobs, apps, selected, jMap, rMap, sMap },
  };
}

