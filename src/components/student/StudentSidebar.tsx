import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  CalendarCheck,
  Bell,
  Settings,
  GraduationCap,
} from "lucide-react";

const items = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Profile", url: "/student/profile", icon: User },
  { title: "Jobs", url: "/student/jobs", icon: Briefcase },
  { title: "Applications", url: "/student/applications", icon: FileText },
  { title: "Interviews", url: "/student/interviews", icon: CalendarCheck },
  { title: "Notifications", url: "/student/notifications", icon: Bell },
  { title: "Settings", url: "/student/settings", icon: Settings },
];

export function StudentSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 p-1 shadow-soft border border-white/10 overflow-hidden shrink-0">
          <img src="/logo-icon.png" alt="HireNexa Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">HireNexa</p>
          <p className="text-[11px] text-muted-foreground">Student Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.url;
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.title === "Notifications" && !active && (
                <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  4
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl p-4 gradient-accent text-primary-foreground shadow-soft">
        <p className="text-xs opacity-90">Upgrade your profile</p>
        <p className="mt-1 text-sm font-semibold">Get 3x more recruiter views</p>
        <button className="mt-3 w-full rounded-lg bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-medium hover:bg-white/25 transition">
          Boost Profile
        </button>
      </div>
    </aside>
  );
}
