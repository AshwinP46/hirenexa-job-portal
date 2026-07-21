import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function getLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function toCSVCell(v: unknown): string {
  if (v == null) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
export function downloadCSV(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [headers.join(","), ...rows.map((r) => r.map(toCSVCell).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(filename: string, title: string, headers: string[], rows: unknown[][], subtitle?: string) {
  const doc = new jsPDF({ orientation: rows[0]?.length && rows[0].length > 5 ? "landscape" : "portrait" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  
  // 1. Top brand banner line
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, w, 8, "F");
  
  // 2. Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39); // Slate 900
  doc.text(title, 14, 28);
  
  if (subtitle) { 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); 
    doc.setTextColor(107, 114, 128); // Slate 500
    doc.text(subtitle, 14, 34); 
    doc.setTextColor(0); 
  }
  
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => (Array.isArray(c) ? c.join(", ") : c == null ? "" : String(c)))),
    startY: subtitle ? 40 : 34,
    styles: { 
      fontSize: 8.5, 
      cellPadding: 3, 
      valign: "middle", 
      textColor: [55, 65, 81], // Slate 700
      lineColor: [229, 231, 235], // Slate 200
      lineWidth: 0.1 
    },
    headStyles: { 
      fillColor: [37, 99, 235], // HireNexa Blue
      textColor: [255, 255, 255], 
      fontStyle: "bold",
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Slate 50
    },
    margin: { top: 25, bottom: 20, left: 14, right: 14 }
  });
  
  // Fetch logo base64
  const logoImg = await getLogoBase64();
  
  // Post-processing header and footer for all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Top Center logo placement
    if (logoImg) {
      doc.addImage(logoImg, "PNG", (w / 2) - 12, 10, 24, 7);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text("HIRENEXA", w / 2, 17, { align: "center" });
    }
    
    // Tiny header accent line
    doc.setDrawColor(243, 244, 246);
    doc.line(14, 22, w - 14, 22);
    
    // Footer line separator
    doc.setDrawColor(229, 231, 235);
    doc.line(14, h - 14, w - 14, h - 14);
    
    // Footer details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Slate 400
    doc.text("Developed and Maintained by Ashwin P", 14, h - 8);
    doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 8, { align: "right" });
  }
  
  doc.save(filename);
}
