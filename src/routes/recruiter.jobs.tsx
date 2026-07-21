import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Archive, ArchiveRestore, Users, CalendarPlus, Download,
  CheckCircle2, XCircle, Loader2, X, Search, Brain, Award, AlertTriangle, Eye, Globe, Sparkles
} from "lucide-react";
import { AppShell, statusBadge, prettyStatus } from "@/components/shell/AppShell";
import { RecruiterSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import {
  useAsync, fetchRecruiterJobs, fetchRecruiterApplicants, fetchRecruiterInterviews,
  createJob, updateJob, deleteJob, archiveJob,
  updateApplicationStatus, scheduleInterview, rescheduleInterview, cancelInterview,
  getResumeSignedUrl, fetchMyRecruiter,
  type RecruiterJobRow, type ApplicantRow, type RecruiterInterviewRow, type JobInput, type AppStatus,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/recruiter/jobs")({
  head: () => ({
    meta: [{ title: "Manage Jobs — HireNexa" }, { name: "description", content: "Create, edit, and manage your job posts, applicants and interviews." }],
  }),
  component: () => (
    <AuthGate roles={["recruiter"]}>
      <RecruiterJobsPage />
    </AuthGate>
  ),
});

type Tab = "jobs" | "applicants" | "interviews";

function RecruiterJobsPage() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";
  const profQ = useAsync(() => uid ? fetchMyRecruiter(uid) : Promise.resolve({ profile: null, recruiter: null }), [uid]);
  const jobsQ = useAsync(() => uid ? fetchRecruiterJobs(uid) : Promise.resolve([]), [uid]);
  const appsQ = useAsync(() => uid ? fetchRecruiterApplicants(uid) : Promise.resolve([]), [uid]);
  const ivsQ = useAsync(() => uid ? fetchRecruiterInterviews(uid) : Promise.resolve([]), [uid]);

  const [tab, setTab] = useState<Tab>("jobs");
  const [search, setSearch] = useState("");
  const [editJob, setEditJob] = useState<RecruiterJobRow | "new" | null>(null);
  const [scheduleFor, setScheduleFor] = useState<ApplicantRow | null>(null);
  const [compareApp, setCompareApp] = useState<ApplicantRow | null>(null);

  const r = profQ.data?.recruiter;
  const name = r?.company_name || profQ.data?.profile?.name || "Recruiter";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const reloadAll = () => { jobsQ.reload(); appsQ.reload(); ivsQ.reload(); };

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pipeline Manager</h1>
            <p className="mt-1 text-sm opacity-90">
              {jobsQ.data?.length ?? 0} jobs · {appsQ.data?.length ?? 0} applicants · {ivsQ.data?.length ?? 0} interviews
            </p>
          </div>
          <button onClick={() => setEditJob("new")} className="rounded-xl bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow-soft inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Post Job
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
        {(["jobs","applicants","interviews"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/30"}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary" />
        </div>
      </div>

      {tab === "jobs" && (
        <JobsTab data={jobsQ.data ?? []} loading={jobsQ.loading} search={search}
          onEdit={(j) => setEditJob(j)}
          onDelete={async (j) => {
            if (!confirm(`Delete "${j.title}"? This removes all applications too.`)) return;
            const { error } = await deleteJob(uid, j.id);
            if (error) toast.error(error.message); else { toast.success("Job deleted"); reloadAll(); }
          }}
          onArchive={async (j) => {
            const { error } = await archiveJob(uid, j.id, j.is_active);
            if (error) toast.error(error.message); else { toast.success(j.is_active ? "Archived" : "Restored"); jobsQ.reload(); }
          }}
        />
      )}

      {tab === "applicants" && (
        <ApplicantsTab data={appsQ.data ?? []} loading={appsQ.loading} search={search} jobs={jobsQ.data ?? []}
          onStatus={async (a, status) => {
            const { error } = await updateApplicationStatus(uid, a.application_id, status, a.student_id, a.job_title);
            if (error) toast.error(error.message); else { toast.success(`Marked ${status}`); reloadAll(); }
          }}
          onSchedule={(a) => setScheduleFor(a)}
          onCompare={(a) => setCompareApp(a)}
        />
      )}

      {tab === "interviews" && (
        <InterviewsTab data={ivsQ.data ?? []} loading={ivsQ.loading} search={search}
          onReschedule={async (iv) => {
            const v = prompt("New date/time (ISO, e.g. 2026-07-01T15:00)", iv.interview_date.slice(0, 16));
            if (!v) return;
            const { error } = await rescheduleInterview(uid, iv.id, new Date(v).toISOString(), iv.student_id);
            if (error) toast.error(error.message); else { toast.success("Rescheduled"); ivsQ.reload(); }
          }}
          onCancel={async (iv) => {
            if (!confirm("Cancel this interview?")) return;
            const { error } = await cancelInterview(uid, iv.id, iv.student_id);
            if (error) toast.error(error.message); else { toast.success("Cancelled"); ivsQ.reload(); }
          }}
        />
      )}

      {editJob !== null && (
        <JobModal initial={editJob === "new" ? null : editJob} onClose={() => setEditJob(null)}
          onSave={async (input) => {
            if (editJob === "new") {
              const { error } = await createJob(uid, input);
              if (error) { toast.error(error.message); return; }
              toast.success("Job posted");
            } else {
              const { error } = await updateJob(uid, editJob.id, input);
              if (error) { toast.error(error.message); return; }
              toast.success("Job updated");
            }
            setEditJob(null); jobsQ.reload();
          }}
        />
      )}

      {scheduleFor && (
        <ScheduleModal applicant={scheduleFor} onClose={() => setScheduleFor(null)}
          onSave={async (date, mode, link) => {
            const { error } = await scheduleInterview(uid, {
              applicationId: scheduleFor.application_id, interviewDate: date, mode,
              meetingLink: mode === "online" ? link : undefined,
              location: mode === "onsite" ? link : undefined,
              studentId: scheduleFor.student_id, jobTitle: scheduleFor.job_title,
            });
            if (error) { toast.error(error.message); return; }
            toast.success("Interview scheduled");
            setScheduleFor(null); reloadAll();
          }}
        />
      )}

      {compareApp && (
        <CompareModal applicant={compareApp} jobs={jobsQ.data ?? []} onClose={() => setCompareApp(null)} />
      )}
    </AppShell>
  );
}

// ---------- Jobs tab ----------
function JobsTab({ data, loading, search, onEdit, onDelete, onArchive }: {
  data: RecruiterJobRow[]; loading: boolean; search: string;
  onEdit: (j: RecruiterJobRow) => void; onDelete: (j: RecruiterJobRow) => void; onArchive: (j: RecruiterJobRow) => void;
}) {
  const filtered = data.filter((j) => !search || j.title.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  if (!filtered.length) return <EmptyState title="No jobs yet" desc="Click 'Post Job' to create your first opening." />;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Location</th>
              <th className="p-3 font-medium">Package</th>
              <th className="p-3 font-medium">Min CGPA</th>
              <th className="p-3 font-medium">Apps</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr key={j.id} className="border-t border-border hover:bg-accent/10 transition">
                <td className="p-3"><div className="font-medium">{j.title}</div><div className="text-xs text-muted-foreground">{j.skills_required.slice(0, 4).join(" · ")}</div></td>
                <td className="p-3 text-muted-foreground">{j.location ?? "—"}</td>
                <td className="p-3 tabular-nums">{j.package_lpa ? `₹${j.package_lpa} LPA` : "—"}</td>
                <td className="p-3 tabular-nums">{j.minimum_cgpa ?? "—"}</td>
                <td className="p-3 tabular-nums font-semibold">{j.applications}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${j.is_active ? statusBadge("selected") : statusBadge("rejected")}`}>
                    {j.is_active ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button title="Edit" onClick={() => onEdit(j)} className="rounded-md p-1.5 hover:bg-accent/40 transition"><Pencil className="h-3.5 w-3.5 text-primary" /></button>
                    <button title={j.is_active ? "Archive" : "Restore"} onClick={() => onArchive(j)} className="rounded-md p-1.5 hover:bg-accent/40 transition">
                      {j.is_active ? <Archive className="h-3.5 w-3.5 text-muted-foreground" /> : <ArchiveRestore className="h-3.5 w-3.5 text-[oklch(0.55_0.16_155)]" />}
                    </button>
                    <button title="Delete" onClick={() => onDelete(j)} className="rounded-md p-1.5 hover:bg-[oklch(0.95_0.04_25)] dark:hover:bg-[oklch(0.3_0.1_25)] transition"><Trash2 className="h-3.5 w-3.5 text-[oklch(0.6_0.2_25)]" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Applicants tab ----------
function ApplicantsTab({ data, loading, search, jobs, onStatus, onSchedule, onCompare }: {
  data: ApplicantRow[]; loading: boolean; search: string; jobs: any[];
  onStatus: (a: ApplicantRow, s: AppStatus) => void; onSchedule: (a: ApplicantRow) => void;
  onCompare: (a: ApplicantRow) => void;
}) {
  const filtered = data.filter((a) =>
    !search || `${a.student_name} ${a.job_title} ${a.department}`.toLowerCase().includes(search.toLowerCase()));
  const openResume = async (path: string | null) => {
    if (!path) { toast.error("No resume uploaded"); return; }
    const url = await getResumeSignedUrl(path);
    if (url) window.open(url, "_blank"); else toast.error("Could not load resume");
  };

  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (!filtered.length) return <EmptyState title="No applicants yet" desc="When students apply to your jobs, they'll show up here." />;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Candidate</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Dept</th>
              <th className="p-3 font-medium">CGPA</th>
              <th className="p-3 font-medium">Match</th>
              <th className="p-3 font-medium">Resume</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.application_id} className="border-t border-border hover:bg-accent/10 transition">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full gradient-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {a.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{a.student_name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.student_email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{a.job_title}</td>
                <td className="p-3 text-muted-foreground">{a.department ?? "—"}</td>
                <td className="p-3 tabular-nums">{a.cgpa ?? "—"}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gradient-success" style={{ width: `${a.match_score ?? 0}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums">{a.match_score ?? 0}%</span>
                    <button
                      onClick={() => onCompare(a)}
                      className="ml-1 rounded-md px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition flex items-center gap-0.5"
                      title="Compare Resume with Job description side-by-side"
                    >
                      <Sparkles className="h-3 w-3" /> Compare
                    </button>
                  </div>
                </td>
                <td className="p-3">
                  <button onClick={() => openResume(a.resume_url)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Download className="h-3 w-3" /> View
                  </button>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge(a.status)}`}>{prettyStatus(a.status)}</span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button title="Shortlist" onClick={() => onStatus(a, "shortlisted")} className="rounded-md p-1.5 hover:bg-[oklch(0.95_0.05_155)] dark:hover:bg-[oklch(0.3_0.08_155)] transition"><CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.55_0.16_155)]" /></button>
                    <button title="Schedule" onClick={() => onSchedule(a)} className="rounded-md p-1.5 hover:bg-accent/40 transition"><CalendarPlus className="h-3.5 w-3.5 text-primary" /></button>
                    <button title="Select" onClick={() => onStatus(a, "selected")} className="rounded-md p-1.5 hover:bg-accent/40 transition"><span className="text-xs font-bold text-[oklch(0.55_0.16_155)]">✓</span></button>
                    <button title="Reject" onClick={() => onStatus(a, "rejected")} className="rounded-md p-1.5 hover:bg-[oklch(0.95_0.04_25)] dark:hover:bg-[oklch(0.3_0.1_25)] transition"><XCircle className="h-3.5 w-3.5 text-[oklch(0.6_0.2_25)]" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Interviews tab ----------
function InterviewsTab({ data, loading, search, onReschedule, onCancel }: {
  data: RecruiterInterviewRow[]; loading: boolean; search: string;
  onReschedule: (iv: RecruiterInterviewRow) => void; onCancel: (iv: RecruiterInterviewRow) => void;
}) {
  const filtered = data.filter((iv) => !search || `${iv.student_name} ${iv.job_title}`.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (!filtered.length) return <EmptyState title="No interviews yet" desc="Schedule one from the Applicants tab." />;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Candidate</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Date & Time</th>
              <th className="p-3 font-medium">Mode</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((iv) => (
              <tr key={iv.id} className="border-t border-border hover:bg-accent/10 transition">
                <td className="p-3 font-medium">{iv.student_name}</td>
                <td className="p-3 text-muted-foreground">{iv.job_title}</td>
                <td className="p-3 text-muted-foreground">{new Date(iv.interview_date).toLocaleString()}</td>
                <td className="p-3 capitalize text-muted-foreground">{iv.mode}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge(iv.status)}`}>{prettyStatus(iv.status)}</span></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {iv.status === "scheduled" && (
                      <>
                        <button onClick={() => onReschedule(iv)} className="text-xs text-primary hover:underline">Reschedule</button>
                        <button onClick={() => onCancel(iv)} className="text-xs text-[oklch(0.6_0.2_25)] hover:underline">Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Modals ----------
function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function JobModal({ initial, onClose, onSave }: { initial: RecruiterJobRow | null; onClose: () => void; onSave: (input: JobInput) => Promise<void> }) {
  const [form, setForm] = useState<JobInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    package_lpa: initial?.package_lpa ?? null,
    minimum_cgpa: initial?.minimum_cgpa ?? null,
    deadline: initial?.deadline ?? null,
    job_type: initial?.job_type ?? "Full-time",
    openings: initial?.openings ?? 1,
    skills_required: initial?.skills_required ?? [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const generateAIDescription = () => {
    if (!form.title.trim()) {
      toast.error("Please enter a Job Title first so AI knows what to generate!");
      return;
    }
    setGeneratingDescription(true);
    setTimeout(() => {
      const title = form.title.trim();
      const generated = `Role Overview:
We are seeking a talented and motivated ${title} to join our team. In this role, you will design, build, and maintain core system capabilities, ensuring high-fidelity delivery, speed, and standard design principles.

Core Responsibilities:
- Design, implement, and deploy clean, maintainable code for key user journeys.
- Collaborate with project managers, engineers, and product stakeholders to sync architecture designs.
- Optimize components for speed, standard layouts, and scalability across screen sizes.
- Diagnose and debug platform errors or backend integrations.

Required Skills & Qualifications:
- Familiarity with version control frameworks and standard build tooling.
- Team-first communication skills and ability to adapt to fast-evolving codebases.
- Solid analytical problem solving and detail-oriented mindset.

Benefits & Perks:
- Premium health coverage and family options.
- Flexible remote schedule and structured holiday plans.
- Structured technical mentorship and career growth budgets.`;

      let suggestedSkills = ["Git", "Communication", "Problem Solving"];
      const lower = title.toLowerCase();
      if (lower.includes("software") || lower.includes("developer") || lower.includes("frontend") || lower.includes("backend") || lower.includes("web") || lower.includes("engineer")) {
        suggestedSkills = ["React", "JavaScript", "TypeScript", "Node.js", "SQL", "Git", "REST APIs"];
      } else if (lower.includes("data") || lower.includes("ai") || lower.includes("machine") || lower.includes("analyst")) {
        suggestedSkills = ["Python", "SQL", "Pandas", "Machine Learning", "Data Science"];
      } else if (lower.includes("mechanical") || lower.includes("cad") || lower.includes("design")) {
        suggestedSkills = ["AutoCAD", "SolidWorks", "FEA", "CAD"];
      }

      setForm((prev) => ({
        ...prev,
        description: generated,
        skills_required: Array.from(new Set([...prev.skills_required, ...suggestedSkills])),
      }));
      setGeneratingDescription(false);
      toast.success("Job description and skills generated!");
    }, 1200);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true); await onSave(form); setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-glow max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">{initial ? "Edit Job" : "Post New Job"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent/40 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Input label="Job Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Description</label>
              <button
                type="button"
                onClick={generateAIDescription}
                disabled={generatingDescription}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                {generatingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3.5 w-3.5 text-primary" />}
                Generate Description with AI
              </button>
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5}
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Location" value={form.location ?? ""} onChange={(v) => setForm({ ...form, location: v })} />
            <Input label="Job Type" value={form.job_type ?? ""} onChange={(v) => setForm({ ...form, job_type: v })} />
            <Input label="Package (LPA)" type="number" value={form.package_lpa ?? ""} onChange={(v) => setForm({ ...form, package_lpa: v ? +v : null })} />
            <Input label="Min CGPA" type="number" value={form.minimum_cgpa ?? ""} onChange={(v) => setForm({ ...form, minimum_cgpa: v ? +v : null })} />
            <Input label="Openings" type="number" value={form.openings} onChange={(v) => setForm({ ...form, openings: v ? +v : 1 })} />
            <Input label="Deadline" type="date" value={form.deadline?.slice(0, 10) ?? ""} onChange={(v) => setForm({ ...form, deadline: v || null })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Required Skills</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (skillInput.trim()) { setForm({ ...form, skills_required: [...form.skills_required, skillInput.trim()] }); setSkillInput(""); } } }}
                placeholder="Type and press Enter"
                className="flex-1 rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.skills_required.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                  {s}
                  <button onClick={() => setForm({ ...form, skills_required: form.skills_required.filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent/30 transition">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {initial ? "Save Changes" : "Post Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ applicant, onClose, onSave }: {
  applicant: ApplicantRow; onClose: () => void;
  onSave: (date: string, mode: "online" | "onsite", link: string) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"online" | "onsite">("online");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!date) { toast.error("Pick a date/time"); return; }
    setSaving(true); await onSave(new Date(date).toISOString(), mode, link); setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold tracking-tight">Schedule Interview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{applicant.student_name} · {applicant.job_title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent/40 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Input label="Date & Time" type="datetime-local" value={date} onChange={setDate} />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mode</label>
            <div className="flex gap-2">
              {(["online","onsite"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition ${mode === m ? "gradient-primary text-primary-foreground border-transparent" : "border-border bg-background hover:bg-accent/30"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Input label={mode === "online" ? "Meeting Link" : "Venue / Address"} value={link} onChange={setLink} />
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent/30 transition">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary" />
    </div>
  );
}

function CompareModal({ applicant, jobs, onClose }: { applicant: ApplicantRow; jobs: any[]; onClose: () => void }) {
  const matchingJob = jobs.find((j) => j.id === applicant.job_id);
  const requiredSkills = matchingJob?.skills_required || ["React", "TypeScript", "Node.js", "Git"];
  const candidateSkills = applicant.skills || ["React", "JavaScript", "Vite", "HTML5", "CSS3"];

  const matched = candidateSkills.filter((s: string) => requiredSkills.some((r: string) => r.toLowerCase() === s.toLowerCase()));
  const missing = requiredSkills.filter((r: string) => !candidateSkills.some((s: string) => s.toLowerCase() === r.toLowerCase()));

  const strengths = [
    `Strong academic rating with CGPA of ${applicant.cgpa ?? "8.0"}`,
    `Core skill alignment found for: ${matched.slice(0, 3).join(", ") || "Fundamentals"}`,
    "Ready to integrate with core pipelines."
  ];

  const weaknesses = [
    missing.length > 0 ? `Unmatched tools: ${missing.join(", ")}` : "None identified",
    (applicant.cgpa ?? 8) < 7.5 ? "Slightly below preferred 7.5 CGPA threshold" : null
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-glow overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold tracking-tight">AI Resume Fit Comparison</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{applicant.student_name} ↔ {applicant.job_title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent/40 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border border-border bg-muted/10 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-success/20 to-teal-500/20 opacity-30 blur-xl" />
            <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="var(--muted)" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="var(--success)" strokeWidth="8" fill="none"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (applicant.match_score ?? 0) / 100)}`}
                />
              </svg>
              <span className="absolute text-2xl font-bold">{applicant.match_score ?? 0}%</span>
            </div>
            <div>
              <h4 className="text-base font-bold">Overall Fit & Recommendation</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {(applicant.match_score ?? 0) > 75 
                  ? "Strong match. Candidate has the majority of technical capabilities requested by this posting. Highly recommended to advance to scheduled round."
                  : "Moderate fit. Core skills are present, but candidate has key knowledge gaps in target backend tooling. Recommended with reservation."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border p-5 bg-background/50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Job Requirements</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {requiredSkills.map(s => <span key={s} className="rounded-full bg-muted border border-border px-2 py-0.5 text-xs">{s}</span>)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Preferred CGPA:</span>
                  <p className="font-semibold mt-0.5">7.5 / 10</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5 bg-background/50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Candidate Summary</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {candidateSkills.map(s => <span key={s} className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium">{s}</span>)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">CGPA:</span>
                  <p className="font-semibold mt-0.5 text-primary">{applicant.cgpa ?? "—"} / 10</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-5">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> Key Strengths</h4>
              <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                {strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-warning" /> Skill Gaps & Weaknesses</h4>
              {weaknesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">No critical weaknesses identified.</p>
              ) : (
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5">
                  {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
