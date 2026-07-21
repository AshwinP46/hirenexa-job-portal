import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Briefcase, Send, CheckCircle2, CalendarCheck, Trophy, XCircle,
  Upload, TrendingUp, MapPin, Clock, ChevronRight, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AppShell, StatCard, statusBadge, prettyStatus, CompanyLogo } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyProfile, fetchActiveJobs, fetchMyApplications, fetchMyInterviews } from "@/lib/api";
import { computeMatch } from "@/lib/match";
import {
  computeResumeInsights, computeStudentBadges, studentSmartInsights,
  trendLabel, countWithinDays,
} from "@/lib/insights";
import { ResumeInsightsCard } from "@/components/insights/ResumeInsightsCard";
import { AchievementsCard } from "@/components/insights/AchievementsCard";
import { SmartInsightsCard } from "@/components/insights/SmartInsightsCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — HireNexa" },
      { name: "description", content: "Track placements, applications, and interviews in one premium dashboard." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <StudentDashboard />
    </AuthGate>
  ),
});

function StudentDashboard() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return <StudentDashboardInner uid={user.id} />;
}

function StudentDashboardInner({ uid }: { uid: string }) {

  const prof = useAsync(() => fetchMyProfile(uid), [uid]);
  const jobsQ = useAsync(() => fetchActiveJobs(), []);
  const appsQ = useAsync(() => fetchMyApplications(uid), [uid]);
  const ivsQ = useAsync(() => fetchMyInterviews(uid), [uid]);

  const student = prof.data?.student;
  const profile = prof.data?.profile;

  const apps = appsQ.data ?? [];
  const jobs = jobsQ.data ?? [];
  const ivs = ivsQ.data ?? [];

  const counts = useMemo(() => {
    const c = { applied: 0, shortlisted: 0, interview_scheduled: 0, selected: 0, rejected: 0 };
    apps.forEach((a) => { c[a.status as keyof typeof c] = (c[a.status as keyof typeof c] ?? 0) + 1; });
    return c;
  }, [apps]);

  const totalJobs = jobs.length;
  const upcomingIvs = ivs.filter((i) => new Date(i.interview_date) >= new Date());

  // 30-day deltas for KPI trend indicators
  const appsLast30 = countWithinDays(apps, "applied_at" as never, 30, 0);
  const appsPrev30 = countWithinDays(apps, "applied_at" as never, 30, 30);
  const ivsLast30  = countWithinDays(ivs, "interview_date" as never, 30, 0);
  const ivsPrev30  = countWithinDays(ivs, "interview_date" as never, 30, 30);

  const stats = [
    { label: "Total Jobs Available", value: totalJobs, change: `${totalJobs} active`, icon: Briefcase, gradient: "gradient-primary" },
    { label: "Applied Jobs", value: apps.length, change: trendLabel(appsLast30, appsPrev30), icon: Send, gradient: "gradient-accent" },
    { label: "Shortlisted", value: counts.shortlisted, change: counts.shortlisted ? "Great work!" : "Keep going", icon: CheckCircle2, gradient: "gradient-success" },
    { label: "Interviews Scheduled", value: counts.interview_scheduled, change: trendLabel(ivsLast30, ivsPrev30), icon: CalendarCheck, gradient: "gradient-warm" },
    { label: "Selected", value: counts.selected, change: counts.selected ? "🎉 Congrats!" : "Stay focused", icon: Trophy, gradient: "gradient-primary" },
    { label: "Rejected", value: counts.rejected, change: "Keep going", icon: XCircle, gradient: "gradient-accent" },
  ];

  // Apps by month (last 6)
  const applicationsByMonth = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; month: string; apps: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }), apps: 0 });
    }
    apps.forEach((a) => {
      const d = new Date(a.applied_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) b.apps++;
    });
    return buckets;
  }, [apps]);

  const statusDist = [
    { name: "Applied", value: counts.applied, color: "var(--chart-1)" },
    { name: "Shortlisted", value: counts.shortlisted, color: "var(--chart-3)" },
    { name: "Interview", value: counts.interview_scheduled, color: "var(--chart-5)" },
    { name: "Selected", value: counts.selected, color: "var(--chart-4)" },
    { name: "Rejected", value: counts.rejected, color: "var(--chart-2)" },
  ].filter((d) => d.value > 0);

  // Recommended jobs ranked by match, exclude already applied
  const appliedIds = new Set(apps.map((a) => a.job_id));
  const recommended = jobs
    .filter((j) => !appliedIds.has(j.id))
    .map((j) => ({
      job: j,
      match: computeMatch({
        studentSkills: student?.skills ?? [],
        studentCgpa: student?.cgpa ?? null,
        studentDept: student?.department ?? null,
        jobSkills: j.skills_required,
        jobMinCgpa: j.minimum_cgpa,
        jobTitle: j.title,
      }),
    }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 4);

  const recentApplications = apps.slice(0, 5);
  const upcomingInterviewsList = upcomingIvs.slice(0, 3);

  // Profile completion
  const fields = [
    !!profile?.name,
    !!profile?.phone,
    !!student?.department,
    !!student?.cgpa,
    (student?.skills?.length ?? 0) > 0,
    !!student?.resume_url,
  ];
  const profileCompletion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  // Resume insights, badges, smart insights
  const resumeInsights = useMemo(
    () => computeResumeInsights(profile ?? null, student ?? null),
    [profile, student],
  );
  const badges = useMemo(
    () => computeStudentBadges({
      profileStrength: resumeInsights.profileStrength,
      resumeUploaded: !!student?.resume_url,
      applicationsCount: apps.length,
      shortlistedCount: counts.shortlisted,
      interviewsCount: ivs.length,
      selectedCount: counts.selected,
    }),
    [resumeInsights.profileStrength, student?.resume_url, apps.length, counts.shortlisted, ivs.length, counts.selected],
  );
  const smartInsights = useMemo(
    () => studentSmartInsights({
      insights: resumeInsights,
      applicationsCount: apps.length,
      shortlistedCount: counts.shortlisted,
      interviewsCount: ivs.length,
      recentAppsDelta: appsLast30 - appsPrev30,
      topSkill: resumeInsights.missingSkills[0] ?? null,
    }),
    [resumeInsights, apps.length, counts.shortlisted, ivs.length, appsLast30, appsPrev30],
  );

  const fullName = profile?.name ?? "Student";
  const initials = fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const subtitle = [student?.department, student?.year_of_study && `Year ${student.year_of_study}`].filter(Boolean).join(" · ") || "Student";

  const loadingAll = prof.loading || jobsQ.loading || appsQ.loading || ivsQ.loading;

  return (
    <AppShell sidebar={<StudentSidebar />} user={{ name: fullName, initials, role: subtitle, avatarUrl: profile?.avatar_url }}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="absolute -bottom-16 right-32 h-32 w-32 rounded-full bg-white/10 animate-float [animation-delay:1s]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3 w-3" /> Placement Season is live
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {fullName.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm opacity-90 max-w-xl">
            You have <b>{recommended.length} job matches</b> waiting and <b>{upcomingIvs.length} upcoming interview{upcomingIvs.length === 1 ? "" : "s"}</b>.
          </p>
          <div className="mt-5 flex gap-2">
            <Link to="/jobs" className="rounded-xl bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow-soft">
              Explore Jobs
            </Link>
            <Link to="/profile" className="rounded-xl bg-white/15 backdrop-blur px-4 py-2 text-sm font-medium hover:bg-white/25 transition">
              Update Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loadingAll ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((s) => <StatCard key={s.label} s={s} />)}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Applications by Month</h3>
              <p className="text-xs text-muted-foreground">Your activity over the last 6 months</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.55_0.16_155)] font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> Live data
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={applicationsByMonth} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="apps" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold tracking-tight">Status Distribution</h3>
          <p className="text-xs text-muted-foreground">All applications</p>
          {statusDist.length === 0 ? (
            <EmptyMini label="No applications yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Resume Insights + Achievements + Smart insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResumeInsightsCard insights={resumeInsights} />
        <AchievementsCard badges={badges} />
        <SmartInsightsCard insights={smartInsights} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended jobs */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Recommended Jobs</h3>
              <p className="text-xs text-muted-foreground">Picked for you based on your profile</p>
            </div>
            <Link to="/jobs" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {jobsQ.loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : recommended.length === 0 ? (
            <EmptyState title="No new job recommendations" subtitle="Check back soon for fresh openings." />
          ) : (
            <div className="space-y-3">
              {recommended.map(({ job, match }) => {
                return (
                  <Link to="/jobs" key={job.id}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4 hover:border-primary/40 hover:bg-accent/20 transition">
                    <CompanyLogo name={job.company_name ?? "Co"} className="h-11 w-11" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{job.title}</p>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{job.company_name}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        {job.package_lpa && <span>₹{job.package_lpa} LPA</span>}
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">Match</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div className="h-full gradient-success" style={{ width: `${match}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">{match}%</span>
                      </div>
                    </div>
                    <span className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground opacity-0 group-hover:opacity-100 transition shadow-soft">
                      View
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile + resume */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold tracking-tight">Profile Completion</h3>
            <p className="text-xs text-muted-foreground">Complete to boost visibility</p>
            <div className="mt-5 flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="var(--muted)" strokeWidth="9" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke="url(#ring)" strokeWidth="9" fill="none"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - profileCompletion / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                  <defs>
                    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" />
                      <stop offset="100%" stopColor="var(--chart-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{profileCompletion}%</span>
                  <span className="text-[10px] text-muted-foreground">Complete</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {[
                ["Basic info", !!profile?.name],
                ["Phone", !!profile?.phone],
                ["Department", !!student?.department],
                ["CGPA", !!student?.cgpa],
                ["Skills", (student?.skills?.length ?? 0) > 0],
                ["Resume", !!student?.resume_url],
              ].map(([label, done]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  {done ? (
                    <span className="text-[oklch(0.55_0.16_155)]">✓ Done</span>
                  ) : (
                    <span className="text-[oklch(0.6_0.18_75)]">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link to="/profile" className="block rounded-2xl border border-dashed border-border bg-card p-6 shadow-soft text-center hover:border-primary/50 transition">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-accent shadow-soft">
              <Upload className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-3 font-semibold tracking-tight">{student?.resume_url ? "Update Resume" : "Upload Resume"}</h3>
            <p className="text-xs text-muted-foreground mt-1">{student?.resume_url ? "Replace your existing resume." : "PDF up to 5MB."}</p>
            <span className="mt-4 inline-block w-full rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft">
              Go to profile
            </span>
          </Link>
        </div>
      </div>

      {/* Recent applications + interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">Recent Applications</h3>
            <Link to="/applications" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {appsQ.loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : recentApplications.length === 0 ? (
            <EmptyState title="No applications yet" subtitle="Apply to a job to see it here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition">
                      <td className="py-3 font-medium">{a.company_name}</td>
                      <td className="py-3 text-muted-foreground">{a.job_title}</td>
                      <td className="py-3 text-muted-foreground">{formatShort(a.applied_at)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge(a.status)}`}>
                          {prettyStatus(a.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">Upcoming Interviews</h3>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          {ivsQ.loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : upcomingInterviewsList.length === 0 ? (
            <EmptyState title="No upcoming interviews" subtitle="You're all caught up." />
          ) : (
            <div className="space-y-3">
              {upcomingInterviewsList.map((i) => (
                <div key={i.id} className="rounded-xl border border-border bg-background/40 p-3 hover:border-primary/40 transition">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{i.company_name}</p>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">{i.mode}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.round_name ?? "Interview"} · {i.job_title}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium">
                    <Clock className="h-3 w-3" /> {formatShort(i.interview_date)} · {formatTime(i.interview_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
function EmptyMini({ label }: { label: string }) {
  return <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">{label}</div>;
}
function formatShort(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; }
}
function formatTime(d: string) {
  try { return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}
