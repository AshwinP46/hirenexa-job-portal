import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { AuthGate } from "@/components/shell/AuthGate";
import { StudentSidebar, RecruiterSidebar, AdminSidebar } from "@/components/shell/sidebars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Component, FileCode2, Database, Sparkles, FileBarChart,
  ShieldCheck, Layers, GitBranch, Rocket, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/stats")({
  component: () => (
    <AuthGate>
      <StatsPage />
    </AuthGate>
  ),
});

const STATS = [
  { label: "UI Components", value: 60, icon: Component, hint: "shadcn/ui + custom" },
  { label: "Pages / Routes", value: 13, icon: FileCode2, hint: "TanStack file-based" },
  { label: "Database Tables", value: 11, icon: Database, hint: "RLS enabled on all" },
  { label: "Core Features", value: 18, icon: Sparkles, hint: "Student · Recruiter · Admin" },
  { label: "Reports & Exports", value: 6, icon: FileBarChart, hint: "CSV + PDF" },
  { label: "RLS Policies", value: 29, icon: ShieldCheck, hint: "Scoped to auth.uid()" },
  { label: "Domain Engines", value: 4, icon: Layers, hint: "match · eligibility · insights · exports" },
  { label: "User Roles", value: 3, icon: GitBranch, hint: "admin > recruiter > student" },
];

const FEATURES = [
  "Email + Google OAuth", "Role-based routing", "Student dashboard",
  "Smart job matching", "Eligibility engine", "Resume upload + storage",
  "Resume insights & scoring", "Achievement system", "Smart insights tips",
  "Application tracking", "Saved jobs", "Interview scheduling",
  "Recruiter pipeline", "Recruiter analytics", "Admin KPIs + MoM trends",
  "Audit logs", "CSV / PDF reports", "Activity Center",
];

const DOCS = [
  { title: "Architecture", path: "docs/ARCHITECTURE.md" },
  { title: "ER Diagram", path: "docs/ER_DIAGRAM.md" },
  { title: "Role Matrix", path: "docs/ROLE_MATRIX.md" },
  { title: "Demo Accounts", path: "docs/DEMO_ACCOUNTS.md" },
  { title: "Release Notes v1.0", path: "docs/RELEASE_NOTES_v1.0.md" },
  { title: "Portfolio Assets", path: "docs/PORTFOLIO.md" },
  { title: "Deployment Checklist", path: "docs/DEPLOYMENT_CHECKLIST.md" },
];

function StatsPage() {
  const { user, role } = useAuth();
  const Sidebar =
    role === "admin" ? AdminSidebar : role === "recruiter" ? RecruiterSidebar : StudentSidebar;
  const name =
    (user?.user_metadata?.name as string) ||
    (user?.email?.split("@")[0] ?? "User");
  const initials = name.slice(0, 2).toUpperCase();
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1) : "User";

  return (
    <AppShell sidebar={<Sidebar />} user={{ name, initials, role: roleLabel }}>
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <Badge variant="secondary">v1.0 · Production Ready</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Project Statistics</h1>
            <p className="text-sm text-muted-foreground">
              A snapshot of what powers HireNexa.
            </p>
          </div>
          <Link
            to="/activity"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            View Activity →
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label} className="border-border/60 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{s.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Feature Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <Badge key={f} variant="outline" className="border-border/60">
                    {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" /> Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {DOCS.map((d) => (
                  <li key={d.path} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
                    <span>{d.title}</span>
                    <code className="text-xs text-muted-foreground">{d.path}</code>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-border/60 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Tech Stack</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Row k="Framework" v="TanStack Start v1 (React 19, SSR)" />
              <Row k="Build" v="Vite 8" />
              <Row k="Styling" v="Tailwind v4 + shadcn/ui" />
              <Row k="Data" v="TanStack Query" />
              <Row k="Backend" v="Supabase (PostgreSQL + RLS)" />
              <Row k="Auth" v="Email + Google OAuth" />
              <Row k="Storage" v="Private resumes bucket" />
              <Row k="Exports" v="jsPDF + papaparse" />
              <Row k="Charts" v="recharts" />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
