import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { AuthGate } from "@/components/shell/AuthGate";
import { StudentSidebar, RecruiterSidebar, AdminSidebar } from "@/components/shell/sidebars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Briefcase, CalendarCheck, FileText, Bookmark, Bell, Shield } from "lucide-react";

export const Route = createFileRoute("/activity")({
  component: () => (
    <AuthGate>
      <ActivityPage />
    </AuthGate>
  ),
});

type Item = {
  id: string;
  kind: "application" | "interview" | "saved" | "audit" | "notification";
  title: string;
  detail: string;
  at: string;
};

function ActivityPage() {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState<"all" | Item["kind"]>("all");

  const { data, loading } = useAsync<Item[]>(async () => {
    if (!user) return [];
    const items: Item[] = [];

    // Applications (student) or applications-for-my-jobs (recruiter)
    if (role === "student") {
      const { data: apps } = await supabase
        .from("applications")
        .select("id, job_id, status, applied_at, jobs(title)")
        .eq("student_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(50);
      (apps ?? []).forEach((a: any) => items.push({
        id: `app-${a.id}`, kind: "application",
        title: `Application: ${a.jobs?.title ?? "—"}`,
        detail: `Status: ${String(a.status).replace(/_/g, " ")}`,
        at: a.applied_at,
      }));

      const { data: ivs } = await supabase
        .from("interviews")
        .select("id, interview_date, mode, status, application_id, applications!inner(student_id, jobs(title))")
        .eq("applications.student_id", user.id)
        .order("interview_date", { ascending: false })
        .limit(50);
      (ivs ?? []).forEach((i: any) => items.push({
        id: `iv-${i.id}`, kind: "interview",
        title: `Interview: ${i.applications?.jobs?.title ?? "—"}`,
        detail: `${i.mode} • ${i.status}`,
        at: i.interview_date,
      }));

      const { data: saved } = await supabase
        .from("saved_jobs")
        .select("id, created_at, jobs(title)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      (saved ?? []).forEach((s: any) => items.push({
        id: `sv-${s.id}`, kind: "saved",
        title: `Saved job: ${s.jobs?.title ?? "—"}`,
        detail: "Bookmarked for later",
        at: s.created_at,
      }));
    }

    // Notifications for any role
    const { data: notifs } = await supabase
      .from("notifications")
      .select("id, title, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    (notifs ?? []).forEach((n) => items.push({
      id: `nt-${n.id}`, kind: "notification",
      title: n.title, detail: n.message, at: n.created_at,
    }));

    // Audit log entries authored by this user (recruiter/admin actions)
    if (role !== "student") {
      const { data: audits } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, metadata, created_at")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      (audits ?? []).forEach((a: any) => items.push({
        id: `au-${a.id}`, kind: "audit",
        title: a.action.replace(/_/g, " "),
        detail: `${a.entity_type}${a.metadata?.title ? ` • ${a.metadata.title}` : ""}`,
        at: a.created_at,
      }));
    }

    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [user?.id, role]);

  const filtered = useMemo(
    () => (data ?? []).filter((i) => filter === "all" || i.kind === filter),
    [data, filter],
  );

  const filters: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "application", label: "Applications" },
    { id: "interview", label: "Interviews" },
    { id: "saved", label: "Saved" },
    { id: "notification", label: "Notifications" },
    ...(role !== "student" ? [{ id: "audit" as const, label: "Audit" }] : []),
  ];

  const fullName = (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || "User";
  const initials = fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const sidebar = role === "admin" ? <AdminSidebar /> : role === "recruiter" ? <RecruiterSidebar /> : <StudentSidebar />;
  const subtitle = role === "admin" ? "Administrator" : role === "recruiter" ? "Recruiter" : "Student";

  return (
    <AppShell sidebar={sidebar} user={{ name: fullName, initials, role: subtitle }}>
      <main className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" aria-hidden /> Activity Center
          </h1>
          <p className="text-sm text-muted-foreground">
            A unified timeline of everything happening across your HireNexa account.
          </p>
        </header>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Activity filters">
          {filters.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "outline"}
              onClick={() => setFilter(f.id)}
              role="tab"
              aria-selected={filter === f.id}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No activity yet.</p>
            ) : (
              <ol className="relative border-l border-border/60 pl-6 space-y-4">
                {filtered.map((i) => (
                  <li key={i.id} className="relative">
                    <span className="absolute -left-[31px] top-1 grid place-items-center h-6 w-6 rounded-full bg-primary/10 border border-primary/30">
                      <KindIcon kind={i.kind} />
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{i.title}</p>
                        <p className="text-xs text-muted-foreground">{i.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="capitalize">{i.kind}</Badge>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(i.at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

function KindIcon({ kind }: { kind: Item["kind"] }) {
  const cls = "h-3.5 w-3.5 text-primary";
  switch (kind) {
    case "application": return <FileText className={cls} aria-hidden />;
    case "interview":   return <CalendarCheck className={cls} aria-hidden />;
    case "saved":       return <Bookmark className={cls} aria-hidden />;
    case "notification":return <Bell className={cls} aria-hidden />;
    case "audit":       return <Shield className={cls} aria-hidden />;
    default:            return <Briefcase className={cls} aria-hidden />;
  }
}
