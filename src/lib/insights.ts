// Pure scoring + insights utilities. No DB schema changes required —
// everything is derived from existing students / applications / interviews rows.

export interface StudentLike {
  department: string | null;
  cgpa: number | null;
  roll_number?: string | null;
  year_of_study?: number | null;
  skills: string[] | null;
  bio?: string | null;
  resume_url?: string | null;
}
export interface ProfileLike {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

// ---------------- Profile / Resume scoring ----------------

export interface ResumeInsights {
  resumeScore: number;          // 0-100
  profileStrength: number;      // 0-100
  hiringReadiness: number;      // 0-100
  detectedSkills: string[];
  missingSkills: string[];      // common in-demand skills the student lacks
  strengths: string[];
  suggestions: string[];
}

// Common industry skills used as a baseline for "missing" detection.
const COMMON_SKILLS = [
  "javascript", "typescript", "react", "node.js", "python",
  "java", "sql", "git", "aws", "docker",
  "communication", "problem solving", "data structures",
];

export function computeResumeInsights(
  profile: ProfileLike | null,
  student: StudentLike | null,
): ResumeInsights {
  const skills = (student?.skills ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const detected = Array.from(new Set(skills));
  const missing = COMMON_SKILLS.filter((s) => !detected.includes(s)).slice(0, 6);

  // Profile completeness — 7 fields
  const fields = [
    !!profile?.name, !!profile?.email, !!profile?.phone, !!profile?.avatar_url,
    !!student?.department, !!student?.cgpa, !!student?.bio,
  ];
  const profileStrength = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  // Resume score — based on resume + skills count + cgpa + bio
  let resumeScore = 0;
  if (student?.resume_url) resumeScore += 35;
  resumeScore += Math.min(30, detected.length * 4);
  if ((student?.cgpa ?? 0) >= 7) resumeScore += 15;
  else if ((student?.cgpa ?? 0) >= 6) resumeScore += 8;
  if (student?.bio && student.bio.length > 40) resumeScore += 10;
  if (student?.department) resumeScore += 10;
  resumeScore = Math.min(100, resumeScore);

  const hiringReadiness = Math.round(resumeScore * 0.6 + profileStrength * 0.4);

  const strengths: string[] = [];
  if (detected.length >= 6) strengths.push("Strong skill portfolio");
  if ((student?.cgpa ?? 0) >= 8) strengths.push("Excellent academic record");
  if (student?.resume_url) strengths.push("Resume uploaded");
  if (profileStrength >= 80) strengths.push("Profile is recruiter-ready");

  const suggestions: string[] = [];
  if (!student?.resume_url) suggestions.push("Upload your latest resume to improve visibility.");
  if (detected.length < 5) suggestions.push("Add at least 5 relevant skills to your profile.");
  if (!student?.bio || student.bio.length < 40) suggestions.push("Write a short professional bio (40+ chars).");
  if (!profile?.phone) suggestions.push("Add a contact phone number.");
  if ((student?.cgpa ?? 0) < 6) suggestions.push("Highlight projects & certifications to offset CGPA.");
  if (missing.length) suggestions.push(`Consider learning: ${missing.slice(0, 3).join(", ")}.`);

  return { resumeScore, profileStrength, hiringReadiness, detectedSkills: detected, missingSkills: missing, strengths, suggestions };
}

// ---------------- Job fit labels ----------------

export type FitLabel = "Excellent Match" | "Good Match" | "Average Match" | "Low Match";

export function fitLabel(score: number): FitLabel {
  if (score >= 80) return "Excellent Match";
  if (score >= 65) return "Good Match";
  if (score >= 45) return "Average Match";
  return "Low Match";
}

export function fitTone(score: number): "success" | "info" | "warning" | "destructive" {
  if (score >= 80) return "success";
  if (score >= 65) return "info";
  if (score >= 45) return "warning";
  return "destructive";
}

// ---------------- Achievements ----------------

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export function computeStudentBadges(opts: {
  profileStrength: number;
  resumeUploaded: boolean;
  applicationsCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  selectedCount: number;
}): Badge[] {
  return [
    { id: "profile_complete", label: "Profile Completed", description: "Profile 80%+ complete", earned: opts.profileStrength >= 80 },
    { id: "resume_uploaded", label: "Resume Uploaded", description: "Resume on file", earned: opts.resumeUploaded },
    { id: "first_application", label: "First Application", description: "Applied to your first job", earned: opts.applicationsCount >= 1 },
    { id: "active_applicant", label: "Active Applicant", description: "5+ applications submitted", earned: opts.applicationsCount >= 5 },
    { id: "interview_ready", label: "Interview Ready", description: "Scheduled for an interview", earned: opts.interviewsCount >= 1 },
    { id: "recruiter_favorite", label: "Recruiter Favorite", description: "Shortlisted by a recruiter", earned: opts.shortlistedCount >= 1 },
    { id: "placement_achieved", label: "Placement Achieved", description: "Selected for a role", earned: opts.selectedCount >= 1 },
  ];
}

// ---------------- KPI trend helpers ----------------

export function monthOverMonth(current: number, previous: number): { delta: number; pct: number; direction: "up" | "down" | "flat" } {
  const delta = current - previous;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / previous) * 100);
  return { delta, pct, direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat" };
}

// Arrow + percent label suitable for a StatCard `change` string.
export function trendLabel(current: number, previous: number, suffix = "vs last 30d"): string {
  const t = monthOverMonth(current, previous);
  if (t.direction === "flat") return `→ 0% ${suffix}`;
  const arrow = t.direction === "up" ? "↑" : "↓";
  return `${arrow} ${Math.abs(t.pct)}% ${suffix}`;
}

// Count items whose `dateField` falls within the last `days` days.
export function countWithinDays<T>(items: T[], dateField: keyof T, days: number, offsetDays = 0): number {
  const now = Date.now();
  const start = now - (days + offsetDays) * 86_400_000;
  const end = now - offsetDays * 86_400_000;
  return items.filter((i) => {
    const v = i[dateField] as unknown as string | null;
    if (!v) return false;
    const t = +new Date(v);
    return t >= start && t <= end;
  }).length;
}

// Contextual smart insights for a student.
export function studentSmartInsights(opts: {
  insights: ResumeInsights;
  applicationsCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  recentAppsDelta: number;     // last 30d minus prior 30d
  topSkill?: string | null;    // an in-demand missing skill, optional
}): string[] {
  const out: string[] = [];
  if (opts.insights.profileStrength < 80)
    out.push(`Complete your profile to increase hiring readiness (currently ${opts.insights.profileStrength}%).`);
  if (opts.insights.resumeScore < 60)
    out.push("Upload a polished resume — recruiters open the highest-scored profiles first.");
  if (opts.applicationsCount === 0)
    out.push("Apply to your first job today to start building momentum.");
  else if (opts.applicationsCount < 5)
    out.push("Aim for at least 5 applications this week to widen your funnel.");
  if (opts.shortlistedCount > 0 && opts.interviewsCount === 0)
    out.push("You've been shortlisted — prepare for interview rounds soon.");
  if (opts.recentAppsDelta > 0)
    out.push(`Great momentum — applications are up by ${opts.recentAppsDelta} this month.`);
  if (opts.topSkill)
    out.push(`Add "${opts.topSkill}" to your skills to improve job match rates.`);
  return out.slice(0, 4);
}

