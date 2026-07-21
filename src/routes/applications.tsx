import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, Eye, CheckCircle2, CalendarCheck, Trophy, XCircle, Filter, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { getLogoBase64 } from "@/lib/exports";
import { AppShell, statusBadge, prettyStatus, CompanyLogo } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyApplications, fetchMyProfile } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My Applications — HireNexa" },
      { name: "description", content: "Track every job application across stages in a beautiful timeline." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <ApplicationsPage />
    </AuthGate>
  ),
});

type Status = "applied" | "shortlisted" | "interview_scheduled" | "selected" | "rejected";

const STATUSES: { key: Status; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string }[] = [
  { key: "applied",             label: "Applied",       icon: Send,          gradient: "gradient-primary" },
  { key: "shortlisted",         label: "Shortlisted",   icon: CheckCircle2,  gradient: "gradient-accent" },
  { key: "interview_scheduled", label: "Interviews",    icon: CalendarCheck, gradient: "gradient-warm" },
  { key: "selected",            label: "Selected",      icon: Trophy,        gradient: "gradient-success" },
  { key: "rejected",            label: "Rejected",      icon: XCircle,       gradient: "gradient-accent" },
];

function ApplicationsPage() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";
  const prof = useAsync(() => uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null }), [uid]);
  const appsQ = useAsync(() => uid ? fetchMyApplications(uid) : Promise.resolve([]), [uid]);

  const [filter, setFilter] = useState<"All" | Status>("All");

  const apps = appsQ.data ?? [];

  const handleDownloadOfferLetter = async (company: string, role: string, packageLpa: number | null) => {
    toast.info("Generating offer letter PDF...");
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // 1. Draw top brand banner (Blue strip)
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, w, 8, "F");

    // 2. Draw modern center header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // Slate 900
    doc.text("LETTER OF PLACEMENT APPOINTMENT", w / 2, 28, { align: "center" });
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 34, w - 20, 34);

    // 3. Body text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81); // Slate 700
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 46);
    
    doc.setFont("helvetica", "bold");
    doc.text(`To: Ashwin Kumar`, 20, 54);
    doc.setFont("helvetica", "normal");
    doc.text(`Email: ashwinlokesh750@gmail.com`, 20, 60);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(`Subject: Job Offer Letter for the position of ${role}`, 20, 74);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.text(`Dear Ashwin Kumar,`, 20, 86);
    doc.text(`We are pleased to offer you employment at ${company} under the following terms:`, 20, 94, { maxWidth: 170 });

    // 4. Draw modern structured key-value box instead of bullet list
    doc.setFillColor(249, 250, 251); // Slate 50 background
    doc.setDrawColor(229, 231, 235);
    doc.rect(20, 108, w - 40, 36, "FD"); // Background + Border

    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("Employment Terms & Details", 24, 115);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Position Offered:", 24, 123);
    doc.text("Offered Salary Package:", 24, 131);
    doc.text("Commencement Date:", 24, 139);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text(role, 70, 123);
    doc.text(`INR ${packageLpa ?? "12"} LPA`, 70, 131);
    doc.text("August 1, 2026", 70, 139);

    // 5. Closing
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.text("Please review, sign, and accept the offer checklist within your student portal dashboard to complete the registration details.", 20, 160, { maxWidth: 170 });
    doc.text(`We look forward to welcoming you onboard at ${company}.`, 20, 172);

    doc.text(`For ${company}`, 20, 196);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Recruiting Officer", 20, 204);

    // Fetch logo image
    const logoImg = await getLogoBase64();

    // Post-processing header and footer for all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Top Center logo placement
      if (logoImg) {
        doc.addImage(logoImg, "PNG", (w / 2) - 5, 10, 10, 10);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.text("HIRENEXA", w / 2, 18, { align: "center" });
      }
      
      // Tiny header accent line
      doc.setDrawColor(243, 244, 246);
      doc.line(14, 22, w - 14, 22);
      
      // Footer line separator
      doc.setDrawColor(229, 231, 235);
      doc.line(14, h - 14, w - 14, h - 14);
      
      // Footer: Page i of pageCount & Ashwin P
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Developed and Maintained by Ashwin P", 14, h - 8);
      doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 8, { align: "right" });
    }

    doc.save(`Offer_${company}_Ashwin.pdf`);
    toast.success("Offer Letter PDF saved!");
  };

  const handleOfferAction = (appId: string, action: "Accepted" | "Rejected") => {
    toast.success(`You have successfully ${action.toLowerCase()} the offer!`);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    STATUSES.forEach((s) => (c[s.key] = apps.filter((a) => a.status === s.key).length));
    return c;
  }, [apps]);
  const filtered = filter === "All" ? apps : apps.filter((a) => a.status === filter);
  const sorted = [...filtered].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const student = prof.data?.student;
  const profile = prof.data?.profile;
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="mt-1 text-sm opacity-90">{apps.length} total · {counts["selected"] ?? 0} offers · {counts["interview_scheduled"] ?? 0} interviews in progress</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUSES.map((s) => {
          const I = s.icon;
          const active = filter === s.key;
          return (
            <button key={s.key}
              onClick={() => setFilter(active ? "All" : s.key)}
              className={`group relative overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow ${
                active ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}>
              <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${s.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`} />
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.gradient} shadow-soft`}>
                <I className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums">{counts[s.key] ?? 0}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Showing</span>
        <span className="rounded-full bg-card border border-border px-2.5 py-1 font-medium capitalize">
          {filter === "All" ? "All" : prettyStatus(filter)} ({sorted.length})
        </span>
        {filter !== "All" && (
          <button onClick={() => setFilter("All")} className="text-primary hover:underline">Clear</button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft">
        <h3 className="font-semibold tracking-tight mb-6">Activity Timeline</h3>
        {appsQ.loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="relative pl-6 md:pl-8">
            <div className="absolute left-2 md:left-3 top-0 bottom-0 w-px bg-gradient-to-b from-border via-primary/30 to-border" />
            <div className="space-y-5">
              {sorted.map((a, i) => {
                const stage = STATUSES.find((s) => s.key === a.status) ?? STATUSES[0];
                const Icon = stage.icon;
                return (
                  <div key={a.id} className="relative animate-count-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className={`absolute -left-6 md:-left-8 top-3 flex h-5 w-5 items-center justify-center rounded-full ${stage.gradient} ring-4 ring-card shadow-soft`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    <div className="rounded-xl border border-border bg-background/40 p-4 hover:border-primary/40 hover:bg-accent/20 transition">
                      <div className="flex items-center gap-4">
                        <CompanyLogo name={a.company_name ?? "Co"} className="h-11 w-11" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{a.job_title}</p>
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{a.company_name}</span>
                            {a.job_package && <span className="text-xs text-muted-foreground">· ₹{a.job_package} LPA</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Applied {formatShort(a.applied_at)} · Updated {formatShort(a.updated_at)}
                          </p>
                        </div>
                        <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge(a.status)}`}>
                          <Icon className="h-3 w-3" /> {prettyStatus(a.status)}
                        </span>
                        <button className="rounded-lg border border-border p-1.5 hover:bg-accent/30 transition" title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* AI Offer Acceptance Box */}
                      {a.status === "selected" && (
                        <div className="mt-4 border-t border-border pt-4 space-y-3">
                          <div className="rounded-xl bg-success/10 border border-success/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-success flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-success" /> Offer Letter Issued!
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Congratulations Ashwin! {a.company_name} has selected you for the role of {a.job_title} with a CTC of ₹{a.job_package ?? "12"} LPA.
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleDownloadOfferLetter(a.company_name ?? "Company", a.job_title, a.job_package)}
                                className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent/30 transition inline-flex items-center gap-1 text-foreground"
                              >
                                <Download className="h-3.5 w-3.5" /> Offer PDF
                              </button>
                              <button
                                onClick={() => handleOfferAction(a.id, "Accepted")}
                                className="rounded-lg bg-success text-success-foreground px-3 py-1.5 text-xs font-bold shadow-soft hover:opacity-90 transition"
                              >
                                Accept Offer
                              </button>
                              <button
                                onClick={() => handleOfferAction(a.id, "Rejected")}
                                className="rounded-lg bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 text-xs font-semibold hover:bg-destructive/20 transition"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {sorted.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <p className="text-sm font-semibold">{filter === "All" ? "No applications yet" : "No applications in this stage"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{filter === "All" ? "Browse jobs to apply." : "Try a different filter"}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatShort(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return d; }
}
