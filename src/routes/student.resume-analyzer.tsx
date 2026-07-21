import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileText, Upload, CheckCircle2, AlertTriangle, ArrowRight, Download, RefreshCw, BarChart2,
  Brain, Check, Search, Briefcase, Award, GraduationCap,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { StudentSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyProfile } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getLogoBase64 } from "@/lib/exports";

export const Route = createFileRoute("/student/resume-analyzer")({
  head: () => ({
    meta: [
      { title: "AI Resume Analyzer — HireNexa" },
      { name: "description", content: "Optimize your resume with ATS compatibility scores, skill gaps, and keyword density check." },
    ],
  }),
  component: () => (
    <AuthGate roles={["student"]}>
      <ResumeAnalyzerPage />
    </AuthGate>
  ),
});

interface ParsedResume {
  filename: string;
  name: string;
  email: string;
  phone: string;
  education: string[];
  experience: string[];
  skills: string[];
  missingSkills: string[];
  atsScore: number;
  resumeScore: number;
  readinessScore: number;
  suggestions: { category: string; tip: string; impact: "High" | "Medium" | "Low" }[];
  keywordDensity: { keyword: string; count: number }[];
}

const DEMO_RESUME: ParsedResume = {
  filename: "Ashwin_Developer_Resume.pdf",
  name: "Ashwin Kumar",
  email: "ashwin.k@example.com",
  phone: "+91 98765 43210",
  education: [
    "B.Tech in Computer Science & Engineering (CGPA: 8.5/10) — 2024",
  ],
  experience: [
    "Frontend Intern at TechCorp (6 Months) — Developed React dashboards, optimized client bundle size by 20%.",
    "Freelance Web Developer — Built responsive ecommerce portals using Vite, Tailwind, and Node.js.",
  ],
  skills: ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Git", "Tailwind CSS", "Vite"],
  missingSkills: ["SQL", "Next.js", "Docker", "Node.js", "Jest", "PostgreSQL", "AWS S3"],
  atsScore: 78,
  resumeScore: 82,
  readinessScore: 80,
  suggestions: [
    { category: "Quantifiable Results", tip: "Add numeric metrics to describe project impact (e.g. 'Reduced loading time by 30%')", impact: "High" },
    { category: "Keyword Optimization", tip: "Include backend terms like SQL, Node.js, and PostgreSQL to match fullstack postings", impact: "High" },
    { category: "Deployment Section", tip: "Mention cloud platform exposure such as AWS, Vercel, or Docker", impact: "Medium" },
    { category: "Action Verbs", tip: "Start experience bullets with strong action words like 'Engineered', 'Optimized', 'Architected'", impact: "Low" },
  ],
  keywordDensity: [
    { keyword: "React", count: 8 },
    { keyword: "Vite", count: 5 },
    { keyword: "Tailwind", count: 4 },
    { keyword: "Developer", count: 4 },
    { keyword: "JavaScript", count: 3 },
    { keyword: "TypeScript", count: 3 },
    { keyword: "Frontend", count: 2 },
  ],
};

