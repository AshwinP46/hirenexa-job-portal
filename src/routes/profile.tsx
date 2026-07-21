import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Mail, Phone, MapPin, GraduationCap,
  Upload, Eye, Pencil, Plus, X, Code2, Sparkles, Loader2,
  Github, Linkedin, Globe, Award, Terminal, BookOpen, Trash2
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyProfile, updateMyProfile, updateMyStudent, uploadResume, getResumeSignedUrl, fetchMyApplications, fetchMyInterviews, uploadAvatar } from "@/lib/api";
import { computeResumeInsights, computeStudentBadges } from "@/lib/insights";
import { ResumeInsightsCard } from "@/components/insights/ResumeInsightsCard";
import { AchievementsCard } from "@/components/insights/AchievementsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — HireNexa" },
      { name: "description", content: "Manage your profile, education, skills, and resume." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <ProfilePage />
    </AuthGate>
  ),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const uid = user?.id || "";
  const prof = useAsync(() => uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null }), [uid]);
  const appsQ = useAsync(() => uid ? fetchMyApplications(uid) : Promise.resolve([]), [uid]);
  const ivsQ = useAsync(() => uid ? fetchMyInterviews(uid) : Promise.resolve([]), [uid]);

  const [editOpen, setEditOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = prof.data?.profile;
  const student = prof.data?.student;

  const parsedBio = useMemo(() => {
    let text = student?.bio || "";
    let github = "";
    let linkedin = "";
    let portfolio = "";
    let certifications: { name: string; issuer: string; date: string; credentialId: string }[] = [];
    let codingProfiles = { leetcode: "", hackerrank: "", codechef: "" };
    
    if (student?.bio?.startsWith("{")) {
      try {
        const parsed = JSON.parse(student.bio);
        text = parsed.text || "";
        github = parsed.github || "";
        linkedin = parsed.linkedin || "";
        portfolio = parsed.portfolio || "";
        certifications = parsed.certifications || [];
        codingProfiles = parsed.codingProfiles || codingProfiles;
      } catch (e) {
        // ignore
      }
    }
    return { text, github, linkedin, portfolio, certifications, codingProfiles };
  }, [student?.bio]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile picture must be under 2MB");
      return;
    }

    setAvatarUploading(true);
    const { error } = await uploadAvatar(uid, file);
    setAvatarUploading(false);

    if (error) {
      toast.error(error.message || "Failed to upload profile picture");
      return;
    }

    toast.success("Profile picture updated!");
    prof.reload();
  };

  useEffect(() => {
    if (student?.resume_url) {
      getResumeSignedUrl(student.resume_url).then(setResumeUrl);
    } else {
      setResumeUrl(null);
    }
  }, [student?.resume_url]);

  const fullName = profile?.name ?? "Student";
  const initials = fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const subtitle = [student?.department, student?.year_of_study && `Year ${student.year_of_study}`].filter(Boolean).join(" · ") || "Student";

  const fields = [
    !!profile?.name, !!profile?.phone,
    !!student?.department, !!student?.cgpa,
    (student?.skills?.length ?? 0) > 0, !!student?.resume_url,
  ];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const resumeInsights = computeResumeInsights(profile ?? null, student ?? null);
  const apps = appsQ.data ?? [];
  const ivs = ivsQ.data ?? [];
  const shortlistedCount = apps.filter((a: any) => a.status === "shortlisted").length;
  const selectedCount = apps.filter((a: any) => a.status === "selected").length;
  const badges = computeStudentBadges({
    profileStrength: resumeInsights.profileStrength,
    resumeUploaded: !!student?.resume_url,
    applicationsCount: apps.length,
    shortlistedCount,
    interviewsCount: ivs.length,
    selectedCount,
  });

  const addSkill = async () => {
    const s = skillInput.trim();
    if (!s) return;
    const next = Array.from(new Set([...(student?.skills ?? []), s]));
    const { error } = await updateMyStudent(uid, { skills: next });
    if (error) { toast.error(error.message); return; }
    setSkillInput("");
    toast.success("Skill added");
    prof.reload();
  };
  const removeSkill = async (s: string) => {
    const next = (student?.skills ?? []).filter((x) => x !== s);
    const { error } = await updateMyStudent(uid, { skills: next });
    if (error) { toast.error(error.message); return; }
    toast("Skill removed");
    prof.reload();
  };

  const handleResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error } = await uploadResume(uid, file);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resume uploaded");
    prof.reload();
  };

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

  if (prof.loading) {
    return (
      <AppShell sidebar={<StudentSidebar />} user={{ name: fullName, initials, role: subtitle }}>
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell sidebar={<StudentSidebar />} user={{ name: fullName, initials, role: subtitle, avatarUrl: profile?.avatar_url }}>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="h-32 gradient-primary relative">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
          <div className="absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-white/10 animate-float [animation-delay:1s]" />
        </div>
        <div className="px-6 md:px-8 pb-6 -mt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative group/avatar h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-card shadow-glow flex items-center justify-center bg-card transition-all hover:scale-105 shrink-0">
              {avatarUploading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-semibold gap-1">
                <Upload className="h-4 w-4" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {profile?.email}</span>
                {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</span>}
                {student?.department && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {student.department}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)} className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft inline-flex items-center gap-1.5">
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Personal Information" icon={Sparkles}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Info label="Full name" value={fullName} />
              <Info label="Email" value={profile?.email ?? "—"} />
              <Info label="Phone" value={profile?.phone ?? "—"} />
              <Info label="Department" value={student?.department ?? "—"} />
              <Info label="Roll Number" value={student?.roll_number ?? "—"} />
              <Info label="Year of Study" value={student?.year_of_study ? `Year ${student.year_of_study}` : "—"} />
            </div>
          </Section>

          <Section title="Education" icon={GraduationCap}>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shadow-soft">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{student?.department ?? "Department"}</p>
                  {student?.year_of_study && <span className="text-xs text-muted-foreground">Year {student.year_of_study}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{parsedBio.text || "Add a bio in your profile to share more about yourself."}</p>
                {student?.cgpa && <p className="text-xs mt-1 text-primary font-medium">CGPA {student.cgpa} / 10</p>}
              </div>
            </div>
          </Section>

          <Section title="Skills" icon={Code2}>
            <div className="flex flex-wrap gap-2 mb-4">
              {(student?.skills ?? []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {(student?.skills?.length ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g. React)"
                className="flex-1 rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={addSkill} className="rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
                Add
              </button>
            </div>
          </Section>

          <Section title="Portfolio & Coding Profiles" icon={Github}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
              <Info label="GitHub" value={parsedBio.github || "Not Linked"} icon={Github} />
              <Info label="LinkedIn" value={parsedBio.linkedin || "Not Linked"} icon={Linkedin} />
              <Info label="Portfolio" value={parsedBio.portfolio || "Not Linked"} icon={Globe} />
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Terminal className="h-4 w-4" /> Coding Profiles
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                  <span className="text-xs font-bold text-orange-500">LeetCode</span>
                  {parsedBio.codingProfiles.leetcode ? (
                    <div>
                      <p className="text-sm font-semibold">{parsedBio.codingProfiles.leetcode}</p>
                      <p className="text-xs text-muted-foreground mt-1">Problems Solved: 320</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not Linked</span>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                  <span className="text-xs font-bold text-green-500">HackerRank</span>
                  {parsedBio.codingProfiles.hackerrank ? (
                    <div>
                      <p className="text-sm font-semibold">{parsedBio.codingProfiles.hackerrank}</p>
                      <p className="text-xs text-muted-foreground mt-1">Problem Solving: ★★★★★</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not Linked</span>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                  <span className="text-xs font-bold text-red-500">CodeChef</span>
                  {parsedBio.codingProfiles.codechef ? (
                    <div>
                      <p className="text-sm font-semibold">{parsedBio.codingProfiles.codechef}</p>
                      <p className="text-xs text-muted-foreground mt-1">Rating: 1640 (3★)</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not Linked</span>
                  )}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Certifications Ledger" icon={Award}>
            {parsedBio.certifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No certifications added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsedBio.certifications.map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-4 flex gap-3 relative">
                    <div className="h-10 w-10 shrink-0 rounded-lg gradient-accent flex items-center justify-center text-primary-foreground animate-pulse">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.issuer} · {c.date}</p>
                      {c.credentialId && <p className="text-[10px] text-primary truncate mt-1">ID: {c.credentialId}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold tracking-tight">Profile Completion</h3>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="var(--muted)" strokeWidth="9" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke="url(#ring2)" strokeWidth="9" fill="none"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - completion / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                  <defs>
                    <linearGradient id="ring2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" />
                      <stop offset="100%" stopColor="var(--chart-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{completion}%</span>
                  <span className="text-[10px] text-muted-foreground">Complete</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {completion === 100 ? "Profile complete!" : "Fill missing fields to reach 100%."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold tracking-tight">Resume</h3>
            {student?.resume_url ? (
              <div className="mt-3 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Resume on file</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {resumeUrl && (
                    <a href={resumeUrl} target="_blank" rel="noreferrer"
                      className="rounded-lg border border-border py-1.5 text-xs font-medium hover:bg-accent/30 transition inline-flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" /> Preview
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">No resume uploaded yet.</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
            <button
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-3 w-full rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {student?.resume_url ? "Replace Resume" : "Upload Resume"}
            </button>
          </div>

          <ResumeInsightsCard insights={resumeInsights} />
          <AchievementsCard badges={badges} />
        </div>
      </div>

      {editOpen && (
        <EditModal
          onClose={() => setEditOpen(false)}
          profile={profile}
          student={student}
          onSaved={() => { setEditOpen(false); prof.reload(); }}
          uid={uid}
        />
      )}
    </AppShell>
  );
}

function EditModal({ onClose, profile, student, onSaved, uid }: any) {
  let parsed = { text: student?.bio || "", github: "", linkedin: "", portfolio: "", certifications: [] as any[], codingProfiles: { leetcode: "", hackerrank: "", codechef: "" } };
  if (student?.bio?.startsWith("{")) {
    try {
      parsed = JSON.parse(student.bio);
    } catch(e) {}
  }

  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [department, setDepartment] = useState(student?.department ?? "");
  const [cgpa, setCgpa] = useState<string>(student?.cgpa?.toString() ?? "");
  const [rollNumber, setRollNumber] = useState(student?.roll_number ?? "");
  const [year, setYear] = useState<string>(student?.year_of_study?.toString() ?? "");
  const [bio, setBio] = useState(parsed.text ?? "");
  const [saving, setSaving] = useState(false);

  // New links & coding profiles state
  const [github, setGithub] = useState(parsed.github ?? "");
  const [linkedin, setLinkedin] = useState(parsed.linkedin ?? "");
  const [portfolio, setPortfolio] = useState(parsed.portfolio ?? "");
  const [leetcode, setLeetcode] = useState(parsed.codingProfiles?.leetcode ?? "");
  const [hackerrank, setHackerrank] = useState(parsed.codingProfiles?.hackerrank ?? "");
  const [codechef, setCodechef] = useState(parsed.codingProfiles?.codechef ?? "");

  // Certifications list state
  const [certs, setCerts] = useState<any[]>(parsed.certifications ?? []);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertDate, setNewCertDate] = useState("");
  const [newCertId, setNewCertId] = useState("");

  const addCert = () => {
    if (!newCertName.trim() || !newCertIssuer.trim()) {
      toast.error("Certificate name and issuer are required");
      return;
    }
    setCerts([...certs, {
      name: newCertName.trim(),
      issuer: newCertIssuer.trim(),
      date: newCertDate.trim() || new Date().toISOString().slice(0, 7),
      credentialId: newCertId.trim()
    }]);
    setNewCertName("");
    setNewCertIssuer("");
    setNewCertDate("");
    setNewCertId("");
  };

  const removeCert = (idx: number) => {
    setCerts(certs.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    const bioData = JSON.stringify({
      text: bio,
      github,
      linkedin,
      portfolio,
      certifications: certs,
      codingProfiles: { leetcode, hackerrank, codechef }
    });

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      updateMyProfile(uid, { name, phone: phone || null }),
      updateMyStudent(uid, {
        department: department || null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        roll_number: rollNumber || null,
        year_of_study: year ? parseInt(year, 10) : null,
        bio: bioData,
      }),
    ]);
    setSaving(false);
    if (e1 || e2) { toast.error((e1 ?? e2)!.message); return; }
    toast.success("Profile updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-count-up" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-glow max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold tracking-tight text-lg">Edit Profile</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent/40 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Personal Data</h4>
            <div className="space-y-3">
              <Input label="Full name" value={name} onChange={setName} />
              <Input label="Phone" value={phone} onChange={setPhone} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Department" value={department} onChange={setDepartment} />
                <Input label="CGPA" value={cgpa} onChange={setCgpa} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Roll Number" value={rollNumber} onChange={setRollNumber} />
                <Input label="Year of study" value={year} onChange={setYear} type="number" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          <div className="border-b border-border pb-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Portfolio Links</h4>
            <div className="space-y-3">
              <Input label="GitHub Profile URL" value={github} onChange={setGithub} />
              <Input label="LinkedIn Profile URL" value={linkedin} onChange={setLinkedin} />
              <Input label="Personal Portfolio URL" value={portfolio} onChange={setPortfolio} />
            </div>
          </div>

          <div className="border-b border-border pb-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Coding Profiles</h4>
            <div className="space-y-3">
              <Input label="LeetCode Username" value={leetcode} onChange={setLeetcode} />
              <Input label="HackerRank Username" value={hackerrank} onChange={setHackerrank} />
              <Input label="CodeChef Username" value={codechef} onChange={setCodechef} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Certifications</h4>
            <div className="space-y-3 bg-muted/20 border border-border p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Certification Name" value={newCertName} onChange={setNewCertName} />
                <Input label="Issuer" value={newCertIssuer} onChange={setNewCertIssuer} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Issue Date (e.g. 2026-07)" value={newCertDate} onChange={setNewCertDate} />
                <Input label="Credential ID (optional)" value={newCertId} onChange={setNewCertId} />
              </div>
              <button type="button" onClick={addCert} className="w-full rounded-lg bg-primary/10 hover:bg-primary/20 text-primary py-2 text-xs font-semibold transition">
                + Add Certification to List
              </button>

              {certs.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {certs.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-card border border-border p-2 rounded-lg text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-muted-foreground truncate">{c.issuer} · {c.date}</p>
                      </div>
                      <button type="button" onClick={() => removeCert(i)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent/30 transition">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft inline-flex items-center gap-1.5 disabled:opacity-60">
            {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{className?:string}>; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{className?:string}> }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />} {value}
      </p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </div>
  );
}
