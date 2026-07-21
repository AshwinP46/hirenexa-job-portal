import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video, MapPin, Clock, CalendarPlus, Loader2 } from "lucide-react";
import { AppShell, statusBadge, prettyStatus, CompanyLogo } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyInterviews, fetchMyProfile } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interview Schedule — HireNexa" },
      { name: "description", content: "Your upcoming interviews on a clean calendar — never miss a round." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <InterviewsPage />
    </AuthGate>
  ),
});

function InterviewsPage() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";
  const prof = useAsync(() => uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null }), [uid]);
  const ivsQ = useAsync(() => uid ? fetchMyInterviews(uid) : Promise.resolve([]), [uid]);

  const NOW = new Date();
  const [cursor, setCursor] = useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  const [showSync, setShowSync] = useState(false);

  function getCalendarSyncLink(provider: "google" | "outlook", subject: string, dateStr: string, locationStr: string) {
    const d = new Date(dateStr);
    const startISO = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dEnd = new Date(d.getTime() + 60 * 60 * 1000);
    const endISO = dEnd.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const text = encodeURIComponent(subject);
    const loc = encodeURIComponent(locationStr || "Online Interview (HireNexa Video Room)");
    const details = encodeURIComponent(`Campus Placement Interview round scheduled via HireNexa. Prepare your resume and portfolio.`);

    if (provider === "google") {
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startISO}/${endISO}&details=${details}&location=${loc}`;
    } else {
      const outlookStart = d.toISOString().slice(0, 19) + "Z";
      const outlookEnd = dEnd.toISOString().slice(0, 19) + "Z";
      return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${text}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${details}&location=${loc}`;
    }
  }

  const interviews = ivsQ.data ?? [];

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const byDate = useMemo(() => {
    const m: Record<string, typeof interviews> = {};
    interviews.forEach((i) => {
      const k = toKey(new Date(i.interview_date));
      (m[k] ??= []).push(i);
    });
    return m;
  }, [interviews]);

  const monthInterviews = interviews.filter((i) => {
    const d = new Date(i.interview_date);
    return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
  });

  const next = interviews
    .filter((i) => new Date(i.interview_date) >= new Date())
    .sort((a, b) => a.interview_date.localeCompare(b.interview_date))[0];

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
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interview Schedule</h1>
            <p className="mt-1 text-sm opacity-90">
              {interviews.length} interviews scheduled
              {next && ` · Next: ${next.company_name} · ${formatDate(next.interview_date)}, ${formatTime(next.interview_date)}`}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSync(!showSync)}
              className="rounded-xl bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow-soft inline-flex items-center gap-1.5"
            >
              <CalendarPlus className="h-4 w-4" /> Sync Calendar
            </button>
            {showSync && (
              <div className="absolute right-0 top-11 bg-card border border-border p-2 rounded-xl shadow-glow z-20 w-48 flex flex-col gap-1 text-xs text-foreground">
                <a
                  href={getCalendarSyncLink("google", `Placement Interview with ${next?.company_name || "Company"}`, next?.interview_date || new Date().toISOString(), next?.meeting_link || next?.location || "")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowSync(false)}
                  className="px-3 py-2 rounded-lg hover:bg-accent/40 transition block text-left font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sync to Google Calendar
                </a>
                <a
                  href={getCalendarSyncLink("outlook", `Placement Interview with ${next?.company_name || "Company"}`, next?.interview_date || new Date().toISOString(), next?.meeting_link || next?.location || "")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowSync(false)}
                  className="px-3 py-2 rounded-lg hover:bg-accent/40 transition block text-left font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sync to Outlook Calendar
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold tracking-tight text-lg">{monthLabel}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg border border-border p-1.5 hover:bg-accent/30 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCursor(new Date(NOW.getFullYear(), NOW.getMonth(), 1))} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/30 transition">
                Today
              </button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg border border-border p-1.5 hover:bg-accent/30 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((d, i) => {
              const key = d ? toKey(d) : `e-${i}`;
              const events = d ? (byDate[key] ?? []) : [];
              const isToday = d && sameDay(d, NOW);
              return (
                <div key={key}
                  className={`relative min-h-[72px] md:min-h-[88px] rounded-xl border p-1.5 transition ${
                    !d ? "border-transparent"
                    : events.length ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-background/40 hover:bg-accent/20"
                  } ${isToday ? "ring-2 ring-primary/40" : ""}`}>
                  {d && (
                    <>
                      <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {d.getDate()}
                      </div>
                      <div className="mt-1 space-y-1">
                        {events.slice(0, 2).map((e) => {
                          const v = companyVisual(e.company_name ?? "Co");
                          return (
                            <div key={e.id} className={`truncate rounded-md bg-gradient-to-r ${v.color} px-1.5 py-0.5 text-[10px] font-medium text-white shadow-soft`}>
                              {formatTime(e.interview_date).replace(" ", "")} · {e.company_name}
                            </div>
                          );
                        })}
                        {events.length > 2 && (
                          <div className="text-[10px] text-primary font-medium">+{events.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold tracking-tight mb-4">Upcoming this month</h3>
          {ivsQ.loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : monthInterviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-semibold">No interviews this month</p>
              <p className="text-xs text-muted-foreground mt-1">Check next month or apply to more jobs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthInterviews.map((i, idx) => {
                return (
                  <div key={i.id} style={{ animationDelay: `${idx * 50}ms` }}
                    className="animate-count-up rounded-xl border border-border bg-background/40 p-3 hover:border-primary/40 transition">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={i.company_name ?? "Co"} className="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{i.company_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.round_name ?? "Interview"} · {i.job_title}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Clock className="h-3 w-3" /> {formatDate(i.interview_date)} · {formatTime(i.interview_date)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground capitalize">
                        {i.mode === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />} {i.mode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-semibold tracking-tight mb-4">All Interviews</h3>
        {ivsQ.loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
        ) : interviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm font-semibold">No interviews scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Recruiters will schedule interviews here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Mode</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((i) => {
                  return (
                    <tr key={i.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <CompanyLogo name={i.company_name ?? "Co"} className="h-7 w-7" />
                          <span className="font-medium">{i.company_name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{i.job_title}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(i.interview_date)}</td>
                      <td className="py-3 text-muted-foreground">{formatTime(i.interview_date)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
                          {i.mode === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />} {i.mode}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadge(i.status)}`}>
                          {prettyStatus(i.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatTime(s: string) {
  try { return new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}
function buildMonthGrid(cursor: Date): (Date | null)[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leading = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
