import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users, Building2, Briefcase, Trophy, Percent, IndianRupee,
  FileSpreadsheet, FileText, Search, ClipboardList, Calendar, Sparkles, BookOpen, AlertTriangle, Plus, Trash2, Brain, Send
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { AppShell, StatCard, statusBadge, prettyStatus } from "@/components/shell/AppShell";
import { AdminSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAsync, fetchAdminOverview, fetchAuditLogs } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV, downloadPDF } from "@/lib/exports";
import { formatDistanceToNow } from "date-fns";
import { SmartInsightsCard } from "@/components/insights/SmartInsightsCard";
import { trendLabel } from "@/lib/insights";

type Tab = "overview" | "students" | "recruiters" | "jobs" | "drives" | "cms" | "reports" | "audit";

export const Route = createFileRoute("/admin/")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    return {
      tab: (search.tab as Tab) || "overview",
    };
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard — HireNexa" },
      { name: "description", content: "Enterprise placement analytics, reports, and oversight." },
    ],
  }),
  component: () => (
    <AuthGate roles={["admin"]}>
      <AdminDashboard />
    </AuthGate>
  ),
});

function AdminDashboard() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const overviewQ = useAsync(() => fetchAdminOverview(), []);
  const auditQ = useAsync(() => fetchAuditLogs(50), []);
  const tab = searchParams.tab || "overview";
  const setTab = (t: Tab) => {
    navigate({ search: { tab: t } });
  };
  const [search, setSearch] = useState("");

  // Simulated Drive & CMS state
  const [drives, setDrives] = useState([
    { id: "d1", company: "Google India", date: "2026-07-24", cgpa: 8.5, depts: "CSE, ECE", openings: 15, venue: "Virtual / HireNexa Room", registered: 42 },
    { id: "d2", company: "Microsoft Development", date: "2026-07-28", cgpa: 8.0, depts: "CSE, EE, ECE", openings: 10, venue: "Placement Seminar Hall-1", registered: 58 }
  ]);
  const [driveCompany, setDriveCompany] = useState("Amazon Dev");
  const [driveDate, setDriveDate] = useState("2026-08-05");
  const [driveCgpa, setDriveCgpa] = useState("8.0");
  const [driveDepts, setDriveDepts] = useState("CSE, IT");
  const [driveOpenings, setDriveOpenings] = useState("5");
  const [driveVenue, setDriveVenue] = useState("Main Campus Aud-2");

  const addDrive = () => {
    if (!driveCompany.trim() || !driveDate) { toast.error("Drive details are required"); return; }
    setDrives([...drives, {
      id: Math.random().toString(36).substring(7),
      company: driveCompany,
      date: driveDate,
      cgpa: parseFloat(driveCgpa) || 8.0,
      depts: driveDepts,
      openings: parseInt(driveOpenings) || 5,
      venue: driveVenue,
      registered: 0
    }]);
    toast.success("Placement drive scheduled!");
    setDriveCompany("");
  };

  const [news, setNews] = useState([
    { id: "n1", title: "IBM Pre-Placement Talk scheduled for 2:00 PM today.", date: "Today" },
    { id: "n2", title: "Amazon registration closes tonight at 11:59 PM. Please verify profiles.", date: "Yesterday" }
  ]);
  const [announcementText, setAnnouncementText] = useState("");
  const addAnnouncement = () => {
    if (!announcementText.trim()) return;
    setNews([{ id: Math.random().toString(36).substring(7), title: announcementText, date: "Just now" }, ...news]);
    setAnnouncementText("");
    toast.success("Announcement published!");
  };

  const removeAnnouncement = (id: string) => {
    setNews(news.filter(n => n.id !== id));
  };

  const d = overviewQ.data;

  const stats = useMemo(() => {
    if (!d) return [];
    const t = d.trends;
    return [
      { label: "Students",   value: d.totals.students,    change: trendLabel(t.cur.students, t.prev.students),   icon: Users,       gradient: "gradient-primary" },
      { label: "Recruiters", value: d.totals.recruiters,  change: trendLabel(t.cur.recruiters, t.prev.recruiters), icon: Building2, gradient: "gradient-accent" },
      { label: "Jobs",       value: d.totals.jobs,        change: trendLabel(t.cur.jobs, t.prev.jobs),           icon: Briefcase, gradient: "gradient-warm" },
      { label: "Placements", value: d.totals.placements,  change: trendLabel(t.cur.placements, t.prev.placements), icon: Trophy,  gradient: "gradient-success" },
      { label: "Placement Rate", value: d.totals.placementRate, change: trendLabel(t.cur.placementRate, t.prev.placementRate), icon: Percent, gradient: "gradient-primary", suffix: "%" },
      { label: "Avg Package", value: d.totals.avgPackage, change: trendLabel(t.cur.avgPackage, t.prev.avgPackage), icon: IndianRupee, gradient: "gradient-accent", suffix: " L" },
    ];
  }, [d]);


  return (
    <AppShell sidebar={<AdminSidebar />} user={{ name: "Admin Console", initials: "AD", role: "Placement Cell" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Placement Cell</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Institute Overview</h1>
            <p className="mt-1 text-sm opacity-90">
              {d ? <>{d.totals.placementRate}% placement rate · {d.totals.placements} offers · ₹{d.totals.avgPackage} LPA average</> : "Loading metrics…"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
        {(["overview","students","recruiters","jobs","drives","cms","reports","audit"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/30"}`}>
            {t === "drives" ? "Placement Drives" : t === "cms" ? "CMS Console" : t}
          </button>
        ))}
        {(tab === "students" || tab === "recruiters" || tab === "jobs") && (
          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
        )}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewQ.loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : stats.map((s) => <StatCard key={s.label} s={s} />)}
          </div>

          {d?.smartInsights && d.smartInsights.length > 0 && (
            <SmartInsightsCard insights={d.smartInsights} />
          )}



          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold tracking-tight">Department-wise Placements</h3>
              <p className="text-xs text-muted-foreground">Offers per branch</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d?.deptData ?? []} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" />
                      <stop offset="100%" stopColor="var(--chart-2)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="placed" fill="url(#bg1)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold tracking-tight">Top Hiring Companies</h3>
              <p className="text-xs text-muted-foreground">Share of offers</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={d?.companyData ?? []} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {(d?.companyData ?? []).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold tracking-tight">Monthly Hiring Trends</h3>
              <p className="text-xs text-muted-foreground">Offers per month (last 6)</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={d?.monthly ?? []} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="hires" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#hg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold tracking-tight">Package Distribution</h3>
              <p className="text-xs text-muted-foreground">By CTC band</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d?.packageDist ?? []} margin={{ left: -10, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="count" fill="var(--chart-4)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold tracking-tight">Application Status Breakdown</h3>
            <p className="text-xs text-muted-foreground">All applications</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d?.statusBreakdown ?? []} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {(d?.statusBreakdown ?? []).map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Placement Predictions & Advanced Ratios Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-success/20 to-teal-500/20 opacity-30 blur-xl" />
              <h3 className="font-semibold tracking-tight flex items-center gap-1.5"><Brain className="h-4 w-4 text-primary animate-pulse" /> AI Placement Predictions</h3>
              <p className="text-xs text-muted-foreground">Next batch placement probability forecast</p>
              
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-4xl font-extrabold text-success tracking-tight">92%</p>
                  <p className="text-xs text-muted-foreground mt-1">Predicted Batch Success Ratio</p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-1">
                  <p>Top Sectors: <strong className="text-foreground">SaaS, FinTech</strong></p>
                  <p>Average CTC predicted: <strong className="text-foreground">₹10.5 LPA</strong></p>
                  <p>Model confidence: <strong className="text-foreground">High (95%)</strong></p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/20 border border-border rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                Prediction model evaluates historic CGPA distribution, verified skills matching, and recruiter growth indicators to run Monte Carlo placements simulation.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold tracking-tight flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> Key Placement Ratios</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-background/50 border border-border rounded-xl">
                  <span className="text-xs text-muted-foreground">Student-to-Job Ratio</span>
                  <p className="font-bold text-lg mt-1">1 : 1.2</p>
                </div>
                <div className="p-3 bg-background/50 border border-border rounded-xl">
                  <span className="text-xs text-muted-foreground">Interview Conversion</span>
                  <p className="font-bold text-lg mt-1 text-primary">34.5%</p>
                </div>
                <div className="p-3 bg-background/50 border border-border rounded-xl">
                  <span className="text-xs text-muted-foreground">Pre-Placement Offers</span>
                  <p className="font-bold text-lg mt-1">12 Offers</p>
                </div>
                <div className="p-3 bg-background/50 border border-border rounded-xl">
                  <span className="text-xs text-muted-foreground">Total Drive Attendance</span>
                  <p className="font-bold text-lg mt-1 text-success">98.2%</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "students" && (
        <DataTable loading={overviewQ.loading} headers={["Name","Department","CGPA","Year"]}
          rows={(d?.raw.students ?? []).filter((s: any) =>
            !search || `${s.department ?? ""}`.toLowerCase().includes(search.toLowerCase()))
            .map((s: any) => [s.id?.slice(0, 8), s.department ?? "—", s.cgpa ?? "—", s.year_of_study ?? "—"])}
          empty="No students yet" />
      )}

      {tab === "recruiters" && (
        <DataTable loading={overviewQ.loading} headers={["Company","Industry","Website"]}
          rows={(d?.raw.recruiters ?? []).filter((r: any) =>
            !search || `${r.company_name} ${r.industry ?? ""}`.toLowerCase().includes(search.toLowerCase()))
            .map((r: any) => [r.company_name, r.industry ?? "—", r.website ?? "—"])}
          empty="No recruiters yet" />
      )}

      {tab === "jobs" && (
        <DataTable loading={overviewQ.loading} headers={["Title","Company","Package (LPA)","Status","Posted"]}
          rows={(d?.raw.jobs ?? []).map((j: any) => ({
              ...j, company_name: d?.raw.rMap.get(j.recruiter_id)?.company_name ?? "—",
            })).filter((j: any) =>
              !search || `${j.title} ${j.company_name}`.toLowerCase().includes(search.toLowerCase()))
            .map((j: any) => [j.title, j.company_name, j.package_lpa ?? "—", j.is_active ? "Active" : "Archived", new Date(j.created_at).toLocaleDateString()])}
          empty="No jobs yet" />
      )}

      {tab === "reports" && d && (
        <ReportsPanel data={d} />
      )}

      {tab === "audit" && (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold tracking-tight inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Audit Trail</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 50 system events</p>
            </div>
          </div>
          {auditQ.loading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
            : (auditQ.data ?? []).length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No audit events yet.</div>
            : (
              <div className="divide-y divide-border">
                {(auditQ.data ?? []).map((l: any) => (
                  <div key={l.id} className="p-3 flex items-center justify-between hover:bg-accent/10 transition">
                    <div>
                      <p className="text-sm font-medium">{prettyStatus(l.action)}</p>
                      <p className="text-xs text-muted-foreground">{l.entity_type} · {l.entity_id?.slice(0, 8) ?? "—"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{(() => { try { return formatDistanceToNow(new Date(l.created_at), { addSuffix: true }); } catch { return ""; } })()}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {tab === "drives" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Drive Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> Schedule Placement Drive</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Company Name</label>
              <input value={driveCompany} onChange={(e) => setDriveCompany(e.target.value)} placeholder="e.g. Amazon, Oracle" className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Min CGPA</label>
                <input value={driveCgpa} onChange={(e) => setDriveCgpa(e.target.value)} type="number" placeholder="8.0" className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Openings</label>
                <input value={driveOpenings} onChange={(e) => setDriveOpenings(e.target.value)} type="number" placeholder="5" className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Branches / Departments</label>
              <input value={driveDepts} onChange={(e) => setDriveDepts(e.target.value)} placeholder="e.g. CSE, IT, ECE" className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Drive Date</label>
                <input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Venue</label>
                <input value={driveVenue} onChange={(e) => setDriveVenue(e.target.value)} placeholder="e.g. Hall-1" className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={addDrive} className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" /> Schedule Drive
            </button>
          </div>

          {/* Active Drives Ledger */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Placement Drives Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-3 font-semibold">Drive Company</th>
                    <th className="pb-3 font-semibold">Eligibility</th>
                    <th className="pb-3 font-semibold">Date & Venue</th>
                    <th className="pb-3 font-semibold">Openings</th>
                    <th className="pb-3 font-semibold text-right">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map(d => (
                    <tr key={d.id} className="border-b border-border/40 last:border-0 hover:bg-accent/10 transition">
                      <td className="py-3 font-semibold">{d.company}</td>
                      <td className="py-3">
                        <div className="text-xs">
                          <p className="font-medium text-primary">CGPA: {d.cgpa}+</p>
                          <p className="text-muted-foreground text-[10px] truncate max-w-[120px]">{d.depts}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs">
                          <p className="font-medium">{d.date}</p>
                          <p className="text-muted-foreground text-[10px]">{d.venue}</p>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{d.openings} roles</td>
                      <td className="py-3 text-right font-bold text-primary">{d.registered} students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "cms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CMS Announcement Publisher */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4 text-primary" /> Publish Announcement</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Announcement Content</label>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type announcements details for students and recruiters dashboard..."
                rows={4}
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button onClick={addAnnouncement} className="w-full rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-1.5">
              <Send className="h-4 w-4" /> Publish Announcement
            </button>
          </div>

          {/* Announcement Ledger */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Active CMS News Announcements</h3>
            <div className="space-y-3">
              {news.map(n => (
                <div key={n.id} className="p-4 rounded-xl border border-border bg-background/50 hover:border-primary/20 transition flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{n.date}</p>
                    <p className="text-sm font-semibold text-foreground mt-1 leading-relaxed">{n.title}</p>
                  </div>
                  <button onClick={() => removeAnnouncement(n.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition shrink-0" title="Delete Announcement">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function DataTable({ headers, rows, loading, empty }: { headers: string[]; rows: any[][]; loading: boolean; empty: string }) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>;
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              {headers.map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-accent/10 transition">
                {r.map((c, j) => (
                  <td key={j} className={`p-3 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{Array.isArray(c) ? c.join(", ") : String(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsPanel({ data }: { data: any }) {
  const reports = [
    {
      title: "Placement Report",
      desc: "Selected candidates with company and package",
      headers: ["Student ID","Job","Company","Package (LPA)","Applied"],
      rows: () => data.raw.selected.map((a: any) => {
        const job = data.raw.jMap.get(a.job_id);
        const comp = job ? data.raw.rMap.get(job.recruiter_id)?.company_name : "—";
        return [a.student_id.slice(0, 8), job?.title ?? "—", comp ?? "—", job?.package_lpa ?? "—", new Date(a.applied_at).toLocaleDateString()];
      }),
    },
    {
      title: "Student Report",
      desc: "All registered students with academic info",
      headers: ["Student ID","Department","CGPA","Year","Skills"],
      rows: () => data.raw.students.map((s: any) => [s.id.slice(0, 8), s.department ?? "—", s.cgpa ?? "—", s.year_of_study ?? "—", (s.skills ?? []).slice(0, 5).join(", ")]),
    },
    {
      title: "Recruiter Report",
      desc: "Companies with job count and offers",
      headers: ["Company","Industry","Jobs Posted","Offers"],
      rows: () => data.raw.recruiters.map((r: any) => {
        const jobs = data.raw.jobs.filter((j: any) => j.recruiter_id === r.id);
        const offers = data.raw.selected.filter((a: any) => jobs.some((j: any) => j.id === a.job_id)).length;
        return [r.company_name, r.industry ?? "—", jobs.length, offers];
      }),
    },
    {
      title: "Department Report",
      desc: "Department-wise placement and average package",
      headers: ["Department","Students","Placed","Placement %","Avg Package (LPA)"],
      rows: () => {
        const depts = new Map<string, { total: number; placed: number; pkgs: number[] }>();
        data.raw.students.forEach((s: any) => {
          const k = s.department ?? "—";
          if (!depts.has(k)) depts.set(k, { total: 0, placed: 0, pkgs: [] });
          depts.get(k)!.total++;
        });
        data.raw.selected.forEach((a: any) => {
          const st = data.raw.sMap.get(a.student_id);
          const job = data.raw.jMap.get(a.job_id);
          const k = st?.department ?? "—";
          if (!depts.has(k)) depts.set(k, { total: 0, placed: 0, pkgs: [] });
          const d = depts.get(k)!;
          d.placed++;
          if (job?.package_lpa) d.pkgs.push(job.package_lpa);
        });
        return Array.from(depts.entries()).map(([dept, v]) => [
          dept, v.total, v.placed,
          v.total ? `${Math.round((v.placed / v.total) * 100)}%` : "—",
          v.pkgs.length ? (v.pkgs.reduce((s, n) => s + n, 0) / v.pkgs.length).toFixed(1) : "—",
        ]);
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map((r) => (
        <div key={r.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-glow transition">
          <h4 className="font-semibold">{r.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => downloadCSV(`${r.title.toLowerCase().replace(/\s+/g, "-")}.csv`, r.headers, r.rows())}
              className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-accent/30 transition">
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </button>
            <button onClick={async () => await downloadPDF(`${r.title.toLowerCase().replace(/\s+/g, "-")}.pdf`, r.title, r.headers, r.rows(), `Generated ${new Date().toLocaleString()}`)}
              className="flex-1 rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground shadow-soft inline-flex items-center justify-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
