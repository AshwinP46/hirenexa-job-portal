import { useEffect, useState, type ReactNode } from "react";
import { Search, Bell, Moon, Sun, LogOut, Check, Home, Briefcase, MessageSquare, User, Settings, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";

interface Props {
  sidebar: ReactNode;
  user: { name: string; initials: string; role: string; avatarUrl?: string | null };
  children: ReactNode;
}

export function AppShell({ sidebar, user, children }: Props) {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [openNotif, setOpenNotif] = useState(false);
  const { user: authUser, signOut } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!authUser?.id) return;
    let alive = true;
    fetchMyNotifications(authUser.id).then((d) => alive && setNotifs(d));
    return () => { alive = false; };
  }, [authUser?.id]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const handleMarkAll = async () => {
    if (!authUser?.id) return;
    await markAllNotificationsRead(authUser.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };
  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground pb-16 lg:pb-0">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-2 px-3 md:px-8">
            <div className="hidden sm:flex relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search..."
                className="w-full rounded-xl border border-border bg-card/60 py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setDark(!dark)}
                className="rounded-xl border border-border bg-card p-2 hover:bg-accent/40 transition"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenNotif((v) => !v)}
                  className="relative rounded-xl border border-border bg-card p-2 hover:bg-accent/40 transition"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
                {openNotif && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpenNotif(false)} />
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card shadow-glow z-40 overflow-hidden">
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <p className="text-sm font-semibold">Notifications</p>
                        {unread > 0 && (
                          <button onClick={handleMarkAll} className="text-[11px] text-primary font-medium hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
                        ) : notifs.map((n) => (
                          <button key={n.id} onClick={() => handleMarkOne(n.id)}
                            className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-accent/30 transition ${!n.is_read ? "bg-primary/5" : ""}`}>
                            <div className="flex items-start gap-2">
                              {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{n.title}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {(() => { try { return formatDistanceToNow(new Date(n.created_at), { addSuffix: true }); } catch { return ""; } })()}
                                </p>
                              </div>
                              {n.is_read && <Check className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card pl-2 pr-3 py-1.5">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                    {user.initials}
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-xs font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{user.role}</p>
                </div>
              </div>
              <button onClick={signOut} className="rounded-xl border border-border bg-card p-2 hover:bg-accent/40 transition" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 space-y-6">{children}</main>
      </div>

      <MobileBottomNav role={user.role} />
    </div>
  );
}

function MobileBottomNav({ role }: { role: string }) {
  const isRecruiter = role.toLowerCase().includes("recruiter") || role.toLowerCase().includes("lead");
  const isAdmin = role.toLowerCase().includes("admin") || role.toLowerCase().includes("placement");
  const homeUrl = isAdmin ? "/admin" : isRecruiter ? "/recruiter" : "/student";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/80 backdrop-blur-lg flex items-center justify-around px-4 lg:hidden z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <Link to={homeUrl} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1">
        <LayoutDashboard className="h-5 w-5" />
        <span className="text-[10px] font-semibold">Home</span>
      </Link>
      {!isAdmin && (
        <Link to={isRecruiter ? "/recruiter/jobs" : "/jobs"} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1">
          <Briefcase className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Jobs</span>
        </Link>
      )}
      <Link to="/chat" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1">
        <MessageSquare className="h-5 w-5" />
        <span className="text-[10px] font-semibold">Chat</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1">
        <User className="h-5 w-5" />
        <span className="text-[10px] font-semibold">Profile</span>
      </Link>
      <Link to="/settings" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1">
        <Settings className="h-5 w-5" />
        <span className="text-[10px] font-semibold">Settings</span>
      </Link>
    </div>
  );
}

export function useCountUp(end: number, duration = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setV(Math.floor(p * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return v;
}

interface Stat {
  label: string;
  value: number;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  suffix?: string;
}

export function StatCard({ s }: { s: Stat }) {
  const v = useCountUp(s.value);
  const Icon = s.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${s.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-25`} />
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.gradient} shadow-soft`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">{s.change}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">
        {v}{s.suffix ?? ""}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
    </div>
  );
}

export function statusBadge(status: string) {
  const key = status.toLowerCase().replace(/_/g, " ");
  const map: Record<string, string> = {
    applied: "bg-[oklch(0.95_0.04_264)] text-[oklch(0.4_0.18_264)] dark:bg-[oklch(0.3_0.08_264)] dark:text-[oklch(0.85_0.15_264)]",
    shortlisted: "bg-[oklch(0.95_0.05_155)] text-[oklch(0.4_0.15_155)] dark:bg-[oklch(0.3_0.08_155)] dark:text-[oklch(0.85_0.15_155)]",
    "in review": "bg-[oklch(0.95_0.04_264)] text-[oklch(0.4_0.18_264)] dark:bg-[oklch(0.3_0.08_264)] dark:text-[oklch(0.85_0.15_264)]",
    interview: "bg-[oklch(0.95_0.05_75)] text-[oklch(0.45_0.15_75)] dark:bg-[oklch(0.3_0.1_75)] dark:text-[oklch(0.85_0.15_75)]",
    "interview scheduled": "bg-[oklch(0.95_0.05_75)] text-[oklch(0.45_0.15_75)] dark:bg-[oklch(0.3_0.1_75)] dark:text-[oklch(0.85_0.15_75)]",
    scheduled: "bg-[oklch(0.95_0.05_75)] text-[oklch(0.45_0.15_75)] dark:bg-[oklch(0.3_0.1_75)] dark:text-[oklch(0.85_0.15_75)]",
    selected: "bg-[oklch(0.93_0.1_155)] text-[oklch(0.35_0.15_155)] dark:bg-[oklch(0.3_0.12_155)] dark:text-[oklch(0.88_0.15_155)]",
    rejected: "bg-[oklch(0.95_0.04_25)] text-[oklch(0.5_0.2_25)] dark:bg-[oklch(0.3_0.1_25)] dark:text-[oklch(0.85_0.15_25)]",
    confirmed: "bg-[oklch(0.93_0.1_155)] text-[oklch(0.35_0.15_155)] dark:bg-[oklch(0.3_0.12_155)] dark:text-[oklch(0.88_0.15_155)]",
    pending: "bg-[oklch(0.95_0.05_75)] text-[oklch(0.45_0.15_75)] dark:bg-[oklch(0.3_0.1_75)] dark:text-[oklch(0.85_0.15_75)]",
    completed: "bg-[oklch(0.93_0.1_155)] text-[oklch(0.35_0.15_155)] dark:bg-[oklch(0.3_0.12_155)] dark:text-[oklch(0.88_0.15_155)]",
    cancelled: "bg-[oklch(0.95_0.04_25)] text-[oklch(0.5_0.2_25)] dark:bg-[oklch(0.3_0.1_25)] dark:text-[oklch(0.85_0.15_25)]",
  };
  return map[key] ?? "bg-muted text-muted-foreground";
}

export function prettyStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// company logo: 1-2 letters from name with consistent gradient
const COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-700",
  "from-rose-500 to-red-700",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-blue-700",
  "from-indigo-600 to-blue-800",
  "from-slate-700 to-slate-900",
  "from-zinc-700 to-zinc-900",
];

export function companyVisual(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  let logoUrl: string | undefined;
  
  if (clean.includes("google")) logoUrl = "https://logos.hunter.io/google.com";
  else if (clean.includes("microsoft")) logoUrl = "https://logos.hunter.io/microsoft.com";
  else if (clean.includes("amazon")) logoUrl = "https://logos.hunter.io/amazon.com";
  else if (clean.includes("meta") || clean.includes("facebook")) logoUrl = "https://logos.hunter.io/meta.com";
  else if (clean.includes("tata") && clean.includes("consult")) logoUrl = "https://logos.hunter.io/tcs.com";
  else if (clean.includes("tcs")) logoUrl = "https://logos.hunter.io/tcs.com";
  else if (clean.includes("infosys")) logoUrl = "https://logos.hunter.io/infosys.com";
  else if (clean.includes("wipro")) logoUrl = "https://logos.hunter.io/wipro.com";
  else if (clean.includes("accenture")) logoUrl = "https://logos.hunter.io/accenture.com";
  else if (clean.includes("cognizant")) logoUrl = "https://logos.hunter.io/cognizant.com";
  else if (clean.includes("hcl")) logoUrl = "https://logos.hunter.io/hcltech.com";
  else if (clean.includes("bosch")) logoUrl = "https://logos.hunter.io/bosch.com";
  else if (clean.includes("siemens")) logoUrl = "https://logos.hunter.io/siemens.com";
  else if (clean.includes("tatamotors") || (clean.includes("tata") && clean.includes("motor"))) logoUrl = "https://logos.hunter.io/tatamotors.com";
  else if (clean.includes("larsen") || clean.includes("lt")) logoUrl = "https://logos.hunter.io/larsentoubro.com";
  else if (clean.includes("honeywell")) logoUrl = "https://logos.hunter.io/honeywell.com";
  else if (clean.includes("ibm")) logoUrl = "https://logos.hunter.io/ibm.com";
  else if (clean.includes("oracle")) logoUrl = "https://logos.hunter.io/oracle.com";
  else if (clean.includes("deloitte")) logoUrl = "https://logos.hunter.io/deloitte.com";
  else if (clean.includes("samsung")) logoUrl = "https://logos.hunter.io/samsung.com";
  else if (clean.includes("isro")) logoUrl = "https://logos.hunter.io/isro.gov.in";
  else if (clean.includes("hirenexa")) logoUrl = "/logo-icon.png";

  const initial = (name?.[0] ?? "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return { initial, color: COLORS[hash % COLORS.length], logoUrl };
}

export function CompanyLogo({ name, className = "h-11 w-11" }: { name: string; className?: string }) {
  const [err, setErr] = useState(false);
  const v = companyVisual(name);
  
  return (
    <div className={`${className} shrink-0 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center font-bold text-white shadow-soft overflow-hidden`}>
      {!err && v.logoUrl ? (
        <img 
          src={v.logoUrl} 
          alt={name} 
          onError={() => setErr(true)}
          className="h-full w-full object-contain p-1.5 bg-white" 
        />
      ) : (
        <span className={className.includes("h-12") ? "text-lg" : className.includes("h-7") ? "text-[10px]" : "text-sm"}>
          {v.initial}
        </span>
      )}
    </div>
  );
}
