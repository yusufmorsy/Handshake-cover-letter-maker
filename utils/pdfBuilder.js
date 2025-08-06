/* utils/pdfBuilder.js
 *
 * jsPDF is loaded globally in popup.html via:
 *   <script src="libs/jspdf.umd.min.js"></script>
 * The UMD build exposes a window.jspdf object that contains { jsPDF }.
 * We pull the constructor from there instead of importing from a CDN,
 * which keeps us compliant with the extension’s CSP (script-src 'self').
 */

export function buildPdf(fileName, content) {
  // 1) Grab jsPDF from the global bundle
  const { jsPDF } = window.jspdf;

  // 2) Create the PDF
  const doc   = new jsPDF();
  const lines = doc.splitTextToSize(content, 180); // wrap long lines
  doc.text(lines, 10, 15);

  // 3) Trigger a download (jsPDF handles this internally)
  doc.save(fileName);         // Produces <fileName>.pdf in the browser
}
