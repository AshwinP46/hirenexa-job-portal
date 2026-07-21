import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings, Key, Bell, Shield, Laptop, LogOut, CheckCircle2, Globe, Moon, Sun, AlertTriangle
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { StudentSidebar, RecruiterSidebar, AdminSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyProfile } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Security — HireNexa" },
      { name: "description", content: "Manage notifications, configure localized languages, check active device logs, and set up 2FA security." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student", "recruiter", "admin"]}>
      <SettingsPage />
    </AuthGate>
  ),
});

interface DeviceSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  active: boolean;
  lastUsed: string;
}

const INITIAL_SESSIONS: DeviceSession[] = [
  { id: "s1", device: "Chrome / Windows 11", location: "Hyderabad, India", ip: "192.168.1.42", active: true, lastUsed: "Current session" },
  { id: "s2", device: "Safari / iPhone 15", location: "Bangalore, India", ip: "103.45.89.21", active: false, lastUsed: "2 hours ago" },
  { id: "s3", device: "Firefox / macOS Sonoma", location: "Mumbai, India", ip: "157.24.120.4", active: false, lastUsed: "3 days ago" }
];

function SettingsPage() {
  const { user, role } = useAuth();
  const uid = user?.id || "";
  const profQ = useAsync(() => uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null }), [uid]);

  const [activeSubTab, setActiveSubTab] = useState<"general" | "security" | "notifications">("general");
  const [sessions, setSessions] = useState<DeviceSession[]>(INITIAL_SESSIONS);
  const [twoFactor, setTwoFactor] = useState(false);
  const [language, setLanguage] = useState("English");
  
  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyAlerts, setWeeklyAlerts] = useState(false);

  const name = profQ.data?.profile?.name || "User";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Active session revoked successfully!");
  };

  const handleToggle2FA = () => {
    if (!twoFactor) {
      toast.info("Generating Mock 2FA QR code...");
    }
    setTwoFactor(!twoFactor);
    toast.success(!twoFactor ? "Two-Factor Auth Enabled!" : "Two-Factor Auth Disabled!");
  };

  const sidebar =
    role === "admin"
      ? <AdminSidebar />
      : role === "recruiter"
      ? <RecruiterSidebar />
      : <StudentSidebar />;

  return (
    <AppShell sidebar={sidebar} user={{ name, initials, role: role || "User" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="mt-1 text-sm opacity-90">
              Manage your notifications, select default localization settings, log active devices, and toggle auth security features.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Settings Navigation Menu */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft h-fit space-y-1">
          <button
            onClick={() => setActiveSubTab("general")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeSubTab === "general" ? "bg-accent/40 text-foreground border border-border" : "text-muted-foreground hover:bg-accent/20"}`}
          >
            <Settings className="h-4 w-4" /> General Preferences
          </button>
          <button
            onClick={() => setActiveSubTab("security")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeSubTab === "security" ? "bg-accent/40 text-foreground border border-border" : "text-muted-foreground hover:bg-accent/20"}`}
          >
            <Shield className="h-4 w-4" /> Security & Session Log
          </button>
          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeSubTab === "notifications" ? "bg-accent/40 text-foreground border border-border" : "text-muted-foreground hover:bg-accent/20"}`}
          >
            <Bell className="h-4 w-4" /> Notification Settings
          </button>
        </div>

        {/* Right Settings Configuration Form */}
        <div className="lg:col-span-3 space-y-6">
          {activeSubTab === "general" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
              <h3 className="font-semibold text-base">General Preferences</h3>
              
              <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Display Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="English">English (US)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2 flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5" /> Appearance Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-primary bg-primary/10 text-primary transition inline-flex items-center justify-center gap-1.5"
                    >
                      <Sun className="h-3.5 w-3.5" /> Light / Dark Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "security" && (
            <div className="space-y-6">
              {/* 2FA Mock settings */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-1.5"><Key className="h-5 w-5 text-primary" /> Two-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Raise account safety thresholds by demanding an authenticator OTP code upon login entries.
                </p>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-semibold">Enable 2FA Setup</p>
                    <p className="text-[10px] text-muted-foreground">Verify using Google Authenticator / Authy app.</p>
                  </div>
                  <button
                    onClick={handleToggle2FA}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${twoFactor ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"}`}
                  >
                    {twoFactor ? "Disable 2FA" : "Enable 2FA Verification"}
                  </button>
                </div>

                {twoFactor && (
                  <div className="mt-4 p-4 rounded-xl border border-border bg-muted/10 flex flex-col sm:flex-row items-center gap-4 animate-count-up">
                    <div className="h-28 w-28 shrink-0 bg-neutral-900 border border-neutral-800 flex items-center justify-center relative overflow-hidden rounded-lg">
                      <span className="text-[9px] text-center px-2 text-neutral-500 font-semibold leading-none">[Simulated Setup Authenticator QR Code]</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <p className="font-bold text-foreground">Scan QR Code setup instructions:</p>
                      <p className="text-muted-foreground">1. Open your Authenticator client app.</p>
                      <p className="text-muted-foreground">2. Click add new account and scan this mock QR placeholder.</p>
                      <p className="text-muted-foreground">Secret code key: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">HIRENEXA2FATESTKEY</code></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Active sessions tracking */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-1.5"><Laptop className="h-5 w-5 text-primary" /> Active Login Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-medium pb-2 block w-full flex justify-between">
                        <th className="pb-2 w-[40%]">Device Agent</th>
                        <th className="pb-2 w-[25%]">Location / IP</th>
                        <th className="pb-2 w-[20%]">Last Active</th>
                        <th className="pb-2 w-[15%] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sessions.map(s => (
                        <tr key={s.id} className="py-3 block w-full flex justify-between items-center">
                          <td className="w-[40%] font-semibold py-2 truncate pr-2">{s.device}</td>
                          <td className="w-[25%] py-2">
                            <p>{s.location}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.ip}</p>
                          </td>
                          <td className="w-[20%] py-2 text-muted-foreground">{s.lastUsed}</td>
                          <td className="w-[15%] py-2 text-right">
                            {s.active ? (
                              <span className="text-[10px] font-bold text-success uppercase">Current</span>
                            ) : (
                              <button onClick={() => handleRevokeSession(s.id)} className="text-xs text-destructive hover:underline inline-flex items-center gap-0.5 font-bold">
                                <LogOut className="h-3 w-3" /> Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
              <h3 className="font-semibold text-base">Notification Channels Settings</h3>
              
              <div className="border-t border-border pt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <p className="font-semibold">Email Alerts Notification</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send immediate message notification copy alerts via email.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background focus:ring-primary text-primary"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <p className="font-semibold">In-App Live Push Notices</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive immediate system announcements notification toasts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background focus:ring-primary text-primary"
                  />
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div>
                    <p className="font-semibold">Weekly Placements Digests</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive structured weekly digests of placement statistics.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyAlerts}
                    onChange={(e) => setWeeklyAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background focus:ring-primary text-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
