import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain, Download, RefreshCw, HelpCircle, CheckCircle2, Star, Award, ShieldAlert, FileText, ChevronRight
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { RecruiterSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyRecruiter } from "@/lib/api";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getLogoBase64 } from "@/lib/exports";

export const Route = createFileRoute("/recruiter/questions")({
  head: () => ({
    meta: [
      { title: "AI Question Generator — HireNexa" },
      { name: "description", content: "Create customized interview question sheets with expected answers and grading rubrics using AI." },
    ],
  }),
  component: () => (
    <AuthGate roles={["recruiter"]}>
      <RecruiterQuestionsPage />
    </AuthGate>
  ),
});

interface Question {
  id: number;
  question: string;
  category: "Technical" | "Coding" | "HR" | "Aptitude";
  difficulty: "Easy" | "Medium" | "Hard";
  expectedAnswer: string;
  rubric: string;
}

const DEMO_QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Technical",
    difficulty: "Medium",
    question: "Explain the difference between Virtual DOM and Real DOM in React. How does reconciliation work?",
    expectedAnswer: "Virtual DOM is an in-memory representation of real HTML components. Reconciliation is React's diffing algorithm that determines which nodes changed and updates only those nodes in the real DOM, boosting performance.",
    rubric: "Look for mentions of diffing algorithm, batching updates, key attribute usage, and performance optimization."
  },
  {
    id: 2,
    category: "Coding",
    difficulty: "Medium",
    question: "Write a function to find the longest substring without repeating characters. What is the time complexity?",
    expectedAnswer: "Use a sliding window pattern with a set/map to store characters and indices. Time complexity is O(N) as each character is visited at most twice.",
    rubric: "Candidate should produce working code with nested loop O(N^2) or optimal O(N) sliding window. Verify time complexity explanation."
  },
  {
    id: 3,
    category: "Aptitude",
    difficulty: "Easy",
    question: "A product is marked up by 20% and then discounted by 10%. What is the net profit percentage?",
    expectedAnswer: "Net profit is 8%. Calculation: 100 * 1.2 = 120. Then 120 * 0.9 = 108. (108 - 100) / 100 = 8% profit.",
    rubric: "Candidate should solve quickly without writing tools. Check if calculation logic is presented cleanly."
  },
  {
    id: 4,
    category: "HR",
    difficulty: "Easy",
    question: "Tell me about a time you faced a technical conflict in a team. How did you resolve it?",
    expectedAnswer: "Candidate should present a structured story (STAR method): Describe the technical disagreement, how they gathered objective metrics/data, discussed politely, aligned, and moved forward.",
    rubric: "Evaluate communication, emotional intelligence, receptiveness to feedback, and constructive resolution skills."
  }
];

function RecruiterQuestionsPage() {
  const { user } = useAuth();
  const uid = user?.id || "";
  const profQ = useAsync(() => uid ? fetchMyRecruiter(uid) : Promise.resolve({ profile: null, recruiter: null }), [uid]);

  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState<"Entry" | "Mid" | "Senior">("Entry");
  const [skills, setSkills] = useState("React, JavaScript, TypeScript");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<"All" | "Technical" | "Coding" | "HR" | "Aptitude">("All");

  const name = profQ.data?.recruiter?.company_name || profQ.data?.profile?.name || "Recruiter";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleGenerate = () => {
    if (!role.trim()) {
      toast.error("Please specify a job role");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setQuestions(DEMO_QUESTIONS);
      setGenerating(false);
      toast.success("AI interview questions generated successfully!");
    }, 1500);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("question-sheet-print");
    if (!element) return;
    toast.info("Generating PDF, please wait...");
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

      pdf.save(`Questions_${role.replace(/\s+/g, "_")}.pdf`);
      toast.success("Interview Sheet PDF downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const filteredQuestions = questions?.filter(
    (q) => activeCategory === "All" || q.category === activeCategory
  );

  return (
    <AppShell sidebar={<RecruiterSidebar />} user={{ name, initials, role: "Talent Lead" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Interview Question Generator</h1>
            <p className="mt-1 text-sm opacity-90">
              Instantly create custom interview question sheets tailored to roles, experience levels, and specific competencies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column Settings Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Generation Options</h3>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Job Role / Title</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Sales Manager"
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Seniority Level</label>
            <div className="flex gap-2">
              {(["Entry", "Mid", "Senior"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${level === l ? "gradient-primary text-primary-foreground border-transparent shadow-soft" : "border-border bg-background hover:bg-accent/30"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Skills / Competencies</label>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, JavaScript, system design"
              rows={3}
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" /> Generate Question Sheet
              </>
            )}
          </button>
        </div>

        {/* Right Column Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!questions ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold">No questions generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Configure options on the left and click generate to create a rubric sheet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2 rounded-2xl border border-border shadow-soft">
                <div className="flex flex-wrap gap-1">
                  {(["All", "Technical", "Coding", "HR", "Aptitude"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeCategory === cat ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/30"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent/30 transition inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>

              {/* Printable Question Sheet */}
              <div id="question-sheet-print" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
                <div className="border-b border-border pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">HireNexa Custom Interview Evaluation</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{role} Evaluation Form ({level}-level)</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Focus: {skills}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredQuestions?.map((q, idx) => (
                    <div key={q.id} className="rounded-2xl border border-border bg-background p-5 space-y-3 relative hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">{q.category}</span>
                        </div>
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${q.difficulty === "Easy" ? "bg-success/10 text-success" : q.difficulty === "Medium" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="bg-muted/10 border border-border p-3 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Expected Answer</p>
                          <p className="text-muted-foreground leading-relaxed">{q.expectedAnswer}</p>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-primary uppercase tracking-wide flex items-center gap-1"><Award className="h-3.5 w-3.5 text-primary" /> Evaluation Rubric</p>
                          <p className="text-muted-foreground leading-relaxed">{q.rubric}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Brand Credit */}
                <div className="border-t border-border pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>HireNexa Placement Portal</span>
                  <span className="font-semibold">Developed and Maintained by Ashwin P</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
