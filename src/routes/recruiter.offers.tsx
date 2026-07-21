import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText, Mail, Send, Award, Download, Check, X, Edit, LayoutGrid, Eye, Upload, Loader2, Sparkles
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { RecruiterSidebar } from "@/components/shell/sidebars";
import { AuthGate } from "@/components/shell/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { useAsync, fetchMyRecruiter } from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { getLogoBase64 } from "@/lib/exports";

export const Route = createFileRoute("/recruiter/offers")({
  head: () => ({
    meta: [
      { title: "Manage Offers & Templates — HireNexa" },
      { name: "description", content: "Issue official placement offers and customize recruiters' transactional email notifications." },
    ],
  }),
  component: () => (
    <AuthGate roles={["recruiter"]}>
      <RecruiterOffersPage />
    </AuthGate>
  ),
});

interface OfferLetter {
  id: string;
  candidateName: string;
  email: string;
  role: string;
  packageLpa: number;
  joinDate: string;
  status: "Pending" | "Accepted" | "Rejected";
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const INITIAL_OFFERS: OfferLetter[] = [
  { id: "o1", candidateName: "Ashwin Kumar", email: "ashwin.k@example.com", role: "Software Engineer", packageLpa: 12.5, joinDate: "2026-08-01", status: "Pending" },
  { id: "o2", candidateName: "Nisha Sharma", email: "nisha.s@example.com", role: "Frontend Dev", packageLpa: 8.0, joinDate: "2026-08-15", status: "Accepted" }
];

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: "scheduled",
    name: "Interview Scheduled",
    subject: "Interview Scheduled for {role} at {company}",
    body: "Hi {name},\n\nWe are pleased to inform you that your interview for the {role} position has been scheduled.\n\nDate & Time: {datetime}\nMode: {mode}\nLink/Venue: {link}\n\nPlease join 5 minutes early. Best of luck!\n\nRegards,\nPlacement Team"
  },
  {
    id: "selected",
    name: "Candidate Selected",
    subject: "Congratulations! You have been selected at {company}",
    body: "Hi {name},\n\nWe are thrilled to let you know that you have cleared all rounds and have been selected for the {role} position at {company}.\n\nOur HR team will reach out with the official offer letter details shortly.\n\nWarm regards,\n{company} Recruitment"
  },
  {
    id: "rejected",
    name: "Application Update",
    subject: "Update on your application for {role}",
    body: "Hi {name},\n\nThank you for taking the time to interview with us. While your qualifications are impressive, we have decided to move forward with other candidates whose experience more closely matches our immediate needs.\n\nWe wish you all the best in your placement search.\n\nBest regards,\nRecruitment Team"
  },
  {
    id: "welcome",
    name: "Welcome Onboard",
    subject: "Welcome to {company}!",
    body: "Hi {name},\n\nWelcome to the team! We are excited to have you join us as a {role}.\n\nYour onboarding sessions will begin on {join_date}. Please review the attached handbook.\n\nBest,\nHR Operations"
  }
];

