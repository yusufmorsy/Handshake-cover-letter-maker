/* utils/pdfBuilder.js
 *
 * Generates a PDF at 11-pt Arial-equivalent with 1-inch margins
 * using the jsPDF UMD bundle loaded in popup.html.
 */

export function buildPdf(fileName, content) {
  /* 1) jsPDF from the global bundle */
  const { jsPDF } = window.jspdf;

  /* 2) Create a Letter-size document in millimetres */
  const doc = new jsPDF({ unit: "mm", format: "letter" }); // 216 mm × 279 mm
  const pageW = doc.internal.pageSize.getWidth();          // ~216 mm
  const pageH = doc.internal.pageSize.getHeight();         // ~279 mm

  /* 3) One-inch margins = 25.4 mm */
  const margin = 25.4;
  const usableW = pageW - margin * 2;

  /* 4) Font & size: Arial ≈ Helvetica in jsPDF */
  doc.setFont("helvetica", "normal");  // closest built-in to Arial
  doc.setFontSize(11);                 // 11 pt

  /* 5) Wrap text to usable width */
  const lines = doc.splitTextToSize(content, usableW);

  /* 6) Top-left corner at (margin, margin) */
  let cursorY = margin;
  const lineHeight = 4.5;              // ~11 pt = 3.9 mm, add a bit of leading

  lines.forEach(line => {
    /* simple page-break logic */
    if (cursorY + lineHeight > pageH - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  /* 7) Trigger download */
  doc.save(fileName);   // no saveAs dialog → popup stays open
}