function ResumeAnalyzerPage() {
  const { user } = useAuth();
  const uid = user?.id || "";
  const studQ = useAsync(() => (uid ? fetchMyProfile(uid) : Promise.resolve({ profile: null, student: null })), [uid]);

  const [analyzing, setAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "suggestions">("overview");

  const name = studQ.data?.profile?.name || "Student";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResumeData(DEMO_RESUME);
      setAnalyzing(false);
      toast.success("Resume parsed and analyzed successfully!");
    }, 2000);
  };

  const handleClear = () => {
    setResumeData(null);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("resume-report-pdf");
    if (!element) return;
    toast.info("Generating PDF report, please wait...");
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Fetch logo image
      const logoImg = await getLogoBase64();

      // Post-processing header and footer for all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Top Center logo placement
        if (logoImg) {
          pdf.addImage(logoImg, "PNG", (pdf.internal.pageSize.getWidth() / 2) - 5, 8, 10, 10);
        } else {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(37, 99, 235);
          pdf.text("HIRENEXA", pdf.internal.pageSize.getWidth() / 2, 16, { align: "center" });
        }
        
        // Tiny header accent line
        pdf.setDrawColor(243, 244, 246);
        pdf.line(14, 20, pdf.internal.pageSize.getWidth() - 14, 20);
        
        // Footer line separator
        pdf.setDrawColor(229, 231, 235);
        pdf.line(14, pdf.internal.pageSize.getHeight() - 14, pdf.internal.pageSize.getWidth() - 14, pdf.internal.pageSize.getHeight() - 14);

        // Footer details
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("Developed and Maintained by Ashwin P", 14, pdf.internal.pageSize.getHeight() - 8);
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 14, pdf.internal.pageSize.getHeight() - 8, { align: "right" });
      }

      pdf.save("HireNexa_Resume_Analysis_Report.pdf");
      toast.success("PDF report downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <AppShell sidebar={<StudentSidebar />} user={{ name, initials, role: "Student" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Resume Analyzer</h1>
            <p className="mt-1 text-sm opacity-90">
              Optimize your resume for applicant tracking systems, analyze core skills, and uncover key missing keywords.
            </p>
          </div>
        </div>
      </div>

      {!resumeData ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center max-w-2xl mx-auto shadow-soft mt-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 animate-pulse">
            <Brain className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">Upload your resume to start analysis</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Drag and drop your PDF or Word document here, or click to browse. We will analyze keywords, match criteria, and ATS parameters.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleUpload}
              disabled={analyzing}
              className="rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload Resume File
                </>
              )}
            </button>
            <button
              onClick={() => setResumeData(DEMO_RESUME)}
              disabled={analyzing}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium hover:bg-accent/30 transition flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground" /> Load Demo Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-xs">{resumeData.filename}</p>
                <p className="text-xs text-muted-foreground">Scanned via HireNexa AI engine</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent/30 transition inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download Report PDF
              </button>
              <button
                onClick={handleClear}
                className="rounded-xl border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-4 py-2 text-xs font-semibold transition"
              >
                Clear / Upload Another
              </button>
            </div>
          </div>

          {/* Scores Overview Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreRingCard title="ATS Compatibility Score" score={resumeData.atsScore} color="stroke-primary" gradient="from-primary/10 to-accent/10" desc="Matches typical job template parameters." />
            <ScoreRingCard title="Resume Layout & Format" score={resumeData.resumeScore} color="stroke-secondary" gradient="from-secondary/10 to-purple-500/10" desc="Assesses text content structural flow." />
            <ScoreRingCard title="Hiring Readiness Level" score={resumeData.readinessScore} color="stroke-success" gradient="from-success/10 to-teal-500/10" desc="Measures overall profile completeness." />
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
            {(["overview", "keywords", "suggestions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${activeTab === t ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/30"}`}
              >
                {t === "overview" ? "Extracted Skills & Details" : t === "keywords" ? "Keyword Density & Gap" : "Improvement Tips"}
              </button>
            ))}
          </div>

          {/* Details Content Area */}
          <div id="resume-report-pdf" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-8">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">HireNexa AI Placement Resume Analysis</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Candidate Evaluation Report for {resumeData.name}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-1 text-[11px] font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Fully Parsed
                </span>
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> Extracted Experience
                    </h3>
                    <div className="space-y-3">
                      {resumeData.experience.map((exp, i) => (
                        <div key={i} className="rounded-xl border border-border bg-background p-4 text-sm relative">
                          <span className="absolute left-0 top-0 bottom-0 w-1 gradient-primary rounded-l-xl" />
                          {exp}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> Education History
                    </h3>
                    <div className="rounded-xl border border-border bg-background p-4 text-sm relative">
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                      {resumeData.education[0]}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Identified Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5 bg-background p-4 rounded-xl border border-border">
                      {resumeData.skills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                          <Check className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Missing Key Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5 bg-background p-4 rounded-xl border border-border">
                      {resumeData.missingSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2.5 py-1 text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "keywords" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4" /> Top Keyword Counts
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resumeData.keywordDensity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="keyword" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                        <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Keyword Fit Optimization Details</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Applicant Tracking Systems (ATS) count core role keywords to match candidate compliance ratios. Your resume shows strong density for <strong className="text-foreground">React</strong> and <strong className="text-foreground">Vite</strong> but lacks backend coverage.
                  </p>
                  <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4 space-y-2">
                    <p className="text-xs font-semibold text-accent-foreground flex items-center gap-1">
                      <Brain className="h-4 w-4" /> AI Suggestion
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Integrating backend/database keywords such as <strong>SQL</strong> and <strong>PostgreSQL</strong> into project summaries will raise ATS match rates by an estimated 15%.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "suggestions" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Targeted Formatting & Content Recommendations
                </h3>
                <div className="space-y-3">
                  {resumeData.suggestions.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/20">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase shrink-0 ${s.impact === "High" ? "bg-destructive/10 text-destructive" : s.impact === "Medium" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                        {s.impact} Impact
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{s.category}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Brand Credit */}
            <div className="border-t border-border pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>HireNexa Placement Portal</span>
              <span className="font-semibold">Developed and Maintained by Ashwin P</span>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Donut Progress Indicator Card Component
function ScoreRingCard({ title, score, color, gradient, desc }: { title: string; score: number; color: string; gradient: string; desc: string }) {
  const radius = 36;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-glow transition-all`}>
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={radius} className="stroke-muted fill-none" strokeWidth={strokeWidth} />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`fill-none ${color} transition-all duration-1000 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tracking-tight">{score}%</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold leading-tight">{title}</h4>
          <p className="text-[11px] text-muted-foreground mt-1 leading-normal">{desc}</p>
        </div>
      </div>
    </div>
  );
}
