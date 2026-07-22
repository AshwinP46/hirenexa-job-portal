import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, GraduationCap, Building2, Loader2, Mail, Lock, User2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, roleHome, type AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to HireNexa" },
      { name: "description", content: "Sign in or create an account on HireNexa to access placements, jobs, and recruiter tools." },
      { property: "og:title", content: "Sign in to HireNexa" },
      { property: "og:description", content: "Access placements, job posts, and recruiter tools on HireNexa." },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Sign in to HireNexa" },
      { name: "twitter:description", content: "Access placements, job posts, and recruiter tools on HireNexa." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [selectedRole, setSelectedRole] = useState<AppRole>("student");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Redirect signed-in users to their home
  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: roleHome(role) });
    }
  }, [loading, user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const [authResult] = await Promise.all([
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);
    setSubmitting(false);
    if (authResult.error) {
      toast.error(authResult.error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const metadata: Record<string, string> = {
      name: name.trim(),
      role: selectedRole,
      phone,
    };
    if (selectedRole === "student") {
      metadata.department = department;
      metadata.cgpa = cgpa;
    }
    if (selectedRole === "recruiter") {
      metadata.company_name = companyName;
    }

    const [authResult] = await Promise.all([
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      }),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);
    setSubmitting(false);
    if (authResult.error) {
      toast.error(authResult.error.message);
      return;
    }
    toast.success("Account created. You can now sign in.");
    setMode("login");
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const [authResult] = await Promise.all([
      lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      }),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);
    if (authResult.error) {
      toast.error("Could not start Google sign-in. Please try again.");
      setSubmitting(false);
      return;
    }
    if (authResult.redirected) return;
  };

  const ROLES: { key: AppRole; label: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
    { key: "student",   label: "Student",   icon: GraduationCap, tint: "from-blue-500 to-indigo-600" },
    { key: "recruiter", label: "Recruiter", icon: Building2,     tint: "from-violet-500 to-purple-600" },
    { key: "admin",     label: "Admin",     icon: Briefcase,     tint: "from-cyan-500 to-blue-700" },
  ];

  return (
    <div className="min-h-screen bg-background relative flex flex-col lg:flex-row overflow-x-hidden">
      {/* Modern Credentials Loading Overlay Animation */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-background/65 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Backlight Glow */}
            <div className="absolute h-32 w-32 rounded-full bg-primary/25 blur-xl animate-pulse" />
            {/* Spinning Gradient Ring */}
            <div className="h-20 w-20 rounded-full border-[3px] border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin absolute" />
            {/* Inner Glow Pulse Logo Container */}
            <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse">
              <img src="/logo-icon.png" alt="HireNexa" className="h-7 w-7 object-contain brightness-0 invert" />
            </div>
          </div>
          <div className="text-center space-y-1 mt-6 z-10">
            <h3 className="text-sm font-bold tracking-widest text-foreground uppercase">HIRENEXA</h3>
            <p className="text-xs text-muted-foreground animate-pulse font-medium">Authenticating credentials...</p>
          </div>
        </div>
      )}

      {/* Left side banner - visible on desktop, aspect ratio fit to image */}
      <div className="hidden lg:block h-screen aspect-[9/16] max-w-[48vw] bg-[#f8fafc] overflow-hidden shrink-0">
        <img 
          src="/login-banner.png" 
          alt="HireNexa - University Recruitment Reimagined" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Right side form container */}
      <div 
        className="flex-1 flex items-center justify-center p-6 md:p-12 relative bg-cover bg-center"
        style={{ backgroundImage: `url('/bg-glass.png')` }}
      >
        <div className="w-full max-w-md space-y-6 relative">
          <Link to="/" className="block">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo.png" alt="HireNexa" className="h-10 object-contain dark:hidden" />
              <img src="/logo-dark.png" alt="HireNexa" className="h-10 object-contain hidden dark:block" />
            </div>
          </Link>

          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-6 md:p-8 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-semibold tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-xs font-medium text-primary hover:underline"
              >
                {mode === "login" ? "Create account" : "Sign in instead"}
              </button>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-background hover:bg-accent/30 transition px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#EA4335" d="M12 10v4h5.7c-.3 1.4-1.7 4-5.7 4-3.4 0-6.2-2.8-6.2-6.3S8.6 5.4 12 5.4c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.8 14.7 1.8 12 1.8 6.5 1.8 2 6.3 2 11.8s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-2H12z"/>
              </svg>
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or use email <div className="h-px flex-1 bg-border" />
            </div>

            {/* Role chooser only on register */}
            {mode === "register" && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {ROLES.map((r) => {
                  const I = r.icon;
                  const active = selectedRole === r.key;
                  return (
                    <button
                      type="button"
                      key={r.key}
                      onClick={() => setSelectedRole(r.key)}
                      className={`group rounded-xl border p-2.5 text-center transition ${
                        active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-accent/20"
                      }`}
                    >
                      <div className={`mx-auto h-8 w-8 rounded-lg bg-gradient-to-br ${r.tint} flex items-center justify-center`}>
                        <I className="h-4 w-4 text-white" />
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium">{r.label}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-3">
              {mode === "register" && (
                <Field icon={User2} placeholder="Full name" value={name} onChange={setName} required />
              )}
              <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required />
              <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={mode === "register" ? 6 : undefined} />

              {mode === "register" && (
                <>
                  <Field icon={Phone} placeholder="Phone (optional)" value={phone} onChange={setPhone} />
                  {selectedRole === "student" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field placeholder="Department (CSE, ECE...)" value={department} onChange={setDepartment} />
                      <Field placeholder="CGPA" value={cgpa} onChange={setCgpa} type="number" />
                    </div>
                  )}
                  {selectedRole === "recruiter" && (
                    <Field icon={Building2} placeholder="Company name" value={companyName} onChange={setCompanyName} required />
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl gradient-primary text-primary-foreground font-medium px-4 py-2.5 text-sm shadow-glow hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] text-muted-foreground">
              By continuing you agree to HireNexa's terms and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, type = "text", placeholder, value, onChange, required, minLength,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="relative block">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className={`w-full rounded-xl border border-border bg-background px-3 ${Icon ? "pl-9" : ""} py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`}
      />
    </label>
  );
}
