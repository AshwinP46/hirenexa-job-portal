import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Users, CalendarCheck, Trophy, Plus, ChevronRight, TrendingUp, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { AppShell, StatCard } from "@/components/shell/AppShell";
import { RecruiterSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchRecruiterDashboard, fetchMyRecruiter } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartInsightsCard } from "@/components/insights/SmartInsightsCard";
import { trendLabel } from "@/lib/insights";

export const Route = createFileRoute("/recruiter/")({
  head: () => ({
    meta: [
      { title: "Recruiter Dashboard — HireNexa" },
      { name: "description", content: "Manage job posts, applicants, and your hiring funnel in one premium console." },
    ],
  }),
  component: () => (
    <AuthGate roles={["recruiter"]}>
      <RecruiterDashboard />
    </AuthGate>
  ),
});

function RecruiterDashboard() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";
  const profQ = useAsync(() => uid ? fetchMyRecruiter(uid) : Promise.resolve({ profile: null, recruiter: null }), [uid]);
  const dashQ = useAsync(() => uid ? fetchRecruiterDashboard(uid) : Promise.resolve(null), [uid]);

  const d = dashQ.data;
  const r = profQ.data?.recruiter;
  const name = r?.company_name || profQ.data?.profile?.name || "Recruiter";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const t = d?.trends;
  const stats = [
    { label: "Active Jobs", value: d?.activeJobs ?? 0, change: t ? trendLabel(t.cur.jobs, t.prev.jobs) : "currently live", icon: Briefcase, gradient: "gradient-primary" },
    { label: "Applications", value: d?.applicationsReceived ?? 0, change: t ? trendLabel(t.cur.apps, t.prev.apps) : "all-time", icon: Users, gradient: "gradient-accent" },
    { label: "Interviews", value: d?.interviewsScheduled ?? 0, change: t ? trendLabel(t.cur.ivs, t.prev.ivs) : "scheduled", icon: CalendarCheck, gradient: "gradient-warm" },
    { label: "Selected", value: d?.selectedCount ?? 0, change: t ? trendLabel(t.cur.sel, t.prev.sel) : "offers extended", icon: Trophy, gradient: "gradient-success" },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell sidebar={<RecruiterSidebar />} user={{ name, initials, role: "Talent Lead" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Recruiter Overview</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Hire smarter, faster.</h1>
            <p className="mt-1 text-sm opacity-90 max-w-xl">
              {d ? <>{d.interviewsScheduled} interviews scheduled · {d.selectedCount} offers extended.</> : "Loading your pipeline…"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/recruiter/jobs" className="rounded-xl bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow-soft inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Post Job
            </Link>
            <Link to="/recruiter/jobs" className="rounded-xl bg-white/15 backdrop-blur px-4 py-2 text-sm font-medium hover:bg-white/25 transition">
              View Pipeline
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {dashQ.loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : stats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Applications Trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.55_0.16_155)] font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d?.trend ?? []} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="apps" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4, fill: "var(--chart-1)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold tracking-tight">Hiring Funnel</h3>
          <p className="text-xs text-muted-foreground">Conversion across stages</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d?.funnel ?? []} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} width={85} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {d?.smartInsights && d.smartInsights.length > 0 && (
        <SmartInsightsCard insights={d.smartInsights} />
      )}



      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold tracking-tight">Top Performing Job Posts</h3>
            <p className="text-xs text-muted-foreground">By application count</p>
          </div>
          <Link to="/recruiter/jobs" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
            Manage all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {dashQ.loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : (d?.topJobs?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-semibold">No jobs yet</p>
            <p className="text-xs text-muted-foreground mt-1">Post your first opening to start receiving applications.</p>
            <Link to="/recruiter/jobs" className="inline-flex mt-4 rounded-xl gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
              Create Job Post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {d!.topJobs.map((j, i) => {
              const max = Math.max(1, ...d!.topJobs.map((x) => x.apps));
              return (
                <div key={j.title + i} className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4 hover:border-primary/40 transition">
                  <div className="text-2xl font-bold text-muted-foreground/40 tabular-nums w-8">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{j.apps} applications · {j.selected} selected</p>
                  </div>
                  <div className="w-32">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-primary" style={{ width: `${(j.apps / max) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{j.apps}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
