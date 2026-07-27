import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
let y = 40;

const margin = 40;
const contentW = pageW - (margin * 2);

function addHeader() {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("CANDIDATE NAME", pageW / 2, y, { align: "center" });
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text("Phone: +91 98765 XYZZZ  |  Email: candidate.demo@hirenexa.com  |  Location: Bengaluru, India", pageW / 2, y, { align: "center" });
  y += 14;
  doc.text("LinkedIn: linkedin.com/in/candidate-demo  |  GitHub: github.com/candidate-demo", pageW / 2, y, { align: "center" });
  y += 16;

  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
}

function addSectionTitle(title) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text(title.toUpperCase(), margin, y);
  y += 4;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 14;
}

addHeader();

// 1. OBJECTIVE / SUMMARY
addSectionTitle("Professional Summary");
doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(51, 65, 85);
const summary = "Detail-oriented Software Engineering graduate with strong technical foundations in Full-Stack Web Development, Data Structures, and Cloud Systems. Proficient in React, Node.js, Java Spring Boot, and PostgreSQL. Experienced in building responsive web applications and real-time platforms.";
const splitSummary = doc.splitTextToSize(summary, contentW);
doc.text(splitSummary, margin, y);
y += (splitSummary.length * 13) + 10;

// 2. EDUCATION
addSectionTitle("Education");
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(15, 23, 42);
doc.text("Bachelor of Technology (B.Tech) - Computer Science & Engineering", margin, y);
doc.setFont("helvetica", "bold");
doc.text("2022 – 2026", pageW - margin, y, { align: "right" });
y += 13;
doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(71, 85, 105);
doc.text("Top Technical University, India  |  CGPA: 8.8 / 10.0", margin, y);
y += 18;

// 3. TECHNICAL SKILLS
addSectionTitle("Technical Skills");
const skills = [
  { cat: "Programming Languages", val: "Java, Python, C++, JavaScript (ES6+), TypeScript, SQL" },
  { cat: "Web & Frameworks", val: "React.js, Node.js, Express, Spring Boot, Tailwind CSS, REST APIs" },
  { cat: "Databases & Cloud", val: "PostgreSQL, MongoDB, Supabase, AWS (S3, EC2), Docker, Git/GitHub" },
  { cat: "Core Concepts", val: "Data Structures & Algorithms, OOP, System Design, Microservices, CI/CD" }
];

skills.forEach(s => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`• ${s.cat}: `, margin + 5, y);
  const catWidth = doc.getTextWidth(`• ${s.cat}: `);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(s.val, margin + 5 + catWidth, y);
  y += 13;
});
y += 8;

// 4. EXPERIENCE / INTERNSHIPS
addSectionTitle("Professional Experience");
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(15, 23, 42);
doc.text("Software Engineering Intern", margin, y);
doc.text("May 2025 – July 2025", pageW - margin, y, { align: "right" });
y += 13;
doc.setFont("helvetica", "italic");
doc.setFontSize(9.5);
doc.setTextColor(71, 85, 105);
doc.text("TechNexa Solutions — Bengaluru, India", margin, y);
y += 13;

doc.setFont("helvetica", "normal");
doc.setTextColor(51, 65, 85);
const expBullets = [
  "Developed and deployed microservices using Spring Boot & PostgreSQL, improving API query response times by 25%.",
  "Designed responsive glassmorphism UI components using React and Tailwind CSS for enterprise dashboards.",
  "Integrated automated CI/CD workflows using GitHub Actions and Docker containerization."
];

expBullets.forEach(b => {
  const lines = doc.splitTextToSize(`•  ${b}`, contentW - 10);
  doc.text(lines, margin + 10, y);
  y += (lines.length * 12) + 2;
});
y += 8;

// 5. PROJECTS
addSectionTitle("Key Technical Projects");

const projects = [
  {
    name: "HireNexa - AI-Powered Campus Recruitment & Job Portal",
    tech: "React, TypeScript, Supabase, Spring Boot, Tailwind CSS",
    bullets: [
      "Engineered an end-to-end placement portal supporting Student, Recruiter, and Admin role-based workflows.",
      "Implemented smart resume parsing, side-by-side ATS match comparison, and live WebRTC video interview rooms."
    ]
  },
  {
    name: "Distributed E-Commerce Microservices",
    tech: "Java, Spring Boot, Apache Kafka, PostgreSQL, Docker",
    bullets: [
      "Architected order processing microservices capable of handling 1,000+ transaction events per second.",
      "Secured API endpoints using OAuth2 and JWT token authentication."
    ]
  }
];

projects.forEach(p => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(p.name, margin, y);
  y += 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tech Stack: ${p.tech}`, margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  p.bullets.forEach(b => {
    const lines = doc.splitTextToSize(`•  ${b}`, contentW - 10);
    doc.text(lines, margin + 10, y);
    y += (lines.length * 12) + 2;
  });
  y += 4;
});
y += 6;

// 6. CERTIFICATIONS
addSectionTitle("Certifications & Achievements");
doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(51, 65, 85);
doc.text("•  AWS Certified Cloud Practitioner — Amazon Web Services (2025)", margin + 10, y); y += 13;
doc.text("•  1st Place Winner — National Level College Hackathon 2025 (Out of 120+ competing teams)", margin + 10, y); y += 13;

const pdfData = doc.output('arraybuffer');
const outputPath = path.resolve('public', 'sample-ats-resume.pdf');
fs.writeFileSync(outputPath, Buffer.from(pdfData));
console.log("Generated sample ATS resume PDF at: " + outputPath);
