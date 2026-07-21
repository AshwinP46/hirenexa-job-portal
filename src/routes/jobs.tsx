import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin, IndianRupee, Bookmark, BookmarkCheck, Filter, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AppShell, CompanyLogo } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchActiveJobs, fetchMyProfile, fetchMyApplications, applyToJob, fetchSavedJobIds, saveJob, unsaveJob, type JobWithRecruiter } from "@/lib/api";
import { computeMatch, isEligible } from "@/lib/match";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — HireNexa" },
      { name: "description", content: "Discover roles tailored to your skills. Filter, save, and apply in one click." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <JobsPage />
    </AuthGate>
  ),
});

function JobsPage() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";

  const prof = useAsync(() => uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null }), [uid]);
  const jobsQ = useAsync(() => fetchActiveJobs(), []);
  const appsQ = useAsync(() => uid ? fetchMyApplications(uid) : Promise.resolve([]), [uid]);
  const savedQ = useAsync(() => uid ? fetchSavedJobIds(uid) : Promise.resolve(new Set<string>()), [uid]);

  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("All");
  const [company, setCompany] = useState("All");
  const [minPkg, setMinPkg] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  const student = prof.data?.student;
  const profile = prof.data?.profile;
  const jobs = jobsQ.data ?? [];
  const appliedIds = new Set((appsQ.data ?? []).map((a) => a.job_id));
  const saved = savedQ.data ?? new Set<string>();

  const ALL_SKILLS = useMemo(() => Array.from(new Set(jobs.flatMap((j) => j.skills_required))).sort(), [jobs]);
  const ALL_COMPANIES = useMemo(() => Array.from(new Set(jobs.map((j) => j.company_name ?? ""))).filter(Boolean).sort(), [jobs]);
  const ALL_LOCATIONS = useMemo(() => Array.from(new Set(jobs.map((j) => j.location ?? ""))).filter(Boolean).sort(), [jobs]);

  const enriched = useMemo(() => jobs.map((j) => ({
    job: j,
    match: computeMatch({
      studentSkills: student?.skills ?? [],
      studentCgpa: student?.cgpa ?? null,
      studentDept: student?.department ?? null,
      jobSkills: j.skills_required,
      jobMinCgpa: j.minimum_cgpa,
      jobTitle: j.title,
    }),
    eligible: isEligible(student?.cgpa ?? null, j.minimum_cgpa),
  })), [jobs, student]);

  const filtered = enriched.filter(({ job }) => {
    if (q && !`${job.title} ${job.company_name}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (loc !== "All" && job.location !== loc) return false;
    if (company !== "All" && job.company_name !== company) return false;
    if ((job.package_lpa ?? 0) < minPkg) return false;
    if (skills.length && !skills.every((s) => job.skills_required.includes(s))) return false;
    return true;
  }).sort((a, b) => b.match - a.match);

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleSave = async (id: string) => {
    if (saved.has(id)) {
      const { error } = await unsaveJob(uid, id);
      if (error) toast.error(error.message); else { toast("Removed from saved"); savedQ.reload(); }
    } else {
      const { error } = await saveJob(uid, id);
      if (error) toast.error(error.message); else { toast.success("Saved for later"); savedQ.reload(); }
    }
  };

  const handleApply = async (j: JobWithRecruiter, match: number) => {
    if (!isEligible(student?.cgpa ?? null, j.minimum_cgpa)) {
      toast.error(`CGPA requirement not met (min ${j.minimum_cgpa})`);
      return;
    }
    if (appliedIds.has(j.id)) {
      toast.error("You've already applied to this job");
      return;
    }
    setApplying(j.id);
    const { error } = await applyToJob({ studentId: uid, jobId: j.id, matchScore: match });
    setApplying(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Applied to ${j.title} at ${j.company_name}`);
    appsQ.reload();
  };

  const fullName = profile?.name ?? "Student";
  const initials = fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const subtitle = [student?.department, student?.year_of_study && `Year ${student.year_of_study}`].filter(Boolean).join(" · ") || "Student";

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
    <AppShell sidebar={<StudentSidebar />} user={{ name: fullName, initials, role: subtitle, avatarUrl: profile?.avatar_url }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find your next role</h1>
          <p className="mt-1 text-sm opacity-90">{jobs.length} openings · {ALL_COMPANIES.length} companies hiring on campus</p>
          <div className="mt-5 flex items-center gap-2 max-w-2xl rounded-2xl bg-white/95 dark:bg-white/90 p-1.5 shadow-soft">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search role, company, skill..."
              className="flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Search</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-soft h-fit lg:sticky lg:top-20 space-y-5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold tracking-tight">Filters</h3>
          </div>

          <Field label="Location">
            <select value={loc} onChange={(e) => setLoc(e.target.value)} className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary">
              <option>All</option>
              {ALL_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="Company">
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary">
              <option>All</option>
              {ALL_COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label={`Min Package (${minPkg} LPA)`}>
            <input
              type="range" min="0" max="40" step="2"
              value={minPkg} onChange={(e) => setMinPkg(+e.target.value)}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0 LPA</span>
              <span>40 LPA</span>
            </div>
          </Field>

          {skills.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Selected Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <button key={s} onClick={() => toggleSkill(s)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-medium hover:bg-destructive/10 hover:text-destructive transition">
                    {s} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Popular Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SKILLS.slice(0, 15).map((s) => {
                const active = skills.includes(s);
                return (
                  <button key={s} onClick={() => toggleSkill(s)} className={`rounded-full px-2 py-0.5 text-[11px] font-medium border transition ${
                    active ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <b className="text-foreground">{filtered.length}</b> jobs found
            </p>
          </div>

          {jobsQ.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-sm font-semibold">No jobs match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try widening your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(({ job, match, eligible }, i) => {
                const isApplied = appliedIds.has(job.id);
                const isApplying = applying === job.id;
                return (
                  <article key={job.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className="group animate-count-up rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <CompanyLogo name={job.company_name ?? "Co"} className="h-12 w-12" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold tracking-tight">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">{job.company_name}</p>
                          </div>
                          <button onClick={() => toggleSave(job.id)} className="rounded-lg p-1.5 hover:bg-accent/30 transition" title={saved.has(job.id) ? "Saved" : "Save"}>
                            {saved.has(job.id)
                              ? <BookmarkCheck className="h-4 w-4 text-primary" />
                              : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                          {job.package_lpa && <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />{job.package_lpa} LPA</span>}
                          {job.minimum_cgpa && <span>Min CGPA {job.minimum_cgpa}</span>}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.skills_required.slice(0, 5).map((s) => (
                            <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          {eligible ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.95_0.05_155)] dark:bg-[oklch(0.3_0.08_155)] text-[oklch(0.4_0.15_155)] dark:text-[oklch(0.85_0.15_155)] px-2 py-0.5 text-[10px] font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.95_0.04_25)] dark:bg-[oklch(0.3_0.1_25)] text-[oklch(0.5_0.2_25)] dark:text-[oklch(0.85_0.15_25)] px-2 py-0.5 text-[10px] font-medium">
                              <AlertCircle className="h-3 w-3" /> Not Eligible
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full gradient-success" style={{ width: `${match}%` }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{match}%</span>
                          </div>
                          <button
                            onClick={() => handleApply(job, match)}
                            disabled={!eligible || isApplied || isApplying}
                            className="rounded-lg gradient-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1">
                            {isApplying && <Loader2 className="h-3 w-3 animate-spin" />}
                            {isApplied ? "Applied" : "Apply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {children}
    </div>
  );
}
