import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Briefcase, GraduationCap, Building2, Loader2, Mail, Lock, User2, Phone, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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

  // Real-time validation state
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect signed-in users to their home
  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: roleHome(role) });
    }
  }, [loading, user, role, navigate]);

  // ──────── Validation Constants ────────
  const BLOCKED_DOMAINS = [
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "yopmail.com", "trashmail.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "discard.email", "maildrop.cc", "10minutemail.com", "temp-mail.org",
    "fakeinbox.com", "getnada.com", "demo.com", "test.com", "example.com",
  ];

  const DEMO_EMAILS = ["admin@demo.com", "recruiter@demo.com", "student@demo.com"];

  // ──────── Name Validation ────────
  const isValidFullName = (n: string): boolean => {
    const trimmed = n.trim();
    if (trimmed.length < 3) return false;
    const parts = trimmed.split(/\s+/).filter((p) => p.length >= 2);
    if (parts.length < 2) return false;
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return false;
    return true;
  };

  // ──────── Phone Validation (Indian) ────────
  const validatePhone = (p: string): string | null => {
    const cleaned = p.replace(/[\s\-()]/g, "");
    if (!cleaned) return null; // optional if empty
    // Remove +91 or 0 prefix
    const num = cleaned.replace(/^(\+91|91|0)/, "");
    if (num.length !== 10) return "Phone number must be 10 digits.";
    if (!/^[6-9]\d{9}$/.test(num)) return "Enter a valid Indian mobile number (starts with 6-9).";
    // Block obvious fakes
    if (/^(\d)\1{9}$/.test(num)) return "Please enter a real phone number.";
    if (num === "1234567890" || num === "9876543210" || num === "0000000000") return "Please enter a real phone number.";
    return null;
  };

  const handlePhoneChange = (val: string) => {
    // Only allow digits, +, spaces, hyphens
    const filtered = val.replace(/[^\d+\s\-()]/g, "");
    setPhone(filtered);
    if (filtered.trim()) {
      const err = validatePhone(filtered);
      setPhoneError(err || "");
    } else {
      setPhoneError("");
    }
  };

  // ──────── Email Validation (Local + API) ────────
  const localEmailCheck = (e: string): { valid: boolean; reason?: string } => {
    const trimmed = e.trim().toLowerCase();
    if (!trimmed) return { valid: false, reason: "Email is required." };
    // Basic format check
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      return { valid: false, reason: "Enter a valid email address." };
    }
    const [localPart, domain] = trimmed.split("@");
    if (!domain) return { valid: false, reason: "Enter a valid email address." };
    // Block disposable domains
    if (BLOCKED_DOMAINS.includes(domain)) {
      return { valid: false, reason: "Disposable or test emails are not allowed. Use your real email." };
    }
    // Block obviously fake local parts
    if (/^(test|fake|dummy|asdf|qwer|abc|xyz|temp|none|no)\d*$/i.test(localPart)) {
      return { valid: false, reason: "Please use your real email address, not a test one." };
    }
    return { valid: true };
  };

  // Real-time email verification via free Disify API
  const verifyEmailReal = useCallback(async (emailAddr: string) => {
    const local = localEmailCheck(emailAddr);
    if (!local.valid) {
      setEmailStatus("invalid");
      setEmailError(local.reason || "Invalid email.");
      return;
    }
    setEmailStatus("checking");
    setEmailError("");
    try {
      const res = await fetch(`https://disify.com/api/email/${emailAddr.trim().toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.disposable) {
          setEmailStatus("invalid");
          setEmailError("Disposable emails are not allowed. Use your real email.");
          return;
        }
        if (data.dns === false) {
          setEmailStatus("invalid");
          setEmailError("This email domain does not exist. Check for typos.");
          return;
        }
        if (data.format === false) {
          setEmailStatus("invalid");
          setEmailError("Invalid email format.");
          return;
        }
        setEmailStatus("valid");
        setEmailError("");
      } else {
        // API down — fallback to local check only
        setEmailStatus("valid");
      }
    } catch {
      // Network error — fallback to local check
      setEmailStatus("valid");
    }
  }, []);

  // Debounced email check on change
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailStatus("idle");
    setEmailError("");
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    if (mode === "register" && val.includes("@") && val.includes(".")) {
      emailCheckTimer.current = setTimeout(() => verifyEmailReal(val), 800);
    }
  };

  // Also check on blur
  const handleEmailBlur = () => {
    if (mode === "register" && email.includes("@")) {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
      verifyEmailReal(email);
    }
  };

  // ──────── Login Handler ────────
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
    // Check email verification (skip for demo accounts)
    const u = authResult.data.user;
    if (u && !u.email_confirmed_at && !DEMO_EMAILS.includes(email.trim().toLowerCase())) {
      await supabase.auth.signOut();
      toast.error("Please verify your email before signing in. Check your inbox for the confirmation link.");
      return;
    }
    toast.success("Welcome back!");
  };

  // ──────── Register Handler ────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate full name
    if (!isValidFullName(name)) {
      toast.error("Please enter your full name (first and last name, letters only).");
      return;
    }

    // Validate email locally
    const localCheck = localEmailCheck(email);
    if (!localCheck.valid) {
      toast.error(localCheck.reason!);
      return;
    }

    // Block if email check is still running or failed
    if (emailStatus === "checking") {
      toast.error("Please wait — we're verifying your email address.");
      return;
    }
    if (emailStatus === "invalid") {
      toast.error(emailError || "Please use a valid, real email address.");
      return;
    }

    // Validate phone
    if (phone.trim()) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        toast.error(phoneErr);
        return;
      }
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const metadata: Record<string, string> = {
      name: name.trim(),
      role: selectedRole,
      phone: phone.replace(/[\s\-()]/g, "").replace(/^(\+91|91|0)/, ""),
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
    toast.success("Account created! Check your email inbox and click the verification link before signing in.", { duration: 8000 });
    setMode("login");
  };


  const handleGoogle = () => {
    toast.info("Google sign-in coming soon. Please use email login.");
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

      {/* Left side banner - visible on desktop */}
      {mode === "login" ? (
        <div className="hidden lg:block h-screen aspect-[9/16] max-w-[48vw] bg-[#f8fafc] overflow-hidden shrink-0 sticky top-0">
          <img 
            src="/login-banner.png" 
            alt="HireNexa - University Recruitment Reimagined" 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="hidden lg:block w-[56.25vh] max-w-[48vw] bg-[#f8fafc] overflow-hidden shrink-0 min-h-screen self-stretch">
          <img 
            src="/login-banner.png" 
            alt="HireNexa - University Recruitment Reimagined" 
            className="w-full h-full object-cover object-left"
          />
        </div>
      )}

      {/* Right side form container */}
      <div 
        className="flex-1 min-h-screen flex items-center justify-center p-6 md:p-12 relative bg-cover bg-center overflow-y-auto"
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
                <Field icon={User2} placeholder="Full name (e.g. Ashwin P)" value={name} onChange={setName} required />
              )}
              <div>
                <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={handleEmailChange} onBlur={handleEmailBlur} required />
                {mode === "register" && emailStatus !== "idle" && (
                  <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${
                    emailStatus === "checking" ? "text-amber-500" :
                    emailStatus === "valid" ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {emailStatus === "checking" && <><Loader2 className="h-3 w-3 animate-spin" /> Verifying email...</>}
                    {emailStatus === "valid" && <><CheckCircle2 className="h-3 w-3" /> Email verified</>}
                    {emailStatus === "invalid" && <><XCircle className="h-3 w-3" /> {emailError}</>}
                  </div>
                )}
              </div>
              <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={mode === "register" ? 6 : undefined} />

              {mode === "register" && (
                <>
                  <div>
                    <Field icon={Phone} placeholder="Phone number (e.g. 9876543210)" value={phone} onChange={handlePhoneChange} />
                    {phoneError && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-500">
                        <AlertCircle className="h-3 w-3" /> {phoneError}
                      </div>
                    )}
                  </div>
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
  icon: Icon, type = "text", placeholder, value, onChange, onBlur, required, minLength,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
        required={required}
        minLength={minLength}
        className={`w-full rounded-xl border border-border bg-background px-3 ${Icon ? "pl-9" : ""} py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition`}
      />
    </label>
  );
}