function RecruiterOffersPage() {
  const { user } = useAuth();
  const uid = user?.id || "";
  const profQ = useAsync(() => uid ? fetchMyRecruiter(uid) : Promise.resolve({ profile: null, recruiter: null }), [uid]);

  const [activeTab, setActiveTab] = useState<"offers" | "emails">("offers");
  const [offers, setOffers] = useState<OfferLetter[]>(INITIAL_OFFERS);
  
  // Send offer form states
  const [candidate, setCandidate] = useState("Ashwin Kumar");
  const [candidateEmail, setCandidateEmail] = useState("ashwin.k@example.com");
  const [offerRole, setOfferRole] = useState("Software Engineer");
  const [salary, setSalary] = useState("12");
  const [joinDate, setJoinDate] = useState("2026-08-01");
  const [issuing, setIssuing] = useState(false);

  // Email template editor states
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState("scheduled");
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  const [editSubject, setEditSubject] = useState(activeTemplate.subject);
  const [editBody, setEditBody] = useState(activeTemplate.body);

  const name = profQ.data?.recruiter?.company_name || profQ.data?.profile?.name || "Recruiter";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  // Handle template selection
  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    const selected = templates.find(t => t.id === id)!;
    setEditSubject(selected.subject);
    setEditBody(selected.body);
  };

  // Save template edit changes
  const handleSaveTemplate = () => {
    setTemplates(prev => prev.map(t => t.id === activeTemplateId ? { ...t, subject: editSubject, body: editBody } : t));
    toast.success("Email template configuration saved!");
  };

  // Issue formal PDF Offer letter using jsPDF
  const handleIssueOffer = () => {
    if (!candidate.trim() || !candidateEmail.trim() || !offerRole.trim()) {
      toast.error("Please fill in candidate details");
      return;
    }
    setIssuing(true);
    setTimeout(async () => {
      // 1. Generate PDF
      const doc = new jsPDF();
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // 1. Draw top brand banner (Blue strip)
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, w, 8, "F");

      // 2. Draw modern center header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39); // Slate 900
      doc.text("OFFER LETTER OF APPOINTMENT", w / 2, 28, { align: "center" });
      
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 34, w - 20, 34);

      // 3. Body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81); // Slate 700
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 46);
      
      doc.setFont("helvetica", "bold");
      doc.text(`To: ${candidate}`, 20, 54);
      doc.setFont("helvetica", "normal");
      doc.text(`Email: ${candidateEmail}`, 20, 60);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(`Subject: Offer of Employment for the position of ${offerRole}`, 20, 74);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text(`Dear ${candidate},`, 20, 86);
      doc.text(`Following our recent placement selection interviews, we are pleased to offer you employment at ${name} under the following terms:`, 20, 94, { maxWidth: 170 });

      // 4. Draw modern structured key-value box instead of bullet list
      doc.setFillColor(249, 250, 251); // Slate 50 background
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, 108, w - 40, 36, "FD"); // Background + Border

      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("Employment Terms & Details", 24, 115);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text("Position Offered:", 24, 123);
      doc.text("Offered Salary Package:", 24, 131);
      doc.text("Commencement Date:", 24, 139);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text(offerRole, 70, 123);
      doc.text(`INR ${salary} LPA (Lakhs Per Annum)`, 70, 131);
      doc.text(joinDate, 70, 139);

      // 5. Closing
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text("Please review, sign, and accept the offer checklist within your student portal dashboard to complete the registration details.", 20, 160, { maxWidth: 170 });
      doc.text(`We look forward to welcoming you onboard at ${name}.`, 20, 172);

      doc.text(`For ${name}`, 20, 196);
      doc.setFont("helvetica", "bold");
      doc.text("Authorized Recruiting Officer", 20, 204);

      // Fetch logo image
      const logoImg = await getLogoBase64();

      // Post-processing header and footer for all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Top Center logo placement
        if (logoImg) {
          doc.addImage(logoImg, "PNG", (w / 2) - 5, 10, 10, 10);
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(37, 99, 235);
          doc.text("HIRENEXA", w / 2, 18, { align: "center" });
        }
        
        // Tiny header accent line
        doc.setDrawColor(243, 244, 246);
        doc.line(14, 22, w - 14, 22);
        
        // Footer line separator
        doc.setDrawColor(229, 231, 235);
        doc.line(14, h - 14, w - 14, h - 14);
        
        // Footer: Page i of pageCount & Ashwin P
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("Developed and Maintained by Ashwin P", 14, h - 8);
        doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 8, { align: "right" });
      }

      // Save it to disk (simulated backend upload too)
      doc.save(`Offer_${candidate.replace(/\s+/g, "_")}.pdf`);

      const newOffer: OfferLetter = {
        id: Math.random().toString(36).substring(7),
        candidateName: candidate,
        email: candidateEmail,
        role: offerRole,
        packageLpa: parseFloat(salary),
        joinDate: joinDate,
        status: "Pending"
      };

      setOffers([newOffer, ...offers]);
      setIssuing(false);
      toast.success("Offer letter generated and issued!");
    }, 1500);
  };

  return (
    <AppShell sidebar={<RecruiterSidebar />} user={{ name, initials, role: "Talent Lead" }}>
      <div className="relative overflow-hidden rounded-3xl border border-border gradient-primary p-6 md:p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Offers & Templates</h1>
            <p className="mt-1 text-sm opacity-90">
              Manage selected student offer letters, track sign-offs, and edit custom email templates.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft mt-6">
        {(["offers", "emails"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${activeTab === t ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent/30"}`}
          >
            {t === "offers" ? "Candidate Offer Letters" : "Email Notification Templates"}
          </button>
        ))}
      </div>

      {activeTab === "offers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Offer Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> Issue Offer Letter</h3>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Candidate Name</label>
              <select value={candidate} onChange={(e) => setCandidate(e.target.value)} className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary">
                <option value="Ashwin Kumar">Ashwin Kumar</option>
                <option value="Srinivas Rao">Srinivas Rao</option>
                <option value="Divya Teja">Divya Teja</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Candidate Email</label>
              <input
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role Offered</label>
              <input
                value={offerRole}
                onChange={(e) => setOfferRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Salary CTC (LPA)</label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Joining Date</label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={handleIssueOffer}
              disabled={issuing}
              className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {issuing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Generate & Send Offer PDF
                </>
              )}
            </button>
          </div>

          {/* Offers Table */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Issued Offers Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Package</th>
                    <th className="pb-3 font-semibold">Join Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(o => (
                    <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-accent/10 transition">
                      <td className="py-3 font-medium">{o.candidateName}</td>
                      <td className="py-3 text-muted-foreground">{o.role}</td>
                      <td className="py-3 font-semibold">{o.packageLpa} LPA</td>
                      <td className="py-3 text-muted-foreground">{o.joinDate}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${o.status === "Accepted" ? "bg-success/10 text-success" : o.status === "Rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1">
                          <Download className="h-3 w-3" /> Offer PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Select Column */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft h-fit space-y-1">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground p-2">Transaction Select</h3>
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${t.id === activeTemplateId ? "bg-accent/40 text-foreground border border-border" : "text-muted-foreground hover:bg-accent/20"}`}
              >
                <span>{t.name}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* Template Editor Column */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Editor Panel</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Subject Title</label>
              <input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Body Message</label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm outline-none focus:border-primary font-mono text-xs leading-relaxed"
              />
            </div>
            <button
              onClick={handleSaveTemplate}
              className="w-full rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-soft flex items-center justify-center gap-1.5 hover:opacity-90 transition"
            >
              <Check className="h-4 w-4" /> Save Template Configuration
            </button>
          </div>

          {/* Template Live Preview Workspace */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Eye className="h-4 w-4 text-primary" /> Live preview</h3>
            <div className="rounded-xl border border-border bg-background p-4 text-xs font-sans space-y-3 shadow-inner">
              <div className="border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-semibold">Subject:</span>{" "}
                <span className="text-foreground font-medium">
                  {editSubject
                    .replace("{role}", "Software Developer")
                    .replace("{company}", name)
                    .replace("{name}", "Ashwin Kumar")}
                </span>
              </div>
              <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {editBody
                  .replace("{role}", "Software Developer")
                  .replace("{company}", name)
                  .replace("{name}", "Ashwin Kumar")
                  .replace("{datetime}", "July 24, 2026 at 3:00 PM")
                  .replace("{mode}", "Online Interview (HireNexa Room)")
                  .replace("{link}", "https://hirenexa.com/room/interview-room")
                  .replace("{join_date}", "August 1, 2026")}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ChevronRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
